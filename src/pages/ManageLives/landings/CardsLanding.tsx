import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import styled, { keyframes } from 'styled-components'

import { assets } from '@/assets/figma'
import {
  bulkDeleteTemplateFileName,
  bulkTemplateFileName,
} from '@/data/employees'
import {
  detectSheetColumns,
  parseSheet,
  type ColumnDetectionResult,
} from '@/pages/ManageLives/bulk/parseAndValidate'
import { ColumnMappingPanel } from '@/pages/ManageLives/landings/ColumnMappingPanel'
import { EndorsementCostPanel } from '@/pages/ManageLives/landings/EndorsementCostPanel'
import { EnrollmentSettingsModal } from '@/pages/ManageLives/landings/EnrollmentSettingsModal'
import { ValidationIssuesPanel } from '@/pages/ManageLives/landings/ValidationIssuesPanel'
import { ValidationResultsPanel } from '@/pages/ManageLives/landings/ValidationResultsPanel'
import { usePendingChanges } from '@/pages/ManageLives/PendingChangesContext'
import { nextPendingId } from '@/pages/ManageLives/pendingChanges'
import { sampleBulkRows, validationIssuesFor, type BulkMemberRow } from '@/data/flexDeal'
import { useProtoConfig } from '@/proto/ProtoConfigContext'

type BulkMode = 'add' | 'remove'

function toggleIgnored(
  rows: BulkMemberRow[],
  rowId: string,
  ignored: boolean,
) {
  const target = rows.find((row) => row.id === rowId)
  if (!target) return rows
  return rows.map((row) => {
    if (row.id === rowId) return { ...row, ignored }
    if (
      target.relationship === 'Self' &&
      row.relationship !== 'Self' &&
      row.employeeId === target.employeeId
    ) {
      return { ...row, ignored }
    }
    return row
  })
}

const ASSIGNING_BENEFITS_MS = 2000

/** Narrates the document scan so the mapping card never appears instantly. */
const SCAN_STAGES = [
  'Opening your document...',
  'Reading the header row...',
  'Matching columns to Loop fields...',
]
const SCAN_STAGE_MS = 900

const WIZARD_STEPS = [
  {
    title: 'Set Up Action',
    description: 'Choose an action, select companies, and upload the sheet.',
  },
  {
    title: 'Validate Data',
    description: 'Review lives, plan distribution, and validation errors.',
  },
  {
    title: 'Review Cost',
    description: 'Check the Endo cost, CD balance, and any shortfall.',
  },
] as const

type StepStatus = 'done' | 'active' | 'pending'

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

function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) {
    const kb = bytes / 1024
    return `${kb >= 10 ? kb.toFixed(0) : kb.toFixed(1)} KB`
  }
  const mb = bytes / (1024 * 1024)
  return `${mb >= 10 ? mb.toFixed(0) : mb.toFixed(1)} MB`
}

