import { useNavigate } from 'react-router-dom'
import styled from 'styled-components'

import { sampleEmployees } from '@/data/employees'
import { FlowStepper, WizardChrome } from '@/pages/LivesWizard/WizardChrome'
import { useLivesWizard } from '@/pages/LivesWizard/WizardContext'

export function EditFormStep() {
  const navigate = useNavigate()
  const {
    method,
    employee,
    updateEmployee,
    selectedEmployeeId,
    setEditBlocked,
    setStep,
  } = useLivesWizard()

  const member = sampleEmployees.find((e) => e.id === selectedEmployeeId)
  const isDependant = method === 'single-dependant'

  const canProceed =
    Boolean(employee.firstName.trim()) &&
    Boolean(employee.gender) &&
    Boolean(employee.dateOfBirth)

  return (
    <WizardChrome
      title={isDependant ? 'Edit dependant details' : 'Edit employee details'}
      onBack={() => setStep('search-employee')}
      onExit={() => navigate('/endorsements')}
      secondaryLabel="Back"
      onSecondary={() => setStep('search-employee')}
      primaryLabel="Continue"
      primaryDisabled={!canProceed}
      onPrimary={() => {
        // Mock eligibility block: dependant DOB before 2000 ages out of child cover
        const blocked =
          isDependant &&
          Boolean(employee.dateOfBirth) &&
          employee.dateOfBirth < '2000-01-01'
        setEditBlocked(blocked)
        if (member?.requiresProofOnEdit) setStep('edit-proof')
        else setStep('verify')
      }}
    >
      <FlowStepper
        steps={['Search', 'Edit details', 'Review']}
        activeIndex={1}
        bare
      />

      <Note>
        Personal and contact details only. Benefit and plan assignment cannot be
        changed here.
      </Note>

      {member ? (
        <Covers>
          Currently on:{' '}
          {member.coverages.map((c) => c.label).join(' · ')}
        </Covers>
      ) : null}

      {!isDependant && member && member.dependants.length > 0 ? (
        <ExistingBlock>
          <ExistingTitle>Existing dependants</ExistingTitle>
          <ExistingList>
            {member.dependants.map((dependant) => (
              <ExistingCard key={dependant.id}>
                <strong>
                  {dependant.firstName} {dependant.lastName}
                </strong>
                <span>
                  {dependant.relationship} · {dependant.gender} · DOB{' '}
                  {dependant.dateOfBirth}
                </span>
                {dependant.mobile || dependant.email ? (
                  <span>
                    {[dependant.mobile, dependant.email]
                      .filter(Boolean)
                      .join(' · ')}
                  </span>
                ) : null}
              </ExistingCard>
            ))}
          </ExistingList>
        </ExistingBlock>
      ) : null}

      <Grid>
        <Field>
          <Label>First Name*</Label>
          <Input
            value={employee.firstName}
            onChange={(e) => updateEmployee({ firstName: e.target.value })}
          />
        </Field>
        <Field>
          <Label>Last Name</Label>
          <Input
            value={employee.lastName}
            onChange={(e) => updateEmployee({ lastName: e.target.value })}
          />
        </Field>
        <Field>
          <Label>Gender*</Label>
          <Select
            value={employee.gender}
            onChange={(e) =>
              updateEmployee({
                gender: e.target.value as typeof employee.gender,
              })
            }
          >
            <option value="">Select</option>
            <option value="Male">Male</option>
            <option value="Female">Female</option>
            <option value="Other">Other</option>
          </Select>
        </Field>
        <Field>
          <Label>Date of Birth*</Label>
          <Input
            type="date"
            value={employee.dateOfBirth}
            onChange={(e) => updateEmployee({ dateOfBirth: e.target.value })}
          />
        </Field>
        <Field>
          <Label>Work Email</Label>
          <Input
            type="email"
            value={employee.email}
            onChange={(e) => updateEmployee({ email: e.target.value })}
          />
        </Field>
        <Field>
          <Label>Mobile</Label>
          <Input
            value={employee.mobile}
            onChange={(e) => updateEmployee({ mobile: e.target.value })}
          />
        </Field>
      </Grid>
    </WizardChrome>
  )
}

const Note = styled.p`
  margin: 0;
  font-size: 13px;
  color: ${({ theme }) => theme.colors.textSecondary};
`

const Covers = styled.div`
  padding: 12px 14px;
  border-radius: 8px;
  background: ${({ theme }) => theme.colors.surface0};
  font-size: 12px;
  color: ${({ theme }) => theme.colors.textSecondary};
`

const ExistingBlock = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
`

const ExistingTitle = styled.h3`
  margin: 0;
  font-size: 14px;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.beyondGrey};
`

const ExistingList = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 10px;
`

const ExistingCard = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 12px 14px;
  border-radius: 10px;
  border: 1px solid ${({ theme }) => theme.colors.disableFill};
  background: ${({ theme }) => theme.colors.surface0};
  font-size: 12px;
  color: ${({ theme }) => theme.colors.textSecondary};

  strong {
    font-size: 13px;
    font-weight: 600;
    color: ${({ theme }) => theme.colors.textPrimary};
  }
`

const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 16px;

  @media (max-width: 900px) {
    grid-template-columns: 1fr;
  }
`

const Field = styled.label`
  display: flex;
  flex-direction: column;
  gap: 8px;
`

const Label = styled.span`
  font-size: 14px;
  font-weight: 500;
`

const Input = styled.input`
  height: 48px;
  padding: 0 16px;
  border: 1px solid ${({ theme }) => theme.colors.defaultBorder};
  border-radius: ${({ theme }) => theme.radii.sm};
  font-family: ${({ theme }) => theme.fontFamily};
  font-size: 14px;
`

const Select = styled.select`
  height: 48px;
  padding: 0 16px;
  border: 1px solid ${({ theme }) => theme.colors.defaultBorder};
  border-radius: ${({ theme }) => theme.radii.sm};
  font-family: ${({ theme }) => theme.fontFamily};
  font-size: 14px;
  background: white;
`
