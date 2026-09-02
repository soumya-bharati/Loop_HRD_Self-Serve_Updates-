import { useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import styled from 'styled-components'

import { assets } from '@/assets/figma'
import {
  bulkDeleteTemplateFileName,
  bulkTemplateFileName,
} from '@/data/employees'
import { sampleBulkDeleteRows, sampleBulkRows } from '@/data/flexDeal'
import { parseSheet } from '@/pages/ManageLives/bulk/parseAndValidate'
import { launchWizardPath } from '@/pages/ManageLives/launchWizard'
import { usePendingChanges } from '@/pages/ManageLives/PendingChangesContext'
import {
  chargeImpact,
  formatINR,
  nextPendingId,
  refundImpact,
} from '@/pages/ManageLives/pendingChanges'
import { searchEmployees } from '@/pages/ManageLives/searchEmployees'
import { useProtoConfig } from '@/proto/ProtoConfigContext'

type BulkMode = 'add' | 'remove'
type BulkPhase = 'idle' | 'parsing' | 'validate' | 'done'
type FindIntent = 'edit' | 'dependant' | 'delete' | null

function downloadBulkTemplate(operation: BulkMode) {
  const isRemove = operation === 'remove'
  const headers = isRemove
    ? 'Employee ID,Date of Leaving,Confirm Delete\n'
    : 'Employee ID,First Name,Last Name,Grade,Core Cover,Email,DOB\n'
  const blob = new Blob([headers], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = (isRemove ? bulkDeleteTemplateFileName : bulkTemplateFileName)
    .replace('.xlsx', '.csv')
  link.click()
  URL.revokeObjectURL(url)
}

const MANUAL_ACTIONS: {
  id: FindIntent | 'add'
  title: string
  copy: string
}[] = [
  {
    id: 'add',
    title: 'Add employee manually',
    copy: "Fill in the employee details, and upload it when you're ready.",
  },
  {
    id: 'edit',
    title: 'Edit Employee Details',
    copy: "Fill in the employee details, and upload it when you're ready.",
  },
  {
    id: 'dependant',
    title: 'Add dependant',
    copy: "Fill in the employee details, and upload it when you're ready.",
  },
  {
    id: 'delete',
    title: 'Delete an Employee',
    copy: "Fill in the employee details, and upload it when you're ready.",
  },
]

export function HubLanding() {
  const navigate = useNavigate()
  const { entities, deals } = useProtoConfig()
  const { addChange } = usePendingChanges()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [entityId, setEntityId] = useState(entities[0]?.id ?? 'symphony-eyc')
  const [bulkMode, setBulkMode] = useState<BulkMode>('add')
  const [file, setFile] = useState<File | null>(null)
  const [phase, setPhase] = useState<BulkPhase>('idle')
  const [error, setError] = useState<string | null>(null)
  const [rowCount, setRowCount] = useState(0)
  const [employeeCount, setEmployeeCount] = useState(0)
  const [findIntent, setFindIntent] = useState<FindIntent>(null)
  const [query, setQuery] = useState('')

  const dealId = deals[0]?.id
  const selectedEntity =
    entities.find((item) => item.id === entityId) ?? entities[0]
  const selectedDeal = deals.find((deal) => deal.id === dealId) ?? deals[0]

  const addPreview = useMemo(
    () => sampleBulkRows.filter((row) => row.relationship === 'Self').slice(0, 6),
    [],
  )
  const deletePreview = useMemo(() => sampleBulkDeleteRows.slice(0, 6), [])
  const passCount =
    bulkMode === 'add'
      ? addPreview.filter((row) => row.status === 'pass').length
      : deletePreview.filter((row) => row.status === 'pass').length

  const findResults = useMemo(
    () => (findIntent ? searchEmployees(query, { entityId }) : []),
    [entityId, findIntent, query],
  )

  const resetBulk = () => {
    setFile(null)
    setPhase('idle')
    setError(null)
    setRowCount(0)
    setEmployeeCount(0)
  }

  const onFile = async (next: File | null) => {
    setFile(next)
    setError(null)
    setRowCount(0)
    setEmployeeCount(0)
    if (!next) {
      setPhase('idle')
      return
    }
    setPhase('parsing')
    try {
      const parsed = await parseSheet(next, bulkMode)
      setRowCount(parsed.rowCount)
      setEmployeeCount(parsed.employeeCount)
      setPhase('validate')
    } catch {
      setError('Something went wrong reading that file. Try again.')
      setPhase('idle')
      setFile(null)
    }
  }

  const confirmBulk = () => {
    if (!file || phase !== 'validate') return
    const isAdd = bulkMode === 'add'
    const amount = isAdd ? passCount * 1850 : passCount * 1200
    addChange({
      id: nextPendingId(),
      employeeId: 'bulk',
      employeeName: isAdd
        ? `Bulk add · ${passCount} employees`
        : `Bulk remove · ${passCount} employees`,
      entityId,
      entityName: selectedEntity?.name,
      dealId: selectedDeal?.id,
      dealName: selectedDeal?.name,
      action: isAdd ? 'bulk_add' : 'bulk_remove',
      description: file.name || (isAdd ? 'Bulk add' : 'Bulk remove'),
      createdAt: new Date().toISOString(),
      costImpact: isAdd ? chargeImpact(amount) : refundImpact(amount),
      payload: {
        fileName: file.name,
        mode: bulkMode,
        rowCount,
        employeeCount,
      },
    })
    setPhase('done')
  }

  const openManual = (id: (typeof MANUAL_ACTIONS)[number]['id']) => {
    if (id === 'add') {
      navigate(
        launchWizardPath({
          action: 'add',
          method: 'single',
          entity: entityId,
          deal: dealId,
        }),
      )
      return
    }
    setFindIntent(id)
    setQuery('')
  }

  const pickEmployee = (employeeRecordId: string) => {
    if (!findIntent) return
    if (findIntent === 'edit') {
      navigate(`/manage-lives/employee/${employeeRecordId}`)
      return
    }
    if (findIntent === 'dependant') {
      navigate(
        launchWizardPath({
          action: 'add',
          method: 'single-dependant',
          entity: entityId,
          deal: dealId,
          employee: employeeRecordId,
        }),
      )
      return
    }
    navigate(
      launchWizardPath({
        action: 'delete',
        method: 'single',
        entity: entityId,
        deal: dealId,
        employee: employeeRecordId,
      }),
    )
  }

  const switchMode = (next: BulkMode) => {
    setBulkMode(next)
    resetBulk()
  }

  return (
    <Page>
      <Hero>
        <HeaderRow>
          <Logo src={assets.loopLogoYellow} alt="loop" />
          <Cancel type="button" onClick={() => navigate('/endorsements')}>
            Cancel
          </Cancel>
        </HeaderRow>

        <HeroCopy>
          <Title>Manage Lives</Title>
          <ShowingFor>
            <Dot src={assets.mlShowingForDot} alt="" />
            <ShowingLabel>Showing for</ShowingLabel>
            <EntitySelect
              value={entityId}
              onChange={(event) => setEntityId(event.target.value)}
              aria-label="Organisation entity"
            >
              {entities.map((entity) => (
                <option key={entity.id} value={entity.id}>
                  {entity.name}
                </option>
              ))}
            </EntitySelect>
            <Chevron src={assets.mlChevronDownWhite} alt="" />
          </ShowingFor>
        </HeroCopy>
      </Hero>

      <Cards>
        <BulkCard>
          <CardTitle>Manage Lives</CardTitle>

          {phase !== 'done' ? (
            <ModeTabs role="tablist" aria-label="Bulk action">
              <ModeTab
                type="button"
                role="tab"
                aria-selected={bulkMode === 'add'}
                $active={bulkMode === 'add'}
                onClick={() => switchMode('add')}
              >
                Add member
              </ModeTab>
              <ModeTab
                type="button"
                role="tab"
                aria-selected={bulkMode === 'remove'}
                $active={bulkMode === 'remove'}
                onClick={() => switchMode('remove')}
              >
                Delete member
              </ModeTab>
            </ModeTabs>
          ) : null}

          {phase === 'idle' || phase === 'parsing' ? (
            <>
              <CardCopy>
                {bulkMode === 'add'
                  ? "Upload an Excel file to add multiple employees at once. Download the template, fill in the employee details, and upload it when you're ready. Have some doubt on how to do it?"
                  : "Upload an Excel file to remove multiple employees at once. Download the template, fill in Employee ID and Date of Leaving, and upload it when you're ready."}
              </CardCopy>

              <LinkRow>
                <TextLink
                  type="button"
                  onClick={() =>
                    window.alert(
                      bulkMode === 'add'
                        ? 'Fill Employee ID, First Name, Last Name, Grade, Core Cover, Email, and DOB. Then upload the sheet for validation.'
                        : 'Fill Employee ID, Date of Leaving, and Confirm Delete. Then upload the sheet for validation.',
                    )
                  }
                >
                  <LinkIcon src={assets.iconDocumentCopy} alt="" />
                  View Instructions
                </TextLink>
                <LinkDivider />
                <TextLink
                  type="button"
                  onClick={() => downloadBulkTemplate(bulkMode)}
                >
                  <LinkIcon src={assets.mlIconDownload} alt="" />
                  Download Template
                </TextLink>
              </LinkRow>

              <DropZone
                onDragOver={(event) => event.preventDefault()}
                onDrop={(event) => {
                  event.preventDefault()
                  void onFile(event.dataTransfer.files[0] ?? null)
                }}
                onClick={() => fileInputRef.current?.click()}
              >
                <UploadArt>
                  <PdfIcon src={assets.mlIconPdf} alt="" />
                  <UploadBadge>
                    <img src={assets.mlIconUploadPlus} alt="" />
                  </UploadBadge>
                </UploadArt>
                <DropCopy>
                  {phase === 'parsing' ? (
                    'Reading file…'
                  ) : (
                    <>
                      Drag and Drop file here or <Choose>Choose file</Choose>
                    </>
                  )}
                </DropCopy>
                <HiddenFile
                  ref={fileInputRef}
                  type="file"
                  onChange={(event) =>
                    void onFile(event.target.files?.[0] ?? null)
                  }
                />
              </DropZone>

              {error ? <ErrorText>{error}</ErrorText> : null}

              <Formats>
                <span>
                  Supported Formats: PPT, PDF, PNG, JPEG, XLS, &amp; XLSX
                </span>
                <span>Maximum Size: 25MB</span>
              </Formats>
            </>
          ) : null}

          {phase === 'validate' && file ? (
            <ValidatePanel>
              <ReadyBadge>
                {bulkMode === 'add'
                  ? 'Bulk add validation'
                  : 'Bulk delete validation'}
              </ReadyBadge>
              <strong>{file.name}</strong>
              <span>
                Dummy parse · {rowCount} rows · {employeeCount} employees ·{' '}
                {passCount} ready
              </span>

              <MiniTable>
                <thead>
                  <tr>
                    <th>Employee</th>
                    <th>{bulkMode === 'add' ? 'Plan' : 'DOL'}</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {bulkMode === 'add'
                    ? addPreview.map((row) => (
                        <tr key={row.id}>
                          <td>
                            {row.name} ({row.employeeId})
                          </td>
                          <td>{row.assignedPlanId}</td>
                          <td>{row.status}</td>
                        </tr>
                      ))
                    : deletePreview.map((row) => (
                        <tr key={row.id}>
                          <td>
                            {row.name} ({row.employeeId})
                          </td>
                          <td>{row.dateOfLeaving}</td>
                          <td>{row.status}</td>
                        </tr>
                      ))}
                </tbody>
              </MiniTable>

              <ReadyActions>
                <Primary type="button" onClick={confirmBulk}>
                  {bulkMode === 'add'
                    ? `Confirm add · ${formatINR(passCount * 1850)}`
                    : `Confirm delete · ${formatINR(passCount * 1200)} refund`}
                </Primary>
                <Ghost type="button" onClick={resetBulk}>
                  Replace file
                </Ghost>
              </ReadyActions>
            </ValidatePanel>
          ) : null}

          {phase === 'done' && file ? (
            <DonePanel>
              <ReadyBadge>Added to Pending Changes</ReadyBadge>
              <DoneTitle>
                {bulkMode === 'add' ? 'Bulk add ready' : 'Bulk delete ready'}
              </DoneTitle>
              <span>
                <strong>{file.name}</strong> · {passCount} employees queued.
                Review and submit from Pending Changes when you&apos;re ready.
              </span>
              <ReadyActions>
                <Primary
                  type="button"
                  onClick={() => navigate('/manage-lives/review')}
                >
                  Review pending changes
                </Primary>
                <Ghost type="button" onClick={resetBulk}>
                  Upload another file
                </Ghost>
              </ReadyActions>
            </DonePanel>
          ) : null}
        </BulkCard>

        <ActionsCard>
          <CardTitle>Or do you want to</CardTitle>
          {MANUAL_ACTIONS.map((action, index) => (
            <div key={action.id}>
              {index > 0 ? <ActionDivider /> : null}
              <ActionRow type="button" onClick={() => openManual(action.id)}>
                <ActionIcon src={assets.mlActionIllustration} alt="" />
                <ActionCopy>
                  <ActionTitle>{action.title}</ActionTitle>
                  <ActionDesc>{action.copy}</ActionDesc>
                </ActionCopy>
                <ChevronButton aria-hidden>
                  <img src={assets.mlChevronRight} alt="" />
                </ChevronButton>
              </ActionRow>
            </div>
          ))}
        </ActionsCard>
      </Cards>

      {findIntent ? (
        <FindOverlay
          role="dialog"
          aria-modal="true"
          aria-label="Find employee"
          onClick={() => setFindIntent(null)}
        >
          <FindPanel onClick={(event) => event.stopPropagation()}>
            <FindHeader>
              <CardTitle>
                {findIntent === 'edit'
                  ? 'Find employee to edit'
                  : findIntent === 'dependant'
                    ? 'Find employee to add a dependant'
                    : 'Find employee to delete'}
              </CardTitle>
              <Ghost type="button" onClick={() => setFindIntent(null)}>
                Close
              </Ghost>
            </FindHeader>
            <SearchInput
              autoFocus
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search by name or employee ID…"
            />
            {query.trim() && findResults.length === 0 ? (
              <EmptyFind>No employees match that search.</EmptyFind>
            ) : null}
            <FindList>
              {findResults.map((employee) => (
                <FindItem
                  key={employee.id}
                  type="button"
                  onClick={() => pickEmployee(employee.id)}
                >
                  <strong>
                    {employee.firstName} {employee.lastName}
                  </strong>
                  <span>{employee.employeeId}</span>
                </FindItem>
              ))}
            </FindList>
          </FindPanel>
        </FindOverlay>
      ) : null}
    </Page>
  )
}

const Page = styled.div`
  position: relative;
  display: flex;
  flex-direction: column;
  min-height: calc(100vh - 44px);
  background: ${({ theme }) => theme.colors.surface0};
`

const Hero = styled.div`
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 36px;
  padding: 36px 48px 0;
  background: ${({ theme }) => theme.colors.emerald};
  min-height: 220px;

  @media (max-width: ${({ theme }) => theme.breakpoints.md}) {
    padding: 24px 20px 0;
    gap: 24px;
  }
`

const HeaderRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
`

const Logo = styled.img`
  height: 32px;
  width: auto;
`

const Cancel = styled.button`
  height: 40px;
  padding: 0 20px;
  border: 0;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.14);
  color: ${({ theme }) => theme.colors.textTertiary};
  font: inherit;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
`

const HeroCopy = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding-bottom: 24px;
`

const Title = styled.h1`
  margin: 0;
  font-size: 24px;
  font-weight: 500;
  line-height: 28px;
  color: ${({ theme }) => theme.colors.textTertiary};
`

const ShowingFor = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  position: relative;
  width: fit-content;
  max-width: 100%;
`

const Dot = styled.img`
  width: 20px;
  height: 20px;
`

const ShowingLabel = styled.span`
  font-size: 14px;
  font-weight: 500;
  letter-spacing: 0.2px;
  color: #c0d7d2;
`

const EntitySelect = styled.select`
  appearance: none;
  border: 0;
  background: transparent;
  color: ${({ theme }) => theme.colors.textTertiary};
  font: inherit;
  font-size: 14px;
  font-weight: 500;
  letter-spacing: 0.2px;
  padding-right: 22px;
  max-width: min(420px, 70vw);
  cursor: pointer;

  option {
    color: ${({ theme }) => theme.colors.textPrimary};
  }
`

const Chevron = styled.img`
  position: absolute;
  right: 0;
  width: 20px;
  height: 20px;
  pointer-events: none;
`

const Cards = styled.div`
  display: grid;
  grid-template-columns: 1.05fr 0.95fr;
  gap: 24px;
  padding: 0 48px 48px;
  margin-top: -8px;
  position: relative;
  z-index: 1;

  @media (max-width: ${({ theme }) => theme.breakpoints.xl}) {
    grid-template-columns: 1fr;
  }

  @media (max-width: ${({ theme }) => theme.breakpoints.md}) {
    padding: 0 20px 40px;
  }
`

const BulkCard = styled.section`
  display: flex;
  flex-direction: column;
  gap: 24px;
  padding: 24px;
  border-radius: 16px;
  background: ${({ theme }) => theme.colors.surface1};
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.06);
`

const ActionsCard = styled.section`
  display: flex;
  flex-direction: column;
  gap: 25px;
  padding: 16px 24px;
  border-radius: 12px;
  background: ${({ theme }) => theme.colors.surface1};
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.06);
  height: fit-content;