export function CardsLanding() {
  const navigate = useNavigate()
  const { entities, deals } = useProtoConfig()
  const { addChange } = usePendingChanges()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const workspaceRef = useRef<HTMLElement>(null)
  const pendingFileRef = useRef<File | null>(null)

  const [bulkMode, setBulkMode] = useState<BulkMode>('add')
  const [entityId, setEntityId] = useState(entities[0]?.id ?? 'symphony-eyc')
  const [file, setFile] = useState<File | null>(null)
  const [phase, setPhase] = useState<
    'idle' | 'scanning' | 'issues' | 'results' | 'cost'
  >('idle')
  const [validatedRows, setValidatedRows] =
    useState<BulkMemberRow[]>(sampleBulkRows)
  const [columnDetection, setColumnDetection] =
    useState<ColumnDetectionResult | null>(null)
  const [assigningBenefits, setAssigningBenefits] = useState(false)
  const [scanStage, setScanStage] = useState(0)
  const [enrollmentOpen, setEnrollmentOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const dealId = deals[0]?.id
  const scanning = phase === 'scanning'
  const showingIssues = phase === 'issues'
  const showingResults = phase === 'results'
  const showingCost = phase === 'cost'
  const activeWizardStep = showingCost
    ? 2
    : scanning || showingIssues || showingResults
      ? 1
      : 0
  const scanFile = pendingFileRef.current ?? file

  function stepStatus(index: number): StepStatus {
    if (index < activeWizardStep) return 'done'
    if (index === activeWizardStep) return 'active'
    return 'pending'
  }

  useEffect(() => {
    if (phase !== 'scanning' || !assigningBenefits) return

    const timer = window.setTimeout(() => {
      setPhase(bulkMode === 'add' ? 'issues' : 'results')
    }, ASSIGNING_BENEFITS_MS)

    return () => window.clearTimeout(timer)
  }, [phase, assigningBenefits, bulkMode])

  useEffect(() => {
    if (phase !== 'scanning' || columnDetection || assigningBenefits) return
    if (scanStage >= SCAN_STAGES.length - 1) return

    const timer = window.setTimeout(
      () => setScanStage((current) => current + 1),
      SCAN_STAGE_MS,
    )

    return () => window.clearTimeout(timer)
  }, [phase, columnDetection, assigningBenefits, scanStage])

  /** Each step animates in from the top, so start the scroller there too. */
  useEffect(() => {
    workspaceRef.current?.scrollTo({ top: 0, behavior: 'smooth' })
  }, [phase])

  function selectFile(next: File | null) {
    if (!next || scanning) return
    setError(null)
    setFile(next)
    setColumnDetection(null)
    setValidatedRows(sampleBulkRows)
    setAssigningBenefits(false)
  }

  function clearFile() {
    if (scanning) return
    setFile(null)
    setError(null)
    setColumnDetection(null)
    setAssigningBenefits(false)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  function goBackToSetup() {
    pendingFileRef.current = null
    setColumnDetection(null)
    setValidatedRows(sampleBulkRows)
    setAssigningBenefits(false)
    setScanStage(0)
    setPhase('idle')
  }

  function mapColumn(mappingId: string, sourceColumn: string) {
    setColumnDetection((current) => {
      if (!current) return current
      return {
        ...current,
        mappings: current.mappings.map((mapping) =>
          mapping.id === mappingId
            ? { ...mapping, sourceColumn, confidence: 'manual' }
            : mapping,
        ),
      }
    })
  }

  function confirmColumnMapping() {
    setAssigningBenefits(true)
  }

  function ignoreValidationIssue(rowId: string) {
    setValidatedRows((current) => toggleIgnored(current, rowId, true))
  }

  function restoreValidationIssue(rowId: string) {
    setValidatedRows((current) => toggleIgnored(current, rowId, false))
  }

  function resolveValidationIssue(
    rowId: string,
    fixes: { field: string; value: string }[],
  ) {
    setValidatedRows((current) =>
      current.map((row) => {
        if (row.id !== rowId) return row

        const remaining = validationIssuesFor(row).filter(
          (issue) =>
            !fixes.some(
              (fix) => fix.field.toLowerCase() === issue.field.toLowerCase(),
            ),
        )

        let employeeId = row.employeeId
        let email = row.email
        let assignedPlanId = row.assignedPlanId
        let needsManualAssignment = row.needsManualAssignment

        for (const fix of fixes) {
          const field = fix.field.toLowerCase()
          if (field.includes('employee id')) employeeId = fix.value
          if (field.includes('email')) email = fix.value
          if (field.includes('cover') || field.includes('plan')) {
            assignedPlanId = fix.value
            needsManualAssignment = false
          }
        }

        const parental = assignedPlanId === 'plan-parental'
        const originalIssues = validationIssuesFor(row)
        const resolved = remaining.length === 0

        return {
          ...row,
          employeeId,
          email,
          assignedPlanId: assignedPlanId ?? (resolved ? 'plan-standard' : null),
          benefitIds: parental
            ? ['ben-gmc', 'ben-gpa', 'ben-gmc-parental']
            : row.benefitIds.length > 0
              ? row.benefitIds
              : ['ben-gmc', 'ben-gpa'],
          purchaseGroupSelections: {
            'pg-core': [parental ? 'opt-parental' : 'opt-standard'],
          },
          assignmentSource: 'manual',
          needsManualAssignment: resolved ? false : needsManualAssignment,
          status: resolved ? 'pass' : row.status,
          payrollDelta: parental ? 2100 : Math.max(row.payrollDelta, 1250),
          validationIssues: remaining,
          validationError: remaining[0]?.error,
          validationField: remaining[0]?.field,
          resolvedIssues: resolved
            ? originalIssues.map((issue) => ({
                ...issue,
                resolvedValue: fixes.find(
                  (fix) =>
                    fix.field.toLowerCase() === issue.field.toLowerCase(),
                )?.value,
              }))
            : row.resolvedIssues,
        }
      }),
    )
  }

  /**
   * Adding lives asks about an enrollment window first; deletions go straight
   * to the cost review.
   */
  function submitForReview() {
    if (bulkMode === 'add') {
      setEnrollmentOpen(true)
      return
    }
    continueToReview()
  }

  function continueToReview() {
    setEnrollmentOpen(false)
    const target = pendingFileRef.current ?? file
    const lives = validatedRows.filter(
      (row) => !row.ignored && row.status !== 'fail',
    ).length
    const entityName =
      entities.find((entity) => entity.id === entityId)?.name ?? entityId
    addChange({
      id: nextPendingId(),
      employeeId: 'bulk',
      employeeName: target?.name ?? 'Bulk upload',
      entityId,
      entityName,
      dealId,
      dealName: deals[0]?.name,
      action: bulkMode === 'add' ? 'bulk_add' : 'bulk_remove',
      description:
        bulkMode === 'add'
          ? `Submitted ${lives} lives for addition`
          : `Submitted ${lives} lives for deletion`,
      createdAt: new Date().toISOString(),
      payload: {
        fileName: target?.name,
        lives,
      },
    })
    setPhase('cost')
  }

  async function proceedToValidate() {
    if (!file || scanning) return

    setError(null)
    pendingFileRef.current = file
    setPhase('scanning')
    setColumnDetection(null)
    setAssigningBenefits(false)
    setScanStage(0)

    try {
      const [detection] = await Promise.all([
        detectSheetColumns(bulkMode),
        parseSheet(file, bulkMode),
      ])
      setColumnDetection(detection)
    } catch {
      pendingFileRef.current = null
      setError('We could not read that file. Try again with any document.')
      setPhase('idle')
      setColumnDetection(null)
      setAssigningBenefits(false)
    }
  }

  return (
    <Page>
      <ProgressPanel>
        <Logo src={assets.loopLogoYellow} alt="loop" />
        <ProgressList aria-label="Bulk update progress">
          {WIZARD_STEPS.map((step, index) => {
            const status = stepStatus(index)
            return (
              <ProgressStep key={step.title}>
                <StepRail>
                  <StepDot $status={status} aria-hidden />
                  {index < WIZARD_STEPS.length - 1 ? (
                    <StepConnector $done={status === 'done'} />
                  ) : null}
                </StepRail>
                <StepCopy $last={index === WIZARD_STEPS.length - 1}>
                  <StepTitle>{step.title}</StepTitle>
                  <StepDesc>{step.description}</StepDesc>
                </StepCopy>
              </ProgressStep>
            )
          })}
        </ProgressList>
      </ProgressPanel>

      <Workspace ref={workspaceRef}>
        <ExitButton type="button" onClick={() => navigate('/employees')}>
          Exit
        </ExitButton>

        <PhaseView key={phase}>
          {scanning ? (
          <Content>
            <AssistantAvatar
              src={assets.mlBulkAssistantAvatar}
              alt=""
              width={48}
              height={48}
            />
            <Setup>
              <ScanPanel role="status" aria-busy aria-live="polite">
                <ScanFileCard>
                  <FileMeta>
                    <FileIconWrap aria-hidden>
                      <img
                        src={assets.mlIconFileUploaded}
                        alt=""
                        width={20}
                        height={20}
                      />
                    </FileIconWrap>
                    <FileCopy>
                      <FileName title={scanFile?.name}>
                        {scanFile?.name}
                      </FileName>
                      <FileSize>{formatFileSize(scanFile?.size ?? 0)}</FileSize>
                    </FileCopy>
                  </FileMeta>
                  <LoaderSpin
                    src={assets.mlIconLoaderScan}
                    alt=""
                    width={32}
                    height={32}
                  />
                </ScanFileCard>

                {columnDetection && !assigningBenefits ? (
                  <ColumnMappingPanel
                    mappings={columnDetection.mappings}
                    uploadedColumns={columnDetection.uploadedColumns}
                    sampleValues={columnDetection.sampleValues}
                    onMap={mapColumn}
                    onConfirm={confirmColumnMapping}
                  />
                ) : (
                  <DetectionIntro>
                    <LoaderSpin
                      src={assets.mlIconLoaderSm}
                      alt=""
                      width={12}
                      height={12}
                    />
                    {assigningBenefits
                      ? 'Assigning benefits to employees...'
                      : SCAN_STAGES[scanStage]}
                  </DetectionIntro>
                )}
              </ScanPanel>
            </Setup>
          </Content>
        ) : showingIssues ? (
          <ValidationIssuesPanel
            rows={validatedRows}
            fileName={scanFile?.name}
            fileSize={scanFile?.size}
            onResolve={resolveValidationIssue}
            onIgnore={ignoreValidationIssue}
            onRestore={restoreValidationIssue}
            onReupload={goBackToSetup}
            onContinue={() => setPhase('results')}
          />
        ) : showingResults ? (
          <ValidationResultsPanel
            rows={validatedRows}
            isDelete={bulkMode === 'remove'}
            fileName={scanFile?.name}
            fileSize={scanFile?.size}
            onBack={goBackToSetup}
            onContinue={submitForReview}
          />
        ) : showingCost ? (
          <EndorsementCostPanel
            rows={validatedRows}
            isDelete={bulkMode === 'remove'}
            onDone={() => navigate('/employees')}
          />
        ) : (
          <Content>
            <AssistantAvatar
              src={assets.mlBulkAssistantAvatar}
              alt=""
              width={48}
              height={48}
            />
            <Setup>
              {entities.length > 1 ? (
                <CompanySection>
                  <SectionTitle>
                    Which company are you taking this action for?
                  </SectionTitle>
                  <Pills role="group" aria-label="Company">
                    {entities.map((entity) => (
                      <Pill
                        key={entity.id}
                        type="button"
                        $active={entityId === entity.id}
                        aria-pressed={entityId === entity.id}
                        onClick={() => setEntityId(entity.id)}
                      >
                        {entity.name}
                      </Pill>
                    ))}
                  </Pills>
                </CompanySection>
              ) : null}

              <Section>
                <SectionTitle>What would you like to do today?</SectionTitle>
                <ActionCards role="group" aria-label="Bulk action">
                  <ActionCard
                    type="button"
                    $active={bulkMode === 'add'}
                    aria-pressed={bulkMode === 'add'}
                    onClick={() => {
                      setBulkMode('add')
                      setError(null)
                      setColumnDetection(null)
                      setAssigningBenefits(false)
                    }}
                  >
                    <ActionIcon src={assets.mlBulkAddLives} alt="" />
                    <ActionCopy>
                      <ActionTitle>Add Lives</ActionTitle>
                      <ActionDescription>
                        Bulk add employees or dependants via Excel.
                      </ActionDescription>
                    </ActionCopy>
                    <SelectedBadge $shown={bulkMode === 'add'} aria-hidden>
                      <img src={assets.mlBulkSelectedCheck} alt="" />
                    </SelectedBadge>
                  </ActionCard>
                  <ActionCard
                    type="button"
                    $active={bulkMode === 'remove'}
                    aria-pressed={bulkMode === 'remove'}
                    onClick={() => {
                      setBulkMode('remove')
                      setError(null)
                      setColumnDetection(null)
                      setAssigningBenefits(false)
                    }}
                  >
                    <ActionIcon src={assets.mlBulkDeleteLives} alt="" />
                    <ActionCopy>
                      <ActionTitle>Delete Lives</ActionTitle>
                      <ActionDescription>
                        Remove employees or dependants via Excel.
                      </ActionDescription>
                    </ActionCopy>
                    <SelectedBadge $shown={bulkMode === 'remove'} aria-hidden>
                      <img src={assets.mlBulkSelectedCheck} alt="" />
                    </SelectedBadge>
                  </ActionCard>
                </ActionCards>
              </Section>

              <PointerRow aria-hidden>
                <UploadPointer $mode={bulkMode} />
              </PointerRow>
              <UploadPanel>
                <UploadHeading>
                  <SmallTitle>Upload the excel sheet</SmallTitle>
                  <UploadDescription>
                    {file
                      ? 'Download the template, fill in the details and upload the completed placement slip to create this policy'
                      : bulkMode === 'add'
                        ? 'Download the template, fill in the details, and upload it to add the employees & their dependants.'
                        : 'Download the template, fill in the details, and upload it to remove employees or dependants.'}
                  </UploadDescription>
                </UploadHeading>

                {file ? null : (
                  <TemplateCard>
                    <TemplateCopy>
                      <TemplateTitle>
                        <ExcelMark aria-hidden>X</ExcelMark>
                        Sample Template for{' '}
                        {bulkMode === 'add' ? 'Addition' : 'Deletion'}
                      </TemplateTitle>
                      <TemplateDescription>
                        Use this template with predefined columns and enter
                        details
                      </TemplateDescription>
                    </TemplateCopy>
                    <DownloadButton
                      type="button"
                      onClick={() => downloadBulkTemplate(bulkMode)}
                    >
                      Download
                    </DownloadButton>
                  </TemplateCard>
                )}

                <UploadBlock>
                  {file ? (
                    <>
                      <FileCard>
                        <FileMeta>
                          <FileIconWrap aria-hidden>
                            <img
                              src={assets.mlIconFileUploaded}
                              alt=""
                              width={20}
                              height={20}
                            />
                          </FileIconWrap>
                          <FileCopy>
                            <FileName title={file.name}>{file.name}</FileName>
                            <FileSize>{formatFileSize(file.size)}</FileSize>
                          </FileCopy>
                        </FileMeta>
                        <DeleteFileButton type="button" onClick={clearFile}>
                          <img
                            src={assets.mlIconTrashDelete}
                            alt=""
                            width={18}
                            height={18}
                          />
                          Delete
                        </DeleteFileButton>
                      </FileCard>
                      <ProceedButton
                        type="button"
                        onClick={() => void proceedToValidate()}
                      >
                        Proceed to Validate
                      </ProceedButton>
                    </>
                  ) : (
                    <>
                      <DropZone
                        role="button"
                        tabIndex={0}
                        onDragOver={(event) => event.preventDefault()}
                        onDrop={(event) => {
                          event.preventDefault()
                          selectFile(event.dataTransfer.files[0] ?? null)
                        }}
                        onClick={() => fileInputRef.current?.click()}
                        onKeyDown={(event) => {
                          if (event.key === 'Enter' || event.key === ' ') {
                            event.preventDefault()
                            fileInputRef.current?.click()
                          }
                        }}
                      >
                        <DropInner>
                          <UploadArt aria-hidden>
                            <PdfIcon src={assets.mlIconPdfUpload} alt="" />
                            <UploadBadge>
                              <img
                                src={assets.mlIconUploadPlusSmall}
                                alt=""
                                width={12}
                                height={12}
                              />
                            </UploadBadge>
                          </UploadArt>
                          <DropCopy>
                            Drag and Drop file here or{' '}
                            <Choose>Choose file</Choose>
                          </DropCopy>
                        </DropInner>
                      </DropZone>
                      <Formats>
                        <span>Supported Formats: XLS, XLSX</span>
                        <span>Maximum Size: 25MB</span>
                      </Formats>
                    </>
                  )}
                  <HiddenFile
                    ref={fileInputRef}
                    type="file"
                    accept=".xls,.xlsx"
                    onChange={(event) =>
                      selectFile(event.target.files?.[0] ?? null)
                    }
                  />
                  {error ? <ErrorText>{error}</ErrorText> : null}
                </UploadBlock>
              </UploadPanel>
            </Setup>
          </Content>
          )}
        </PhaseView>
      </Workspace>

      <EnrollmentSettingsModal
        open={enrollmentOpen}
        recipientCount={
          validatedRows.filter(
            (row) =>
              !row.ignored &&
              row.status !== 'fail' &&
              row.relationship === 'Self',
          ).length
        }
        onCancel={() => setEnrollmentOpen(false)}
        onConfirm={continueToReview}
      />
    </Page>
  )
}

const Page = styled.div`
  display: flex;
  align-items: stretch;
  gap: 10px;
  width: 100%;
  height: 100%;
  min-height: 0;
  max-height: 100%;
  padding: 6px;
  box-sizing: border-box;
  overflow: hidden;
  background: ${({ theme }) => theme.colors.surface1};

  @media (max-width: ${({ theme }) => theme.breakpoints.md}) {
    flex-direction: column;
    height: auto;
    min-height: 100vh;
    max-height: none;
    overflow: visible;
  }
`

const ProgressPanel = styled.aside`
  position: relative;
  isolation: isolate;
  width: 330px;
  height: 100%;
  min-height: 0;
  flex-shrink: 0;
  padding: 24px;
  border-radius: 16px;
  background-color: ${({ theme }) => theme.colors.emerald};
  background-image: linear-gradient(
    180deg,
    rgba(2, 95, 76, 0.08),
    rgba(0, 40, 31, 0.9)
  );
  background-repeat: no-repeat;
  background-size: cover;
  box-sizing: border-box;
  overflow: hidden;

  /* Noise sits on the green fill with Overlay, matching Figma. */
  &::before {
    content: '';
    position: absolute;
    inset: 0;
    z-index: 0;
    background: image-set(url(${assets.mlBulkSidebarNoise}) 2x) top left / 17.36%
      auto repeat;
    mix-blend-mode: overlay;
    pointer-events: none;
  }

  /* Leaf art sits above the stepper content, as in the design. */
  &::after {
    content: '';
    position: absolute;
    left: -312px;
    bottom: -194px;
    z-index: 1;
    width: 442px;
    height: 442px;
    background: url(${assets.mlBulkSidebarLeaves}) no-repeat center / contain;
    transform: rotate(0.45deg);
    pointer-events: none;
  }

  @media (max-width: ${({ theme }) => theme.breakpoints.lg}) {
    width: 270px;
  }

  @media (max-width: ${({ theme }) => theme.breakpoints.md}) {
    width: 100%;
    height: auto;
    min-height: 0;
  }
`

const Logo = styled.img`
  position: relative;
  z-index: 1;
  display: block;
  width: 67px;
  height: 32px;
  object-fit: contain;
`

const ProgressList = styled.div`
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  margin-top: 16px;

  @media (max-width: ${({ theme }) => theme.breakpoints.md}) {
    margin-top: 24px;
  }
`

const ProgressStep = styled.div`
  display: flex;
  gap: 12px;
  width: 100%;
`

const StepRail = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 14px;
  flex-shrink: 0;
  padding-top: 4px;
`

const StepDot = styled.span<{ $status: StepStatus }>`
  display: grid;
  place-items: center;
  width: 14px;
  height: 14px;
  flex-shrink: 0;
  border-radius: 50%;
  box-sizing: border-box;
  background: ${({ theme, $status }) =>
    $status === 'done'
      ? theme.colors.fillGreen
      : $status === 'active'
        ? theme.colors.planeGreenDark
        : theme.colors.planeGreenDark};
  border: 2px solid
    ${({ theme, $status }) =>
      $status === 'done'
        ? theme.colors.planeGreenLight
        : $status === 'active'
          ? theme.colors.textTertiary
          : 'rgba(255, 255, 255, 0.5)'};
`

const StepConnector = styled.span<{ $done?: boolean }>`
  flex: 1;
  min-height: 44px;
  margin-top: 8px;
  border-left: 1px
    ${({ $done }) => ($done ? 'solid' : 'dashed')}
    ${({ theme, $done }) =>
      $done ? theme.colors.planeGreenLight : 'rgba(255, 255, 255, 0.5)'};
`

const StepCopy = styled.div<{ $last?: boolean }>`
  display: flex;
  flex-direction: column;
  flex: 1;
  min-width: 0;
  padding-bottom: ${({ $last }) => ($last ? '24px' : '36px')};
`

const StepTitle = styled.p`
  margin: 0;
  font-size: 16px;
  font-weight: 500;
  line-height: 24px;
  letter-spacing: 0.2px;
  color: ${({ theme }) => theme.colors.textTertiary};
`

const StepDesc = styled.p`
  margin: 0;
  font-size: 14px;
  font-weight: 400;
  line-height: 20px;
  letter-spacing: 0.2px;
  color: ${({ theme }) => theme.colors.planeGreenLight};
`

const Workspace = styled.main`
  position: relative;
  flex: 1;
  min-width: 0;
  overflow-x: hidden;
  overflow-y: auto;
  overscroll-behavior: contain;
  background: ${({ theme }) => theme.colors.surface1};
`

const ExitButton = styled.button`
  position: absolute;
  top: 18px;
  right: 18px;
  /* Above PhaseView, whose animation transform makes it paint over this. */
  z-index: 2;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 96px;
  height: 36px;
  padding: 8px 16px;
  border: 1px solid ${({ theme }) => theme.colors.defaultBorder};
  border-radius: ${({ theme }) => theme.radii.sm};
  background: transparent;
  box-sizing: border-box;
  font: inherit;
  font-size: 12px;
  font-weight: 500;
  line-height: 18px;
  letter-spacing: 0.2px;
  color: ${({ theme }) => theme.colors.textPrimary};
  cursor: pointer;

  &:hover:not(:disabled) {
    border-color: ${({ theme }) => theme.colors.emerald};
  }

  &:disabled {
    cursor: not-allowed;
    opacity: 0.6;
  }
`

const stepIn = keyframes`
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
`

/** Remounted per phase so every step rises into place like a new chat message. */
const PhaseView = styled.div`
  animation: ${stepIn} 800ms cubic-bezier(0.22, 1, 0.36, 1) both;

  @media (prefers-reduced-motion: reduce) {
    animation: none;
  }
`

const Content = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 24px;
  width: 100%;
  max-width: 996px;
  padding: 72px 24px 24px 40px;
  box-sizing: border-box;

  @media (max-width: ${({ theme }) => theme.breakpoints.lg}) {
    padding-left: 24px;
  }

  @media (max-width: ${({ theme }) => theme.breakpoints.md}) {
    padding: 72px ${({ theme }) => theme.layout.contentPadXMobile} 32px;
  }

  @media (max-width: ${({ theme }) => theme.breakpoints.sm}) {
    flex-direction: column;
  }
`

const AssistantAvatar = styled.img`
  display: block;
  width: 48px;
  height: 48px;
  flex: 0 0 48px;
  border-radius: 50%;
  object-fit: cover;
`

const Setup = styled.div`
  display: flex;
  min-width: 0;
  max-width: 860px;
  flex: 1;
  flex-direction: column;
  gap: 16px;
  padding-top: 13px;

  @media (max-width: ${({ theme }) => theme.breakpoints.md}) {
    max-width: none;
  }

  @media (max-width: ${({ theme }) => theme.breakpoints.sm}) {
    width: 100%;
    padding-top: 0;
  }
`

const spin = keyframes`
  to { transform: rotate(360deg); }
`

const LoaderSpin = styled.img`
  display: block;
  animation: ${spin} 1s linear infinite;

  @media (prefers-reduced-motion: reduce) {
    animation: none;
  }
`

const DetectionIntro = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 2px 0;
  color: ${({ theme }) => theme.colors.textSecondary};
  font-size: 12px;
  line-height: 18px;
  letter-spacing: 0.2px;
`

const Section = styled.section`
  display: flex;
  flex-direction: column;
  gap: 16px;
  width: 100%;
`

const SectionTitle = styled.h2`
  margin: 0;
  font-family: inherit;
  font-size: 18px;
  font-weight: 500;
  font-style: normal;
  line-height: 24px;
  letter-spacing: 0.2px;
  color: ${({ theme }) => theme.colors.textPrimary};
`

const ActionCards = styled.div`
  display: flex;
  gap: 16px;
  width: 100%;

  @media (max-width: ${({ theme }) => theme.breakpoints.lg}) {
    flex-direction: column;
  }
`

/**
 * The selected ring is a box-shadow rather than a wider border so switching
 * modes cannot reflow the card contents by a pixel.
 */
const ActionCard = styled.button<{ $active: boolean }>`
  position: relative;
  display: flex;
  min-width: 0;
  min-height: 88px;
  flex: 1;
  align-items: flex-start;
  gap: 16px;
  padding: 16px;
  border: 1px solid
    ${({ $active, theme }) =>
      $active ? theme.colors.emerald : theme.colors.disableFill};
  border-radius: 12px;
  background: ${({ theme }) => theme.colors.surface1};
  box-shadow: 0 0 0 ${({ $active }) => ($active ? '2px' : '0')}
    ${({ theme }) => theme.colors.emerald};
  box-sizing: border-box;
  color: inherit;
  font: inherit;
  text-align: left;
  cursor: pointer;
  transition:
    border-color 200ms ease,
    box-shadow 200ms ease,
    background-color 200ms ease;

  &:hover {
    border-color: ${({ theme }) => theme.colors.emerald};
  }

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.colors.emerald};
    outline-offset: 2px;
  }

  @media (prefers-reduced-motion: reduce) {
    transition: none;
  }
