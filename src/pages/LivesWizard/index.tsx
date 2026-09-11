import { Navigate, useParams, useSearchParams } from 'react-router-dom'
import styled from 'styled-components'

import { CaptureWorkspaceChange } from '@/pages/ManageLives/CaptureWorkspaceChange'

import {
  LivesWizardProvider,
  useLivesWizard,
  type LifeAction,
  type LifeMethod,
  type WizardStep,
} from '@/pages/LivesWizard/WizardContext'
import { AutofillWidget } from '@/pages/LivesWizard/components/AutofillWidget'
import { BulkReviewStep } from '@/pages/LivesWizard/steps/BulkReviewStep'
import { BulkValidateStep } from '@/pages/LivesWizard/steps/BulkValidateStep'
import { CorrectionBatchStep } from '@/pages/LivesWizard/steps/CorrectionBatchStep'
import { BenefitsStep } from '@/pages/LivesWizard/steps/BenefitsStep'
import { DateOfLeavingStep } from '@/pages/LivesWizard/steps/DateOfLeavingStep'
import { DeleteSummaryStep } from '@/pages/LivesWizard/steps/DeleteSummaryStep'
import { DependantDetailsStep } from '@/pages/LivesWizard/steps/DependantDetailsStep'
import { DependantPlanStep } from '@/pages/LivesWizard/steps/DependantPlanStep'
import { EditFormStep } from '@/pages/LivesWizard/steps/EditFormStep'
import { EditProofStep } from '@/pages/LivesWizard/steps/EditProofStep'
import { EmployeeDetailsStep } from '@/pages/LivesWizard/steps/EmployeeDetailsStep'
import { EndoCostsStep } from '@/pages/LivesWizard/steps/EndoCostsStep'
import { EnrolmentStep } from '@/pages/LivesWizard/steps/EnrolmentStep'
import { FamilyStep } from '@/pages/LivesWizard/steps/FamilyStep'
import { MidtermProofStep } from '@/pages/LivesWizard/steps/MidtermProofStep'
import { OffboardCoverageStep } from '@/pages/LivesWizard/steps/OffboardCoverageStep'
import { ProcessingStep } from '@/pages/LivesWizard/steps/ProcessingStep'
import { SearchEmployeeStep } from '@/pages/LivesWizard/steps/SearchEmployeeStep'
import { SelectionStep } from '@/pages/LivesWizard/steps/SelectionStep'
import { SuccessStep } from '@/pages/LivesWizard/steps/SuccessStep'
import { UploadStep } from '@/pages/LivesWizard/steps/UploadStep'
import { SingleEmployeeSetupStep } from '@/pages/LivesWizard/steps/SingleEmployeeSetupStep'
import { VerifyStep } from '@/pages/LivesWizard/steps/VerifyStep'

const VALID_ACTIONS: LifeAction[] = ['add', 'edit', 'delete']
const VALID_METHODS: LifeMethod[] = ['bulk', 'single', 'single-dependant']
const VALID_STEPS: WizardStep[] = [
  'selection',
  'employee-details',
  'user-details',
  'search-employee',
  'dependant-details',
  'dependant-plan',
  'benefits',
  'family',
  'verify',
  'endo-costs',
  'enrolment',
  'upload',
  'bulk-validate',
  'midterm-proof',
  'bulk-review',
  'processing',
  'date-of-leaving',
  'offboard-coverage',
  'delete-summary',
  'edit-form',
  'edit-proof',
  'correction-batch',
  'success',
]

