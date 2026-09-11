import { useState } from 'react'
import styled from 'styled-components'

import { assets } from '@/assets/figma'
import {
  flexDeal,
  isReadyToSubmit,
  validationIssuesFor,
  type BulkMemberRow,
  type BulkValidationIssue,
} from '@/data/flexDeal'
import {
  downloadAssignmentSheet,
  downloadDeletionSheet,
  downloadIssuesSheet,
} from '@/pages/ManageLives/bulk/downloadAssignmentSheet'
import { AssignmentBreakup } from '@/pages/ManageLives/landings/AssignmentBreakup'
import { ReverifyModal } from '@/pages/ManageLives/landings/ReverifyModal'

type Props = {
  rows: BulkMemberRow[]
  fileName?: string
  fileSize?: number
  isDelete?: boolean
  onResolve: (rowId: string, fixes: { field: string; value: string }[]) => void
  onIgnore: (rowId: string) => void
  onRestore: (rowId: string) => void
  onReverify: (file: File) => void
  onBack: () => void
  onContinue: () => void
}

function controlKind(field: string) {
  const value = field.toLowerCase()
  if (value.includes('cover') || value.includes('plan')) return 'plan'
  if (value.includes('gender')) return 'gender'
  if (value.includes('birth') || value.includes('date')) return 'date'
  if (value.includes('email')) return 'email'
  return 'text'
}

function draftKey(rowId: string, issueId: string) {
  return `${rowId}:${issueId}`
}

function displayFixValue(field: string, value: string | undefined) {
  if (!value) return 'Corrected'
  if (field.toLowerCase().includes('cover') || field.toLowerCase().includes('plan')) {
    return flexDeal.plans.find((plan) => plan.id === value)?.name ?? value
  }
  return value
}