`

const ActionIcon = styled.img`
  display: block;
  width: 48px;
  height: 48px;
  flex: 0 0 48px;
`

const ActionCopy = styled.span`
  display: flex;
  min-width: 0;
  flex: 1;
  flex-direction: column;
  gap: 4px;
`

const ActionTitle = styled.span`
  color: ${({ theme }) => theme.colors.textPrimary};
  font-size: 16px;
  font-weight: 500;
  line-height: 24px;
  letter-spacing: 0.2px;
`

const ActionDescription = styled.span`
  color: ${({ theme }) => theme.colors.textSecondary};
  font-size: 14px;
  font-weight: 400;
  line-height: 20px;
  letter-spacing: 0.2px;
`

const SelectedBadge = styled.span<{ $shown: boolean }>`
  position: absolute;
  top: 7px;
  right: 7px;
  display: grid;
  width: 20px;
  height: 20px;
  place-items: center;
  border-radius: 50%;
  background: ${({ theme }) => theme.colors.emerald};
  opacity: ${({ $shown }) => ($shown ? 1 : 0)};
  transform: scale(${({ $shown }) => ($shown ? 1 : 0.6)});
  transition:
    opacity 200ms ease,
    transform 200ms ease;

  img {
    display: block;
    width: 12px;
    height: 12px;
  }

  @media (prefers-reduced-motion: reduce) {
    transition: none;
  }
