/** Shared stepper labels for Add employee(s). */
export function addEmployeesPageTitle(dealName?: string | null) {
  return dealName
    ? `Add new employee(s) to ${dealName}`
    : 'Add new employee(s)'
}

export const SINGLE_ADD_STEPS = [
  'Employee',
  'Benefits',
  'Dependants',
  'Review',
] as const

/** Stepper labels for Add new dependant (unchanged path). */
export const SINGLE_DEPENDANT_STEPS = [
  'Select employee',
  'Dependant details',
  'Review',
] as const