`

const CardTitle = styled.h2`
  margin: 0;
  font-size: 20px;
  font-weight: 500;
  line-height: 24px;
  color: ${({ theme }) => theme.colors.textPrimary};
`

const ModeTabs = styled.div`
  display: inline-flex;
  align-items: center;
  padding: 6px;
  width: fit-content;
  border-radius: 14px;
  background: ${({ theme }) => theme.colors.disableFill};
`

const ModeTab = styled.button<{ $active: boolean }>`
  height: 36px;
  padding: 0 16px;
  border: 0;
  border-radius: 8px;
  font: inherit;
  font-size: 14px;
  font-weight: 500;
  letter-spacing: 0.2px;
  cursor: pointer;
  background: ${({ $active, theme }) =>
    $active ? theme.colors.surface1 : 'transparent'};
  color: ${({ $active, theme }) =>
    $active ? theme.colors.emerald : theme.colors.textPrimary};
`

const CardCopy = styled.p`
  margin: 0;
  font-size: 14px;
  line-height: 20px;
  letter-spacing: 0.2px;
  color: ${({ theme }) => theme.colors.textPrimary};
`

const LinkRow = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
`

const TextLink = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 0;
  border: 0;
  background: transparent;
  color: ${({ theme }) => theme.colors.emerald};
  font: inherit;
  font-size: 14px;
  font-weight: 500;
  letter-spacing: 0.2px;
  cursor: pointer;
