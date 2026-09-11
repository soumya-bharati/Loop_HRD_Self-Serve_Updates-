import { useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'

import { sampleEmployees } from '@/data/employees'
import { employeeDetailsPath } from '@/pages/ManageLives/launchWizard'
import { usePendingChanges } from '@/pages/ManageLives/PendingChangesContext'
import {
  chargeImpact,
  nextPendingId,
  refundImpact,
  type PendingAction,
  type PendingChange,
} from '@/pages/ManageLives/pendingChanges'
import { useLivesWizard } from '@/pages/LivesWizard/WizardContext'

export function CaptureWorkspaceChange() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const { addChange } = usePendingChanges()
  const wizard = useLivesWizard()

  useEffect(() => {
    if (params.get('returnTo') !== 'manage-lives') return
    const change = pendingChangeFromWizard(wizard)
    if (change) addChange(change)
    // Flows launched from one employee go back to that employee, not the hub.
    const employeeId = params.get('employee')
    navigate(employeeId ? employeeDetailsPath(employeeId) : '/manage-lives', {
      replace: true,
    })
    // Capture once when success is shown.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <p style={{ padding: 32, color: '#595959' }}>
      Adding this change to Pending Changes…
    </p>
  )
}

export function pendingChangeFromWizard(
  wizard: ReturnType<typeof useLivesWizard>,
): PendingChange | null {
  const selected = sampleEmployees.find((item) => item.id === wizard.selectedEmployeeId)
  const createdAt = new Date().toISOString()
  const base = {
    id: nextPendingId(),
    entityId: wizard.organisationEntityId,
    entityName: wizard.organisationEntityName,
    dealId: wizard.activeDealId ?? undefined,
    dealName: wizard.activeDeal?.name,
    createdAt,
  }

  if (wizard.action === 'add' && wizard.method === 'single') {
    const members = wizard.addEmployees.filter(
      (member) =>
        member.assignmentCompleted ||
        member.employee.firstName ||
        member.employee.employeeId,
    )
    const names = members
      .map((member) =>
        `${member.employee.firstName} ${member.employee.lastName}`.trim(),
      )
      .filter(Boolean)
    const first = members[0]
    return {
      ...base,
      employeeId: first?.employee.employeeId || first?.id || 'new',
      employeeName: names.join(', ') || 'New employee(s)',
      action: 'add_employee',
      description: `Add ${members.length || 1} employee${(members.length || 1) === 1 ? '' : 's'}`,
      costImpact: chargeImpact(wizard.costEstimate.totalEndorsementCost),
      payload: { members },
    }
  }

  if (wizard.action === 'add' && wizard.method === 'single-dependant') {
    const dep = wizard.dependants[0]
    return {
      ...base,
      employeeId: selected?.employeeId ?? wizard.employee.employeeId,
      employeeName: selected
        ? `${selected.firstName} ${selected.lastName}`
        : `${wizard.employee.firstName} ${wizard.employee.lastName}`.trim(),
      action: 'add_dependant',
      description: dep
        ? `Add ${dep.relationship || 'dependant'} ${dep.firstName} ${dep.lastName}`.trim()
        : 'Add dependant',
      costImpact: chargeImpact(wizard.costEstimate.totalEndorsementCost),
      payload: { dependants: wizard.dependants },
    }
  }

  if (wizard.action === 'edit') {
    const isDependant = wizard.method === 'single-dependant'
    const action: PendingAction = isDependant ? 'edit_dependant' : 'edit_employee'
    const name = `${wizard.employee.firstName} ${wizard.employee.lastName}`.trim()
    return {
      ...base,
      employeeId: selected?.employeeId ?? wizard.employee.employeeId,
      employeeName: selected
        ? `${selected.firstName} ${selected.lastName}`
        : name,
      action,
      description: isDependant
        ? `Edit dependant ${name}`
        : `Edit employee ${name}`,
      costImpact: chargeImpact(1200),
      payload: {
        employee: wizard.employee,
        corrections: wizard.correctionBatch,
      },
    }
  }

  if (wizard.action === 'delete' && wizard.method === 'single') {
    return {
      ...base,
      employeeId: selected?.employeeId ?? wizard.employee.employeeId,
      employeeName: selected
        ? `${selected.firstName} ${selected.lastName}`
        : `${wizard.employee.firstName} ${wizard.employee.lastName}`.trim(),
      action: 'employee_exit',
      description: `Mark as leaving on ${wizard.dateOfLeaving || 'TBD'}`,
      effectiveDate: wizard.dateOfLeaving,
      costImpact: refundImpact(wizard.refundEstimate?.totalInsurerRefund ?? 0),
      payload: {
        employeeId: selected?.id ?? selected?.employeeId,
        leavingDate: wizard.dateOfLeaving,
        reasonOfLeaving: wizard.reasonOfLeaving || undefined,
      },
    }
  }

  if (wizard.action === 'add' && wizard.method === 'bulk') {
    return {
      ...base,
      employeeId: 'bulk',
      employeeName: `Bulk add · ${wizard.rows.filter((row) => row.status === 'pass').length} employees`,
      action: 'bulk_add',
      description: wizard.fileName ?? 'Bulk add',
      costImpact: chargeImpact(wizard.costEstimate.totalEndorsementCost),
      payload: { rows: wizard.rows.filter((row) => row.status !== 'fail') },
    }
  }

  if (wizard.action === 'delete' && wizard.method === 'bulk') {
    return {
      ...base,
      employeeId: 'bulk',
      employeeName: `Bulk remove · ${wizard.bulkDeleteRows.filter((row) => row.status === 'pass').length} employees`,
      action: 'bulk_remove',
      description: wizard.fileName ?? 'Bulk remove',
      costImpact: refundImpact(wizard.refundEstimate?.totalInsurerRefund ?? 0),
      payload: {
        rows: wizard.bulkDeleteRows.filter((row) => row.status === 'pass'),
      },
    }
  }

  return null
}
