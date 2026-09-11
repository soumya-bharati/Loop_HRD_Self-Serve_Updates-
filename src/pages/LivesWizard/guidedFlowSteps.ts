import type { GuidedFlowStep } from '@/pages/LivesWizard/components/GuidedFlowChrome'

/** Shared timeline for the single-employee addition flow. */
export const SINGLE_GUIDED_STEPS: readonly GuidedFlowStep[] = [
  {
    title: 'Provide Details',
    description: 'Enter the employee details we need for this addition.',
    icon: 'details',
  },
  {
    title: 'View Benefits & Add Dependant',
    description: 'Review the assigned benefits, add any dependants, then submit.',
    icon: 'benefits',
  },
]

/** Timeline for managing an employee and their covered family. */
export const DEPENDANT_GUIDED_STEPS: readonly GuidedFlowStep[] = [
  {
    title: 'Manage Family Details',
    description: 'Edit an existing member or add someone to an empty slot.',
    icon: 'details',
  },
]

/** Timeline for off-boarding an employee and their dependants. */
export const DELETE_GUIDED_STEPS: readonly GuidedFlowStep[] = [
  {
    title: 'Date of Leaving',
    description: 'Set the leaving date. This family will be off-boarded together.',
    icon: 'details',
  },
  {
    title: 'Coverage Ending',
    description: 'See which covers end, then off-board this family.',
    icon: 'benefits',
  },
]

const EDIT_DETAILS_STEP: GuidedFlowStep = {
  title: 'Update Details',
  description: 'Correct the personal and contact details.',
  icon: 'details',
}

const EDIT_VERIFY_STEP: GuidedFlowStep = {
  title: 'Verify & Save',
  description: 'We verify eligibility and payroll impact before saving.',
  icon: 'review',
}

/** KYC proof is collected with the changed details, before verification. */
export function editGuidedSteps(_includeProof?: boolean): GuidedFlowStep[] {
  return [EDIT_DETAILS_STEP, EDIT_VERIFY_STEP]
}