`

const LinkIcon = styled.img`
  width: 20px;
  height: 20px;
`

const LinkDivider = styled.span`
  width: 1px;
  height: 14px;
  background: ${({ theme }) => theme.colors.defaultBorder};
`

const DropZone = styled.div`
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16px;
  min-height: 280px;
  padding: 48px 12px;
  border-radius: 12px;
  background: ${({ theme }) => theme.colors.planeGreenLight};
  cursor: pointer;
`

const UploadArt = styled.div`
  position: relative;
  width: 24px;
  height: 24px;
  flex-shrink: 0;
`

const PdfIcon = styled.img`
  width: 24px;
  height: 24px;
`

const UploadBadge = styled.span`
  position: absolute;
  left: 14px;
  top: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  border-radius: 36px;
  background: ${({ theme }) => theme.colors.emerald};
  padding: 4px;
  box-sizing: border-box;

  img {
    width: 12px;
    height: 12px;
  }
`

const DropCopy = styled.p`
  margin: 0;
  font-size: 14px;
  line-height: 20px;
  letter-spacing: 0.2px;
  color: ${({ theme }) => theme.colors.textSecondary};
`

const Choose = styled.span`
  font-weight: 500;
  color: ${({ theme }) => theme.colors.emerald};
`

const HiddenFile = styled.input`
  display: none;
