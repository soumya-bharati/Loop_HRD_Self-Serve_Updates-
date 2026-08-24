import { useNavigate } from 'react-router-dom'
import styled from 'styled-components'

import { flexDeal, formatINR, getPlanById } from '@/data/flexDeal'
import { CostAndCdSummary } from '@/pages/LivesWizard/components/CostAndCdSummary'
import { FlowStepper, WizardChrome } from '@/pages/LivesWizard/WizardChrome'
import { useLivesWizard } from '@/pages/LivesWizard/WizardContext'

export function BulkReviewStep() {
  const navigate = useNavigate()
  const { rows, costEstimate, setStep } = useLivesWizard()

  const valid = rows.filter((r) => r.status === 'pass')
  const byAssignment = new Map<
    string,
    { employees: Set<string>; lives: number; payroll: number }
  >()

  for (const row of valid) {
    const planName = row.assignedPlanId
      ? getPlanById(row.assignedPlanId)?.name ?? row.assignedPlanId
      : 'Unassigned'
    const key = planName
    const cur = byAssignment.get(key) ?? {
      employees: new Set<string>(),
      lives: 0,
      payroll: 0,
    }
    cur.employees.add(row.employeeId)
    cur.lives += 1
    cur.payroll += row.payrollDelta
    byAssignment.set(key, cur)
  }

  return (
    <WizardChrome
      title="Bulk review & cost"
      onBack={() =>
        setStep(
          rows.some((r) => r.needsMidtermProof)
            ? 'midterm-proof'
            : 'bulk-validate',
        )
      }
      onExit={() => navigate('/endorsements')}
      secondaryLabel="Back"
      onSecondary={() => setStep('bulk-validate')}
      primaryLabel="Continue to enrolment"
      onPrimary={() => setStep('enrolment')}
    >
      <FlowStepper
        steps={['Upload', 'Validate', 'Review', 'Enrolment']}
        activeIndex={2}
        bare
      />

      <Actions>
        <Download
          type="button"
          onClick={() => {
            const lines = [
              'Employee ID,Name,Plan,Payroll',
              ...valid.map(
                (r) =>
                  `${r.employeeId},${r.name},${r.assignedPlanId ?? ''},${r.payrollDelta}`,
              ),
            ]
            const blob = new Blob([lines.join('\n')], { type: 'text/csv' })
            const url = URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = url
            a.download = 'who_gets_what.csv'
            a.click()
            URL.revokeObjectURL(url)
          }}
        >
          Download who-gets-what sheet
        </Download>
      </Actions>

      <Table>
        <thead>
          <tr>
            <th>Assignment</th>
            <th>Employees</th>
            <th>Lives</th>
            <th>Payroll deduction</th>
          </tr>
        </thead>
        <tbody>
          {[...byAssignment.entries()].map(([name, stats]) => (
            <tr key={name}>
              <td>
                {flexDeal.name} · {name}
              </td>
              <td>{stats.employees.size}</td>
              <td>{stats.lives}</td>
              <td>{formatINR(stats.payroll)}</td>
            </tr>
          ))}
        </tbody>
      </Table>

      <CostAndCdSummary estimate={costEstimate} />
    </WizardChrome>
  )
}

const Actions = styled.div`
  display: flex;
  justify-content: flex-end;
`

const Download = styled.button`
  border: 1px solid ${({ theme }) => theme.colors.emerald};
  background: transparent;
  color: ${({ theme }) => theme.colors.emerald};
  border-radius: 8px;
  padding: 10px 14px;
  font-family: ${({ theme }) => theme.fontFamily};
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
`

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
  background: ${({ theme }) => theme.colors.surface1};
  border-radius: 12px;
  overflow: hidden;

  th,
  td {
    text-align: left;
    padding: 12px;
    border-bottom: 1px solid ${({ theme }) => theme.colors.disableFill};
  }

  th {
    font-size: 12px;
    color: ${({ theme }) => theme.colors.textSecondary};
    background: ${({ theme }) => theme.colors.surface0};
  }
`
