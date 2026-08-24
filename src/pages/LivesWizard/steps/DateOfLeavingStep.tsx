import { useNavigate } from 'react-router-dom'
import styled from 'styled-components'

import { sampleEmployees } from '@/data/employees'
import { isValidDateOfLeaving } from '@/data/flexDeal'
import { FlowStepper, WizardChrome } from '@/pages/LivesWizard/WizardChrome'
import { useLivesWizard } from '@/pages/LivesWizard/WizardContext'

export function DateOfLeavingStep() {
  const navigate = useNavigate()
  const {
    selectedEmployeeId,
    dateOfLeaving,
    setDateOfLeaving,
    setStep,
  } = useLivesWizard()

  const employee = sampleEmployees.find((e) => e.id === selectedEmployeeId)
  const valid = isValidDateOfLeaving(dateOfLeaving)

  return (
    <WizardChrome
      title="Date of leaving"
      onBack={() => setStep('search-employee')}
      onExit={() => navigate('/endorsements')}
      secondaryLabel="Back"
      onSecondary={() => setStep('search-employee')}
      primaryLabel="Continue"
      primaryDisabled={!valid}
      onPrimary={() => setStep('delete-summary')}
    >
      <FlowStepper
        steps={['Search', 'Date of leaving', 'Refund summary']}
        activeIndex={1}
        bare
      />

      {employee ? (
        <Family>
          <Title>
            Off-boarding {employee.firstName} {employee.lastName}
          </Title>
          <Meta>
            {employee.employeeId} · {employee.dependants.length} dependants will
            be removed with this employee
          </Meta>
          <List>
            <li>
              {employee.firstName} {employee.lastName} (Self)
            </li>
            {employee.dependants.map((d) => (
              <li key={d.id}>
                {d.firstName} {d.lastName} ({d.relationship})
              </li>
            ))}
          </List>
        </Family>
      ) : null}

      <Field>
        <Label>
          Date of leaving<span>*</span>
        </Label>
        <Input
          type="date"
          value={dateOfLeaving}
          onChange={(e) => setDateOfLeaving(e.target.value)}
        />
        <Hint>Only dates from today back to T-45 are allowed.</Hint>
        {dateOfLeaving && !valid ? (
          <ErrorText>
            Date must not be in the future and must fall within the last 45
            days.
          </ErrorText>
        ) : null}
      </Field>
    </WizardChrome>
  )
}

const Family = styled.div`
  padding: 16px 20px;
  border-radius: 12px;
  background: ${({ theme }) => theme.colors.surface1};
  border: 1px solid ${({ theme }) => theme.colors.disableFill};
`

const Title = styled.h2`
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.beyondGrey};
`

const Meta = styled.p`
  margin: 6px 0 12px;
  font-size: 13px;
  color: ${({ theme }) => theme.colors.textSecondary};
`

const List = styled.ul`
  margin: 0;
  padding-left: 18px;
  font-size: 14px;
  color: ${({ theme }) => theme.colors.textPrimary};
`

const Field = styled.label`
  display: flex;
  flex-direction: column;
  gap: 8px;
  max-width: 320px;
`

const Label = styled.span`
  font-size: 14px;
  font-weight: 500;
  color: ${({ theme }) => theme.colors.textPrimary};

  span {
    color: ${({ theme }) => theme.colors.textError};
  }
`

const Input = styled.input`
  height: 48px;
  padding: 0 16px;
  border: 1px solid ${({ theme }) => theme.colors.defaultBorder};
  border-radius: ${({ theme }) => theme.radii.sm};
  font-family: ${({ theme }) => theme.fontFamily};
  font-size: 14px;
`

const Hint = styled.span`
  font-size: 12px;
  color: ${({ theme }) => theme.colors.textSecondary};
`

const ErrorText = styled.span`
  font-size: 12px;
  color: ${({ theme }) => theme.colors.textError};
`
