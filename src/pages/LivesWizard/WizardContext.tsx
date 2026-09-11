import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react'

import {
  emptyDependantForm,
  emptyEmployeeForm,
  sampleEmployees,
  type DependantFormData,
  type EmployeeFormData,
} from '@/data/employees'
import {
  buildCostEstimate,
  buildMembersCostEstimate,
  buildRefundEstimate,
  buildSingleCostEstimate,
  emptyEnrolmentSettings,
  flexDeal,
  getOrganisationEntity,
  getPlanById,
  resolveSelectionBenefitIds,
  sampleBulkDeleteRows,
  sampleBulkRows,
  type BulkMemberRow,
  type CostEstimate,
  type EnrolmentSettingsState,
  type RefundEstimate,
} from '@/data/flexDeal'
import {
  buildRefundEstimate as buildConfiguredRefundEstimate,
  buildPolicyImpact,
  getDealConfig,
  resolveInitialDealId,
  type FlexDealConfig,
  type MemberCorrection,
} from '@/domain/flex'
import {
  emptyAddEmployeeMember,
  flattenMembers,
  nextDependantId,
  nextMemberId,
  type AddEmployeeMember,
  type IntakeMode,
} from '@/pages/LivesWizard/addEmployees'
import { toDisplayDate } from '@/pages/LivesWizard/autofill/personas'
import { useProtoConfig } from '@/proto/ProtoConfigContext'

export type LifeAction = 'add' | 'edit' | 'delete'
export type LifeMethod = 'bulk' | 'single' | 'single-dependant'

export type WizardStep =
  | 'selection'
  | 'employee-details'
  | 'user-details'
  | 'search-employee'
  | 'dependant-details'
  | 'dependant-plan'
  | 'benefits'
  | 'family'
  | 'verify'
  | 'endo-costs'
  | 'enrolment'
  | 'upload'
  | 'bulk-validate'
  | 'midterm-proof'
  | 'bulk-review'
  | 'processing'
  | 'date-of-leaving'
  | 'offboard-coverage'
  | 'delete-summary'
  | 'edit-form'
  | 'edit-proof'
  | 'correction-batch'
  | 'success'

export type BulkAssignMode = 'rules' | 'sheet' | null
export type BenefitsAssignMode = 'common' | 'individual'

export type BulkDeleteRow = (typeof sampleBulkDeleteRows)[number]

interface LivesWizardContextValue {
  action: LifeAction
  step: WizardStep
  setStep: (step: WizardStep) => void
  method: LifeMethod
  setMethod: (method: LifeMethod) => void
  organisationEntityId: string
  organisationEntityName: string

  employee: EmployeeFormData
  setEmployee: (value: EmployeeFormData) => void
  updateEmployee: (patch: Partial<EmployeeFormData>) => void
  updateCustomAttribute: (id: string, value: string) => void

  addDependants: boolean | null
  setAddDependants: (value: boolean | null) => void
  dependants: DependantFormData[]
  setDependants: (value: DependantFormData[]) => void
  updateDependant: (id: string, patch: Partial<DependantFormData>) => void
  addDependant: () => void
  removeDependant: (id: string) => void
  maxDependants: number

  selectedEmployeeId: string | null
  setSelectedEmployeeId: (id: string | null) => void
  selectedDependantId: string | null
  setSelectedDependantId: (id: string | null) => void
  selectedDependantPlanId: string | null
  setSelectedDependantPlanId: (id: string | null) => void

  selectedPolicyIds: string[]
  togglePolicy: (policyId: string) => void
  selectedPolicyTiers: Record<string, string>
  setPolicyTier: (policyId: string, tierId: string) => void
  selectedPolicyFamilyStructures: Record<string, string>
  setPolicyFamilyStructure: (policyId: string, structureId: string) => void
  purchaseGroupChoices: Record<string, string[]>
  togglePurchaseGroupOption: (
    dealId: string,
    groupId: string,
    optionId: string,
    mode: 'single' | 'multi',
  ) => void
  setPurchaseGroupChoice: (
    dealId: string,
    groupId: string,
    optionId: string | null,
  ) => void
  activeDealId: string | null
  activeDeal: FlexDealConfig | null
  selectDeal: (dealId: string) => void
  pruneIneligibleSelections: (eligibility: {
    policies: Record<string, { eligible: boolean }>
    options: Record<string, { eligible: boolean }>
  }) => void

  /** Add employee(s) employee → benefits → dependants → review flow */
  intakeMode: IntakeMode
  setIntakeMode: (mode: IntakeMode) => void
  addEmployees: AddEmployeeMember[]
  setAddEmployees: (members: AddEmployeeMember[]) => void
  updateAddEmployee: (
    memberId: string,
    patch: Partial<Omit<AddEmployeeMember, 'id'>>,
  ) => void
  completeAddEmployeeAssignment: (
    memberId: string,
    assignment: Pick<
      AddEmployeeMember,
      'planId'
        | 'purchaseGroupSelections'
        | 'policySlabIds'
        | 'assignmentSource'
        | 'selectedBenefitIds'
        | 'dependants'
    >,
  ) => void
  updateAddEmployeeFields: (
    memberId: string,
    patch: Partial<EmployeeFormData>,
  ) => void
  updateAddEmployeeCustomAttribute: (
    memberId: string,
    attrId: string,
    value: string,
  ) => void
  addAddEmployee: () => void
  removeAddEmployee: (memberId: string) => void
  /** Saved employee cards reopened for editing, so their form is on screen. */
  editingAddEmployeeIds: string[]
  setAddEmployeeEditing: (memberId: string, editing: boolean) => void
  addAddEmployeeDependant: (memberId: string) => void
  updateAddEmployeeDependant: (
    memberId: string,
    dependantId: string,
    patch: Partial<DependantFormData>,
  ) => void
  removeAddEmployeeDependant: (memberId: string, dependantId: string) => void
  toggleCoverForEligibleLives: (
    coverId: string,
    enabled: boolean,
    lifeIds: string[],
  ) => void
  setLifeCoverIds: (lifeId: string, coverIds: string[]) => void
  benefitsAssignMode: BenefitsAssignMode
  setBenefitsAssignMode: (mode: BenefitsAssignMode) => void