function LivesWizardInner() {
  const { step, action, method, intakeMode } = useLivesWizard()
  const hideAutofill =
    (step === 'endo-costs' &&
      action === 'add' &&
      method === 'single' &&
      intakeMode === 'form') ||
    (step === 'delete-summary' && action === 'delete' && method === 'single')

  if (step === 'success') {
    const returning = new URLSearchParams(window.location.search).get('returnTo') === 'manage-lives'
    return (
      <Page>
        <Body>
          {returning ? <CaptureWorkspaceChange /> : <SuccessStep />}
        </Body>
      </Page>
    )
  }

  if (step === 'processing') {
    return (
      <Page>
        <Body>
          <ProcessingStep />
        </Body>
      </Page>
    )
  }

  return (
    <Page>
      {step === 'selection' && <SelectionStep />}
      {step === 'employee-details' && <EmployeeDetailsStep />}
      {step === 'user-details' && <SingleEmployeeSetupStep />}
      {step === 'search-employee' && <SearchEmployeeStep />}
      {step === 'dependant-details' && <DependantDetailsStep />}
      {step === 'dependant-plan' && <DependantPlanStep />}
      {step === 'benefits' && <BenefitsStep />}
      {step === 'family' && <FamilyStep />}
      {step === 'verify' && <VerifyStep />}
      {step === 'endo-costs' && <EndoCostsStep />}
      {step === 'enrolment' && <EnrolmentStep />}
      {step === 'upload' && <UploadStep />}
      {step === 'bulk-validate' && <BulkValidateStep />}
      {step === 'midterm-proof' && <MidtermProofStep />}
      {step === 'bulk-review' && <BulkReviewStep />}
      {step === 'date-of-leaving' && <DateOfLeavingStep />}
      {step === 'offboard-coverage' && <OffboardCoverageStep />}
      {step === 'delete-summary' && <DeleteSummaryStep />}
      {step === 'edit-form' && <EditFormStep />}
      {step === 'edit-proof' && <EditProofStep />}
      {step === 'correction-batch' && <CorrectionBatchStep />}
      {hideAutofill ? null : <AutofillWidget />}
    </Page>
  )
}

export function LivesWizardPage() {
  const { action: actionParam } = useParams<{ action: string }>()
  const [searchParams] = useSearchParams()
  const action = actionParam as LifeAction | undefined
  const methodParam = searchParams.get('method') as LifeMethod | null
  const entityParam = searchParams.get('entity')
  const dealParam = searchParams.get('deal')
  const employeeParam = searchParams.get('employee')
  const dependantParam = searchParams.get('dependant')
  const leavingParam = searchParams.get('leaving')
  const fileParam = searchParams.get('file')
  const stepParam = searchParams.get('step')
  const initialStepOverride =
    stepParam && VALID_STEPS.includes(stepParam as WizardStep)
      ? (stepParam as WizardStep)
      : null

  const fallback = searchParams.get('returnTo') === 'manage-lives' ? '/manage-lives' : '/endorsements'

  if (!action || !VALID_ACTIONS.includes(action)) {
    return <Navigate to={fallback} replace />
  }

  if (!methodParam || !VALID_METHODS.includes(methodParam)) {
    return <Navigate to={fallback} replace />
  }

  // Edit/delete do not support every method combo from the modal, but routes are validated upstream.
  if (action === 'edit' && methodParam === 'bulk') {
    return <Navigate to={fallback} replace />
  }
  if (action === 'delete' && methodParam === 'single-dependant') {
    return <Navigate to={fallback} replace />
  }

  return (
    <LivesWizardProvider
      key={`${action}-${methodParam}-${entityParam ?? 'default'}-${dealParam ?? 'default'}-${employeeParam ?? ''}-${dependantParam ?? ''}-${fileParam ?? ''}-${stepParam ?? ''}`}
      action={action}
      initialMethod={methodParam}
      organisationEntityId={entityParam}
      initialDealId={dealParam}
      initialEmployeeId={employeeParam}
      initialDependantId={dependantParam}
      initialLeavingDate={leavingParam}
      initialFileName={fileParam}
      initialStepOverride={initialStepOverride}
    >
      <LivesWizardInner />
    </LivesWizardProvider>
  )
}

const Page = styled.div`
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: calc(100vh - ${({ theme }) => theme.layout.topNavHeight});
  width: 100%;
  background: ${({ theme }) => theme.colors.surface0};
  max-width: 100%;
  /* Steps that keep the legacy chrome must still scroll inside the
     full-bleed guided shell, which clips its own overflow. */
  max-height: 100%;
  overflow-x: hidden;
  overflow-y: auto;
`

const Body = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: 32px 48px 48px;

  @media (max-width: ${({ theme }) => theme.breakpoints.lg}) {
    padding: 24px ${({ theme }) => theme.layout.contentPadXTablet};
  }

  @media (max-width: ${({ theme }) => theme.breakpoints.md}) {
    padding: 20px ${({ theme }) => theme.layout.contentPadXMobile};
  }
`