`

const CompanySection = styled.section`
  display: flex;
  flex-direction: column;
  gap: 8px;
`

const SmallTitle = styled.h3`
  margin: 0;
  color: ${({ theme }) => theme.colors.textPrimary};
  font-size: 16px;
  font-weight: 500;
  line-height: 24px;
  letter-spacing: 0.2px;
`

const Pills = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
`

const Pill = styled.button<{ $active: boolean }>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  height: 36px;
  padding: 8px 16px;
  border: 1px solid
    ${({ $active, theme }) =>
      $active ? theme.colors.planeGreenLight : theme.colors.defaultBorder};
  border-radius: 30px;
  background: ${({ $active, theme }) =>
    $active ? theme.colors.planeGreenLight : 'transparent'};
  color: ${({ $active, theme }) =>
    $active ? theme.colors.emerald : theme.colors.textPrimary};
  font: inherit;
  font-size: 12px;
  font-weight: ${({ $active }) => ($active ? 500 : 400)};
  line-height: 18px;
  letter-spacing: 0.2px;
  cursor: pointer;

  &:disabled {
    cursor: not-allowed;
  }
`

const PointerRow = styled.div`
  position: relative;
  height: 12px;
  margin: -4px 0 -16px;

  @media (max-width: ${({ theme }) => theme.breakpoints.lg}) {
    display: none;
  }
