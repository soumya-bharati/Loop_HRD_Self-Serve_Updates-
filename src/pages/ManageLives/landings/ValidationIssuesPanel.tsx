import { useState } from 'react'
import styled from 'styled-components'

import { assets } from '@/assets/figma'
import {
  flexDeal,
  validationIssuesFor,
  type BulkMemberRow,
  type BulkValidationIssue,
} from '@/data/flexDeal'

type Props = {
  rows: BulkMemberRow[]
  fileName?: string
  fileSize?: number
  onResolve: (rowId: string, fixes: { field: string; value: string }[]) => void
  onIgnore: (rowId: string) => void
  onRestore: (rowId: string) => void
  onReupload: () => void
  onContinue: () => void
}

function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
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
  fileName = 'Uploaded employee list.xlsx',
  fileSize = 0,
  onResolve,
  onIgnore,
  onRestore,
  onReupload,
  onContinue,
}: Props) {
  const [drafts, setDrafts] = useState<Record<string, string>>({})
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

  function updateDraft(
    row: BulkMemberRow,
    issues: BulkValidationIssue[],
    issueId: string,
    value: string,
  ) {
    if (row.ignored) return
    const next = {
      ...drafts,
      [draftKey(row.id, issueId)]: value,
    }
    setDrafts(next)
    const complete = issues.every(
      (issue) => next[draftKey(row.id, issue.id)]?.trim(),
    )
    if (!complete) return
    onResolve(
      row.id,
      issues.map((issue) => ({
        field: issue.field,
        value: next[draftKey(row.id, issue.id)].trim(),
      })),
    )
  }

  return (
    <Panel>
      <AssistantAvatar
        src={assets.mlBulkAssistantAvatar}
        alt=""
        width={48}
        height={48}
      />
      <Content>
        <Heading>
          <div>
            <Title>
              {openRows.length > 0
                ? 'Some lives need your attention'
                : ignoredCount > 0 && fixedCount === 0
                  ? 'Ignored lives will be left out'
                  : 'All validation issues are resolved'}
            </Title>
            <Description>
              {openRows.length > 0
                ? 'Fix missing or ineligible information before reviewing the final benefit assignment. Corrected and ignored lives stay in this list.'
                : ignoredCount > 0
                  ? 'Corrected lives will be included. Ignored lives will not, unless you undo them.'
                  : 'Every life is ready for the final validation review.'}
            </Description>
          </div>
          <IssueCount $clear={openRows.length === 0}>
            {openRows.length === 0
              ? [
                  fixedCount > 0
                    ? `${fixedCount} fixed`
                    : ignoredCount > 0
                      ? null
                      : 'All fixed',
                  ignoredCount > 0 ? `${ignoredCount} ignored` : null,
                ]
                  .filter(Boolean)
                  .join(' · ')
              : `${issueCount} ${issueCount === 1 ? 'issue' : 'issues'}${
                  ignoredCount > 0 ? ` · ${ignoredCount} ignored` : ''
                }${fixedCount > 0 ? ` · ${fixedCount} fixed` : ''}`}
          </IssueCount>
        </Heading>

        <FileCard>
          <FileMeta>
            <FileIcon>
              <img src={assets.mlIconFileUploaded} alt="" />
            </FileIcon>
            <FileCopy>
              <FileName title={fileName}>{fileName}</FileName>
              <FileSize>{formatFileSize(fileSize)}</FileSize>
            </FileCopy>
          </FileMeta>
          <ReuploadButton type="button" onClick={onReupload}>
            <img src={assets.mlIconReupload} alt="" />
            Re-Upload
          </ReuploadButton>
        </FileCard>

        <SectionDivider>
          <span>
            {openRows.length > 0
              ? 'Here are the lives that need a fix'
              : 'Lives reviewed'}
          </span>
          <i />
        </SectionDivider>

        {issueRows.length > 0 ? (
          <IssueSection>
            <IssueHeader>
              <IssueTitle>Lives to review</IssueTitle>
            </IssueHeader>
            <IssueList>
            {issueRows.map((row) => {
              const issues = validationIssuesFor(row)
              const ignored = Boolean(row.ignored)
              const fixed =
                !ignored &&
                issues.length === 0 &&
                Boolean(row.resolvedIssues?.length)
              const shownIssues = ignored
                ? []
                : fixed
                  ? (row.resolvedIssues ?? [])
                  : issues

              return (
                <IssueCard key={row.id} $state={ignored ? 'ignored' : fixed ? 'fixed' : 'open'}>
                  <Member>
                    <MemberAvatar
                      aria-hidden
                      $state={ignored ? 'ignored' : fixed ? 'fixed' : 'open'}
                    >
                      {row.name
                        .split(' ')
                        .slice(0, 2)
                        .map((part) => part[0])
                        .join('')}
                    </MemberAvatar>
                    <div>
                      <MemberName>{row.name}</MemberName>
                      <MemberMeta>
                        {row.employeeId} · {row.relationship}
                        {ignored
                          ? ' · Ignored'
                          : fixed
                            ? ' · Fixed'
                            : issues.length > 1
                              ? ` · ${issues.length} issues`
                              : ''}
                      </MemberMeta>
                    </div>
                  </Member>

                  <IssueBody>
                    {ignored ? (
                      <IgnoredNote>
                        This life will not be included in the endorsement.
                      </IgnoredNote>
                    ) : (
                      shownIssues.map((issue) => {
                      const kind = controlKind(issue.field)
                      const key = draftKey(row.id, issue.id)
                      const value = drafts[key] ?? ''
                      const label = `Fix ${issue.field} for ${row.name}`

                      return (
                        <IssueFix key={issue.id}>
                          <Issue>
                            <IssueLabel $fixed={fixed}>{issue.field}</IssueLabel>
                            <IssueReason>
                              {fixed
                                ? `Was: ${issue.error}`
                                : issue.error}
                            </IssueReason>
                          </Issue>
                          {fixed ? (
                            <FixedValue>
                              {displayFixValue(issue.field, issue.resolvedValue)}
                            </FixedValue>
                          ) : kind === 'plan' ? (
                            <Select
                              value={value}
                              aria-label={label}
                              onChange={(event) =>
                                updateDraft(
                                  row,
                                  issues,
                                  issue.id,
                                  event.target.value,
                                )
                              }
                            >
                              <option value="">Select eligible plan</option>
                              {flexDeal.plans.map((plan) => (
                                <option key={plan.id} value={plan.id}>
                                  {plan.name}
                                </option>
                              ))}
                            </Select>
                          ) : kind === 'gender' ? (
                            <Select
                              value={value}
                              aria-label={label}
                              onChange={(event) =>
                                updateDraft(
                                  row,
                                  issues,
                                  issue.id,
                                  event.target.value,
                                )
                              }
                            >
                              <option value="">Select gender</option>
                              <option value="Female">Female</option>
                              <option value="Male">Male</option>
                              <option value="Other">Other</option>
                            </Select>
                          ) : (
                            <Input
                              type={
                                kind === 'date'
                                  ? 'date'
                                  : kind === 'email'
                                    ? 'email'
                                    : 'text'
                              }
                              value={value}
                              placeholder={issue.field}
                              aria-label={label}
                              onChange={(event) =>
                                updateDraft(
                                  row,
                                  issues,
                                  issue.id,
                                  event.target.value,
                                )
                              }
                            />
                          )}
                        </IssueFix>
                      )
                    })
                    )}

                    <Actions>
                      {ignored ? (
                        <UndoButton
                          type="button"
                          onClick={() => onRestore(row.id)}
                          aria-label={`Undo ignore for ${row.name}`}
                        >
                          Undo ignore
                        </UndoButton>
                      ) : (
                        <IgnoreButton
                          type="button"
                          onClick={() => onIgnore(row.id)}
                          aria-label={`Ignore ${row.name}`}
                        >
                          Ignore
                        </IgnoreButton>
                      )}
                    </Actions>
                  </IssueBody>
                </IssueCard>
              )
            })}
            </IssueList>
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
              <SuccessTitle>Validation complete</SuccessTitle>
              <SuccessCopy>
                {ignoredCount > 0
                  ? `${ignoredCount} ${ignoredCount === 1 ? 'life was' : 'lives were'} ignored and will not be included. Continue to review the rest.`
                  : 'Continue to review the final list of lives and their benefit assignments.'}
              </SuccessCopy>
            </div>
          </SuccessCard>
        )}

        <ContinueButton
          type="button"
          disabled={openRows.length > 0}
          onClick={onContinue}
        >
          Continue to final validation
        </ContinueButton>
      </Content>
    </Panel>
  )
}

