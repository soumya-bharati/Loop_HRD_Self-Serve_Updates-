import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import styled from 'styled-components'

import { assets } from '@/assets/figma'
import {
  sampleEmployees,
  type DependantFormData,
  type EmployeeFormData,
} from '@/data/employees'
import { isValidDateOfLeaving } from '@/data/flexDeal'
import { computeFamilySlots } from '@/domain/flex'
import { toDisplayDate } from '@/pages/LivesWizard/autofill/personas'
import { DependantSlotSelector } from '@/pages/LivesWizard/components/DependantSlotSelector'
import { GuidedStepLayout } from '@/pages/LivesWizard/components/GuidedStepLayout'
import { DELETE_GUIDED_STEPS } from '@/pages/LivesWizard/guidedFlowSteps'
import { useLivesWizard } from '@/pages/LivesWizard/WizardContext'
import { employeeDetailsPath } from '@/pages/ManageLives/launchWizard'

export function DateOfLeavingStep() {
  const navigate = useNavigate()
  const {
    activeDeal,
    selectedEmployeeId,
    dateOfLeaving,
    setDateOfLeaving,
    reasonOfLeaving,
    setReasonOfLeaving,
    setStep,
  } = useLivesWizard()

  const employee = sampleEmployees.find((e) => e.id === selectedEmployeeId)
  const valid = isValidDateOfLeaving(dateOfLeaving)

  const employeeForm = useMemo<EmployeeFormData | null>(() => {
    if (!employee) return null
    return {
      employeeId: employee.employeeId,
      firstName: employee.firstName,
      lastName: employee.lastName,
      gender: employee.gender,
      dateOfBirth: toDisplayDate(employee.dateOfBirth),
      relationship: 'Self',
      mobile: employee.mobile,
      email: employee.email,
      dateOfJoining: toDisplayDate(employee.dateOfJoining),
      customAttributes: {
        ...(employee.department
          ? { 'attr-department': employee.department }
          : {}),
        ...(employee.dealAttributes ?? {}),
      },
    }
  }, [employee])

  const familyMembers = useMemo<DependantFormData[]>(
    () =>
      (employee?.dependants ?? []).map((item) => ({
        id: item.id,
        firstName: item.firstName,
        lastName: item.lastName,
        gender: item.gender,
        dateOfBirth: toDisplayDate(item.dateOfBirth),
        relationship: item.relationship,
        mobile: item.mobile,
        email: item.email,
        selectedBenefitIds: item.benefitIds ?? [],
        customAttributes: {},
        supportingDocumentName: '',
      })),
    [employee],
  )

  const selectedEmployeeBenefitIds = useMemo(
    () =>
      employee?.coverages
        .filter((coverage) => coverage.kind === 'benefit')
        .map((coverage) => coverage.id) ?? [],
    [employee],
  )

  const summary = useMemo(() => {
    if (!activeDeal || !employee) {
      return {
        dealId: '',
        slots: [],
        addableRelationships: [],
        allSlotsConsumed: true,
      }
    }
    return computeFamilySlots({
      deal: activeDeal,
      selectedBenefitIds: selectedEmployeeBenefitIds,
      existingDependants: familyMembers.map((item) => ({
        id: item.id,
        relationship: item.relationship,
        dateOfBirth: item.dateOfBirth,
        benefitIds: item.selectedBenefitIds,
      })),
    })
  }, [activeDeal, employee, familyMembers, selectedEmployeeBenefitIds])

  const benefitLabels = useMemo(
    () =>
      Object.fromEntries(
        (activeDeal?.benefits ?? []).map((benefit) => [benefit.id, benefit.name]),
      ),
    [activeDeal],
  )

  return (
    <GuidedStepLayout
      steps={DELETE_GUIDED_STEPS}
      activeIndex={0}
      onExit={() => navigate(employeeDetailsPath(selectedEmployeeId))}
      title="When is this employee leaving?"
      primaryLabel="Continue"
      primaryDisabled={!valid}
      onPrimary={() => setStep('offboard-coverage')}
    >
      <Lead>
        These lives will be off-boarded together on the leaving date.
      </Lead>

      {employeeForm ? (
        <DependantSlotSelector
          summary={summary}
          benefitLabels={benefitLabels}
          employee={employeeForm}
          employeeBenefitIds={selectedEmployeeBenefitIds}
          dependants={familyMembers}
          showCovers={false}
          hideEmptySlots
        />
      ) : null}

      <Fields>
        <Field>
          <Label>
            Date of leaving<Required>*</Required>
          </Label>
          <ControlWrap>
            <Input
              inputMode="numeric"
              value={toDisplayDate(dateOfLeaving)}
              placeholder="Enter Date (DD/MM/YYYY)"
              onChange={(event) => setDateOfLeaving(event.target.value)}
            />
            <ControlIcon src={assets.iconCalendar24} alt="" aria-hidden />
          </ControlWrap>
          <Hint>Only dates from today back to T-45 are allowed.</Hint>
          {dateOfLeaving && !valid ? (
            <ErrorText>
              Date must not be in the future and must fall within the last 45
              days.
            </ErrorText>
          ) : null}
        </Field>
        <Field>
          <Label>Reason of leaving</Label>
          <Input
            $plain
            value={reasonOfLeaving}
            placeholder="Enter reason (optional)"
            onChange={(event) => setReasonOfLeaving(event.target.value)}
          />
        </Field>
      </Fields>
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

const Fields = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 360px));
  gap: 16px 24px;

  @media (max-width: ${({ theme }) => theme.breakpoints.md}) {
    grid-template-columns: minmax(0, 360px);
  }
`

const Field = styled.label`
  display: flex;
  max-width: 360px;
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

const ControlWrap = styled.div`
  position: relative;
`

const Input = styled.input<{ $plain?: boolean }>`
  width: 100%;
  height: 48px;
  padding: ${({ $plain }) => ($plain ? '12px 20px' : '12px 48px 12px 20px')};
  border: 1px solid ${({ theme }) => theme.colors.defaultBorder};
  border-radius: ${({ theme }) => theme.radii.sm};
  background: ${({ theme }) => theme.colors.surface1};
  color: ${({ theme }) => theme.colors.textPrimary};
  font-size: 14px;
  font-weight: 400;
  line-height: 20px;
  letter-spacing: 0.2px;
  box-sizing: border-box;

  &::placeholder {
    color: ${({ theme }) => theme.colors.textSecondary};
  }

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

const Hint = styled.span`
  font-size: 12px;
  color: ${({ theme }) => theme.colors.textSecondary};
`

const ErrorText = styled.span`
  font-size: 12px;
  color: ${({ theme }) => theme.colors.textError};
`