  fileName: string | null
  setFileName: (name: string | null) => void
  templateDownloaded: boolean
  setTemplateDownloaded: (value: boolean) => void
  deleteConfirmed: boolean
  setDeleteConfirmed: (value: boolean) => void

  rows: BulkMemberRow[]
  updateRowPlan: (rowId: string, planId: string) => void
  /** Prototype: clear a validation error after inline field edit. */
  resolveRowValidation: (rowId: string, fieldValue?: string) => void
  bulkAssignMode: BulkAssignMode
  setBulkAssignMode: (mode: BulkAssignMode) => void
  bulkFilter: string
  setBulkFilter: (value: string) => void
  midtermProofUploaded: boolean
  setMidtermProofUploaded: (value: boolean) => void
  processingProgress: number
  startProcessing: () => void

  dateOfLeaving: string
  setDateOfLeaving: (value: string) => void
  reasonOfLeaving: string
  setReasonOfLeaving: (value: string) => void
  bulkDeleteRows: BulkDeleteRow[]

  editProofFileName: string | null
  setEditProofFileName: (name: string | null) => void
  editBlocked: boolean
  setEditBlocked: (value: boolean) => void
  simulateEditSaveFailure: boolean
  setSimulateEditSaveFailure: (value: boolean) => void
  pendingCorrection: MemberCorrection | null
  setPendingCorrection: (value: MemberCorrection | null) => void
  correctionBatch: MemberCorrection[]
  addCorrection: (value: MemberCorrection) => void
  addPendingCorrection: () => void
  removeCorrection: (memberId: string) => void

  enrolment: EnrolmentSettingsState
  setEnrolment: (value: EnrolmentSettingsState) => void

  costEstimate: CostEstimate
  refundEstimate: RefundEstimate | null
  resolvedAssignment: ReturnType<typeof resolveSelectionBenefitIds>

  /** Increments whenever the demo autofill widget writes to the wizard. */
  autofillNonce: number
  signalAutofill: () => void

  completeFlow: () => void
  /** @deprecated use completeFlow */
  completeAddition: () => void
  resetWizard: () => void
}

const LivesWizardContext = createContext<LivesWizardContextValue | null>(null)

function initialStepFor(action: LifeAction, method: LifeMethod): WizardStep {
  if (action === 'add') {
    if (method === 'single') return 'user-details'
    if (method === 'single-dependant') return 'search-employee'
    return 'upload'
  }
  if (action === 'delete') {
    if (method === 'bulk') return 'upload'
    return 'search-employee'
  }
  // edit
  return 'search-employee'
}

function hydrateFromRoster(
  employeeKey: string | null | undefined,
  dependantKey: string | null | undefined,
  action: LifeAction,
  method: LifeMethod,
) {
  if (!employeeKey) return null
  const emp = sampleEmployees.find(
    (item) => item.id === employeeKey || item.employeeId === employeeKey,
  )
  if (!emp) return null
  const dependant = dependantKey
    ? emp.dependants.find((item) => item.id === dependantKey)
    : undefined

  let step = initialStepFor(action, method)
  if (action === 'add' && method === 'single-dependant') step = 'dependant-details'
  if (action === 'delete' && method === 'single') step = 'date-of-leaving'
  if (action === 'edit' && method === 'single') step = 'edit-form'
  if (action === 'edit' && method === 'single-dependant' && dependant) {
    step = 'edit-form'
  }

  const employeeForm =
    dependant && action === 'edit' && method === 'single-dependant'
      ? {
          ...emptyEmployeeForm(),
          employeeId: emp.employeeId,
          firstName: dependant.firstName,
          lastName: dependant.lastName,
          gender: dependant.gender,
          dateOfBirth: toDisplayDate(dependant.dateOfBirth),
          email: dependant.email,
          mobile: dependant.mobile,
          relationship: dependant.relationship,
        }
      : {
          ...emptyEmployeeForm(),
          employeeId: emp.employeeId,
          firstName: emp.firstName,
          lastName: emp.lastName,
          gender: emp.gender,
          dateOfBirth: toDisplayDate(emp.dateOfBirth),
          email: emp.email,
          mobile: emp.mobile,
          dateOfJoining: toDisplayDate(emp.dateOfJoining),
          relationship: 'Self' as const,
          customAttributes: {
            ...(emp.department ? { 'attr-department': emp.department } : {}),
            ...(emp.dealAttributes ?? {}),
          },
        }

  return {
    emp,
    step,
    employeeForm,
    dependants:
      action === 'add' && method === 'single-dependant'
        ? [emptyDependantForm('dep-1')]
        : [],
    dependantId: dependant?.id ?? null,
  }
}

