import { useNavigate } from 'react-router-dom'
import styled from 'styled-components'

import { sampleEmployees } from '@/data/employees'
import { getBenefitConfig } from '@/domain/flex'
import { FlowStepper, WizardChrome } from '@/pages/LivesWizard/WizardChrome'
import { useLivesWizard } from '@/pages/LivesWizard/WizardContext'

export function OffboardCoverageStep() {
  const navigate = useNavigate()
  const { activeDeal, selectedEmployeeId, dateOfLeaving, setStep } =
    useLivesWizard()
  const employee = sampleEmployees.find(
    (item) => item.id === selectedEmployeeId,
  )
  if (!employee) return null

  const retained = employee.coverages.filter((coverage) => {
    const benefit = activeDeal
      ? getBenefitConfig(activeDeal, coverage.id)
      : undefined
    return benefit?.retainedOnOffboard
  })
  const ending = employee.coverages.filter(
    (coverage) => !retained.some((item) => item.id === coverage.id),
  )

  return (
    <WizardChrome
      title="Coverage being off-boarded"
      onBack={() => setStep('date-of-leaving')}
      onExit={() => navigate('/endorsements')}
      secondaryLabel="Back"
      onSecondary={() => setStep('date-of-leaving')}
      primaryLabel="Review refund"
      onPrimary={() => setStep('delete-summary')}
    >
      <FlowStepper
        steps={['Search', 'Leaving date', 'Coverage', 'Refund']}
        activeIndex={2}
        bare
      />

      <Summary>
        <strong>
          {employee.firstName} {employee.lastName}
        </strong>
        <span>
          Leaving {dateOfLeaving} · {employee.dependants.length} dependant
          {employee.dependants.length === 1 ? '' : 's'} will also be removed
        </span>
      </Summary>

      <Section>
        <Title>Ending coverage</Title>
        <List>
          {ending.map((coverage) => (
            <Coverage key={`${coverage.kind}-${coverage.id}`}>
              <div>
                <strong>{coverage.label}</strong>
                <span>
                  {coverage.kind} · Employee
                  {employee.dependants.length > 0
                    ? ` + ${employee.dependants.length} dependant${employee.dependants.length === 1 ? '' : 's'}`
                    : ''}
                </span>
              </div>
              <Ending>Ends {dateOfLeaving}</Ending>
            </Coverage>
          ))}
        </List>
      </Section>

      {retained.length > 0 || employee.hasFlatWellness ? (
        <RetainedSection>
          <Title>Remains active</Title>
          {(retained.length > 0 ? retained : [{ id: 'wellness', label: 'Cult.fit Membership' }]).map(
            (coverage) => {
              const benefit = activeDeal
                ? getBenefitConfig(activeDeal, coverage.id)
                : undefined
              return (
                <Coverage key={coverage.id}>
                  <div>
                    <strong>{coverage.label}</strong>
                    <span>
                      {benefit?.retainedReason ??
                        'This benefit has a fixed validity and will not end on the employee leaving date.'}
                    </span>
                  </div>
                  <Retained>
                    Until {benefit?.retainedUntil ?? '31 Dec 2026'}
                  </Retained>
                </Coverage>
              )
            },
          )}
        </RetainedSection>
      ) : null}
    </WizardChrome>
  )
}

const Summary = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 14px 16px;
  border-radius: 10px;
  background: ${({ theme }) => theme.colors.surface1};
  font-size: 12px;
  color: ${({ theme }) => theme.colors.textSecondary};

  strong {
    font-size: 14px;
    color: ${({ theme }) => theme.colors.textPrimary};
  }
`

const Section = styled.section`
  display: flex;
  flex-direction: column;
  gap: 12px;
`

const RetainedSection = styled(Section)`
  padding: 16px;
  border-radius: 12px;
  background: ${({ theme }) => theme.colors.planeGreenLight};
`

const Title = styled.h2`
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.beyondGrey};
`

const List = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
`

const Coverage = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  padding: 14px 16px;
  border-radius: 10px;
  border: 1px solid ${({ theme }) => theme.colors.defaultBorder};
  background: ${({ theme }) => theme.colors.surface1};

  div {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  strong {
    font-size: 13px;
    color: ${({ theme }) => theme.colors.textPrimary};
  }

  span {
    font-size: 11px;
    color: ${({ theme }) => theme.colors.textSecondary};
  }
`

const Ending = styled.span`
  font-weight: 600;
  color: ${({ theme }) => theme.colors.textError} !important;
  white-space: nowrap;
`

const Retained = styled.span`
  font-weight: 600;
  color: ${({ theme }) => theme.colors.emerald} !important;
  white-space: nowrap;
`