export function ValidationIssuesPanel({
  rows,
  isDelete = false,
  onResolve,
  onIgnore,
  onRestore,
  onReverify,
  onBack,
  onContinue,
}: Props) {
  const [drafts, setDrafts] = useState<Record<string, string>>({})
  const [attempted, setAttempted] = useState<Record<string, boolean>>({})
  const [tab, setTab] = useState<'ready' | 'attention'>(() =>
    rows.some(
      (row) => !row.ignored && validationIssuesFor(row).length > 0,
    )
      ? 'attention'
      : 'ready',
  )
  const [proceedWithApproved, setProceedWithApproved] = useState(false)
  const [reverifyOpen, setReverifyOpen] = useState(false)
  const issueRows = rows.filter(
    (row) =>
      validationIssuesFor(row).length > 0 ||
      Boolean(row.resolvedIssues && row.resolvedIssues.length > 0),
  )
  const openRows = issueRows.filter(
    (row) => !row.ignored && validationIssuesFor(row).length > 0,
  )
  const ignoredCount = issueRows.filter((row) => row.ignored).length
  const fixedCount = issueRows.filter(
    (row) =>
      !row.ignored &&
      validationIssuesFor(row).length === 0 &&
      Boolean(row.resolvedIssues?.length),
  ).length
  const issueCount = openRows.reduce(
    (sum, row) => sum + validationIssuesFor(row).length,
    0,
  )
  const acceptedRows = rows.filter(isReadyToSubmit)
  const readyEmployees = acceptedRows.filter(
    (row) => row.relationship === 'Self',
  ).length
  const readyDependants = acceptedRows.length - readyEmployees
  const showAttention = openRows.length > 0
  const activeTab = showAttention && tab === 'attention' ? 'attention' : 'ready'

  function cardState(row: BulkMemberRow): 'open' | 'ignored' | 'fixed' {
    if (row.ignored) return 'ignored'
    const issues = validationIssuesFor(row)
    if (issues.length === 0 && row.resolvedIssues?.length) return 'fixed'
    return 'open'
  }

  function updateDraft(rowId: string, issueId: string, value: string) {
    setDrafts((current) => ({
      ...current,
      [draftKey(rowId, issueId)]: value,
    }))
  }

  function save(row: BulkMemberRow, issues: BulkValidationIssue[]) {
    const missing = issues.filter(
      (issue) => !drafts[draftKey(row.id, issue.id)]?.trim(),
    )
    if (missing.length > 0) {
      setAttempted((current) => ({ ...current, [row.id]: true }))
      return
    }
    onResolve(
      row.id,
      issues.map((issue) => ({
        field: issue.field,
        value: drafts[draftKey(row.id, issue.id)].trim(),
      })),
    )
  }

  function ignore(rowId: string) {
    onIgnore(rowId)
  }

  return (
    <>
    <Panel>
      <Content>
        <Summary aria-live="polite">
          <SummaryTitle>
            {acceptedRows.length} of {rows.length}{' '}
            {rows.length === 1 ? 'member' : 'members'} ready to submit
          </SummaryTitle>
          <SummarySub>
            which includes {readyEmployees}{' '}
            {readyEmployees === 1 ? 'employee' : 'employees'} &{' '}
            {readyDependants}{' '}
            {readyDependants === 1 ? 'Dependant' : 'Dependants'}
          </SummarySub>
        </Summary>

        {showAttention ? (
          <TabBar role="tablist" aria-label="Validation review">
            <Tab
              type="button"
              role="tab"
              aria-selected={activeTab === 'ready'}
              $active={activeTab === 'ready'}
              onClick={() => setTab('ready')}
            >
              Members ready for submission({acceptedRows.length})
            </Tab>
            <Tab
              type="button"
              role="tab"
              aria-selected={activeTab === 'attention'}
              $active={activeTab === 'attention'}
              onClick={() => setTab('attention')}
            >
              Members who need attention({openRows.length})
            </Tab>
          </TabBar>
        ) : null}

        {activeTab === 'ready' ? (
          <>
            <ReadyBanner>
              <div>
                <ReadyTitle>
                  {acceptedRows.length}{' '}
                  {acceptedRows.length === 1 ? 'member' : 'members'} ready for{' '}
                  {isDelete ? 'deletion' : 'addition'}
                </ReadyTitle>
              </div>
              <DownloadOutline
                type="button"
                onClick={() =>
                  isDelete
                    ? downloadDeletionSheet(acceptedRows)
                    : downloadAssignmentSheet(acceptedRows)
                }
              >
                {isDelete
                  ? 'Download deletion list'
                  : 'Download list with Assignments'}
              </DownloadOutline>
            </ReadyBanner>

            <AssignHeader>
              <AssignLabel>
                {isDelete
                  ? 'Here are the covers being removed'
                  : 'Here are the assigned benefits'}
              </AssignLabel>
              <AssignRule />
              <KnowHow type="button">
                {isDelete ? 'Know how it’s removed' : 'Know how it’s assigned'}
                <KnowTip role="tooltip">
                  {isDelete
                    ? 'Loop matches each life to their current covers, then ends those covers on the leaving date. Download the deletion list to review every employee and dependant.'
                    : 'Loop assigns each life to a plan from your sheet and the policy rules for this account. Download the assignment list to review every employee and dependant.'}
                </KnowTip>
              </KnowHow>
            </AssignHeader>

            <AssignmentBreakup rows={acceptedRows} isDelete={isDelete} />
          </>
        ) : (
          <>
            <ReadyBanner $tone="error">
              <div>
                <ReadyTitle $tone="error">
                  {openRows.length}{' '}
                  {openRows.length === 1 ? 'member' : 'members'} need attention
                </ReadyTitle>
              </div>
              <BannerActions>
                <DownloadOutline
                  type="button"
                  $tone="error"
                  onClick={() => downloadIssuesSheet(openRows)}
                >
                  Download sheet with issues
                </DownloadOutline>
                <DownloadOutline
                  type="button"
                  $tone="error"
                  onClick={() => setReverifyOpen(true)}
                >
                  Re-Upload
                </DownloadOutline>
              </BannerActions>
            </ReadyBanner>

            {issueRows.length > 0 ? (
          <IssueSection>
            <IssueHeader>
              <IssueHeaderTop>
                <IssueTitle>
                  {openRows.length > 0 ? 'Lives to review' : 'Lives reviewed'}
                </IssueTitle>
                <ProgressStats aria-live="polite">
                  <RemainingBadge $clear={openRows.length === 0}>
                    {openRows.length === 0
                      ? 'All clear'
                      : `${issueCount} ${issueCount === 1 ? 'issue' : 'issues'} left`}
                  </RemainingBadge>
                  {fixedCount > 0 ? (
                    <StatChip $tone="fixed">
                      {fixedCount} fixed
                    </StatChip>
                  ) : null}
                  {ignoredCount > 0 ? (
                    <StatChip $tone="ignored">
                      {ignoredCount} ignored
                    </StatChip>
                  ) : null}
                </ProgressStats>
              </IssueHeaderTop>
              <ProgressTrack
                role="progressbar"
                aria-valuemin={0}
                aria-valuemax={issueRows.length}
                aria-valuenow={fixedCount + ignoredCount}
                aria-label="Lives resolved"
              >
                <ProgressFill
                  $pct={
                    issueRows.length === 0
                      ? 100
                      : ((fixedCount + ignoredCount) / issueRows.length) * 100
                  }
                />
              </ProgressTrack>
              <ProgressCaption>
                {fixedCount + ignoredCount} of {issueRows.length}{' '}
                {issueRows.length === 1 ? 'life' : 'lives'} resolved
              </ProgressCaption>
            </IssueHeader>

            <SheetScroller>
              <Sheet>
                <thead>
                  <tr>
                    <ThIndex scope="col">#</ThIndex>
                    <Th scope="col">Employee ID</Th>
                    <Th scope="col">Member Name</Th>
                    <Th scope="col">Relationship</Th>
                    <Th scope="col">Field</Th>
                    <Th scope="col">What needs fixing</Th>
                    <Th scope="col">Corrected value</Th>
                    <Th scope="col">Action</Th>
                  </tr>
                </thead>
                <tbody>
                  {issueRows.map((row, index) => {
                    const state = cardState(row)
                    const issues = validationIssuesFor(row)
                    const ignored = state === 'ignored'
                    const fixed = state === 'fixed'
                    const open = state === 'open'
                    const shownIssues = ignored
                      ? []
                      : fixed
                        ? (row.resolvedIssues ?? [])
                        : issues
                    const tried = Boolean(attempted[row.id])
                    const span = Math.max(shownIssues.length, 1)

                    const identity = (
                      <>
                        <TdIndex rowSpan={span}>{index + 1}</TdIndex>
                        <Td rowSpan={span} $muted={ignored}>
                          {row.employeeId}
                        </Td>
                        <Td rowSpan={span} $muted={ignored}>
                          <CellName>{row.name}</CellName>
                        </Td>
                        <Td rowSpan={span} $muted={ignored}>
                          {row.relationship}
                        </Td>
                      </>
                    )

                    const action = ignored ? (
                      <UndoButton
                        type="button"
                        onClick={() => onRestore(row.id)}
                        aria-label={`Undo ignore for ${row.name}`}
                      >
                        Undo ignore
                      </UndoButton>
                    ) : fixed ? (
                      <StatChip $tone="fixed">Fixed</StatChip>
                    ) : (
                      <CellActions>
                        <SaveButton
                          type="button"
                          onClick={() => save(row, issues)}
                          aria-label={`Save fix for ${row.name}`}
                        >
                          Save fix
                        </SaveButton>
                        <IgnoreButton
                          type="button"
                          onClick={() => ignore(row.id)}
                          aria-label={`Ignore ${row.name}`}
                        >
                          Ignore
                        </IgnoreButton>
                      </CellActions>
                    )

                    if (ignored) {
                      return (
                        <Tr key={row.id} $state={state}>
                          {identity}
                          <Td colSpan={3} $muted>
                            Ignored — this life will not be included in the
                            endorsement.
                          </Td>
                          <Td>{action}</Td>
                        </Tr>
                      )
                    }

                    return shownIssues.map((issue, issueIndex) => {
                      const kind = controlKind(issue.field)
                      const key = draftKey(row.id, issue.id)
                      const value = drafts[key] ?? ''
                      const invalid = open && tried && !value.trim()
                      const label = `Fix ${issue.field} for ${row.name}`
                      const first = issueIndex === 0

                      return (
                        <Tr key={`${row.id}:${issue.id}`} $state={state}>
                          {first ? identity : null}
                          <Td>
                            <CellField>{issue.field}</CellField>
                          </Td>
                          <Td $error={open}>
                            {fixed ? `Was: ${issue.error}` : issue.error}
                          </Td>
                          <TdField $invalid={invalid}>
                            {fixed ? (
                              <FixedValue>
                                {displayFixValue(
                                  issue.field,
                                  issue.resolvedValue,
                                )}
                              </FixedValue>
                            ) : kind === 'plan' || kind === 'gender' ? (
                              <CellSelect
                                value={value}
                                aria-label={label}
                                onChange={(event) =>
                                  updateDraft(
                                    row.id,
                                    issue.id,
                                    event.target.value,
                                  )
                                }
                              >
                                <option value="">
                                  {kind === 'plan'
                                    ? 'Select eligible plan'
                                    : 'Select gender'}
                                </option>
                                {kind === 'plan'
                                  ? flexDeal.plans.map((plan) => (
                                      <option key={plan.id} value={plan.id}>
                                        {plan.name}
                                      </option>
                                    ))
                                  : ['Female', 'Male', 'Other'].map(
                                      (option) => (
                                        <option key={option} value={option}>
                                          {option}
                                        </option>
                                      ),
                                    )}
                              </CellSelect>
                            ) : (
                              <CellInput
                                type={
                                  kind === 'date'
                                    ? 'date'
                                    : kind === 'email'
                                      ? 'email'
                                      : 'text'
                                }
                                value={value}
                                placeholder={`Enter ${issue.field.toLowerCase()}`}
                                aria-label={label}
                                onChange={(event) =>
                                  updateDraft(
                                    row.id,
                                    issue.id,
                                    event.target.value,
                                  )
                                }
                              />
                            )}
                          </TdField>
                          {first ? <Td rowSpan={span}>{action}</Td> : null}
                        </Tr>
                      )
                    })
                  })}
                </tbody>
              </Sheet>
            </SheetScroller>
          </IssueSection>
        ) : (
          <SuccessCard role="status">
            <SuccessMark aria-hidden>
              <img
                src={assets.mlIconCheckEmerald}
                alt=""
                width={16}
                height={16}
              />
            </SuccessMark>
            <div>
              <SuccessTitle>All lives are ready for submission.</SuccessTitle>
              {ignoredCount > 0 ? (
                <SuccessCopy>
                  {ignoredCount}{' '}
                  {ignoredCount === 1 ? 'life was' : 'lives were'} ignored and
                  will not be included.
                </SuccessCopy>
              ) : null}
            </div>
          </SuccessCard>
        )}
          </>
        )}

        {activeTab === 'ready' ? (
          <FooterActions>
            {openRows.length > 0 ? (
              <ProceedCheck htmlFor="proceed-approved-lives">
                <input
                  id="proceed-approved-lives"
                  type="checkbox"
                  checked={proceedWithApproved}
                  onChange={(event) =>
                    setProceedWithApproved(event.target.checked)
                  }
                />
                Proceed with the {acceptedRows.length} approved{' '}
                {acceptedRows.length === 1 ? 'life' : 'lives'} and leave out{' '}
                {openRows.length} with issues
              </ProceedCheck>
            ) : null}
            <FooterButtons>
              <BackButton type="button" onClick={onBack}>
                Go Back
              </BackButton>
              <ContinueButton
                type="button"
                disabled={
                  acceptedRows.length === 0 ||
                  (openRows.length > 0 && !proceedWithApproved)
                }
                onClick={onContinue}
              >
                Submit {acceptedRows.length}{' '}
                {acceptedRows.length === 1 ? 'life' : 'lives'} for{' '}
                {isDelete ? 'Deletion' : 'Addition'}
              </ContinueButton>
            </FooterButtons>
          </FooterActions>
        ) : null}
      </Content>
    </Panel>
    <ReverifyModal
      open={reverifyOpen}
      onCancel={() => setReverifyOpen(false)}
      onVerified={(file) => {
        setReverifyOpen(false)
        setTab('ready')
        setProceedWithApproved(false)
        onReverify(file)
      }}
    />
    </>
  )
}

