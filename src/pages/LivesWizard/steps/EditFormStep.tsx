import { useNavigate } from 'react-router-dom'
import styled from 'styled-components'

import { sampleEmployees } from '@/data/employees'
import { validateMemberCorrection } from '@/domain/flex'
import { FlowStepper, WizardChrome } from '@/pages/LivesWizard/WizardChrome'
import { useLivesWizard } from '@/pages/LivesWizard/WizardContext'

export function EditFormStep() {
  const navigate = useNavigate()
  const {
    method,
    employee,
    updateEmployee,
    selectedEmployeeId,
    selectedDependantId,
    activeDeal,
    setPendingCorrection,
    addCorrection,
    setStep,
  } = useLivesWizard()

  const member = sampleEmployees.find((e) => e.id === selectedEmployeeId)
  const isDependant = method === 'single-dependant'
  const originalDependant = isDependant
    ? member?.dependants.find((item) => item.id === selectedDependantId)
    : undefined
  const original = originalDependant ?? member
  const benefitIds = isDependant
    ? originalDependant?.benefitIds ?? []
    : member?.coverages
        .filter((coverage) => coverage.kind === 'benefit')
        .map((coverage) => coverage.id) ?? []
  const correction =
    activeDeal && original
      ? validateMemberCorrection(activeDeal, {
          memberId: original.id,
          memberName:
            `${employee.firstName} ${employee.lastName}`.trim() || 'Member',
          relationship: isDependant
            ? originalDependant?.relationship ?? 'Dependant'
            : 'Self',
          original: {
            firstName: original.firstName,
            lastName: original.lastName,
            dateOfBirth: original.dateOfBirth,
            gender: original.gender,
            email: original.email,
            mobile: original.mobile,
          },
          updated: {
            firstName: employee.firstName,
            lastName: employee.lastName,
            dateOfBirth: employee.dateOfBirth,
            gender: employee.gender,
            email: employee.email,
            mobile: employee.mobile,
          },
          benefitIds,
          dealId: activeDeal.id,
          department: member?.department,
          attributes: member?.dealAttributes,
        })
      : null

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
      primaryDisabled={
        !canProceed ||
        !correction ||
        correction.diffs.length === 0 ||
        !correction.accepted
      }
      onPrimary={() => {
        if (!correction?.accepted) return
        setPendingCorrection(correction)
        if (correction.requiresKyc) {
          setStep('edit-proof')
        } else {
          addCorrection(correction)
          setStep('correction-batch')
        }
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

      <LockedGrid>
        <LockedField>
          <span>Employee ID</span>
          <strong>{member?.employeeId ?? '—'}</strong>
          <small>Employee ID cannot be changed after creation.</small>
        </LockedField>
        <LockedField>
          <span>Relationship</span>
          <strong>{isDependant ? originalDependant?.relationship : 'Self'}</strong>
          <small>Relationship and coverage cannot be changed here.</small>
        </LockedField>
        <LockedField>
          <span>Deal</span>
          <strong>{activeDeal?.name ?? '—'}</strong>
          <small>Deal attributes are locked for corrections.</small>
        </LockedField>
      </LockedGrid>

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

      {correction && correction.diffs.length > 0 ? (
        <Changes>
          <ChangesTitle>Changes detected</ChangesTitle>
          {correction.diffs.map((diff) => (
            <ChangeRow key={diff.field}>
              <strong>{diff.label}</strong>
              <span>{diff.from || '—'} → {diff.to || '—'}</span>
            </ChangeRow>
          ))}
          {correction.requiresKyc ? (
            <KycNote>
              Supporting KYC will be required for this correction.
            </KycNote>
          ) : null}
        </Changes>
      ) : null}

      {correction?.rejectionReason &&
      correction.diffs.length > 0 ? (
        <Blocked>
          <strong>This change can’t be saved</strong>
          <span>{correction.rejectionReason}</span>
        </Blocked>
      ) : null}
    </WizardChrome>
  )
}

const Note = styled.p`
  margin: 0;
  font-size: 13px;
  color: ${({ theme }) => theme.colors.textSecondary};
`

const LockedGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;

  @media (max-width: 900px) {
    grid-template-columns: 1fr;
  }
`

const LockedField = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 12px 14px;
  border-radius: 10px;
  background: ${({ theme }) => theme.colors.disableFill};
  font-size: 12px;
  color: ${({ theme }) => theme.colors.textSecondary};

  strong {
    font-size: 13px;
    color: ${({ theme }) => theme.colors.textPrimary};
  }

  small {
    line-height: 16px;
  }
`

const Changes = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 16px;
  border-radius: 12px;
  background: ${({ theme }) => theme.colors.surface1};
  border: 1px solid ${({ theme }) => theme.colors.defaultBorder};
`

const ChangesTitle = styled.h3`
  margin: 0 0 4px;
  font-size: 14px;
  color: ${({ theme }) => theme.colors.beyondGrey};
`

const ChangeRow = styled.div`
  display: flex;
  justify-content: space-between;
  gap: 12px;
  font-size: 12px;
  color: ${({ theme }) => theme.colors.textSecondary};

  strong {
    color: ${({ theme }) => theme.colors.textPrimary};
  }
`

const KycNote = styled.div`
  margin-top: 4px;
  padding: 8px 10px;
  border-radius: 8px;
  background: #fff6e5;
  font-size: 12px;
  color: ${({ theme }) => theme.colors.textPrimary};
`

const Blocked = styled.div`
  display: flex;
  flex-direction: column;
  gap: 5px;
  padding: 14px 16px;
  border-radius: 10px;
  background: #fdecec;
  font-size: 12px;
  color: ${({ theme }) => theme.colors.textError};
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
