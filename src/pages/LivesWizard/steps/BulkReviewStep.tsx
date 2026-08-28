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
              <td data-label="Assignment">
                {flexDeal.name} · {name}
              </td>
              <td data-label="Employees">{stats.employees.size}</td>
              <td data-label="Lives">{stats.lives}</td>
              <td data-label="Payroll deduction">{formatINR(stats.payroll)}</td>
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

  @media (max-width: 640px) {
    justify-content: stretch;
  }
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

  @media (max-width: 640px) {
    width: 100%;
    box-sizing: border-box;
  }
`

const Table = styled.table`
  width: 100%;
  max-width: 100%;
  border-collapse: collapse;
  font-size: 13px;
  background: ${({ theme }) => theme.colors.surface1};
  border-radius: 12px;
  overflow: hidden;
  box-sizing: border-box;

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

  @media (max-width: 640px) {
    display: block;
    overflow: hidden;

    thead {
      display: none;
    }

    tbody {
      display: block;
    }

    tbody tr {
      display: block;
      padding: 12px;
      border-bottom: 1px solid ${({ theme }) => theme.colors.disableFill};

      &:last-child {
        border-bottom: none;
      }
    }

    tbody td {
      display: flex;
      flex-direction: column;
      gap: 4px;
      padding: 8px 0;
      border-bottom: none;

      &::before {
        content: attr(data-label);
        font-size: 11px;
        font-weight: 600;
        letter-spacing: 0.2px;
        color: ${({ theme }) => theme.colors.textSecondary};
      }

      &:not(:last-child) {
        border-bottom: 1px solid ${({ theme }) => theme.colors.disableFill};
      }
    }
  }
`