`

const Formats = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  font-size: 12px;
  line-height: 18px;
  letter-spacing: 0.2px;
  color: ${({ theme }) => theme.colors.textSecondary};
  flex-wrap: wrap;
`

const ValidatePanel = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 20px;
  border-radius: 12px;
  background: ${({ theme }) => theme.colors.planeGreenLight};

  strong {
    font-size: 16px;
    color: ${({ theme }) => theme.colors.emerald};
  }

  span {
    font-size: 14px;
    color: ${({ theme }) => theme.colors.textSecondary};
  }
`

const DonePanel = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 24px;
  border-radius: 12px;
  background: ${({ theme }) => theme.colors.planeGreenLight};

  span {
    font-size: 14px;
    line-height: 20px;
    color: ${({ theme }) => theme.colors.textSecondary};
  }
`

const DoneTitle = styled.h3`
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.emerald};
`

const MiniTable = styled.table`
  width: 100%;
  margin-top: 8px;
  border-collapse: collapse;
  font-size: 13px;
  background: ${({ theme }) => theme.colors.surface1};
  border-radius: 8px;
  overflow: hidden;

  th,
  td {
    padding: 10px 12px;
    text-align: left;
    border-bottom: 1px solid ${({ theme }) => theme.colors.disableFill};
  }

  th {
    font-weight: 500;
    color: ${({ theme }) => theme.colors.textSecondary};
    background: ${({ theme }) => theme.colors.surface0};
  }

  tbody tr:last-child td {
    border-bottom: 0;
  }
`

