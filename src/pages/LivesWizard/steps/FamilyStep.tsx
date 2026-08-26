import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import styled from 'styled-components'

import {
  availableBenefitsForRelationship,
  computeFamilySlots,
  resolveAttributeFields,
  validateAttributeValues,
} from '@/domain/flex'
import { DependantSlotSelector } from '@/pages/LivesWizard/components/DependantSlotSelector'
import { DynamicAttributeForm } from '@/pages/LivesWizard/components/DynamicAttributeForm'
import { FlowStepper, WizardChrome } from '@/pages/LivesWizard/WizardChrome'
import { useLivesWizard } from '@/pages/LivesWizard/WizardContext'
import { SINGLE_ADD_STEPS } from '@/pages/LivesWizard/singleAddSteps'

export function FamilyStep() {
  const navigate = useNavigate()
  const {
    activeDeal,
    addEmployees,
    addAddEmployeeDependant,
    removeAddEmployeeDependant,
    updateAddEmployeeDependant,
    setStep,
  } = useLivesWizard()

  const benefitLabels = useMemo(
    () =>
      Object.fromEntries(
        activeDeal?.benefits.map((benefit) => [benefit.id, benefit.name]) ?? [],
      ),
    [activeDeal],
  )

  if (!activeDeal) return null

  const members = addEmployees.map((member) => {
    const summary = computeFamilySlots({
      deal: activeDeal,
      selectedBenefitIds: member.selectedBenefitIds,
      existingDependants: member.dependants
        .filter((dependant) => Boolean(dependant.relationship))
        .map((dependant) => ({
          id: dependant.id,
          relationship: dependant.relationship,
          dateOfBirth: dependant.dateOfBirth,
          benefitIds: dependant.selectedBenefitIds,
        })),
    })
    return { member, summary }
  })

  const canProceed = addEmployees.every((member) =>
    member.dependants.every((dependant) => {
      const fields = resolveAttributeFields({
        deal: activeDeal,
        entity: 'dependant',
        relationship: dependant.relationship,
        selectedBenefitIds: dependant.selectedBenefitIds,
        existingValues: dependant.customAttributes,
      }).fields
      return (
        Boolean(dependant.firstName.trim()) &&
        Boolean(dependant.relationship) &&
        Boolean(dependant.gender) &&
        Boolean(dependant.dateOfBirth) &&
        Object.keys(
          validateAttributeValues(fields, dependant.customAttributes),
        ).length === 0
      )
    }),
  )

  return (
    <WizardChrome
      title="Add new employee(s)"
      onBack={() => setStep('benefits')}
      onExit={() => navigate('/endorsements')}
      secondaryLabel="Back"
      onSecondary={() => setStep('benefits')}
      primaryLabel="Review"
      primaryDisabled={!canProceed}
      onPrimary={() => setStep('endo-costs')}
    >
      <FlowStepper steps={[...SINGLE_ADD_STEPS]} activeIndex={2} bare />

      <Lead>
        Family slots come from each employee’s final benefit selection.
        Dependants only see benefits that support their relationship.
      </Lead>

      {members.map(({ member, summary }, memberIndex) => (
        <MemberSection key={member.id}>
          <MemberHeader>
            <div>
              <MemberTitle>
                {member.employee.firstName || `Employee ${memberIndex + 1}`}{' '}
                {member.employee.lastName}
              </MemberTitle>
              <MemberMeta>
                {member.dependants.length} dependant
                {member.dependants.length === 1 ? '' : 's'} added
              </MemberMeta>
            </div>
            {!summary.allSlotsConsumed ? (
              <AddButton
                type="button"
                onClick={() => addAddEmployeeDependant(member.id)}
              >
                + Add dependant
              </AddButton>
            ) : null}
          </MemberHeader>

          <DependantSlotSelector
            summary={summary}
            benefitLabels={benefitLabels}
          />

          {member.dependants.map((dependant, dependantIndex) => {
            const fields = resolveAttributeFields({
              deal: activeDeal,
              entity: 'dependant',
              relationship: dependant.relationship,
              selectedBenefitIds: dependant.selectedBenefitIds,
              existingValues: dependant.customAttributes,
            }).fields
            const attributeErrors = validateAttributeValues(
              fields,
              dependant.customAttributes,
            )
            return (
              <DependantCard key={dependant.id}>
                <CardHeader>
                  <strong>Dependant {dependantIndex + 1}</strong>
                  <Remove
                    type="button"
                    onClick={() =>
                      removeAddEmployeeDependant(member.id, dependant.id)
                    }
                  >
                    Remove
                  </Remove>
                </CardHeader>

                <Grid>
                  <Field>
                    <Label>Relationship*</Label>
                    <Select
                      value={dependant.relationship}
                      onChange={(event) => {
                        const relationship = event.target
                          .value as typeof dependant.relationship
                        updateAddEmployeeDependant(member.id, dependant.id, {
                          relationship,
                          selectedBenefitIds:
                            availableBenefitsForRelationship(
                              summary,
                              relationship,
                            ),
                        })
                      }}
                    >
                      <option value="">Select</option>
                      {summary.addableRelationships.map((relationship) => (
                        <option key={relationship} value={relationship}>
                          {relationship}
                        </option>
                      ))}
                      {dependant.relationship &&
                      !summary.addableRelationships.some(
                        (relationship) =>
                          relationship === dependant.relationship,
                      ) ? (
                        <option value={dependant.relationship}>
                          {dependant.relationship}
                        </option>
                      ) : null}
                    </Select>
                  </Field>
                  <Field>
                    <Label>First name*</Label>
                    <Input
                      value={dependant.firstName}
                      onChange={(event) =>
                        updateAddEmployeeDependant(member.id, dependant.id, {
                          firstName: event.target.value,
                        })
                      }
                    />
                  </Field>
                  <Field>
                    <Label>Last name</Label>
                    <Input
                      value={dependant.lastName}
                      onChange={(event) =>
                        updateAddEmployeeDependant(member.id, dependant.id, {
                          lastName: event.target.value,
                        })
                      }
                    />
                  </Field>
                  <Field>
                    <Label>Gender*</Label>
                    <Select
                      value={dependant.gender}
                      onChange={(event) =>
                        updateAddEmployeeDependant(member.id, dependant.id, {
                          gender: event.target.value as typeof dependant.gender,
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
                    <Label>Date of birth*</Label>
                    <Input
                      type="date"
                      value={dependant.dateOfBirth}
                      onChange={(event) =>
                        updateAddEmployeeDependant(member.id, dependant.id, {
                          dateOfBirth: event.target.value,
                        })
                      }
                    />
                  </Field>
                </Grid>

                <Benefits>
                  <Label>Benefits for this dependant</Label>
                  <ChipRow>
                    {dependant.selectedBenefitIds.map((benefitId) => (
                      <Chip key={benefitId}>
                        {benefitLabels[benefitId] ?? benefitId}
                      </Chip>
                    ))}
                    {dependant.selectedBenefitIds.length === 0 ? (
                      <MemberMeta>
                        Select an eligible relationship to assign benefits.
                      </MemberMeta>
                    ) : null}
                  </ChipRow>
                </Benefits>

                <DynamicAttributeForm
                  fields={fields}
                  values={dependant.customAttributes}
                  errors={attributeErrors}
                  onChange={(attributeId, value) =>
                    updateAddEmployeeDependant(member.id, dependant.id, {
                      customAttributes: {
                        ...dependant.customAttributes,
                        [attributeId]: value,
                      },
                    })
                  }
                />
              </DependantCard>
            )
          })}
        </MemberSection>
      ))}
    </WizardChrome>
  )
}

const Lead = styled.p`
  margin: 0;
  font-size: 13px;
  line-height: 19px;
  color: ${({ theme }) => theme.colors.textSecondary};
`

const MemberSection = styled.section`
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 20px;
  border-radius: 16px;
  background: ${({ theme }) => theme.colors.surface1};
`

const MemberHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
`

const MemberTitle = styled.h2`
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.beyondGrey};
`

const MemberMeta = styled.span`
  font-size: 12px;
  color: ${({ theme }) => theme.colors.textSecondary};
`

const AddButton = styled.button`
  border: 1px solid ${({ theme }) => theme.colors.emerald};
  border-radius: 8px;
  background: transparent;
  padding: 8px 12px;
  font-family: ${({ theme }) => theme.fontFamily};
  font-size: 12px;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.emerald};
  cursor: pointer;
`

const DependantCard = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 18px;
  border-radius: 12px;
  border: 1px solid ${({ theme }) => theme.colors.defaultBorder};
`

const CardHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 14px;
  color: ${({ theme }) => theme.colors.textPrimary};
`

const Remove = styled.button`
  border: none;
  background: transparent;
  color: ${({ theme }) => theme.colors.textError};
  font-family: ${({ theme }) => theme.fontFamily};
  cursor: pointer;
`

const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 14px;

  @media (max-width: 900px) {
    grid-template-columns: 1fr;
  }
`

const Field = styled.label`
  display: flex;
  flex-direction: column;
  gap: 7px;
`

const Label = styled.span`
  font-size: 13px;
  font-weight: 500;
  color: ${({ theme }) => theme.colors.textPrimary};
`

const Input = styled.input`
  height: 44px;
  padding: 0 12px;
  border: 1px solid ${({ theme }) => theme.colors.defaultBorder};
  border-radius: ${({ theme }) => theme.radii.sm};
  font-family: ${({ theme }) => theme.fontFamily};
  box-sizing: border-box;
`

const Select = styled.select`
  height: 44px;
  padding: 0 12px;
  border: 1px solid ${({ theme }) => theme.colors.defaultBorder};
  border-radius: ${({ theme }) => theme.radii.sm};
  background: ${({ theme }) => theme.colors.surface1};
  font-family: ${({ theme }) => theme.fontFamily};
`

const Benefits = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`

const ChipRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
`

const Chip = styled.span`
  padding: 4px 9px;
  border-radius: 999px;
  background: ${({ theme }) => theme.colors.planeGreenLight};
  font-size: 11px;
  color: ${({ theme }) => theme.colors.emerald};
`