const Panel = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 24px;
  width: 100%;
  max-width: none;
  padding: 72px 24px 40px 40px;
  box-sizing: border-box;

  @media (max-width: ${({ theme }) => theme.breakpoints.md}) {
    padding: 72px 16px 40px;
  }
`

const Content = styled.div`
  display: flex;
  min-width: 0;
  width: 100%;
  max-width: none;
  flex: 1;
  flex-direction: column;
  gap: 24px;
  padding-top: 13px;
`

const Summary = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
`

const SummaryTitle = styled.p`
  margin: 0;
  color: ${({ theme }) => theme.colors.emerald};
  font-size: 16px;
  font-weight: 600;
  line-height: 24px;
  letter-spacing: 0.2px;
`

const SummarySub = styled.p`
  margin: 0;
  color: ${({ theme }) => theme.colors.textSecondary};
  font-size: 12px;
  font-weight: 500;
  line-height: 18px;
  letter-spacing: 0.2px;
`

const TabBar = styled.div`
  display: flex;
  align-items: stretch;
  gap: 20px;
  width: 100%;
  border-bottom: 1px solid ${({ theme }) => theme.colors.defaultBorder};
`

const Tab = styled.button<{ $active: boolean }>`
  height: 48px;
  padding: 14px 0 0;
  border: 0;
  border-bottom: ${({ $active, theme }) =>
    $active
      ? `2px solid ${theme.colors.emerald}`
      : `1px solid ${theme.colors.defaultBorder}`};
  margin-bottom: -1px;
  background: transparent;
  color: ${({ $active, theme }) =>
    $active ? theme.colors.emerald : theme.colors.textSecondary};
  font: inherit;
  font-size: 14px;
  font-weight: ${({ $active }) => ($active ? 600 : 500)};
  line-height: 20px;
  letter-spacing: 0.2px;
  cursor: pointer;
`

