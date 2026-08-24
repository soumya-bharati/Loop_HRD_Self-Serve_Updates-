import { Navigate, useParams, useSearchParams } from 'react-router-dom'
import styled from 'styled-components'

import {
  LivesWizardProvider,
  useLivesWizard,
  type LifeAction,
  type LifeMethod,
} from '@/pages/LivesWizard/WizardContext'
import { BulkReviewStep } from '@/pages/LivesWizard/steps/BulkReviewStep'
import { BulkValidateStep } from '@/pages/LivesWizard/steps/BulkValidateStep'
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
import { MidtermProofStep } from '@/pages/LivesWizard/steps/MidtermProofStep'
import { ProcessingStep } from '@/pages/LivesWizard/steps/ProcessingStep'
import { SearchEmployeeStep } from '@/pages/LivesWizard/steps/SearchEmployeeStep'
import { SelectionStep } from '@/pages/LivesWizard/steps/SelectionStep'
import { SuccessStep } from '@/pages/LivesWizard/steps/SuccessStep'
import { UploadStep } from '@/pages/LivesWizard/steps/UploadStep'
import { UserDetailsStep } from '@/pages/LivesWizard/steps/UserDetailsStep'
import { VerifyStep } from '@/pages/LivesWizard/steps/VerifyStep'

const VALID_ACTIONS: LifeAction[] = ['add', 'edit', 'delete']
const VALID_METHODS: LifeMethod[] = ['bulk', 'single', 'single-dependant']

function LivesWizardInner() {
  const { step } = useLivesWizard()

  if (step === 'success') {
    return (
      <Page>
        <Body>
          <SuccessStep />
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
      {step === 'user-details' && <UserDetailsStep />}
      {step === 'search-employee' && <SearchEmployeeStep />}
      {step === 'dependant-details' && <DependantDetailsStep />}
      {step === 'dependant-plan' && <DependantPlanStep />}
      {step === 'benefits' && <BenefitsStep />}
      {step === 'verify' && <VerifyStep />}
      {step === 'endo-costs' && <EndoCostsStep />}
      {step === 'enrolment' && <EnrolmentStep />}
      {step === 'upload' && <UploadStep />}
      {step === 'bulk-validate' && <BulkValidateStep />}
      {step === 'midterm-proof' && <MidtermProofStep />}
      {step === 'bulk-review' && <BulkReviewStep />}
      {step === 'date-of-leaving' && <DateOfLeavingStep />}
      {step === 'delete-summary' && <DeleteSummaryStep />}
      {step === 'edit-form' && <EditFormStep />}
      {step === 'edit-proof' && <EditProofStep />}
    </Page>
  )
}

export function LivesWizardPage() {
  const { action: actionParam } = useParams<{ action: string }>()
  const [searchParams] = useSearchParams()
  const action = actionParam as LifeAction | undefined
  const methodParam = searchParams.get('method') as LifeMethod | null

  if (!action || !VALID_ACTIONS.includes(action)) {
    return <Navigate to="/endorsements" replace />
  }

  if (!methodParam || !VALID_METHODS.includes(methodParam)) {
    return <Navigate to="/endorsements" replace />
  }

  // Edit/delete do not support every method combo from the modal, but routes are validated upstream.
  if (action === 'edit' && methodParam === 'bulk') {
    return <Navigate to="/endorsements" replace />
  }
  if (action === 'delete' && methodParam === 'single-dependant') {
    return <Navigate to="/endorsements" replace />
  }

  return (
    <LivesWizardProvider
      key={`${action}-${methodParam}`}
      action={action}
      initialMethod={methodParam}
    >
      <LivesWizardInner />
    </LivesWizardProvider>
  )
}

const Page = styled.div`
  display: flex;
  flex-direction: column;
  min-height: calc(100vh - ${({ theme }) => theme.layout.topNavHeight});
  width: 100%;
  background: ${({ theme }) => theme.colors.surface0};
`

const Body = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: 32px 48px 48px;
`
