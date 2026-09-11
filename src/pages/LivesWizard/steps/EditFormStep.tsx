import { useMemo, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import styled from 'styled-components'

import { assets } from '@/assets/figma'
import { sampleEmployees } from '@/data/employees'
import {
  parseDateOnly,
  resolveAttributeFields,
  validateMemberCorrection,
} from '@/domain/flex'
import { toDisplayDate } from '@/pages/LivesWizard/autofill/personas'
import { GuidedStepLayout } from '@/pages/LivesWizard/components/GuidedStepLayout'
import { editGuidedSteps } from '@/pages/LivesWizard/guidedFlowSteps'
import { useLivesWizard } from '@/pages/LivesWizard/WizardContext'
import { employeeDetailsPath } from '@/pages/ManageLives/launchWizard'

/** Same calendar-day value even when one side is ISO and the other is DD/MM/YYYY. */
function comparableDate(value: string) {
  const parsed = parseDateOnly(value)
  if (!parsed) return value.trim()
  const month = String(parsed.month).padStart(2, '0')
  const day = String(parsed.day).padStart(2, '0')
  return `${parsed.year}-${month}-${day}`
}

export function EditFormStep() {
  const navigate = useNavigate()
  const proofInputRef = useRef<HTMLInputElement>(null)
  const {
    method,
    employee,
    updateEmployee,
    updateCustomAttribute,
    selectedEmployeeId,
    selectedDependantId,
    activeDeal,
    editProofFileName,
    setPendingCorrection,
    addCorrection,
    setEditProofFileName,
    setStep,
  } = useLivesWizard()

  const member = sampleEmployees.find((e) => e.id === selectedEmployeeId)
  const isDependant = method === 'single-dependant'
  const originalDependant = isDependant
    ? member?.dependants.find((item) => item.id === selectedDependantId)
    : undefined
  const original = originalDependant ?? member
  const benefitIds = isDependant
    ? (originalDependant?.benefitIds ?? [])
    : (member?.coverages
        .filter((coverage) => coverage.kind === 'benefit')
        .map((coverage) => coverage.id) ?? [])

  const additionalFields = useMemo(
    () =>
      !isDependant && activeDeal
        ? resolveAttributeFields({
            deal: activeDeal,
            entity: 'employee',
            existingValues: {
              ...(member?.department
                ? { 'attr-department': member.department }
                : {}),
              ...(member?.dealAttributes ?? {}),
              ...employee.customAttributes,
            },
          }).fields.filter((field) => field.visible)
        : [],
    [
      activeDeal,
      employee.customAttributes,
      isDependant,
      member?.dealAttributes,
      member?.department,
    ],
  )

  const correction =
    activeDeal && original
      ? validateMemberCorrection(activeDeal, {
          memberId: original.id,
          memberName:
            `${employee.firstName} ${employee.lastName}`.trim() || 'Member',
          relationship: isDependant
            ? (originalDependant?.relationship ?? 'Dependant')
            : 'Self',
          original: {
            firstName: original.firstName,
            lastName: original.lastName,
            dateOfBirth: comparableDate(original.dateOfBirth),
            gender: original.gender,
            email: original.email,
            mobile: original.mobile,
          },
          updated: {
            firstName: employee.firstName,
            lastName: employee.lastName,
            dateOfBirth: comparableDate(employee.dateOfBirth),
            gender: employee.gender,
            email: employee.email,
            mobile: employee.mobile,
          },
          benefitIds,
          dealId: activeDeal.id,
          department: member?.department,
          attributes: {
            ...(member?.dealAttributes ?? {}),
            ...employee.customAttributes,
          },
        })
      : null

  const canProceed =
    Boolean(employee.firstName.trim()) &&
    Boolean(employee.gender) &&
    Boolean(employee.dateOfBirth)
  const proofRequired = Boolean(correction?.requiresKyc)
  const hasRequiredProof = !proofRequired || Boolean(editProofFileName)

  return (
    <GuidedStepLayout
      steps={editGuidedSteps(Boolean(correction?.requiresKyc))}
      activeIndex={0}
      onExit={() => navigate(employeeDetailsPath(selectedEmployeeId))}
      title={isDependant ? 'Edit dependant details' : 'Edit employee details'}
      onBack={() => navigate(employeeDetailsPath(selectedEmployeeId))}
      primaryLabel="Verify details"
      primaryDisabled={
        !canProceed ||
        !correction ||
        correction.diffs.length === 0 ||
        !correction.accepted ||
        !hasRequiredProof
      }
      onPrimary={() => {
        if (!correction?.accepted) return
        const correctionWithProof = {
          ...correction,
          proofFileName: correction.requiresKyc
            ? editProofFileName ?? undefined
            : undefined,
        }
        setPendingCorrection(correctionWithProof)
        addCorrection(correctionWithProof)
        setStep('verify')
      }}
    >
      <FormGrid>
        <Field>
          <Label>
            Employee ID<Required>*</Required>
          </Label>
          <Input
            value={employee.employeeId || member?.employeeId || ''}
            readOnly
            $locked
          />
        </Field>

        <Field>
          <Label>
            First Name<Required>*</Required>
          </Label>
          <Input
            value={employee.firstName}
            placeholder="Enter first name"
            onChange={(event) =>
              updateEmployee({ firstName: event.target.value })
            }
          />
        </Field>

        <Field>
          <Label>Last Name</Label>
          <Input
            value={employee.lastName}
            placeholder="Enter last name"
            onChange={(event) =>
              updateEmployee({ lastName: event.target.value })
            }
          />
        </Field>

        <Field>
          <Label>
            Gender<Required>*</Required>
          </Label>
          <ControlWrap>
            <Select
              $placeholder={!employee.gender}
              value={employee.gender}
              onChange={(event) =>
                updateEmployee({
                  gender: event.target.value as typeof employee.gender,
                })
              }
            >
              <option value="">Select gender</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              {employee.gender === 'Other' ? (
                <option value="Other">Other</option>
              ) : null}
            </Select>
            <ControlIcon src={assets.chevronDown} alt="" aria-hidden />
          </ControlWrap>
        </Field>

        <Field>
          <Label>
            Date of Birth<Required>*</Required>
          </Label>
          <ControlWrap>
            <Input
              inputMode="numeric"
              value={toDisplayDate(employee.dateOfBirth)}
              placeholder="Enter Date (DD/MM/YYYY)"
              onChange={(event) =>
                updateEmployee({ dateOfBirth: event.target.value })
              }
            />
            <ControlIcon src={assets.iconCalendar24} alt="" aria-hidden />
          </ControlWrap>
        </Field>

        {!isDependant ? (
          <Field>
            <Label>
              Date of Joining<Required>*</Required>
            </Label>
            <ControlWrap>
              <Input
                inputMode="numeric"
                value={toDisplayDate(employee.dateOfJoining)}
                readOnly
                $locked
                placeholder="Enter Date (DD/MM/YYYY)"
              />
              <ControlIcon src={assets.iconCalendar24} alt="" aria-hidden />
            </ControlWrap>
          </Field>
        ) : null}

        <Field>
          <Label>Work Email</Label>
          <Input
            type="email"
            value={employee.email}
            placeholder="Enter work email"
            onChange={(event) => updateEmployee({ email: event.target.value })}
          />
        </Field>

        <Field>
          <Label>Mobile Number</Label>
          <PhoneControl>
            <PhonePrefix>+91</PhonePrefix>
            <PhoneDivider aria-hidden />
            <PhoneInput
              value={employee.mobile}
              placeholder="Enter phone number"
              onChange={(event) =>
                updateEmployee({ mobile: event.target.value })
              }
            />
          </PhoneControl>
        </Field>
      </FormGrid>

      {additionalFields.length > 0 ? (
        <AdditionalSection>
          <Divider />
          <AdditionalTitle>Additional Details</AdditionalTitle>
          <FormGrid>
            {additionalFields.map(({ definition }) => (
              <Field key={definition.id}>
                <Label>
                  {definition.label}
                  {definition.required ? <Required>*</Required> : null}
                </Label>
                {definition.allowedValues?.length ? (
                  <ControlWrap>
                    <Select
                      $placeholder={!employee.customAttributes[definition.id]}
                      value={employee.customAttributes[definition.id] ?? ''}
                      onChange={(event) =>
                        updateCustomAttribute(definition.id, event.target.value)
                      }
                    >
                      <option value="">Select</option>
                      {definition.allowedValues.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </Select>
                    <ControlIcon src={assets.chevronDown} alt="" aria-hidden />
                  </ControlWrap>
                ) : (
                  <Input
                    value={employee.customAttributes[definition.id] ?? ''}
                    placeholder={`Enter ${definition.label.toLowerCase()}`}
                    onChange={(event) =>
                      updateCustomAttribute(definition.id, event.target.value)
                    }
                  />
                )}
              </Field>
            ))}
          </FormGrid>
        </AdditionalSection>
      ) : null}

      {correction && correction.diffs.length > 0 ? (
        <Changes>
          <ChangesTitle>Changes detected</ChangesTitle>
          {correction.diffs.map((diff) => (
            <ChangeRow key={diff.field}>
              <strong>{diff.label}</strong>
              <span>
                {diff.from || '—'} → {diff.to || '—'}
              </span>
            </ChangeRow>
          ))}
          {correction.requiresKyc ? (
            <KycUpload>
              <KycCopy>
                <strong>Supporting KYC document</strong>
                <span>
                  Upload the official ID proof required for this correction.
                </span>
              </KycCopy>
              <UploadButton
                type="button"
                onClick={() => proofInputRef.current?.click()}
              >
                <img src={assets.mlIconFileUploaded} alt="" aria-hidden />
                {editProofFileName ?? 'Upload document'}
                <input
                  ref={proofInputRef}
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png"
                  hidden
                  onChange={(event) => {
                    const file = event.target.files?.[0]
                    if (file) setEditProofFileName(file.name)
                  }}
                />
              </UploadButton>
              {editProofFileName ? (
                <RemoveProof
                  type="button"
                  onClick={() => {
                    setEditProofFileName(null)
                    if (proofInputRef.current) proofInputRef.current.value = ''
                  }}
                >
                  Remove
                </RemoveProof>
              ) : null}
            </KycUpload>
          ) : null}
        </Changes>
      ) : null}

      {correction?.rejectionReason && correction.diffs.length > 0 ? (
        <Blocked>
          <strong>This change can’t be saved</strong>
          <span>{correction.rejectionReason}</span>
        </Blocked>
      ) : null}
    </GuidedStepLayout>
  )
}

const FormGrid = styled.div`
  display: grid;
  width: 100%;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 16px 24px;

  @media (max-width: ${({ theme }) => theme.breakpoints.lg}) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  @media (max-width: ${({ theme }) => theme.breakpoints.sm}) {
    grid-template-columns: 1fr;
  }
`

const Field = styled.label`
  display: flex;
  min-width: 0;
  flex-direction: column;
  gap: 8px;
`

const Label = styled.span`
  color: ${({ theme }) => theme.colors.textPrimary};
  font-size: 14px;
  font-weight: 500;
  line-height: 20px;
  letter-spacing: 0.2px;
`

const Required = styled.span`
  color: ${({ theme }) => theme.colors.textError};
`

const Input = styled.input<{ $locked?: boolean }>`
  width: 100%;
  height: 48px;
  padding: 12px 20px;
  border: 1px solid ${({ theme }) => theme.colors.defaultBorder};
  border-radius: ${({ theme }) => theme.radii.sm};
  background: ${({ theme, $locked }) =>
    $locked ? theme.colors.disableFill : theme.colors.surface1};
  color: ${({ theme }) => theme.colors.textPrimary};
  font-size: 14px;
  font-weight: 400;
  line-height: 20px;
  letter-spacing: 0.2px;

  &::placeholder {
    color: ${({ theme }) => theme.colors.textSecondary};
  }

  &:focus {
    border-color: ${({ theme }) => theme.colors.emerald};
    outline: none;
  }
`

const ControlWrap = styled.div`
  position: relative;

  ${Input} {
    padding-right: 48px;
  }
`

const Select = styled.select<{ $placeholder: boolean }>`
  width: 100%;
  height: 48px;
  padding: 12px 48px 12px 20px;
  border: 1px solid ${({ theme }) => theme.colors.defaultBorder};
  border-radius: ${({ theme }) => theme.radii.sm};
  background: ${({ theme }) => theme.colors.surface1};
  color: ${({ theme, $placeholder }) =>
    $placeholder ? theme.colors.textSecondary : theme.colors.textPrimary};
  font-size: 14px;
  font-weight: 400;
  line-height: 20px;
  letter-spacing: 0.2px;
  appearance: none;
  cursor: pointer;

  &:focus {
    border-color: ${({ theme }) => theme.colors.emerald};
    outline: none;
  }
`

const ControlIcon = styled.img`
  position: absolute;
  top: 50%;
  right: 12px;
  width: 24px;
  height: 24px;
  transform: translateY(-50%);
  pointer-events: none;
`

const PhoneControl = styled.div`
  display: flex;
  height: 48px;
  align-items: center;
  padding: 0 20px;
  border: 1px solid ${({ theme }) => theme.colors.defaultBorder};
  border-radius: ${({ theme }) => theme.radii.sm};
  background: ${({ theme }) => theme.colors.surface1};

  &:focus-within {
    border-color: ${({ theme }) => theme.colors.emerald};
  }
`

const PhonePrefix = styled.span`
  flex-shrink: 0;
  color: ${({ theme }) => theme.colors.textSecondary};
  font-size: 14px;
  line-height: 20px;
`

const PhoneDivider = styled.span`
  width: 1px;
  height: 20px;
  flex-shrink: 0;
  margin: 0 8px;
  background: ${({ theme }) => theme.colors.defaultBorder};
`

const PhoneInput = styled.input`
  min-width: 0;
  height: 100%;
  flex: 1;
  padding: 0;
  border: 0;
  outline: 0;
  background: transparent;
  color: ${({ theme }) => theme.colors.textPrimary};
  font-size: 14px;
  line-height: 20px;

  &::placeholder {
    color: ${({ theme }) => theme.colors.textSecondary};
  }
`

const AdditionalSection = styled.section`
  display: flex;
  width: 100%;
  flex-direction: column;
  gap: 16px;
`

const Divider = styled.div`
  width: 100%;
  height: 1px;
  background: ${({ theme }) => theme.colors.defaultBorder};
`

const AdditionalTitle = styled.h2`
  margin: 0;
  color: ${({ theme }) => theme.colors.textSecondary};
  font-size: 14px;
  font-weight: 500;
  line-height: 20px;
  letter-spacing: 0.2px;
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

const KycUpload = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto auto;
  align-items: center;
  gap: 12px;
  margin-top: 4px;
  padding: 12px;
  border-radius: 8px;
  background: #fff6e5;
  color: ${({ theme }) => theme.colors.textPrimary};

  @media (max-width: ${({ theme }) => theme.breakpoints.sm}) {
    grid-template-columns: 1fr;
  }
`

const KycCopy = styled.div`
  display: flex;
  min-width: 0;
  flex-direction: column;
  gap: 3px;
  font-size: 12px;

  span {
    color: ${({ theme }) => theme.colors.textSecondary};
  }
`

const UploadButton = styled.button`
  display: inline-flex;
  max-width: 280px;
  align-items: center;
  gap: 8px;
  padding: 9px 12px;
  border: 1px dashed ${({ theme }) => theme.colors.defaultBorder};
  border-radius: 8px;
  overflow: hidden;
  background: ${({ theme }) => theme.colors.surface1};
  color: ${({ theme }) => theme.colors.textPrimary};
  font-family: ${({ theme }) => theme.fontFamily};
  font-size: 12px;
  text-overflow: ellipsis;
  white-space: nowrap;
  cursor: pointer;

  img {
    width: 18px;
    height: 18px;
    flex-shrink: 0;
  }
`

const RemoveProof = styled.button`
  padding: 4px;
  border: 0;
  background: transparent;
  color: ${({ theme }) => theme.colors.textError};
  font-family: ${({ theme }) => theme.fontFamily};
  font-size: 12px;
  cursor: pointer;
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