const ReadyBanner = styled.div<{ $tone?: 'error' }>`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  width: 100%;
  padding: 16px 20px;
  border: 1px solid
    ${({ $tone }) => ($tone === 'error' ? '#f1b7b7' : 'transparent')};
  border-radius: 12px;
  background: ${({ $tone, theme }) =>
    $tone === 'error' ? '#fffafa' : theme.colors.hoverSurface1};
  box-sizing: border-box;
`

const ReadyTitle = styled.p<{ $tone?: 'error' }>`
  margin: 0;
  color: ${({ $tone, theme }) =>
    $tone === 'error' ? theme.colors.textError : theme.colors.emerald};
  font-size: 24px;
  font-weight: 500;
  line-height: 28px;
`

const DownloadOutline = styled.button<{ $tone?: 'error' }>`
  flex-shrink: 0;
  height: 36px;
  padding: 8px 16px;
  border: 1px solid
    ${({ $tone, theme }) =>
      $tone === 'error' ? theme.colors.textError : theme.colors.emerald};
  border-radius: 8px;
  background: transparent;
  color: ${({ $tone, theme }) =>
    $tone === 'error' ? theme.colors.textError : theme.colors.emerald};
  font: inherit;
  font-size: 12px;
  font-weight: 500;
  line-height: 18px;
  letter-spacing: 0.2px;
  cursor: pointer;
`