`

/**
 * Cards are two equal flex children with a 16px gap, so their centres sit at
 * 25% - 4px and 75% + 4px of the row.
 */
const UploadPointer = styled.span<{ $mode: BulkMode }>`
  position: absolute;
  bottom: 0;
  left: ${({ $mode }) =>
    $mode === 'add' ? 'calc(25% - 4px)' : 'calc(75% + 4px)'};
  width: 0;
  height: 0;
  border-right: 12px solid transparent;
  border-bottom: 12px solid ${({ theme }) => theme.colors.disableFill};
  border-left: 12px solid transparent;
  transform: translateX(-50%);
  transition: left 260ms cubic-bezier(0.4, 0, 0.2, 1);
  z-index: 1;

  @media (prefers-reduced-motion: reduce) {
    transition: none;
  }
`

const UploadPanel = styled.section`
  display: flex;
  flex-direction: column;
  gap: 16px;
  width: 100%;
  padding: 16px;
  border: 1px solid ${({ theme }) => theme.colors.disableFill};
  border-top-width: 4px;
  border-radius: 12px;
  background: ${({ theme }) => theme.colors.surface1};
  box-sizing: border-box;
  overflow: hidden;
`

const ScanPanel = styled(UploadPanel)`
  border-top-width: 1px;
`

const UploadHeading = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
`

