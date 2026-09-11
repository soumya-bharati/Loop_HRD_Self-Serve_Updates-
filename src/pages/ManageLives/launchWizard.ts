export function launchWizardPath({
  action,
  method,
  entity,
  deal,
  employee,
  dependant,
  leaving,
  file,
  step,
}: {
  action: 'add' | 'edit' | 'delete'
  method: 'bulk' | 'single' | 'single-dependant'
  entity: string
  deal?: string
  employee?: string
  dependant?: string
  leaving?: string
  file?: string
  step?: string
}) {
  const params = new URLSearchParams({
    method,
    entity,
    returnTo: 'manage-lives',
  })
  if (deal) params.set('deal', deal)
  if (employee) params.set('employee', employee)
  if (dependant) params.set('dependant', dependant)
  if (leaving) params.set('leaving', leaving)
  if (file) params.set('file', file)
  if (step) params.set('step', step)
  return `/endorsements/lives/${action}?${params.toString()}`
}

export function isWorkspaceReturn() {
  return new URLSearchParams(window.location.search).get('returnTo') === 'manage-lives'
}

export function wizardExitPath() {
  return isWorkspaceReturn() ? '/manage-lives' : '/endorsements'
}

/** True when the wizard was launched against a specific employee. */
export function launchedForEmployee() {
  return Boolean(new URLSearchParams(window.location.search).get('employee'))
}

/** Exit target for flows that act on one existing employee. */
export function employeeDetailsPath(employeeId?: string | null) {
  return employeeId ? `/manage-lives/employee/${employeeId}` : '/employees'
}