const BannerActions = styled.div`
  display: flex;
  flex-shrink: 0;
  flex-wrap: wrap;
  align-items: center;
  justify-content: flex-end;
  gap: 8px;
`

const AssignHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
`

const AssignLabel = styled.p`
  margin: 0;
  color: ${({ theme }) => theme.colors.textSecondary};
  font-size: 14px;
  font-weight: 500;
  line-height: 20px;
  letter-spacing: 0.2px;
  white-space: nowrap;
`

const AssignRule = styled.i`
  display: block;
  height: 1px;
  flex: 1;
  min-width: 8px;
  background: ${({ theme }) => theme.colors.defaultBorder};
`

const KnowHow = styled.button`
  position: relative;
  flex-shrink: 0;
  padding: 0;
  border: 0;
  background: transparent;
  color: ${({ theme }) => theme.colors.emerald};
  font: inherit;
  font-size: 14px;
  font-weight: 600;
  line-height: 20px;
  letter-spacing: 0.2px;
  text-decoration: underline;
  cursor: help;

  &:hover > span,
  &:focus-visible > span {
    opacity: 1;
    visibility: visible;
  }
`

const KnowTip = styled.span`
  position: absolute;
  right: 0;
  bottom: calc(100% + 8px);
  z-index: 2;
  width: 280px;
  padding: 10px 12px;
  border-radius: 8px;
  background: ${({ theme }) => theme.colors.surface1};
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
  color: ${({ theme }) => theme.colors.textPrimary};
  font-size: 12px;
  font-weight: 400;
  line-height: 18px;
  letter-spacing: 0.2px;
  text-decoration: none;
  opacity: 0;
  visibility: hidden;
