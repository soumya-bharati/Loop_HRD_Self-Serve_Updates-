import { useNavigate } from 'react-router-dom'
import styled from 'styled-components'

import { sampleEmployees } from '@/data/employees'
import { getBenefitConfig } from '@/domain/flex'
import { toDisplayDate } from '@/pages/LivesWizard/autofill/personas'
import { GuidedStepLayout } from '@/pages/LivesWizard/components/GuidedStepLayout'
import { DELETE_GUIDED_STEPS } from '@/pages/LivesWizard/guidedFlowSteps'
import { useLivesWizard } from '@/pages/LivesWizard/WizardContext'
import { pendingChangeFromWizard } from '@/pages/ManageLives/CaptureWorkspaceChange'
import { employeeDetailsPath, isWorkspaceReturn } from '@/pages/ManageLives/launchWizard'
import { usePendingChanges } from '@/pages/ManageLives/PendingChangesContext'

export function OffboardCoverageStep() {
  const navigate = useNavigate()
  const wizard = useLivesWizard()
  const { activeDeal, selectedEmployeeId, dateOfLeaving, setStep } = wizard
  const { addChange } = usePendingChanges()
  const employee = sampleEmployees.find(
    (item) => item.id === selectedEmployeeId,
  )
  if (!employee) return null

  const leavingLabel = toDisplayDate(dateOfLeaving) || dateOfLeaving
  const dependantCount = employee.dependants.length
  const familyStructure = [
    'Employee',
    ...employee.dependants.map((item) => item.relationship),
  ].join(' + ')

  const retained = employee.coverages.filter((coverage) => {
    const benefit = activeDeal
      ? getBenefitConfig(activeDeal, coverage.id)
      : undefined
    return benefit?.retainedOnOffboard
  })
  const ending = employee.coverages.filter(
    (coverage) => !retained.some((item) => item.id === coverage.id),
  )
  const retainedItems =
    retained.length > 0
      ? retained
      : employee.hasFlatWellness
        ? [{ id: 'wellness', label: 'Cult.fit Membership', kind: 'benefit' as const }]
        : []

  return (
    <GuidedStepLayout
      steps={DELETE_GUIDED_STEPS}
      activeIndex={1}
      onExit={() => navigate(employeeDetailsPath(selectedEmployeeId))}
      title="Coverage being off-boarded"
      onBack={() => setStep('date-of-leaving')}
      primaryLabel="Off-board employee"
      onPrimary={() => {
        if (isWorkspaceReturn()) {
          const change = pendingChangeFromWizard(wizard)
          if (change) addChange(change)
        }
        setStep('delete-summary')
      }}
    >
      <Lead>
        {employee.firstName} {employee.lastName} is leaving on {leavingLabel}.{' '}
        {dependantCount} dependant{dependantCount === 1 ? '' : 's'} will be
        removed with this employee.
      </Lead>

      {ending.length > 0 ? (
        <Block>
          <BlockTitle>Ending coverage</BlockTitle>
          <CoverGrid>
            {ending.map((coverage) => (
              <CoverCard key={`${coverage.kind}-${coverage.id}`}>
                <CoverHeader>
                  <div>
                    <CoverEyebrow>{coverage.kind}</CoverEyebrow>
                    <CoverName>{coverage.label}</CoverName>
                  </div>
                  <LivesBadge $ending>Ends {leavingLabel}</LivesBadge>
                </CoverHeader>
                <CoverDetails>
                  <DetailItem>
                    <DetailLabel>Family structure</DetailLabel>
                    <DetailValue>{familyStructure}</DetailValue>
                  </DetailItem>
                </CoverDetails>
              </CoverCard>
            ))}
          </CoverGrid>
        </Block>
      ) : null}

      {retainedItems.length > 0 ? (
        <Block>
          <BlockTitle>Remains active</BlockTitle>
          <CoverGrid>
            {retainedItems.map((coverage) => {
              const benefit = activeDeal
                ? getBenefitConfig(activeDeal, coverage.id)
                : undefined
              return (
                <CoverCard key={coverage.id}>
                  <CoverHeader>
                    <div>
                      <CoverEyebrow>Benefit</CoverEyebrow>
                      <CoverName>{coverage.label}</CoverName>
                    </div>
                    <LivesBadge>
                      Until {benefit?.retainedUntil ?? '31 Dec 2026'}
                    </LivesBadge>
                  </CoverHeader>
                  <CoverDetails>
                    <DetailItem>
                      <DetailLabel>Why it stays</DetailLabel>
                      <DetailValue>
                        {benefit?.retainedReason ??
                          'This benefit has a fixed validity and will not end on the employee leaving date.'}
                      </DetailValue>
                    </DetailItem>
                  </CoverDetails>
                </CoverCard>
              )
            })}
          </CoverGrid>
        </Block>
      ) : null}
    </GuidedStepLayout>
  )
}

