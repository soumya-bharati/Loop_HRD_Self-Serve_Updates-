import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import styled from 'styled-components'

import {
  sampleEmployees,
  type DependantFormData,
  type EmployeeFormData,
} from '@/data/employees'
import {
  availableBenefitsForRelationship,
  computeFamilySlots,
  validateMidtermAssignments,
  type FamilyRelationship,
} from '@/domain/flex'
import {
  hasRequiredRelationshipProof,
  isDependantValid,
  nextDependantId,
} from '@/pages/LivesWizard/addEmployees'
import { toDisplayDate } from '@/pages/LivesWizard/autofill/personas'
import { AddDependantModal } from '@/pages/LivesWizard/components/AddDependantModal'
import { DependantSlotSelector } from '@/pages/LivesWizard/components/DependantSlotSelector'
import { GuidedStepLayout } from '@/pages/LivesWizard/components/GuidedStepLayout'
import { DEPENDANT_GUIDED_STEPS } from '@/pages/LivesWizard/guidedFlowSteps'
import { useLivesWizard } from '@/pages/LivesWizard/WizardContext'
import {
  employeeDetailsPath,
  launchWizardPath,
} from '@/pages/ManageLives/launchWizard'

function asFamilyRelationship(value: string): FamilyRelationship | '' {
  if (
    value === 'Spouse' ||
    value === 'Child' ||
    value === 'Parent' ||
    value === 'Parent-in-law' ||
    value === 'Sibling' ||
    value === 'Other'
  ) {
    return value
  }
  return ''
}

export function ExistingEmployeeDependantStep() {
  const navigate = useNavigate()
  const {
    activeDeal,
    organisationEntityId,
    selectedEmployeeId,
    dependants,
    setDependants,
    completeFlow,
  } = useLivesWizard()
  const [modal, setModal] = useState<{
    relationship: FamilyRelationship
    dependant?: DependantFormData
  } | null>(null)

  const employee = sampleEmployees.find(
    (item) => item.id === selectedEmployeeId,
  )

  const selectedEmployeeBenefitIds = useMemo(() => {
    const fromEmployee =
      employee?.coverages
        .filter((coverage) => coverage.kind === 'benefit')
        .map((coverage) => coverage.id) ?? []
    const fromDependants = (employee?.dependants ?? []).flatMap(
      (dependant) => dependant.benefitIds ?? [],
    )
    return [...new Set([...fromEmployee, ...fromDependants])]
  }, [employee])
  const coverageStatuses = useMemo(
    () =>
      Object.fromEntries(
        employee?.coverages
          .filter((coverage) => coverage.kind === 'benefit')
          .map((coverage) => [coverage.id, coverage.status ?? 'active']) ?? [],
      ) as Record<string, 'active' | 'draft'>,
    [employee],
  )

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

  const enrolledDependants = useMemo<DependantFormData[]>(
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

  const addedDependants = useMemo(
    () =>
      dependants.filter(
        (item) => item.firstName.trim() && Boolean(item.relationship),
      ),
    [dependants],
  )

  const familyMembers = useMemo(
    () => [...enrolledDependants, ...addedDependants],
    [addedDependants, enrolledDependants],
  )

  const summary = useMemo(() => {
    if (!activeDeal || !employee) {
      return {
        dealId: '',
        slots: [],
        addableRelationships: [] as FamilyRelationship[],
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

  const midtermErrors = useMemo(() => {
    if (!activeDeal) return []
    return addedDependants.flatMap((dependant) => {
      const relationship = asFamilyRelationship(dependant.relationship)
      if (relationship === 'Parent' || relationship === 'Parent-in-law') {
        return []
      }
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
      return midterm.flatMap(({ benefitId, result }) =>
        result.allowed
          ? []
          : result.reasons.map(
              (reason) =>
                `${benefitLabels[benefitId] ?? benefitId}: ${reason}`,
            ),
      )
    })
  }, [activeDeal, addedDependants, benefitLabels, coverageStatuses])

  if (!employee || !activeDeal || !employeeForm) return null

  const canProceed =
    addedDependants.length > 0 &&
    addedDependants.every(isDependantValid) &&
    addedDependants.every(hasRequiredRelationshipProof) &&
    midtermErrors.length === 0

  function saveDependant(dependant: DependantFormData) {
    const relationship = asFamilyRelationship(
      modal?.relationship ?? dependant.relationship,
    )
    if (!relationship) return
    const withCovers = {
      ...dependant,
      relationship,
      id: modal?.dependant?.id ?? nextDependantId(),
      selectedBenefitIds: availableBenefitsForRelationship(
        summary,
        relationship,
      ),
    }
    const filled = dependants.filter(
      (item) => item.firstName.trim() && Boolean(item.relationship),
    )
    const exists = filled.some((item) => item.id === withCovers.id)
    setDependants(
      exists
        ? filled.map((item) => (item.id === withCovers.id ? withCovers : item))
        : [...filled, withCovers],
    )
    setModal(null)
  }

  const dealId = activeDeal.id
  const employeeRecordId = employee.id

  function editEmployee() {
    navigate(
      launchWizardPath({
        action: 'edit',
        method: 'single',
        entity: organisationEntityId,
        deal: dealId,
        employee: employeeRecordId,
      }),
    )
  }

  function editDependant(dependant: DependantFormData) {
    const enrolled = enrolledDependants.some(
      (item) => item.id === dependant.id,
    )
    if (enrolled) {
      navigate(
        launchWizardPath({
          action: 'edit',
          method: 'single-dependant',
          entity: organisationEntityId,
          deal: dealId,
          employee: employeeRecordId,
          dependant: dependant.id,
        }),
      )
      return
    }

    const relationship = asFamilyRelationship(dependant.relationship)
    if (relationship) setModal({ relationship, dependant })
  }

  return (
    <GuidedStepLayout
      steps={DEPENDANT_GUIDED_STEPS}
      activeIndex={0}
      onExit={() => navigate(employeeDetailsPath(selectedEmployeeId))}
      title="Manage Employee Family Details"
      primaryLabel={addedDependants.length > 0 ? 'Save' : undefined}
      primaryDisabled={!canProceed}
      onPrimary={addedDependants.length > 0 ? completeFlow : undefined}
    >
      <DependantSlotSelector
        summary={summary}
        benefitLabels={benefitLabels}
        employee={employeeForm}
        employeeBenefitIds={selectedEmployeeBenefitIds}
        dependants={familyMembers}
        showCovers={false}
        addSlotLabel="Add Details for"
        onEditSelf={editEmployee}
        onAddSlot={(relationship) => setModal({ relationship })}
        onEditDependant={editDependant}
      />

      {midtermErrors.length > 0 ? (
        <ErrorBox>
          {midtermErrors.map((error) => (
            <span key={error}>{error}</span>
          ))}
        </ErrorBox>
      ) : null}

      <AddDependantModal
        open={Boolean(modal)}
        relationship={modal?.relationship ?? 'Spouse'}
        initial={modal?.dependant ?? null}
        requireRelationshipProof
        onClose={() => setModal(null)}
        onSave={saveDependant}
      />
    </GuidedStepLayout>
  )
}

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