const Panel = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 24px;
  width: 100%;
  max-width: 996px;
  padding: 72px 24px 40px 40px;
  box-sizing: border-box;

  @media (max-width: ${({ theme }) => theme.breakpoints.md}) {
    padding: 72px 16px 40px;
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

const FileCard = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  width: 100%;
  padding: 16px 20px;
  border-radius: 12px;
  background: ${({ theme }) => theme.colors.hoverSurface1};
  box-sizing: border-box;
`

const FileMeta = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
  min-width: 0;
`

const FileIcon = styled.div`
  display: grid;
  width: 40px;
  height: 40px;
  flex: 0 0 40px;
  place-items: center;
  border-radius: 50%;
  background: ${({ theme }) => theme.colors.planeGreenLight};

  img {
    width: 20px;
    height: 20px;
  }
`

const FileCopy = styled.div`
  min-width: 0;
`

const FileName = styled.p`
  margin: 0;
  overflow: hidden;
  color: ${({ theme }) => theme.colors.textPrimary};
  font-size: 14px;
  font-weight: 500;
  line-height: 20px;
  letter-spacing: 0.2px;
  text-overflow: ellipsis;
  white-space: nowrap;
`

const FileSize = styled.p`
  margin: 2px 0 0;
  color: ${({ theme }) => theme.colors.textSecondary};
  font-size: 12px;
  line-height: 18px;
`

const ReuploadButton = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  flex-shrink: 0;
  padding: 0;
  border: 0;
  background: transparent;
  color: ${({ theme }) => theme.colors.emerald};
  font: inherit;
  font-size: 14px;
  font-weight: 500;
  line-height: 18px;
  letter-spacing: -0.28px;
  cursor: pointer;

  img {
    width: 20px;
    height: 20px;
  }
`

const Content = styled.div`
  display: flex;
  min-width: 0;
  max-width: 860px;
  flex: 1;
  flex-direction: column;
  gap: 16px;
  padding-top: 13px;
`

const Heading = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
`

const Title = styled.h1`
  margin: 0;
  color: ${({ theme }) => theme.colors.textPrimary};
  font-size: 18px;
  font-weight: 500;
  line-height: 24px;
`

const Description = styled.p`
  margin: 4px 0 0;
  color: ${({ theme }) => theme.colors.textSecondary};
  font-size: 12px;
  line-height: 18px;
  letter-spacing: 0.2px;
`

const IssueCount = styled.span<{ $clear: boolean }>`
  flex-shrink: 0;
  padding: 5px 10px;
  border-radius: 999px;
  background: ${({ $clear, theme }) =>
    $clear ? theme.colors.planeGreenLight : '#FDECEC'};
  color: ${({ $clear, theme }) =>
    $clear ? theme.colors.emerald : theme.colors.textError};
  font-size: 12px;
  font-weight: 500;
  line-height: 18px;
`

const SectionDivider = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
  color: ${({ theme }) => theme.colors.textSecondary};
  font-size: 14px;
  font-weight: 500;
  line-height: 20px;
  letter-spacing: 0.2px;

  i {
    height: 1px;
    flex: 1;
    background: ${({ theme }) => theme.colors.disableFill};
  }
`

const IssueSection = styled.section`
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 16px;
  border: 1px solid ${({ theme }) => theme.colors.disableFill};
  border-radius: 12px;
  box-sizing: border-box;
`

const IssueHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
`

const IssueTitle = styled.h2`
  margin: 0;
  color: ${({ theme }) => theme.colors.textSecondary};
  font-size: 16px;
  font-weight: 500;
  line-height: 24px;
  letter-spacing: 0.2px;
`

const IssueList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`

const IssueCard = styled.article<{ $state: 'open' | 'ignored' | 'fixed' }>`
  display: grid;
  grid-template-columns: minmax(180px, 0.85fr) minmax(0, 1.4fr);
  align-items: start;
  gap: 16px;
  padding: 16px;
  border: 1px solid
    ${({ $state, theme }) =>
      $state === 'ignored'
        ? theme.colors.disableFill
        : $state === 'fixed'
          ? theme.colors.emerald
          : '#f1b7b7'};
  border-radius: 12px;
  background: ${({ $state, theme }) =>
    $state === 'ignored'
      ? theme.colors.surface0
      : $state === 'fixed'
        ? theme.colors.planeGreenLight
        : '#fffafa'};
  opacity: ${({ $state }) => ($state === 'ignored' ? 0.78 : 1)};

  @media (max-width: ${({ theme }) => theme.breakpoints.md}) {
    grid-template-columns: 1fr;
  }
`

const Member = styled.div`
  display: flex;
  min-width: 0;
  align-items: center;
  gap: 10px;
  padding-top: 2px;
`

const MemberAvatar = styled.span<{ $state: 'open' | 'ignored' | 'fixed' }>`
  display: grid;
  width: 36px;
  height: 36px;
  flex: 0 0 36px;
  place-items: center;
  border-radius: 50%;
  background: ${({ $state, theme }) =>
    $state === 'ignored'
      ? theme.colors.disableFill
      : theme.colors.planeGreenLight};
  color: ${({ $state, theme }) =>
    $state === 'ignored' ? theme.colors.textSecondary : theme.colors.emerald};
  font-size: 11px;
  font-weight: 600;
`

const MemberName = styled.p`
  margin: 0;
  overflow: hidden;
  color: ${({ theme }) => theme.colors.textPrimary};
  font-size: 13px;
  font-weight: 500;
  line-height: 18px;
  text-overflow: ellipsis;
  white-space: nowrap;
`

const MemberMeta = styled.p`
  margin: 2px 0 0;
  color: ${({ theme }) => theme.colors.textSecondary};
  font-size: 11px;
  line-height: 16px;
`

const IssueBody = styled.div`
  display: flex;
  min-width: 0;
  flex-direction: column;
  gap: 10px;
`

const IssueFix = styled.div`
  display: grid;
  grid-template-columns: minmax(160px, 1fr) minmax(160px, 1fr);
  align-items: center;
  gap: 12px;

  @media (max-width: ${({ theme }) => theme.breakpoints.sm}) {
    grid-template-columns: 1fr;
  }
`

const Issue = styled.div`
  min-width: 0;
`

const IssueLabel = styled.p<{ $fixed?: boolean }>`
  margin: 0;
  color: ${({ $fixed, theme }) =>
    $fixed ? theme.colors.emerald : theme.colors.textError};
  font-size: 12px;
  font-weight: 500;
  line-height: 18px;
`

const IssueReason = styled.p`
  margin: 2px 0 0;
  color: ${({ theme }) => theme.colors.textPrimary};
  font-size: 12px;
  line-height: 18px;
`

const FixedValue = styled.span`
  display: flex;
  min-width: 0;
  align-items: center;
  min-height: 36px;
  padding: 0 10px;
  border-radius: 8px;
  background: ${({ theme }) => theme.colors.surface1};
  color: ${({ theme }) => theme.colors.emerald};
  font-size: 12px;
  font-weight: 500;
  line-height: 18px;
  box-sizing: border-box;
`

const IgnoredNote = styled.p`
  margin: 0;
  color: ${({ theme }) => theme.colors.textSecondary};
  font-size: 12px;
  line-height: 18px;
`

const Actions = styled.div`
  display: flex;
  justify-content: flex-end;
`

const controlStyles = `
  width: 100%;
  height: 36px;
  padding: 0 10px;
  border-radius: 8px;
  background: white;
  box-sizing: border-box;
  font: inherit;
  font-size: 12px;
`

const Input = styled.input`
  ${controlStyles}
  border: 1px solid ${({ theme }) => theme.colors.defaultBorder};
  color: ${({ theme }) => theme.colors.textPrimary};

  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.colors.emerald};
  }
`

const Select = styled.select`
  ${controlStyles}
  padding-right: 30px;
  border: 1px solid ${({ theme }) => theme.colors.defaultBorder};
  color: ${({ theme }) => theme.colors.textPrimary};
  appearance: none;
  background: ${({ theme }) => theme.colors.surface1}
    url(${assets.mlChevronDown24}) no-repeat right 8px center / 16px 16px;

  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.colors.emerald};
  }
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
