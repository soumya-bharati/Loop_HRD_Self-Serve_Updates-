import { useMemo } from 'react'
import styled from 'styled-components'

import { assets } from '@/assets/figma'
import { buildCoverBreakup, coverAssignmentsForRow } from '@/data/coverPlans'
import { validationIssuesFor, type BulkMemberRow } from '@/data/flexDeal'
import {
  buildAssignmentSheet,
  downloadAssignmentSheet,
} from '@/pages/ManageLives/bulk/downloadAssignmentSheet'

const PLAN_COLORS: Record<string, string> = {
  Base: '#0D7963',
  Bronze: '#FDD506',
  Silver: '#A8B5B1',
  Gold: '#FDD506',
  Platinum: '#FF8080',
  General: '#0D7963',
}

function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function assignmentDescription(
  rows: BulkMemberRow[],
  coverId: string,
  planId: string,
) {
  const assigned = rows.filter((row) =>
    coverAssignmentsForRow(row, rows).some(
      (item) => item.coverId === coverId && item.planId === planId,
    ),
  )
  const employees = assigned.filter((row) => row.relationship === 'Self').length
  const dependents = assigned.length - employees
  const parts = [
    employees ? `${employees} ${employees === 1 ? 'employee' : 'employees'}` : '',
    dependents
      ? `${dependents} ${dependents === 1 ? 'dependant' : 'dependants'}`
      : '',
  ].filter(Boolean)
  return parts.join(' & ')
}

