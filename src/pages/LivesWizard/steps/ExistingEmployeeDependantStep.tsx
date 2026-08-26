import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import styled from 'styled-components'

import { sampleEmployees } from '@/data/employees'
import {
  availableBenefitsForRelationship,
  computeFamilySlots,
  getBenefitConfig,
  resolveAttributeFields,
  validateAttributeValues,
  validateMidtermAssignments,
} from '@/domain/flex'
import { DependantSlotSelector } from '@/pages/LivesWizard/components/DependantSlotSelector'
import { DynamicAttributeForm } from '@/pages/LivesWizard/components/DynamicAttributeForm'
import { FlowStepper, WizardChrome } from '@/pages/LivesWizard/WizardChrome'
import { useLivesWizard } from '@/pages/LivesWizard/WizardContext'
import { SINGLE_DEPENDANT_STEPS } from '@/pages/LivesWizard/singleAddSteps'

export function ExistingEmployeeDependantStep() {
  const navigate = useNavigate()
  const {
    activeDeal,
    selectedEmployeeId,
    dependants,
    updateDependant,
    setStep,
  } = useLivesWizard()
  const employee = sampleEmployees.find(
    (item) => item.id === selectedEmployeeId,
  )
  const dependant = dependants[0]

  const selectedEmployeeBenefitIds = useMemo(
    () =>
      employee?.coverages
        .filter((coverage) => coverage.kind === 'benefit')
        .map((coverage) => coverage.id) ?? [],
    [employee],
  )
  const coverageStatuses = useMemo(
    () =>
      Object.fromEntries(
        employee?.coverages
          .filter((coverage) => coverage.kind === 'benefit')
          .map((coverage) => [
            coverage.id,
            coverage.status ?? 'active',
          ]) ?? [],
      ) as Record<string, 'active' | 'draft'>,
    [employee],
  )

  if (!employee || !activeDeal || !dependant) return null

  const summary = computeFamilySlots({
    deal: activeDeal,
    selectedBenefitIds: selectedEmployeeBenefitIds,
    existingDependants: employee.dependants.map((item) => ({
      id: item.id,
      relationship: item.relationship,
      dateOfBirth: item.dateOfBirth,
      benefitIds: item.benefitIds,
    })),
    coverages: selectedEmployeeBenefitIds.map((benefitId) => ({
      benefitId,
      status: coverageStatuses[benefitId] ?? 'active',
    })),
  })
  const benefitLabels = Object.fromEntries(
    activeDeal.benefits.map((benefit) => [benefit.id, benefit.name]),
  )
  const availableBenefitIds = availableBenefitsForRelationship(
    summary,
    dependant.relationship,
  )
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
  const midterm = validateMidtermAssignments(
    activeDeal,
    dependant.selectedBenefitIds,
    coverageStatuses,
    {
      relationship: dependant.relationship,
      dateOfBirth: dependant.dateOfBirth,
      marriageDate: dependant.customAttributes['attr-marriage-date'],
    },
  )
  const midtermErrors = midterm.flatMap(({ benefitId, result }) =>
    result.allowed
      ? []
      : result.reasons.map(
          (reason) => `${benefitLabels[benefitId] ?? benefitId}: ${reason}`,
        ),
  )
  const requiredDocument = midterm.find(
    ({ result }) => result.requiresDocument,
  )?.result.documentLabel
  const canProceed =
    !summary.allSlotsConsumed &&
    Boolean(dependant.firstName.trim()) &&
    Boolean(dependant.gender) &&
    Boolean(dependant.dateOfBirth) &&
    Boolean(dependant.relationship) &&
    dependant.selectedBenefitIds.length > 0 &&
    Object.keys(attributeErrors).length === 0 &&
    midtermErrors.length === 0 &&
    (!requiredDocument || Boolean(dependant.supportingDocumentName))

  return (
    <WizardChrome
      title="Add Dependant Details"
      onBack={() => setStep('search-employee')}
      onExit={() => navigate('/endorsements')}
      secondaryLabel="Back"
      onSecondary={() => setStep('search-employee')}
      primaryLabel="Proceed"
      primaryDisabled={!canProceed}
      onPrimary={() => setStep('verify')}
    >
      <FlowStepper
        steps={[...SINGLE_DEPENDANT_STEPS]}
        activeIndex={1}
        bare
      />

      <Employee>
        <strong>
          {employee.firstName} {employee.lastName}
        </strong>
        <span>
          {employee.employeeId} · Flex Deal · {activeDeal.name}
        </span>
      </Employee>

      <Section>
        <SectionTitle>Existing dependants</SectionTitle>
        <ExistingGrid>
          {employee.dependants.map((item) => (
            <Existing key={item.id}>
              <strong>
                {item.firstName} {item.lastName}
              </strong>
              <span>
                {item.relationship} · {item.gender} · {item.dateOfBirth}
              </span>
              <Locked>Already enrolled</Locked>
            </Existing>
          ))}
        </ExistingGrid>
      </Section>

      <Section>
        <SectionTitle>Available family slots</SectionTitle>
        <DependantSlotSelector
          summary={summary}
          selected={dependant.relationship}
          benefitLabels={benefitLabels}
          onSelect={(relationship) =>
            updateDependant(dependant.id, {
              relationship,
              selectedBenefitIds: availableBenefitsForRelationship(
                summary,
                relationship,
              ),
            })
          }
        />
      </Section>

      {!summary.allSlotsConsumed ? (
        <FormCard>
          <SectionTitle>Dependant details</SectionTitle>
          <Grid>
            <Field>
              <Label>First name*</Label>
              <Input
                value={dependant.firstName}
                onChange={(event) =>
                  updateDependant(dependant.id, {
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
                  updateDependant(dependant.id, {
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
                  updateDependant(dependant.id, {
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
                  updateDependant(dependant.id, {
                    dateOfBirth: event.target.value,
                  })
                }
              />
            </Field>
          </Grid>

          {dependant.relationship ? (
            <BenefitBlock>
              <Label>Eligible benefits</Label>
              {availableBenefitIds.map((benefitId) => {
                const checked =
                  dependant.selectedBenefitIds.includes(benefitId)
                return (
                  <BenefitOption key={benefitId}>
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() =>
                        updateDependant(dependant.id, {
                          selectedBenefitIds: checked
                            ? dependant.selectedBenefitIds.filter(
                                (id) => id !== benefitId,
                              )
                            : [...dependant.selectedBenefitIds, benefitId],
                        })
                      }
                    />
                    <span>
                      <strong>
                        {getBenefitConfig(activeDeal, benefitId)?.name ??
                          benefitId}
                      </strong>
                      <small>
                        {coverageStatuses[benefitId] === 'draft'
                          ? 'Draft coverage'
                          : 'Active coverage · midterm rules apply'}
                      </small>
                    </span>
                  </BenefitOption>
                )
              })}
            </BenefitBlock>
          ) : null}

          <DynamicAttributeForm
            fields={fields}
            values={dependant.customAttributes}
            errors={attributeErrors}
            onChange={(attributeId, value) =>
              updateDependant(dependant.id, {
                customAttributes: {
                  ...dependant.customAttributes,
                  [attributeId]: value,
                },
              })
            }
          />

          {midtermErrors.length > 0 ? (
            <ErrorBox>
              {midtermErrors.map((error) => (
                <span key={error}>{error}</span>
              ))}
            </ErrorBox>
          ) : null}

          {requiredDocument ? (
            <Field>
              <Label>{requiredDocument}*</Label>
              <Input
                type="file"
                accept=".pdf,.png,.jpg,.jpeg"
                onChange={(event) =>
                  updateDependant(dependant.id, {
                    supportingDocumentName:
                      event.target.files?.[0]?.name ?? '',
                  })
                }
              />
              {dependant.supportingDocumentName ? (
                <FileName>{dependant.supportingDocumentName}</FileName>
              ) : null}
            </Field>
          ) : null}
        </FormCard>
      ) : null}
    </WizardChrome>
  )
}

const Employee = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 14px 16px;
  border-radius: 10px;
  background: ${({ theme }) => theme.colors.planeGreenLight};
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

const SectionTitle = styled.h2`
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.beyondGrey};
`

const ExistingGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(210px, 1fr));
  gap: 10px;
`

const Existing = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 13px;
  border-radius: 10px;
  background: ${({ theme }) => theme.colors.surface1};
  border: 1px solid ${({ theme }) => theme.colors.defaultBorder};
  font-size: 11px;
  color: ${({ theme }) => theme.colors.textSecondary};

  strong {
    font-size: 13px;
    color: ${({ theme }) => theme.colors.textPrimary};
  }
`

const Locked = styled.span`
  align-self: flex-start;
  padding: 2px 7px;
  border-radius: 999px;
  background: ${({ theme }) => theme.colors.disableFill};
  font-size: 10px;
`

const FormCard = styled.section`
  display: flex;
  flex-direction: column;
  gap: 18px;
  padding: 20px;
  border-radius: 14px;
  background: ${({ theme }) => theme.colors.surface1};
`

const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;

  @media (max-width: 700px) {
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
  min-height: 44px;
  padding: 8px 12px;
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

const BenefitBlock = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`

const BenefitOption = styled.label`
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 12px;
  border-radius: 10px;
  border: 1px solid ${({ theme }) => theme.colors.defaultBorder};

  input {
    margin-top: 2px;
    accent-color: ${({ theme }) => theme.colors.emerald};
  }

  span {
    display: flex;
    flex-direction: column;
    gap: 3px;
  }

  strong {
    font-size: 13px;
    color: ${({ theme }) => theme.colors.textPrimary};
  }

  small {
    color: ${({ theme }) => theme.colors.textSecondary};
  }
`

const ErrorBox = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 12px 14px;
  border-radius: 8px;
  background: #fdecec;
  font-size: 12px;
  color: ${({ theme }) => theme.colors.textError};
`

const FileName = styled.span`
  font-size: 11px;
  color: ${({ theme }) => theme.colors.emerald};
`