`

const IssueSection = styled.section`
  display: flex;
  flex-direction: column;
  gap: 16px;
  box-sizing: border-box;
`

const IssueHeader = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
`

const IssueHeaderTop = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
`

const IssueTitle = styled.h2`
  margin: 0;
  color: ${({ theme }) => theme.colors.textPrimary};
  font-size: 16px;
  font-weight: 500;
  line-height: 24px;
  letter-spacing: 0.2px;
`

const ProgressStats = styled.div`
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
`

const RemainingBadge = styled.span<{ $clear: boolean }>`
  display: inline-flex;
  align-items: center;
  padding: 5px 12px;
  border-radius: 999px;
  background: ${({ $clear, theme }) =>
    $clear ? theme.colors.planeGreenLight : '#FDECEC'};
  color: ${({ $clear, theme }) =>
    $clear ? theme.colors.emerald : theme.colors.textError};
  font-size: 13px;
  font-weight: 600;
  line-height: 18px;
  letter-spacing: 0.2px;
`

const StatChip = styled.span<{ $tone: 'fixed' | 'ignored' }>`
  display: inline-flex;
  align-items: center;
  padding: 4px 10px;
  border-radius: 999px;
  background: ${({ $tone, theme }) =>
    $tone === 'fixed' ? theme.colors.planeGreenLight : theme.colors.surface0};
  color: ${({ $tone, theme }) =>
    $tone === 'fixed' ? theme.colors.emerald : theme.colors.textSecondary};
  border: 1px solid
    ${({ $tone, theme }) =>
      $tone === 'fixed' ? theme.colors.emerald : theme.colors.disableFill};
  font-size: 12px;
  font-weight: 500;
  line-height: 18px;
`

const ProgressTrack = styled.div`
  width: 100%;
  height: 6px;
  border-radius: 999px;
  background: ${({ theme }) => theme.colors.disableFill};
  overflow: hidden;
`

const ProgressFill = styled.i<{ $pct: number }>`
  display: block;
  width: ${({ $pct }) => `${Math.min(100, Math.max(0, $pct))}%`};
  height: 100%;
  border-radius: inherit;
  background: ${({ theme }) => theme.colors.emerald};
  transition: width 280ms ease;