const UploadDescription = styled.p`
  margin: 0;
  color: ${({ theme }) => theme.colors.textSecondary};
  font-size: 12px;
  font-weight: 400;
  line-height: 18px;
  letter-spacing: 0.2px;
`

const TemplateCard = styled.div`
  display: flex;
  min-height: 68px;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 16px 24px;
  border-radius: 12px;
  background: ${({ theme }) => theme.colors.surface0};
  box-sizing: border-box;

  @media (max-width: ${({ theme }) => theme.breakpoints.sm}) {
    align-items: stretch;
    flex-direction: column;
  }
`

const TemplateCopy = styled.div`
  display: flex;
  min-width: 0;
  flex-direction: column;
  gap: 4px;
`

const TemplateTitle = styled.p`
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0;
  color: ${({ theme }) => theme.colors.textPrimary};
  font-size: 12px;
  font-weight: 500;
  line-height: 18px;
  letter-spacing: 0.2px;
`

const ExcelMark = styled.span`
  display: grid;
  width: 16px;
  height: 16px;
  flex: 0 0 16px;
  place-items: center;
  border-radius: 2px;
  background: #168443;
  color: white;
  font-size: 9px;
  font-weight: 600;
`

const TemplateDescription = styled.p`
  margin: 0;
  color: ${({ theme }) => theme.colors.textSecondary};
  font-size: 12px;
  font-weight: 400;
  line-height: 18px;
  letter-spacing: 0.2px;
`