const ReadyBadge = styled.span`
  align-self: flex-start;
  display: inline-flex;
  align-items: center;
  height: 24px;
  padding: 0 10px;
  border-radius: 999px;
  background: ${({ theme }) => theme.colors.fillGreen};
  color: ${({ theme }) => theme.colors.emerald};
  font-size: 12px;
  font-weight: 600;
`

const ReadyActions = styled.div`
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  margin-top: 12px;
`

const Primary = styled.button`
  height: 44px;
  padding: 0 20px;
  border: 0;
  border-radius: 12px;
  background: ${({ theme }) => theme.colors.fillGreen};
  color: ${({ theme }) => theme.colors.emerald};
  font: inherit;
  font-weight: 600;
  cursor: pointer;
`

const Ghost = styled.button`
  height: 36px;
  padding: 0 12px;
  border: 0;
  border-radius: 8px;
  background: transparent;
  color: ${({ theme }) => theme.colors.emerald};
  font: inherit;
  font-weight: 500;
  cursor: pointer;
`

const ErrorText = styled.p`
  margin: 0;
  font-size: 13px;
  color: ${({ theme }) => theme.colors.textError};
`

const ActionDivider = styled.div`
  height: 1px;
  width: 100%;
  background: ${({ theme }) => theme.colors.defaultBorder};
  margin: 0 0 25px;
`