export function ValidationResultsPanel({
  rows,
  onBack,
  onContinue,
  isDelete = false,
}: {
  rows: BulkMemberRow[]
  onBack: () => void
  onContinue: () => void
  isDelete?: boolean
}) {
  const acceptedRows = useMemo(
    () => rows.filter((row) => !row.ignored && row.status !== 'fail'),
    [rows],
  )
  const assignmentSheet = useMemo(
    () => buildAssignmentSheet(acceptedRows),
    [acceptedRows],
  )
  const employees = acceptedRows.filter(
    (row) => row.relationship === 'Self',
  ).length
  const needsFix = rows.filter(
    (row) => !row.ignored && validationIssuesFor(row).length > 0,
  ).length
  const coverBreakup = useMemo(() => buildCoverBreakup(acceptedRows), [acceptedRows])
  const visibleCovers = coverBreakup.filter(
    (item) =>
      item.cover.id === 'cover-health' || item.cover.id === 'cover-term-life',
  )

  return (
    <Panel>
      <Results>
        <Title>Based on your uploaded document</Title>

        <FileCard>
          <FileMeta>
            <FileIcon>
              <img src={assets.mlIconFileDoc} alt="" />
            </FileIcon>
            <FileCopy>
              <FileName title={assignmentSheet.fileName}>
                {assignmentSheet.fileName}
              </FileName>
              <FileSize>{formatFileSize(assignmentSheet.sizeBytes)}</FileSize>
            </FileCopy>
          </FileMeta>
          <DownloadButton
            type="button"
            onClick={() => downloadAssignmentSheet(acceptedRows)}
          >
            Download Assignment Sheet
          </DownloadButton>
        </FileCard>

        <SectionDivider>
          <span>Here’s what we found</span>
          <i />
        </SectionDivider>

        <Metrics $withFix={needsFix > 0}>
          <MetricCard $accent>
            <MetricValue>{acceptedRows.length} lives</MetricValue>
            <MetricLabel>Total Lives</MetricLabel>
            <MetricIcon>
              <img src={assets.mlIconMetricUser} alt="" />
            </MetricIcon>
          </MetricCard>
          <MetricCard>
            <MetricValue>{employees}</MetricValue>
            <MetricLabel>Employees</MetricLabel>
            <MetricIcon>
              <img src={assets.mlIconMetricBriefcase} alt="" />
            </MetricIcon>
          </MetricCard>
          <MetricCard $muted>
            <MetricValue>{acceptedRows.length - employees}</MetricValue>
            <MetricLabel>Dependents</MetricLabel>
            <MetricIcon>
              <img src={assets.mlIconMetricUsers} alt="" />
            </MetricIcon>
          </MetricCard>
          {needsFix > 0 ? (
            <MetricCard $error>
              <MetricValue>{needsFix} lives</MetricValue>
              <MetricLabel>Need a fix</MetricLabel>
              <MetricIcon $error>
                <img src={assets.mlIconMetricUser} alt="" />
              </MetricIcon>
            </MetricCard>
          ) : null}
        </Metrics>

        <SectionDivider>
          <span>Here is assignment of benefits</span>
          <i />
        </SectionDivider>

        <AssignmentCard>
          <AssignmentHeader>
            <AssignmentTitle>Lives covered in</AssignmentTitle>
          </AssignmentHeader>

          <CoverGrid>
            {visibleCovers.map((item) => (
              <CoverCard key={item.cover.id}>
                <CoverHeader>
                  {item.cover.id === 'cover-term-life'
                    ? 'Term Life Insurance'
                    : item.cover.name}
                </CoverHeader>
                <PlanList>
                  {item.plans.map((plan, index) => (
                    <PlanRow key={plan.planId}>
                      <PlanName>
                        <Swatch
                          $color={
                            PLAN_COLORS[plan.planLabel] ??
                            ['#0D7963', '#FDD506', '#FF8080'][index % 3]
                          }
                        />
                        {plan.planLabel} Plan
                      </PlanName>
                      <PlanCount>
                        <strong>{String(plan.lives).padStart(2, '0')}</strong>
                        <span>
                          ({assignmentDescription(
                            acceptedRows,
                            item.cover.id,
                            plan.planId,
                          )})
                        </span>
                      </PlanCount>
                    </PlanRow>
                  ))}
                </PlanList>
              </CoverCard>
            ))}
          </CoverGrid>

          <Actions>
            <BackButton type="button" onClick={onBack}>
              Go Back
            </BackButton>
            <SubmitButton type="button" onClick={onContinue}>
              {isDelete
                ? `Submit ${acceptedRows.length} Lives for Deletion`
                : `Submit ${acceptedRows.length} Lives for Addition`}
            </SubmitButton>
          </Actions>
        </AssignmentCard>
      </Results>
    </Panel>
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

const Results = styled.div`
  display: flex;
  flex: 1;
  min-width: 0;
  width: 100%;
  max-width: none;
  flex-direction: column;
  gap: 16px;
  padding-top: 13px;
`

const Title = styled.h1`
  margin: 0;
  font-size: 18px;
  font-weight: 500;
  line-height: 24px;
  color: ${({ theme }) => theme.colors.textPrimary};
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

const Metrics = styled.div<{ $withFix: boolean }>`
  display: grid;
  grid-template-columns: ${({ $withFix }) =>
    $withFix
      ? 'repeat(4, minmax(0, 1fr))'
      : 'repeat(3, minmax(0, 1fr))'};
  gap: 16px;

  @media (max-width: ${({ theme }) => theme.breakpoints.md}) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  @media (max-width: ${({ theme }) => theme.breakpoints.sm}) {
    grid-template-columns: 1fr;
  }
`

const MetricCard = styled.div<{
  $accent?: boolean
  $muted?: boolean
  $error?: boolean
}>`
  position: relative;
  min-height: 92px;
  padding: 16px;
  border: 1px solid
    ${({ $error, theme }) =>
      $error ? '#f1b7b7' : theme.colors.disableFill};
  border-radius: 12px;
  background: ${({ $error }) => ($error ? '#fffafa' : 'transparent')};
  box-sizing: border-box;
  color: ${({ theme, $accent, $muted, $error }) =>
    $error
      ? theme.colors.textError
      : $accent
        ? theme.colors.emerald
        : $muted
          ? theme.colors.textSecondary
          : theme.colors.textPrimary};
`

const MetricValue = styled.p`
  margin: 0;
  font-size: 24px;
  font-weight: 500;
  line-height: 28px;
`

const MetricLabel = styled.p`
  margin: 2px 0 0;
  color: ${({ theme }) => theme.colors.textSecondary};
  font-size: 12px;
  font-weight: 500;
  line-height: 18px;
  letter-spacing: 0.2px;
`

const MetricIcon = styled.div<{ $error?: boolean }>`
  position: absolute;
  top: 20px;
  right: 16px;
  display: grid;
  width: 36px;
  height: 36px;
  place-items: center;
  border-radius: 50%;
  background: ${({ $error }) => ($error ? '#FDECEC' : '#f3f4f6')};

  img {
    width: 18px;
    height: 18px;
  }
`

const AssignmentCard = styled.section`
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 16px;
  border: 1px solid ${({ theme }) => theme.colors.disableFill};
  border-radius: 12px;
  box-sizing: border-box;
`

const AssignmentHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
`

const AssignmentTitle = styled.h2`
  margin: 0;
  color: ${({ theme }) => theme.colors.textSecondary};
  font-size: 16px;
  font-weight: 500;
  line-height: 24px;
  letter-spacing: 0.2px;
`

const CoverGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;

  @media (max-width: ${({ theme }) => theme.breakpoints.sm}) {
    grid-template-columns: 1fr;
  }
`

const CoverCard = styled.article`
  display: flex;
  flex-direction: column;
  gap: 16px;
  min-width: 0;
  padding: 16px;
  border-radius: 12px;
  background: ${({ theme }) => theme.colors.surface0};
`

const CoverHeader = styled.div`
  color: ${({ theme }) => theme.colors.textSecondary};
  font-size: 14px;
  font-weight: 500;
  line-height: 20px;
  letter-spacing: 0.2px;
`

const PlanList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 14px;
`

const PlanRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  min-height: 34px;
  padding: 8px 12px;
  border-radius: 6px;
  background: ${({ theme }) => theme.colors.disableFill};
  box-sizing: border-box;
`

const PlanName = styled.span`
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 112px;
  color: ${({ theme }) => theme.colors.textPrimary};
  font-size: 12px;
  line-height: 18px;
  letter-spacing: 0.2px;
`

const Swatch = styled.i<{ $color: string }>`
  width: 10px;
  height: 10px;
  flex: 0 0 10px;
  border-radius: 50%;
  background: ${({ $color }) => $color};
`

const PlanCount = styled.span`
  display: flex;
  gap: 4px;
  color: ${({ theme }) => theme.colors.textSecondary};
  font-size: 12px;
  line-height: 18px;
  white-space: nowrap;

  strong {
    color: ${({ theme }) => theme.colors.textPrimary};
    font-size: 14px;
    font-weight: 500;
    line-height: 20px;
  }
`

const Actions = styled.div`
  display: flex;
  gap: 16px;
  align-items: center;
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

const SubmitButton = styled.button`
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
  letter-spacing: 0.2px;
  cursor: pointer;
`

const DownloadButton = styled(SubmitButton)`
  flex-shrink: 0;
  border: 1px solid ${({ theme }) => theme.colors.emerald};
  background: ${({ theme }) => theme.colors.surface1};
`