const Lead = styled.p`
  margin: 0;
  color: ${({ theme }) => theme.colors.textSecondary};
  font-size: 14px;
  font-weight: 400;
  line-height: 20px;
  letter-spacing: 0.2px;
`

const Block = styled.section`
  display: flex;
  width: 100%;
  flex-direction: column;
  gap: 16px;
`

const BlockTitle = styled.h2`
  margin: 0;
  color: ${({ theme }) => theme.colors.textPrimary};
  font-size: 16px;
  font-weight: 500;
  line-height: 24px;
  letter-spacing: 0.2px;
`

const CoverGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;

  @media (max-width: ${({ theme }) => theme.breakpoints.lg}) {
    grid-template-columns: 1fr;
  }
`

const CoverCard = styled.article`
  display: flex;
  flex-direction: column;
  gap: 20px;
  min-width: 0;
  padding: 20px;
  overflow: hidden;
  border: 1px solid ${({ theme }) => theme.colors.disableFill};
  border-radius: ${({ theme }) => theme.radii.md};
  background: ${({ theme }) => theme.colors.surface1};
`

const CoverHeader = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
`

const CoverEyebrow = styled.p`
  margin: 0;
  color: ${({ theme }) => theme.colors.textSecondary};
  font-size: 11px;
  font-weight: 500;
  line-height: 16px;
  text-transform: uppercase;
  letter-spacing: 0.2px;
`

const CoverName = styled.p`
  margin: 4px 0 0;
  color: ${({ theme }) => theme.colors.textPrimary};
  font-size: 16px;
  font-weight: 600;
  line-height: 22px;
  letter-spacing: 0.2px;
`

const LivesBadge = styled.span<{ $ending?: boolean }>`
  flex-shrink: 0;
  padding: 4px 10px;
  border-radius: 999px;
  background: ${({ theme, $ending }) =>
    $ending ? '#fdecec' : theme.colors.planeGreenLight};
  color: ${({ theme, $ending }) =>
    $ending ? theme.colors.textError : theme.colors.emerald};
  font-size: 12px;
  font-weight: 500;
  line-height: 18px;
  white-space: nowrap;
`

const CoverDetails = styled.dl`
  display: grid;
  grid-template-columns: 1fr;
  gap: 12px;
  margin: 0;
`

const DetailItem = styled.div`
  min-width: 0;
  padding: 12px;
  border-radius: 10px;
  background: ${({ theme }) => theme.colors.surface0};
`

const DetailLabel = styled.dt`
  margin: 0;
  color: ${({ theme }) => theme.colors.textSecondary};
  font-size: 11px;
  font-weight: 500;
  line-height: 16px;
  text-transform: uppercase;
  letter-spacing: 0.2px;
`

const DetailValue = styled.dd`
  margin: 4px 0 0;
  color: ${({ theme }) => theme.colors.textPrimary};
  font-size: 14px;
  font-weight: 500;
  line-height: 20px;
`
