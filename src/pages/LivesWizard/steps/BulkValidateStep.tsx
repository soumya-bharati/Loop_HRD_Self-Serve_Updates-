import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import styled from 'styled-components'

import {
  flexDeal,
  getPlanById,
  type BulkMemberRow,
} from '@/data/flexDeal'
import { BulkAssignmentKnowMoreModal } from '@/pages/LivesWizard/components/BulkAssignmentKnowMoreModal'
import { WizardChrome } from '@/pages/LivesWizard/WizardChrome'
import { useLivesWizard } from '@/pages/LivesWizard/WizardContext'
import {
  isWorkspaceReturn,
  wizardExitPath,
} from '@/pages/ManageLives/launchWizard'

function isHighlighted(row: BulkMemberRow) {
  return (
    row.status === 'fail' ||
    row.status === 'needs-review' ||
    row.needsManualAssignment
  )
}

function statusLabel(status: BulkMemberRow['status']) {
  if (status === 'needs-review') return 'Needs review'
  if (status === 'fail') return 'Fail'
  return 'Pass'
}

function planLabel(row: BulkMemberRow) {
  if (!row.assignedPlanId) return 'Unassigned'
  return getPlanById(row.assignedPlanId)?.name ?? row.assignedPlanId
}

export function BulkValidateStep() {
  const navigate = useNavigate()
  const {
    action,
    rows,
    bulkDeleteRows,
    bulkFilter,
    setBulkFilter,
    updateRowPlan,
    resolveRowValidation,
    setStep,
  } = useLivesWizard()

  const [knowMoreOpen, setKnowMoreOpen] = useState(false)
  const [draftFields, setDraftFields] = useState<Record<string, string>>({})

  const employees = useMemo(
    () => rows.filter((r) => r.relationship === 'Self').length,
    [rows],
  )
  const dependants = rows.length - employees

  const benefitBreakdown = useMemo(() => {
    const counts = new Map<string, number>()
    for (const row of rows) {
      const label = planLabel(row)
      counts.set(label, (counts.get(label) ?? 0) + 1)
    }
    return [...counts.entries()].sort((a, b) => b[1] - a[1])
  }, [rows])

  const isDelete = action === 'delete'
  // The workspace already collected the sheet, so back leaves the wizard.
  const goBack = isWorkspaceReturn()
    ? () => navigate('/manage-lives')
    : () => setStep('upload')

  if (isDelete) {
    const pass = bulkDeleteRows.filter((r) => r.status === 'pass')
    const fail = bulkDeleteRows.filter((r) => r.status === 'fail')
    return (
      <WizardChrome
        title="Bulk delete validation"
        onBack={goBack}
        onExit={() => navigate(wizardExitPath())}
        secondaryLabel="Back"
        onSecondary={goBack}
        primaryLabel="Continue to refund estimate"
        primaryDisabled={pass.length === 0}
        onPrimary={() => setStep('delete-summary')}
      >
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
                <td data-label="Employee">
                  {r.name} ({r.employeeId})
                </td>
                <td data-label="DOL">{r.dateOfLeaving}</td>
                <td data-label="Status">{r.status}</td>
                <td data-label="Error">{'error' in r ? r.error : '—'}</td>
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

  const unresolved = rows.some(
    (r) => r.status === 'needs-review' || r.needsManualAssignment,
  )

  return (
    <WizardChrome
      title="Bulk validation"
      onBack={goBack}
      onExit={() => navigate(wizardExitPath())}
      secondaryLabel="Back"
      onSecondary={goBack}
      primaryLabel="Continue"
      primaryDisabled={
        unresolved ||
        rows.filter((r) => r.status === 'pass' || r.status === 'needs-review')
          .length === 0
      }
      onPrimary={() => setStep('bulk-review')}
    >
      <MetricsGrid>
        <MetricCard>
          <MetricLabel>Uploaded lives</MetricLabel>
          <MetricValue>{rows.length}</MetricValue>
          <MetricHint>Rows parsed from your sheet</MetricHint>
        </MetricCard>
        <MetricCard>
          <MetricLabel>Employee / Dependant</MetricLabel>
          <MetricValue>
            {employees} / {dependants}
          </MetricValue>
          <MetricHint>Self vs family members</MetricHint>
        </MetricCard>
        <MetricCard $wide>
          <MetricHeader>
            <div>
              <MetricLabel>Benefit assignment</MetricLabel>
              <MetricValue $compact>
                {benefitBreakdown
                  .map(([name, count]) => `${count} ${name}`)
                  .join(' · ')}
              </MetricValue>
            </div>
            <KnowMore type="button" onClick={() => setKnowMoreOpen(true)}>
              Know more
            </KnowMore>
          </MetricHeader>
          <BenefitChips>
            {benefitBreakdown.map(([name, count]) => (
              <BenefitChip key={name}>
                <strong>{count}</strong> {name}
              </BenefitChip>
            ))}
          </BenefitChips>
        </MetricCard>
      </MetricsGrid>

      <Chips>
        {['all', 'pass', 'needs-review', 'fail', 'deal'].map((chip) => (
          <Chip
            key={chip}
            type="button"
            $active={bulkFilter === chip}
            onClick={() => setBulkFilter(chip)}
          >
            {chip === 'deal'
              ? flexDeal.name
              : chip === 'needs-review'
                ? 'Needs review'
                : chip === 'pass'
                  ? 'Pass'
                  : chip === 'fail'
                    ? 'Fail'
                    : 'All'}
          </Chip>
        ))}
      </Chips>

      <Table>
        <thead>
          <tr>
            <th>Employee</th>
            <th>Relationship</th>
            <th>Plan / Benefits</th>
            <th>Status</th>
            <th>Error / edit</th>
          </tr>
        </thead>
        <tbody>
          {filtered.map((row) => {
            const highlight = isHighlighted(row)
            const draft =
              draftFields[row.id] ??
              (row.validationField?.toLowerCase().includes('email')
                ? row.email
                : '')
            return (
              <Tr key={row.id} $highlight={highlight}>
                <td data-label="Employee">
                  {row.name}
                  <Sub>{row.employeeId}</Sub>
                </td>
                <td data-label="Relationship">{row.relationship}</td>
                <td data-label="Plan / Benefits">
                  {highlight ? (
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
                  ) : (
                    <>
                      {planLabel(row)}
                      <Sub>
                        {(row.benefitIds ?? []).length
                          ? `${row.benefitIds.length} benefit(s)`
                          : '—'}
                      </Sub>
                    </>
                  )}
                </td>
                <td data-label="Status">
                  <StatusChip $tone={row.status}>
                    {statusLabel(row.status)}
                  </StatusChip>
                </td>
                <td data-label="Error / edit">
                  {row.validationError ? (
                    <Err>
                      {row.validationField ? `${row.validationField}: ` : ''}
                      {row.validationError}
                    </Err>
                  ) : (
                    <Muted>—</Muted>
                  )}
                  {highlight && row.validationField ? (
                    <EditRow>
                      <FieldInput
                        value={draft}
                        placeholder={`Fix ${row.validationField}`}
                        aria-label={`Edit ${row.validationField} for ${row.name}`}
                        onChange={(e) =>
                          setDraftFields((current) => ({
                            ...current,
                            [row.id]: e.target.value,
                          }))
                        }
                      />
                      <SaveBtn
                        type="button"
                        onClick={() => {
                          resolveRowValidation(row.id, draft)
                          setDraftFields((current) => {
                            const next = { ...current }
                            delete next[row.id]
                            return next
                          })
                        }}
                      >
                        Save
                      </SaveBtn>
                    </EditRow>
                  ) : null}
                </td>
              </Tr>
            )
          })}
        </tbody>
      </Table>

      <BulkAssignmentKnowMoreModal
        open={knowMoreOpen}
        onClose={() => setKnowMoreOpen(false)}
      />
    </WizardChrome>
  )
}

const MetricsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;

  @media (min-width: 900px) {
    grid-template-columns: 1fr 1fr 1.6fr;
  }
`

const MetricCard = styled.div<{ $wide?: boolean }>`
  padding: 16px;
  border-radius: 12px;
  background: ${({ theme }) => theme.colors.planeGreenLight};
  border: 1px solid ${({ theme }) => theme.colors.disableFill};

  @media (max-width: 899px) {
    grid-column: ${({ $wide }) => ($wide ? '1 / -1' : 'auto')};
  }
`

const MetricHeader = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
`

const MetricLabel = styled.div`
  font-size: 12px;
  font-weight: 500;
  letter-spacing: 0.2px;
  color: ${({ theme }) => theme.colors.textSecondary};
`

const MetricValue = styled.div<{ $compact?: boolean }>`
  margin-top: 6px;
  font-size: ${({ $compact }) => ($compact ? '15px' : '28px')};
  font-weight: 600;
  line-height: ${({ $compact }) => ($compact ? '22px' : '34px')};
  color: ${({ theme }) => theme.colors.emerald};
  word-break: break-word;
`

const MetricHint = styled.div`
  margin-top: 4px;
  font-size: 12px;
  color: ${({ theme }) => theme.colors.textSecondary};
`

const KnowMore = styled.button`
  flex-shrink: 0;
  height: 32px;
  padding: 0 12px;
  border-radius: 8px;
  border: 1px solid ${({ theme }) => theme.colors.defaultBorder};
  background: ${({ theme }) => theme.colors.surface1};
  font: inherit;
  font-size: 12px;
  font-weight: 500;
  color: ${({ theme }) => theme.colors.textPrimary};
  cursor: pointer;

  &:hover {
    border-color: ${({ theme }) => theme.colors.emerald};
    color: ${({ theme }) => theme.colors.emerald};
  }
`

const BenefitChips = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 12px;
`

const BenefitChip = styled.span`
  padding: 6px 10px;
  border-radius: 999px;
  background: ${({ theme }) => theme.colors.surface1};
  font-size: 12px;
  color: ${({ theme }) => theme.colors.textPrimary};

  strong {
    color: ${({ theme }) => theme.colors.emerald};
  }
`

const Stats = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 12px;

  @media (max-width: 640px) {
    gap: 8px;
  }
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

  @media (max-width: 640px) {
    flex: 1 1 calc(50% - 4px);
    min-width: 0;
    padding: 10px 12px;
    font-size: 12px;
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
    vertical-align: top;
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

const Tr = styled.tr<{ $highlight: boolean }>`
  background: ${({ $highlight }) =>
    $highlight ? 'rgba(255, 107, 107, 0.08)' : 'transparent'};

  td:first-child {
    box-shadow: ${({ theme, $highlight }) =>
      $highlight ? `inset 3px 0 0 ${theme.colors.textError}` : 'none'};
  }
`

const StatusChip = styled.span<{
  $tone: BulkMemberRow['status']
}>`
  display: inline-flex;
  align-items: center;
  padding: 4px 8px;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.2px;
  background: ${({ theme, $tone }) =>
    $tone === 'pass'
      ? theme.colors.planeGreenLight
      : $tone === 'fail'
        ? 'rgba(255, 107, 107, 0.14)'
        : 'rgba(245, 166, 35, 0.16)'};
  color: ${({ theme, $tone }) =>
    $tone === 'pass'
      ? theme.colors.emerald
      : $tone === 'fail'
        ? theme.colors.textError
        : '#B26A00'};
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

const Muted = styled.span`
  color: ${({ theme }) => theme.colors.textSecondary};
`

const EditRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
`

const FieldInput = styled.input`
  height: 36px;
  min-width: 140px;
  flex: 1;
  padding: 0 10px;
  border-radius: 6px;
  border: 1px solid ${({ theme }) => theme.colors.defaultBorder};
  font-family: ${({ theme }) => theme.fontFamily};
  font-size: 12px;
  box-sizing: border-box;
`

const SaveBtn = styled.button`
  height: 36px;
  padding: 0 12px;
  border: 0;
  border-radius: 6px;
  background: ${({ theme }) => theme.colors.emerald};
  color: white;
  font: inherit;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
`

const Select = styled.select`
  height: 36px;
  max-width: 100%;
  border-radius: 6px;
  border: 1px solid ${({ theme }) => theme.colors.defaultBorder};
  font-family: ${({ theme }) => theme.fontFamily};
  font-size: 12px;

  @media (max-width: 640px) {
    width: 100%;
    box-sizing: border-box;
  }
`