`

const ProgressCaption = styled.p`
  margin: 0;
  color: ${({ theme }) => theme.colors.textSecondary};
  font-size: 12px;
  font-weight: 400;
  line-height: 16px;
  letter-spacing: 0.2px;
`

const SheetScroller = styled.div`
  width: 100%;
  overflow-x: auto;
  border: 1px solid ${({ theme }) => theme.colors.disableFill};
  border-radius: 12px;
  box-sizing: border-box;
`

const Sheet = styled.table`
  width: 100%;
  border-collapse: collapse;
  table-layout: auto;

  th,
  td {
    border-right: 1px solid ${({ theme }) => theme.colors.disableFill};
    border-bottom: 1px solid ${({ theme }) => theme.colors.disableFill};
    text-align: left;
    vertical-align: middle;
  }

  th:last-child,
  td:last-child {
    border-right: 0;
  }

  tbody tr:last-child td {
    border-bottom: 0;
  }
`

const Th = styled.th`
  position: sticky;
  top: 0;
  z-index: 1;
  padding: 10px 12px;
  background: ${({ theme }) => theme.colors.surface0};
  color: ${({ theme }) => theme.colors.textSecondary};
  font-size: 11px;
  font-weight: 600;
  line-height: 16px;
  letter-spacing: 0.4px;
  text-transform: uppercase;
  white-space: nowrap;
`

const ThIndex = styled(Th)`
  width: 44px;
  text-align: center;
`

const Tr = styled.tr<{ $state: 'open' | 'ignored' | 'fixed' }>`
  background: ${({ $state, theme }) =>
    $state === 'ignored'
      ? theme.colors.surface0
      : $state === 'fixed'
        ? theme.colors.planeGreenLight
        : theme.colors.surface1};

  &:hover {
    background: ${({ $state, theme }) =>
      $state === 'open' ? theme.colors.hoverSurface1 : undefined};
  }
`

const Td = styled.td<{ $muted?: boolean; $error?: boolean }>`
  padding: 10px 12px;
  color: ${({ $muted, $error, theme }) =>
    $muted
      ? theme.colors.textSecondary
      : $error
        ? theme.colors.textError
        : theme.colors.textPrimary};
  font-size: 12px;
  line-height: 18px;
  letter-spacing: 0.2px;
`

const TdIndex = styled(Td)`
  background: ${({ theme }) => theme.colors.surface0};
  color: ${({ theme }) => theme.colors.textSecondary};
  font-size: 11px;
  font-weight: 600;
  text-align: center;
`

const TdField = styled(Td)<{ $invalid?: boolean }>`
  padding: 4px 6px;
  background: ${({ $invalid }) => ($invalid ? '#FFF4F4' : undefined)};
  box-shadow: ${({ $invalid, theme }) =>
    $invalid ? `inset 0 0 0 1px ${theme.colors.textError}` : undefined};
`

const CellName = styled.span`
  color: ${({ theme }) => theme.colors.textPrimary};
  font-weight: 500;
  white-space: nowrap;
`

const CellField = styled.span`
  font-weight: 500;
  white-space: nowrap;
`

const CellActions = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
`

/** Borderless controls so each editable cell reads like a spreadsheet cell. */
const cellControlStyles = `
  width: 100%;
  min-width: 150px;
  height: 32px;
  border: 0;
  background: transparent;
  box-sizing: border-box;
  font: inherit;
  font-size: 12px;
  line-height: 18px;
`

const CellInput = styled.input`
  ${cellControlStyles}
  padding: 0 6px;
  color: ${({ theme }) => theme.colors.textPrimary};

  &::placeholder {
    color: ${({ theme }) => theme.colors.textSecondary};
  }

  &:focus {
    outline: 2px solid ${({ theme }) => theme.colors.emerald};
    outline-offset: -2px;
  }
`