function applyPlanToRow(row: BulkMemberRow, planId: string): BulkMemberRow {
  const planBenefits =
    planId === 'plan-parental'
      ? row.relationship === 'Parent'
        ? ['ben-gmc-parental']
        : ['ben-gmc', 'ben-gpa', 'ben-gmc-parental']
      : ['ben-gmc', 'ben-gpa']

  const payroll =
    planId === 'plan-parental'
      ? row.relationship === 'Parent'
        ? 1600
        : 2100
      : row.relationship === 'Spouse'
        ? 980
        : 1250

  return {
    ...row,
    assignedPlanId: planId,
    benefitIds: planBenefits,
    purchaseGroupSelections: {
      ...row.purchaseGroupSelections,
      'pg-core': [
        planId === 'plan-parental' ? 'opt-parental' : 'opt-standard',
      ],
    },
    assignmentSource: 'manual',
    needsManualAssignment: false,
    validationError: undefined,
    validationField: undefined,
    status: 'pass',
    payrollDelta: payroll,
  }
}

let dependantSeq = 1

export function LivesWizardProvider({
  action,
  initialMethod,
  organisationEntityId: organisationEntityIdProp,
  initialDealId,
  initialEmployeeId,
  initialDependantId,
  initialLeavingDate,
  initialFileName,
  initialStepOverride,
  children,
}: {
  action: LifeAction
  initialMethod: LifeMethod
  organisationEntityId?: string | null
  initialDealId?: string | null
  initialEmployeeId?: string | null
  initialDependantId?: string | null
  initialLeavingDate?: string | null
  /** Sheet already attached upstream — skip the wizard's own upload step. */
  initialFileName?: string | null
  /** Jump past bulk-validate when results were already reviewed upstream. */
  initialStepOverride?: WizardStep | null
  children: ReactNode
}) {
  const { entities: protoEntities, deals: protoDeals } = useProtoConfig()
  const hydrated = hydrateFromRoster(
    initialEmployeeId,
    initialDependantId,
    action,
    initialMethod,
  )
  const skipUpload = Boolean(initialFileName) && initialMethod === 'bulk'
  const initialStep =
    initialStepOverride ??
    (skipUpload
      ? 'bulk-validate'
      : (hydrated?.step ?? initialStepFor(action, initialMethod)))
  const organisationEntity = getOrganisationEntity(
    organisationEntityIdProp,
    protoEntities,
  )
  const organisationEntityId = organisationEntity.id
  const organisationEntityName = organisationEntity.name

  const [step, setStep] = useState<WizardStep>(initialStep)
  const [method, setMethod] = useState<LifeMethod>(initialMethod)
  const [employee, setEmployee] = useState<EmployeeFormData>(
    () => hydrated?.employeeForm ?? emptyEmployeeForm(),
  )
  const [addDependants, setAddDependants] = useState<boolean | null>(null)
  const [dependants, setDependants] = useState<DependantFormData[]>(
    () => hydrated?.dependants ?? [],
  )
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string | null>(
    hydrated?.emp.id ?? null,
  )
  const [selectedDependantId, setSelectedDependantId] = useState<string | null>(
    hydrated?.dependantId ?? null,
  )
  const [selectedDependantPlanId, setSelectedDependantPlanId] = useState<
    string | null
  >(null)
  const [selectedPolicyIds, setSelectedPolicyIds] = useState<string[]>([])
  const [selectedPolicyTiers, setSelectedPolicyTiers] = useState<
    Record<string, string>
  >({})
  const [selectedPolicyFamilyStructures, setSelectedPolicyFamilyStructures] =
    useState<Record<string, string>>({})
  const [purchaseGroupChoices, setPurchaseGroupChoices] = useState<
    Record<string, string[]>
  >({})
  const [activeDealId, setActiveDealId] = useState<string | null>(() => {
    if (hydrated?.emp.dealId && getDealConfig(hydrated.emp.dealId, protoDeals)) {
      return hydrated.emp.dealId
    }
    if (initialDealId && getDealConfig(initialDealId, protoDeals)) {
      return initialDealId
    }
    return resolveInitialDealId(protoDeals)
  })
  const [fileName, setFileName] = useState<string | null>(
    initialFileName ?? null,
  )
  const [templateDownloaded, setTemplateDownloaded] = useState(skipUpload)
  const [deleteConfirmed, setDeleteConfirmed] = useState(skipUpload)
  const [rows, setRows] = useState<BulkMemberRow[]>(() =>
    sampleBulkRows.map((r) => ({ ...r })),
  )
  const [bulkAssignMode, setBulkAssignMode] = useState<BulkAssignMode>(null)
  const [bulkFilter, setBulkFilter] = useState('all')
  const [midtermProofUploaded, setMidtermProofUploaded] = useState(false)
  const [processingProgress, setProcessingProgress] = useState(0)
  const [dateOfLeaving, setDateOfLeaving] = useState(initialLeavingDate ?? '')
  const [reasonOfLeaving, setReasonOfLeaving] = useState('')
  const [bulkDeleteRows] = useState(() =>
    sampleBulkDeleteRows.map((r) => ({ ...r })),
  )
  const [editProofFileName, setEditProofFileName] = useState<string | null>(
    null,
  )
  const [editBlocked, setEditBlocked] = useState(false)
  const [simulateEditSaveFailure, setSimulateEditSaveFailure] = useState(false)
  const [pendingCorrection, setPendingCorrection] =
    useState<MemberCorrection | null>(null)
  const [correctionBatch, setCorrectionBatch] = useState<MemberCorrection[]>([])
  const [enrolment, setEnrolment] = useState<EnrolmentSettingsState>(
    emptyEnrolmentSettings,
  )
  const [intakeMode, setIntakeMode] = useState<IntakeMode>('form')
  const [addEmployees, setAddEmployees] = useState<AddEmployeeMember[]>(() => [
    emptyAddEmployeeMember(),
  ])
  const [editingAddEmployeeIds, setEditingAddEmployeeIds] = useState<string[]>(
    [],
  )
  const [benefitsAssignMode, setBenefitsAssignMode] =
    useState<BenefitsAssignMode>('common')
  const [autofillNonce, setAutofillNonce] = useState(0)

  const signalAutofill = useCallback(() => {
    setAutofillNonce((current) => current + 1)
  }, [])

  const activeDeal = useMemo(
    () => (activeDealId ? getDealConfig(activeDealId, protoDeals) ?? null : null),
    [activeDealId, protoDeals],
  )

  const selectDeal = useCallback((dealId: string) => {
    setActiveDealId((current) => {
      if (current === dealId) return current
      setSelectedPolicyIds([])
      setSelectedPolicyTiers({})
      setSelectedPolicyFamilyStructures({})
      setPurchaseGroupChoices({})
      setDependants((items) =>
        items.map((item) => ({ ...item, selectedBenefitIds: [] })),
      )
      setAddEmployees((members) =>
        members.map((member) => ({
          ...member,
          selectedBenefitIds: [],
          employee: {
            ...member.employee,
            customAttributes: {},
          },
          dependants: member.dependants.map((dependant) => ({
            ...dependant,
            selectedBenefitIds: [],
            customAttributes: {},
          })),
        })),
      )
      return dealId
    })
  }, [])

  const addCorrection = useCallback((correction: MemberCorrection) => {
    if (!correction.accepted) return
    setCorrectionBatch((current) => [
      ...current.filter((item) => item.memberId !== correction.memberId),
      correction,
    ])
  }, [])

  const addPendingCorrection = useCallback(() => {
    setPendingCorrection((pending) => {
      if (!pending?.accepted) return pending
      if (pending.requiresKyc && !editProofFileName) return pending
      addCorrection({
        ...pending,
        proofFileName: pending.requiresKyc
          ? editProofFileName ?? undefined
          : undefined,
      })
      return null
    })
  }, [addCorrection, editProofFileName])

  const removeCorrection = useCallback((memberId: string) => {
    setCorrectionBatch((current) =>
      current.filter((item) => item.memberId !== memberId),
    )
  }, [])

  const updateEmployee = useCallback((patch: Partial<EmployeeFormData>) => {
    setEmployee((current) => ({ ...current, ...patch }))
  }, [])

  const updateCustomAttribute = useCallback((id: string, value: string) => {
    setEmployee((current) => ({
      ...current,
      customAttributes: { ...current.customAttributes, [id]: value },
    }))
  }, [])

  const updateDependant = useCallback(
    (id: string, patch: Partial<DependantFormData>) => {
      setDependants((current) =>
        current.map((d) => (d.id === id ? { ...d, ...patch } : d)),
      )
    },
    [],
  )

  const addDependant = useCallback(() => {
    const id = `dep-${dependantSeq++}`
    setDependants((current) => [...current, emptyDependantForm(id)])
  }, [])

  const removeDependant = useCallback((id: string) => {
    setDependants((current) => current.filter((d) => d.id !== id))
  }, [])

  const updateAddEmployee = useCallback(
    (memberId: string, patch: Partial<Omit<AddEmployeeMember, 'id'>>) => {
      setAddEmployees((current) =>
        current.map((m) => (m.id === memberId ? { ...m, ...patch } : m)),
      )
    },
    [],
  )

  const completeAddEmployeeAssignment = useCallback(
    (
      memberId: string,
      assignment: Pick<
        AddEmployeeMember,
        'planId'
        | 'purchaseGroupSelections'
        | 'policySlabIds'
        | 'assignmentSource'
        | 'selectedBenefitIds'
        | 'dependants'
      >,
    ) => {
      setAddEmployees((current) =>
        current.map((member) =>
          member.id === memberId
            ? { ...member, ...assignment, assignmentCompleted: true }
            : member,
        ),
      )
    },
    [],
  )

  const updateAddEmployeeFields = useCallback(
    (memberId: string, patch: Partial<EmployeeFormData>) => {
      setAddEmployees((current) =>
        current.map((m) =>
          m.id === memberId
            ? { ...m, employee: { ...m.employee, ...patch } }
            : m,
        ),
      )
    },
    [],
  )

  const updateAddEmployeeCustomAttribute = useCallback(
    (memberId: string, attrId: string, value: string) => {
      setAddEmployees((current) =>
        current.map((m) =>
          m.id === memberId
            ? {
                ...m,
                employee: {
                  ...m.employee,
                  customAttributes: {
                    ...m.employee.customAttributes,
                    [attrId]: value,
                  },
                },
              }
            : m,
        ),
      )
    },
    [],
  )

  const addAddEmployee = useCallback(() => {
    setAddEmployees((current) => [
      ...current,
      emptyAddEmployeeMember(nextMemberId()),
    ])
  }, [])

  const removeAddEmployee = useCallback((memberId: string) => {
    setAddEmployees((current) => {
      const next = current.filter((m) => m.id !== memberId)
      return next.length > 0 ? next : [emptyAddEmployeeMember()]
    })
    setEditingAddEmployeeIds((current) =>
      current.filter((id) => id !== memberId),
    )
  }, [])

  const setAddEmployeeEditing = useCallback(
    (memberId: string, editing: boolean) => {
      setEditingAddEmployeeIds((current) => {
        const without = current.filter((id) => id !== memberId)
        return editing ? [...without, memberId] : without
      })
    },
    [],
  )

  const addAddEmployeeDependant = useCallback((memberId: string) => {
    const dep = emptyDependantForm(nextDependantId())
    setAddEmployees((current) =>
      current.map((m) =>
        m.id === memberId
          ? { ...m, dependants: [...m.dependants, dep] }
          : m,
      ),
    )
  }, [])

  const updateAddEmployeeDependant = useCallback(
    (
      memberId: string,
      dependantId: string,
      patch: Partial<DependantFormData>,
    ) => {
      setAddEmployees((current) =>
        current.map((m) =>
          m.id === memberId
            ? {
                ...m,
                dependants: m.dependants.map((d) =>
                  d.id === dependantId ? { ...d, ...patch } : d,
                ),
              }
            : m,
        ),
      )
    },
    [],
  )

  const removeAddEmployeeDependant = useCallback(
    (memberId: string, dependantId: string) => {
      setAddEmployees((current) =>
        current.map((m) =>
          m.id === memberId
            ? {
                ...m,
                dependants: m.dependants.filter((d) => d.id !== dependantId),
              }
            : m,
        ),
      )
    },
    [],
  )

  const setLifeCoverIds = useCallback((lifeId: string, coverIds: string[]) => {
    setAddEmployees((current) =>
      current.map((m) => {
        if (m.id === lifeId) {
          return { ...m, selectedBenefitIds: coverIds }
        }
        const dep = m.dependants.find((d) => d.id === lifeId)
        if (!dep) return m
        return {
          ...m,
          dependants: m.dependants.map((d) =>
            d.id === lifeId ? { ...d, selectedBenefitIds: coverIds } : d,
          ),
        }
      }),
    )
  }, [])

  const toggleCoverForEligibleLives = useCallback(
    (coverId: string, enabled: boolean, lifeIds: string[]) => {
      const lifeSet = new Set(lifeIds)
      setAddEmployees((current) => {
        const next = current.map((m) => {
          const touchEmp = lifeSet.has(m.id)
          const empIds = !touchEmp
            ? m.selectedBenefitIds
            : enabled
              ? m.selectedBenefitIds.includes(coverId)
                ? m.selectedBenefitIds
                : [...m.selectedBenefitIds, coverId]
              : m.selectedBenefitIds.filter((id) => id !== coverId)
          return {
            ...m,
            selectedBenefitIds: empIds,
            dependants: m.dependants.map((d) => {
              if (!lifeSet.has(d.id)) return d
              return {
                ...d,
                selectedBenefitIds: enabled
                  ? d.selectedBenefitIds.includes(coverId)
                    ? d.selectedBenefitIds
                    : [...d.selectedBenefitIds, coverId]
                  : d.selectedBenefitIds.filter((id) => id !== coverId),
              }
            }),
          }
        })
        const stillAssigned = next.some(
          (m) =>
            m.selectedBenefitIds.includes(coverId) ||
            m.dependants.some((d) => d.selectedBenefitIds.includes(coverId)),
        )
        setSelectedPolicyIds((ids) => {
          if (enabled || stillAssigned) {
            return ids.includes(coverId) ? ids : [...ids, coverId]
          }
          return ids.filter((id) => id !== coverId)
        })
        if (!enabled && !stillAssigned) {
          setSelectedPolicyTiers((tiers) => {
            const nextTiers = { ...tiers }
            delete nextTiers[coverId]
            return nextTiers
          })
          setSelectedPolicyFamilyStructures((structures) => {
            const nextStructures = { ...structures }
            delete nextStructures[coverId]
            return nextStructures
          })
        }
        return next
      })
    },
    [],
  )

  const togglePolicy = useCallback((policyId: string) => {
    setSelectedPolicyIds((current) => {
      if (current.includes(policyId)) {
        setSelectedPolicyTiers((tiers) => {
          const next = { ...tiers }
          delete next[policyId]
          return next
        })
        setSelectedPolicyFamilyStructures((structures) => {
          const next = { ...structures }
          delete next[policyId]
          return next
        })
        return current.filter((id) => id !== policyId)
      }
      return [...current, policyId]
    })
  }, [])

  const setPolicyTier = useCallback((policyId: string, tierId: string) => {
    setSelectedPolicyTiers((current) => ({ ...current, [policyId]: tierId }))
    setSelectedPolicyIds((current) =>
      current.includes(policyId) ? current : [...current, policyId],
    )
  }, [])

  const setPolicyFamilyStructure = useCallback(
    (policyId: string, structureId: string) => {
      setSelectedPolicyFamilyStructures((current) => ({
        ...current,
        [policyId]: structureId,
      }))
      setSelectedPolicyIds((current) =>
        current.includes(policyId) ? current : [...current, policyId],
      )
    },
    [],
  )

  const pruneIneligibleSelections = useCallback(
    (eligibility: {
      policies: Record<string, { eligible: boolean }>
      options: Record<string, { eligible: boolean }>
    }) => {
      setSelectedPolicyIds((current) =>
        current.filter((id) => eligibility.policies[id]?.eligible !== false),
      )
      setSelectedPolicyTiers((current) => {
        const next: Record<string, string> = {}
        for (const [policyId, tierId] of Object.entries(current)) {
          if (eligibility.policies[policyId]?.eligible !== false) {
            next[policyId] = tierId
          }
        }
        return next
      })
      setSelectedPolicyFamilyStructures((current) => {
        const next: Record<string, string> = {}
        for (const [policyId, structureId] of Object.entries(current)) {
          if (eligibility.policies[policyId]?.eligible !== false) {
            next[policyId] = structureId
          }
        }
        return next
      })
      setPurchaseGroupChoices((current) => {
        const next: Record<string, string[]> = {}
        let anySelected = false
        for (const [groupId, optionIds] of Object.entries(current)) {
          const kept = optionIds.filter(
            (id) => eligibility.options[id]?.eligible !== false,
          )
          next[groupId] = kept
          if (kept.length > 0) anySelected = true
        }
        if (!anySelected) setActiveDealId(null)
        return next
      })
    },
    [],
  )

  const togglePurchaseGroupOption = useCallback(
    (
      dealId: string,
      groupId: string,
      optionId: string,
      mode: 'single' | 'multi',
    ) => {
      setActiveDealId((current) => {
        if (current && current !== dealId) return current
        return dealId
      })
      setPurchaseGroupChoices((current) => {
        if (activeDealId && activeDealId !== dealId) return current
        const existing = current[groupId] ?? []
        let next: string[]
        if (mode === 'single') {
          next = existing.includes(optionId) ? [] : [optionId]
        } else {
          next = existing.includes(optionId)
            ? existing.filter((id) => id !== optionId)
            : [...existing, optionId]
        }
        const updated = { ...current, [groupId]: next }
        const anySelected = Object.values(updated).some((v) => v.length > 0)
        if (!anySelected) setActiveDealId(null)
        else setActiveDealId(dealId)
        return updated
      })
    },
    [activeDealId],
  )

  const setPurchaseGroupChoice = useCallback(
    (dealId: string, groupId: string, optionId: string | null) => {
      setActiveDealId((current) => {
        if (current && current !== dealId) return current
        return optionId ? dealId : current
      })
      setPurchaseGroupChoices((current) => {
        if (activeDealId && activeDealId !== dealId) return current
        const updated = {
          ...current,
          [groupId]: optionId ? [optionId] : [],
        }
        const anySelected = Object.values(updated).some((v) => v.length > 0)
        if (!anySelected) setActiveDealId(null)
        else setActiveDealId(dealId)
        return updated
      })
    },
    [activeDealId],
  )

  const updateRowPlan = useCallback((rowId: string, planId: string) => {
    setRows((current) =>
      current.map((row) =>
        row.id === rowId ? applyPlanToRow(row, planId) : row,
      ),
    )
  }, [])

  const resolveRowValidation = useCallback(
    (rowId: string, fieldValue?: string) => {
      setRows((current) =>
        current.map((row) => {
          if (row.id !== rowId) return row
          const field = (row.validationField ?? '').toLowerCase()
          const nextEmail =
            fieldValue !== undefined &&
            (field.includes('email') || field === 'email')
              ? fieldValue.trim() || row.email
              : row.email
          // Plan pick is handled by updateRowPlan; keep manual flag if still open.
          if (row.needsManualAssignment && !row.assignedPlanId) {
            return {
              ...row,
              email: nextEmail,
              validationError: undefined,
              validationField: undefined,
            }
          }
          return {
            ...row,
            email: nextEmail,
            validationError: undefined,
            validationField: undefined,
            needsManualAssignment: false,
            status: 'pass',
          }
        }),
      )
    },
    [],
  )

  const startProcessing = useCallback(() => {
    setProcessingProgress(0)
    setStep('processing')
    let progress = 0
    const timer = window.setInterval(() => {
      progress += 20
      setProcessingProgress(progress)
      if (progress >= 100) {
        window.clearInterval(timer)
        setStep('success')
      }
    }, 350)
  }, [])

  const resolvedAssignment = useMemo(
    () =>
      resolveSelectionBenefitIds(
        selectedPolicyIds,
        purchaseGroupChoices,
        activeDealId,
      ),
    [selectedPolicyIds, purchaseGroupChoices, activeDealId],
  )

  const maxDependants = useMemo(() => {
    const fromPlans = resolvedAssignment.planIds
      .map((id) => getPlanById(id)?.maxDependants ?? 0)
      .filter(Boolean)
    if (fromPlans.length === 0) return flexDeal.maxDependantsUnion
    return Math.max(...fromPlans, flexDeal.maxDependantsUnion)
  }, [resolvedAssignment.planIds])

  const selectedEmployee = sampleEmployees.find(
    (e) => e.id === selectedEmployeeId,
  )

  const costEstimate = useMemo(() => {
    if (action === 'delete') {
      return buildSingleCostEstimate({
        selectedPolicyIds: [],
        purchaseGroupChoices: {},
        activeDealId: null,
        lifeCount: 0,
      })
    }

    if (method === 'bulk' && action === 'add') {
      return buildCostEstimate(rows, { cdShortfall: true })
    }

    if (method === 'single' && action === 'add') {
      const lives = flattenMembers(addEmployees)
      if (activeDeal) {
        return buildPolicyImpact({
          deal: activeDeal,
          lives: lives.map((life) => ({
            benefitIds: life.selectedBenefitIds,
          })),
        })
      }
      return buildMembersCostEstimate(
        lives,
        selectedPolicyTiers,
        selectedPolicyFamilyStructures,
      )
    }

    if (
      method === 'single-dependant' &&
      action === 'add' &&
      activeDeal
    ) {
      return buildPolicyImpact({
        deal: activeDeal,
        lives: dependants.map((dependant) => ({
          benefitIds: dependant.selectedBenefitIds,
        })),
        currentPayrollDeduction:
          selectedEmployee?.currentPayrollDeduction ?? 0,
      })
    }

    const lifeCount =
      method === 'single-dependant'
        ? Math.max(dependants.length, 1)
        : 1 + (addDependants === true ? dependants.length : 0)

    return buildSingleCostEstimate({
      selectedPolicyIds,
      purchaseGroupChoices,
      activeDealId:
        method === 'single-dependant'
          ? flexDeal.id
          : activeDealId,
      lifeCount,
      forceCdShortfall:
        selectedPolicyIds.includes('pol-gtl') ||
        resolvedAssignment.benefitIds.includes('ben-gmc-parental'),
    })
  }, [
    action,
    method,
    rows,
    selectedPolicyIds,
    purchaseGroupChoices,
    activeDealId,
    dependants,
    addDependants,
    resolvedAssignment.benefitIds,
    addEmployees,
    selectedPolicyTiers,
    selectedPolicyFamilyStructures,
    activeDeal,
    selectedEmployee,
  ])

  const refundEstimate = useMemo(() => {
    if (action !== 'delete' || method === 'bulk') {
      if (action === 'delete' && method === 'bulk') {
        const pass = bulkDeleteRows.filter((r) => r.status === 'pass')
        return {
          totalLivesDeleted: pass.length,
          totalInsurerRefund: pass.reduce((s, r) => s + r.insurerRefund, 0),
          totalEmployeeRefund: pass.reduce((s, r) => s + r.payrollRefund, 0),
          lines: pass.map((r) => ({
            id: r.id,
            label: r.name,
            kind: 'policy' as const,
            lives: 1,
            insurerRefund: r.insurerRefund,
            employeeRefund: r.payrollRefund,
            zeroReason: r.hasClaim ? ('claim' as const) : undefined,
          })),
          policiesByCd: [
            {
              cdAccountId: 'cd-main',
              cdAccountName: 'Symphony Main CD',
              cdBalance: 238456,
              policies: pass.map((r) => ({
                policyName: r.name,
                lives: 1,
                refund: r.insurerRefund,
              })),
            },
          ],
        } satisfies RefundEstimate
      }
      return null
    }
    if (!selectedEmployee) return null
    if (activeDeal) {
      const endingBenefitIds = selectedEmployee.coverages
        .filter(
          (coverage) =>
            coverage.kind === 'benefit' &&
            activeDeal.benefits.some(
              (benefit) => benefit.id === coverage.id,
            ),
        )
        .map((coverage) => coverage.id)
      return buildConfiguredRefundEstimate({
        deal: activeDeal,
        endingBenefitIds,
        dependantCount: selectedEmployee.dependants.length,
        claimedBenefitIds: selectedEmployee.hasClaimOnGmc
          ? activeDeal.benefits
              .filter((benefit) => benefit.category === 'gmc')
              .map((benefit) => benefit.id)
          : [],
        planId: selectedEmployee.plans[0]?.id,
      })
    }
    return buildRefundEstimate({
      employeeName: `${selectedEmployee.firstName} ${selectedEmployee.lastName}`,
      dependantCount: selectedEmployee.dependants.length,
      hasClaimOnGmc: selectedEmployee.hasClaimOnGmc,
      includeFlatWellness: selectedEmployee.hasFlatWellness,
    })
  }, [action, method, selectedEmployee, bulkDeleteRows, activeDeal])

  const completeFlow = useCallback(() => {
    if (
      action === 'edit' &&
      correctionBatch.some(
        (correction) => correction.requiresKyc && !correction.proofFileName,
      )
    ) {
      return
    }
    if (action === 'edit' && simulateEditSaveFailure && editProofFileName) {
      setEditProofFileName(null)
      setSimulateEditSaveFailure(false)
      window.alert(
        'Submission failed. Uploaded proof was removed; review the correction batch and upload it again before retrying.',
      )
      setStep('correction-batch')
      return
    }
    setStep('success')
  }, [
    action,
    correctionBatch,
    simulateEditSaveFailure,
    editProofFileName,
  ])

  const resetWizard = useCallback(() => {
    setStep(initialStep)
    setMethod(initialMethod)
    setEmployee(emptyEmployeeForm())
    setAddDependants(null)
    setDependants([])
    setSelectedEmployeeId(null)
    setSelectedDependantId(null)
    setSelectedDependantPlanId(null)
    setSelectedPolicyIds([])
    setSelectedPolicyTiers({})
    setSelectedPolicyFamilyStructures({})
    setPurchaseGroupChoices({})
    setActiveDealId(
      initialDealId && getDealConfig(initialDealId, protoDeals)
        ? initialDealId
        : resolveInitialDealId(protoDeals),
    )
    setFileName(null)
    setTemplateDownloaded(false)
    setDeleteConfirmed(false)
    setRows(sampleBulkRows.map((r) => ({ ...r })))
    setBulkAssignMode(null)
    setBulkFilter('all')
    setMidtermProofUploaded(false)
    setProcessingProgress(0)
    setDateOfLeaving('')
    setReasonOfLeaving('')
    setEditProofFileName(null)
    setEditBlocked(false)
    setSimulateEditSaveFailure(false)
    setPendingCorrection(null)
    setCorrectionBatch([])
    setEnrolment(emptyEnrolmentSettings())
    setIntakeMode('form')
    setAddEmployees([emptyAddEmployeeMember()])
    setEditingAddEmployeeIds([])
    setBenefitsAssignMode('common')
  }, [initialMethod, initialStep, initialDealId, protoDeals])

  const value = useMemo(
    () => ({
      action,
      step,
      setStep,
      method,
      setMethod,
      organisationEntityId,
      organisationEntityName,
      employee,
      setEmployee,
      updateEmployee,
      updateCustomAttribute,
      addDependants,
      setAddDependants,
      dependants,
      setDependants,
      updateDependant,
      addDependant,
      removeDependant,
      maxDependants,
      selectedEmployeeId,
      setSelectedEmployeeId,
      selectedDependantId,
      setSelectedDependantId,
      selectedDependantPlanId,
      setSelectedDependantPlanId,
      selectedPolicyIds,
      togglePolicy,
      selectedPolicyTiers,
      setPolicyTier,
      selectedPolicyFamilyStructures,
      setPolicyFamilyStructure,
      purchaseGroupChoices,
      togglePurchaseGroupOption,
      setPurchaseGroupChoice,
      activeDealId,
      activeDeal,
      selectDeal,
      pruneIneligibleSelections,
      intakeMode,
      setIntakeMode,
      addEmployees,
      setAddEmployees,
      updateAddEmployee,
      completeAddEmployeeAssignment,
      updateAddEmployeeFields,
      updateAddEmployeeCustomAttribute,
      addAddEmployee,
      removeAddEmployee,
      editingAddEmployeeIds,
      setAddEmployeeEditing,
      addAddEmployeeDependant,
      updateAddEmployeeDependant,
      removeAddEmployeeDependant,
      toggleCoverForEligibleLives,
      setLifeCoverIds,
      benefitsAssignMode,
      setBenefitsAssignMode,
      fileName,
      setFileName,
      templateDownloaded,
      setTemplateDownloaded,
      deleteConfirmed,
      setDeleteConfirmed,
      rows,
      updateRowPlan,
      resolveRowValidation,
      bulkAssignMode,
      setBulkAssignMode,
      bulkFilter,
      setBulkFilter,
      midtermProofUploaded,
      setMidtermProofUploaded,
      processingProgress,
      startProcessing,
      dateOfLeaving,
      setDateOfLeaving,
      reasonOfLeaving,
      setReasonOfLeaving,
      bulkDeleteRows,
      editProofFileName,
      setEditProofFileName,
      editBlocked,
      setEditBlocked,
      simulateEditSaveFailure,
      setSimulateEditSaveFailure,
      pendingCorrection,
      setPendingCorrection,
      correctionBatch,
      addCorrection,
      addPendingCorrection,
      removeCorrection,
      enrolment,
      setEnrolment,
      costEstimate,
      refundEstimate,
      resolvedAssignment,
      autofillNonce,
      signalAutofill,
      completeFlow,
      completeAddition: completeFlow,
      resetWizard,
    }),
    [
      action,
      step,
      method,
      organisationEntityId,
      organisationEntityName,
      employee,
      updateEmployee,
      updateCustomAttribute,
      addDependants,
      dependants,
      updateDependant,
      addDependant,
      removeDependant,
      maxDependants,
      selectedEmployeeId,
      selectedDependantId,
      selectedDependantPlanId,
      selectedPolicyIds,
      togglePolicy,
      selectedPolicyTiers,
      setPolicyTier,
      selectedPolicyFamilyStructures,
      setPolicyFamilyStructure,
      purchaseGroupChoices,
      togglePurchaseGroupOption,
      setPurchaseGroupChoice,
      activeDealId,
      activeDeal,
      selectDeal,
      pruneIneligibleSelections,
      intakeMode,
      addEmployees,
      updateAddEmployee,
      completeAddEmployeeAssignment,
      updateAddEmployeeFields,
      updateAddEmployeeCustomAttribute,
      addAddEmployee,
      removeAddEmployee,
      editingAddEmployeeIds,
      setAddEmployeeEditing,
      addAddEmployeeDependant,
      updateAddEmployeeDependant,
      removeAddEmployeeDependant,
      toggleCoverForEligibleLives,
      setLifeCoverIds,
      benefitsAssignMode,
      fileName,
      templateDownloaded,
      deleteConfirmed,
      rows,
      updateRowPlan,
      resolveRowValidation,
      bulkAssignMode,
      bulkFilter,
      midtermProofUploaded,
      processingProgress,
      startProcessing,
      dateOfLeaving,
      reasonOfLeaving,
      bulkDeleteRows,
      editProofFileName,
      editBlocked,
      simulateEditSaveFailure,
      pendingCorrection,
      correctionBatch,
      addCorrection,
      addPendingCorrection,
      removeCorrection,
      enrolment,
      costEstimate,
      refundEstimate,
      resolvedAssignment,
      autofillNonce,
      signalAutofill,
      completeFlow,
      resetWizard,
    ],
  )

  return (
    <LivesWizardContext.Provider value={value}>
      {children}
    </LivesWizardContext.Provider>
  )
}

export function useLivesWizard() {
  const ctx = useContext(LivesWizardContext)
  if (!ctx) {
    throw new Error('useLivesWizard must be used within LivesWizardProvider')
  }
  return ctx
}
