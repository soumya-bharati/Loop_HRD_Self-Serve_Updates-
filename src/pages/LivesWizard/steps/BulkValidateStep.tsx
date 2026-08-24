import { useNavigate } from 'react-router-dom'
import styled from 'styled-components'

import { flexDeal } from '@/data/flexDeal'
import { FlowStepper, WizardChrome } from '@/pages/LivesWizard/WizardChrome'
import { useLivesWizard } from '@/pages/LivesWizard/WizardContext'

export function BulkValidateStep() {
  const navigate = useNavigate()
  const {
    action,
    rows,
    bulkDeleteRows,
    bulkAssignMode,
    setBulkAssignMode,
    bulkFilter,
    setBulkFilter,
    updateRowPlan,
    setStep,
  } = useLivesWizard()

  const isDelete = action === 'delete'

  if (isDelete) {
    const pass = bulkDeleteRows.filter((r) => r.status === 'pass')
    const fail = bulkDeleteRows.filter((r) => r.status === 'fail')
    return (
      <WizardChrome
        title="Bulk delete validation"
        onBack={() => setStep('upload')}
        onExit={() => navigate('/endorsements')}
        secondaryLabel="Back"
        onSecondary={() => setStep('upload')}
        primaryLabel="Continue to refund estimate"
        primaryDisabled={pass.length === 0}
        onPrimary={() => setStep('delete-summary')}
      >
        <FlowStepper
          steps={['Upload', 'Validate', 'Refund estimate']}
          activeIndex={1}
          bare
        />
        <Stats>
          <Stat>
            <strong>{bulkDeleteRows.length}</strong> total
          </Stat>
          <Stat>
            <strong>{pass.length}</strong> can be deleted
          </Stat>
          <Stat>
            <strong>{fail.length}</strong> need review
          </Stat>
        </Stats>
        <Table>
          <thead>
            <tr>
              <th>Employee</th>
              <th>DOL</th>
              <th>Status</th>
              <th>Error</th>
            </tr>
          </thead>
          <tbody>
            {bulkDeleteRows.map((r) => (
              <tr key={r.id}>
                <td>
                  {r.name} ({r.employeeId})
                </td>
                <td>{r.dateOfLeaving}</td>
                <td>{r.status}</td>
                <td>{'error' in r ? r.error : '—'}</td>
              </tr>
            ))}
          </tbody>
        </Table>
      </WizardChrome>
    )
  }

  const filtered =
    bulkFilter === 'all'
      ? rows
      : bulkFilter === 'deal'
        ? rows.filter((r) => r.dealId === flexDeal.id)
        : rows.filter((r) => r.status === bulkFilter)

  const pass = rows.filter((r) => r.status === 'pass').length
  const fail = rows.filter((r) => r.status === 'fail').length
  const review = rows.filter((r) => r.status === 'needs-review').length
  const needsMidterm = rows.some((r) => r.needsMidtermProof)
  const unresolved = rows.some(
    (r) => r.status === 'needs-review' || r.needsManualAssignment,
  )

  return (
    <WizardChrome
      title="Bulk validation"
      onBack={() => setStep('upload')}
      onExit={() => navigate('/endorsements')}
      secondaryLabel="Back"
      onSecondary={() => setStep('upload')}
      primaryLabel="Continue"
      primaryDisabled={
        !bulkAssignMode ||
        unresolved ||
        rows.filter((r) => r.status === 'pass' || r.status === 'needs-review')
          .length === 0
      }
      onPrimary={() =>
        setStep(needsMidterm ? 'midterm-proof' : 'bulk-review')
      }
    >
      <FlowStepper
        steps={['Upload', 'Validate', 'Review', 'Enrolment']}
        activeIndex={1}
        bare
      />

      <Stats>
        <Stat>
          <strong>{rows.length}</strong> total lives
        </Stat>
        <Stat>
          <strong>{pass}</strong> can be added
        </Stat>
        <Stat>
          <strong>{review}</strong> need review
        </Stat>
        <Stat>
          <strong>{fail}</strong> failed
        </Stat>
      </Stats>

      <Prompt>
        <PromptTitle>Assignment mode</PromptTitle>
        <PromptCopy>
          This deal has assignment rules. Choose how to assign plans and
          benefits.
        </PromptCopy>
        <RadioRow>
          <label>
            <input
              type="radio"
              checked={bulkAssignMode === 'rules'}
              onChange={() => setBulkAssignMode('rules')}
            />
            Assign automatically via rules
          </label>
          <label>
            <input
              type="radio"
              checked={bulkAssignMode === 'sheet'}
              onChange={() => setBulkAssignMode('sheet')}
            />
            Use plan/benefit from the sheet
          </label>
        </RadioRow>
      </Prompt>

      <Chips>
        {['all', 'pass', 'needs-review', 'fail', 'deal'].map((chip) => (
          <Chip
            key={chip}
            type="button"
            $active={bulkFilter === chip}
            onClick={() => setBulkFilter(chip)}
          >
            {chip === 'deal' ? flexDeal.name : chip}
          </Chip>
        ))}
      </Chips>

      <Table>
        <thead>
          <tr>
            <th>Member</th>
            <th>Deal / PG</th>
            <th>Status</th>
            <th>Error / action</th>
          </tr>
        </thead>
        <tbody>
          {filtered.map((row) => (
            <tr key={row.id}>
              <td>
                {row.name}
                <Sub>
                  {row.employeeId} · {row.relationship}
                </Sub>
              </td>
              <td>
                {flexDeal.name}
                <Sub>
                  Core:{' '}
                  {(row.purchaseGroupSelections['pg-core'] ?? []).join(', ') ||
                    '—'}
                </Sub>
              </td>
              <td>{row.status}</td>
              <td>
                {row.validationError ? (
                  <Err>
                    {row.validationField
                      ? `${row.validationField}: `
                      : ''}
                    {row.validationError}
                  </Err>
                ) : (
                  '—'
                )}
                {row.needsManualAssignment ? (
                  <Select
                    value={row.assignedPlanId ?? ''}
                    onChange={(e) => {
                      if (e.target.value) updateRowPlan(row.id, e.target.value)
                    }}
                  >
                    <option value="">Pick plan</option>
                    {flexDeal.plans.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </Select>
                ) : null}
              </td>
            </tr>
          ))}
        </tbody>
      </Table>
    </WizardChrome>
  )
}

const Stats = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
`

const Stat = styled.div`
  padding: 12px 16px;
  border-radius: 10px;
  background: ${({ theme }) => theme.colors.planeGreenLight};
  font-size: 13px;
  color: ${({ theme }) => theme.colors.textPrimary};

  strong {
    color: ${({ theme }) => theme.colors.emerald};
  }
`

const Prompt = styled.div`
  padding: 16px;
  border-radius: 12px;
  background: ${({ theme }) => theme.colors.surface1};
  border: 1px solid ${({ theme }) => theme.colors.disableFill};
`

const PromptTitle = styled.div`
  font-size: 14px;
  font-weight: 600;
`

const PromptCopy = styled.p`
  margin: 6px 0 10px;
  font-size: 13px;
  color: ${({ theme }) => theme.colors.textSecondary};
`

const RadioRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  font-size: 13px;

  label {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    cursor: pointer;
  }

  input {
    accent-color: ${({ theme }) => theme.colors.emerald};
  }
`

const Chips = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
`

const Chip = styled.button<{ $active: boolean }>`
  padding: 8px 12px;
  border-radius: 999px;
  border: 1px solid
    ${({ theme, $active }) =>
      $active ? theme.colors.emerald : theme.colors.defaultBorder};
  background: ${({ theme, $active }) =>
    $active ? theme.colors.planeGreenLight : theme.colors.surface1};
  color: ${({ theme, $active }) =>
    $active ? theme.colors.emerald : theme.colors.textPrimary};
  font-family: ${({ theme }) => theme.fontFamily};
  font-size: 12px;
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
    vertical-align: top;
  }

  th {
    font-size: 12px;
    color: ${({ theme }) => theme.colors.textSecondary};
    background: ${({ theme }) => theme.colors.surface0};
  }
`

const Sub = styled.div`
  margin-top: 2px;
  font-size: 11px;
  color: ${({ theme }) => theme.colors.textSecondary};
`

const Err = styled.div`
  color: ${({ theme }) => theme.colors.textError};
  margin-bottom: 6px;
`

const Select = styled.select`
  height: 36px;
  border-radius: 6px;
  border: 1px solid ${({ theme }) => theme.colors.defaultBorder};
  font-family: ${({ theme }) => theme.fontFamily};
  font-size: 12px;
`