const CellSelect = styled.select`
  ${cellControlStyles}
  padding: 0 26px 0 6px;
  color: ${({ theme }) => theme.colors.textPrimary};
  appearance: none;
  background: transparent url(${assets.mlChevronDown24}) no-repeat right 6px
    center / 16px 16px;

  &:focus {
    outline: 2px solid ${({ theme }) => theme.colors.emerald};
    outline-offset: -2px;
  }
`

const FixedValue = styled.span`
  display: inline-flex;
  align-items: center;
  padding: 0 6px;
  color: ${({ theme }) => theme.colors.emerald};
  font-size: 12px;
  font-weight: 500;
  line-height: 18px;
`

const UndoButton = styled.button`
  height: 36px;
  padding: 0 14px;
  border: 1px solid ${({ theme }) => theme.colors.emerald};
  border-radius: 8px;
  background: ${({ theme }) => theme.colors.surface1};
  color: ${({ theme }) => theme.colors.emerald};
  font: inherit;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
`

const IgnoreButton = styled.button`
  height: 36px;
  padding: 0 14px;
  border: 0;
  border-radius: 8px;
  background: transparent;
  color: ${({ theme }) => theme.colors.textSecondary};
  font: inherit;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;

  &:hover {
    color: ${({ theme }) => theme.colors.textPrimary};
  }
`

const SaveButton = styled.button`
  height: 36px;
  padding: 0 14px;
  border: 0;
  border-radius: 8px;
  background: ${({ theme }) => theme.colors.fillGreen};
  color: ${({ theme }) => theme.colors.emerald};
  font: inherit;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;

  &:hover {
    filter: brightness(0.98);
  }
`

const SuccessCard = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  border: 1px solid ${({ theme }) => theme.colors.defaultBorder};
  border-radius: 12px;
  background: ${({ theme }) => theme.colors.planeGreenLight};
`

const SuccessMark = styled.span`
  display: grid;
  width: 32px;
  height: 32px;
  flex: 0 0 32px;
  place-items: center;
  border-radius: 50%;
  background: ${({ theme }) => theme.colors.surface1};
`

const SuccessTitle = styled.p`
  margin: 0;
  color: ${({ theme }) => theme.colors.emerald};
  font-size: 13px;
  font-weight: 500;
  line-height: 18px;
`

const SuccessCopy = styled.p`
  margin: 2px 0 0;
  color: ${({ theme }) => theme.colors.textPrimary};
  font-size: 12px;
  line-height: 18px;
`

const FooterActions = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 12px;
`

const FooterButtons = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
`

const ProceedCheck = styled.label`
  display: flex;
  align-items: flex-start;
  gap: 8px;
  margin: 0;
  color: ${({ theme }) => theme.colors.textSecondary};
  font-size: 12px;
  font-weight: 400;
  line-height: 18px;
  letter-spacing: 0.2px;
  cursor: pointer;

  input {
    margin: 2px 0 0;
    width: 14px;
    height: 14px;
    flex-shrink: 0;
    accent-color: ${({ theme }) => theme.colors.emerald};
    cursor: pointer;
  }
`

const BackButton = styled.button`
  height: 48px;
  padding: 14px 24px;
  border: 1px solid ${({ theme }) => theme.colors.emerald};
  border-radius: 12px;
  background: ${({ theme }) => theme.colors.surface1};
  color: ${({ theme }) => theme.colors.emerald};
  font: inherit;
  font-size: 14px;
  font-weight: 500;
  line-height: 20px;
  letter-spacing: 0.2px;
  cursor: pointer;
`

const ContinueButton = styled.button`
  align-self: flex-start;
  height: 48px;
  padding: 14px 24px;
  border: 0;
  border-radius: 12px;
  background: ${({ theme }) => theme.colors.fillGreen};
  color: ${({ theme }) => theme.colors.emerald};
  font: inherit;
  font-size: 14px;
  font-weight: 500;
  line-height: 20px;
  cursor: pointer;

  &:disabled {
    background: ${({ theme }) => theme.colors.disableFill};
    color: ${({ theme }) => theme.colors.textSecondary};
    cursor: not-allowed;
  }
`