const ActionRow = styled.button`
  display: flex;
  align-items: center;
  gap: 24px;
  width: 100%;
  padding: 0;
  border: 0;
  background: transparent;
  text-align: left;
  cursor: pointer;
  font: inherit;
  color: inherit;
`

const ActionIcon = styled.img`
  width: 60px;
  height: 60px;
  flex-shrink: 0;
`

const ActionCopy = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  flex: 1;
  min-width: 0;
`

const ActionTitle = styled.span`
  font-size: 18px;
  font-weight: 500;
  line-height: 24px;
  color: ${({ theme }) => theme.colors.textPrimary};
`

const ActionDesc = styled.span`
  font-size: 14px;
  line-height: 20px;
  letter-spacing: 0.2px;
  color: ${({ theme }) => theme.colors.textPrimary};
`

const ChevronButton = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 48px;
  height: 48px;
  flex-shrink: 0;
  border: 1px solid ${({ theme }) => theme.colors.emerald};
  border-radius: 12px;

  img {
    width: 20px;
    height: 20px;
  }
`

const FindOverlay = styled.div`
  position: fixed;
  inset: 0;
  z-index: 40;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  background: rgba(17, 24, 39, 0.45);
`

const FindPanel = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
  width: min(520px, 100%);
  max-height: min(70vh, 560px);
  padding: 24px;
  border-radius: 16px;
  background: ${({ theme }) => theme.colors.surface1};
  overflow: hidden;
`

const FindHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
`

const SearchInput = styled.input`
  height: 44px;
  padding: 0 14px;
  border: 1px solid ${({ theme }) => theme.colors.defaultBorder};
  border-radius: 8px;
  font: inherit;
`

const FindList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  overflow: auto;
`

const FindItem = styled.button`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 2px;
  padding: 12px;
  border: 1px solid ${({ theme }) => theme.colors.disableFill};
  border-radius: 8px;
  background: ${({ theme }) => theme.colors.surface0};
  font: inherit;
  text-align: left;
  cursor: pointer;

  strong {
    color: ${({ theme }) => theme.colors.emerald};
  }

  span {
    font-size: 13px;
    color: ${({ theme }) => theme.colors.textSecondary};
  }
`

const EmptyFind = styled.p`
  margin: 0;
  font-size: 14px;
  color: ${({ theme }) => theme.colors.textSecondary};
`