const DownloadButton = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  height: 36px;
  padding: 8px 16px;
  border: 1px solid ${({ theme }) => theme.colors.defaultBorder};
  border-radius: ${({ theme }) => theme.radii.sm};
  background: ${({ theme }) => theme.colors.surface1};
  font: inherit;
  font-size: 12px;
  font-weight: 500;
  line-height: 18px;
  letter-spacing: 0.2px;
  color: ${({ theme }) => theme.colors.textPrimary};
  cursor: pointer;
  white-space: nowrap;

  &:hover {
    border-color: ${({ theme }) => theme.colors.emerald};
  }
`

const UploadBlock = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 16px;
  width: 100%;
`

const FileCard = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  width: 100%;
  padding: 16px 20px;
  border: 1px solid ${({ theme }) => theme.colors.defaultBorder};
  border-radius: ${({ theme }) => theme.radii.sm};
  background: ${({ theme }) => theme.colors.surface1};
  box-sizing: border-box;
`

const ScanFileCard = styled(FileCard)`
  border-color: transparent;
  background: ${({ theme }) => theme.colors.hoverSurface1};
`

const FileMeta = styled.div`
  display: flex;
  min-width: 0;
  align-items: center;
  gap: 16px;
`

const FileIconWrap = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  width: 40px;
  height: 40px;
  padding: 8px;
  border-radius: 100px;
  background: ${({ theme }) => theme.colors.planeGreenLight};
  box-sizing: border-box;

  img {
    display: block;
    width: 20px;
    height: 20px;
  }
`

const FileCopy = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
  flex: 1;
`

const FileName = styled.p`
  margin: 0;
  font-size: 14px;
  font-weight: 500;
  line-height: 20px;
  letter-spacing: 0.2px;
  color: ${({ theme }) => theme.colors.textPrimary};
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`

const FileSize = styled.p`
  margin: 0;
  font-size: 12px;
  font-weight: 400;
  line-height: 18px;
  letter-spacing: 0.2px;
  color: ${({ theme }) => theme.colors.textSecondary};
`

const DeleteFileButton = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  gap: 4px;
  padding: 0;
  border: 0;
  background: transparent;
  font: inherit;
  font-size: 14px;
  font-weight: 500;
  line-height: 18px;
  letter-spacing: -0.28px;
  color: ${({ theme }) => theme.colors.textError};
  cursor: pointer;
  white-space: nowrap;

  img {
    display: block;
    width: 18px;
    height: 18px;
  }
`

const DropZone = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  padding: 36px 12px;
  border: 1px dashed ${({ theme }) => theme.colors.defaultBorder};
  border-radius: ${({ theme }) => theme.radii.md};
  background: ${({ theme }) => theme.colors.surface1};
  cursor: pointer;
  box-sizing: border-box;
  overflow: hidden;

  &:hover {
    border-color: ${({ theme }) => theme.colors.emerald};
  }

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.colors.emerald};
    outline-offset: 2px;
  }
`

const DropInner = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;
  min-width: 0;
`

const UploadArt = styled.div`
  position: relative;
  width: 24px;
  height: 24px;
  flex-shrink: 0;
`

const PdfIcon = styled.img`
  display: block;
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
  padding: 4px;
  border-radius: 36px;
  background: ${({ theme }) => theme.colors.emerald};
  box-sizing: border-box;
  line-height: 0;

  img {
    display: block;
    width: 12px;
    height: 12px;
  }
`

const DropCopy = styled.p`
  margin: 0;
  min-width: 0;
  font-size: 14px;
  font-weight: 400;
  line-height: 20px;
  letter-spacing: 0.2px;
  text-align: center;
  color: ${({ theme }) => theme.colors.textSecondary};
  overflow-wrap: anywhere;
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
  font-weight: 400;
  line-height: 18px;
  letter-spacing: 0.2px;
  color: ${({ theme }) => theme.colors.textSecondary};

  @media (max-width: ${({ theme }) => theme.breakpoints.sm}) {
    flex-direction: column;
    gap: 4px;
  }
`

const ErrorText = styled.p`
  margin: 0;
  font-size: 13px;
  color: ${({ theme }) => theme.colors.textError};
`

const ProceedButton = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  align-self: auto;
  height: 48px;
  padding: 14px 24px;
  border: 0;
  border-radius: ${({ theme }) => theme.radii.md};
  background: ${({ theme }) => theme.colors.fillGreen};
  font: inherit;
  font-size: 14px;
  font-weight: 500;
  line-height: 20px;
  letter-spacing: 0.2px;
  color: ${({ theme }) => theme.colors.emerald};
  cursor: pointer;

  &:disabled {
    background: ${({ theme }) => theme.colors.disableFill};
    color: ${({ theme }) => theme.colors.textSecondary};
    cursor: not-allowed;
  }
`
