import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import styled from 'styled-components'

import { EnrolmentSettings } from '@/pages/LivesWizard/components/EnrolmentSettings'
import { emptyEnrolmentSettings } from '@/data/flexDeal'
import { usePendingChanges } from '@/pages/ManageLives/PendingChangesContext'
import { EndorsementCostPanel } from '@/pages/ManageLives/landings/EndorsementCostPanel'
import {
  GROUP_LABELS,
  actionGroup,
  formatINR,
  type PendingChange,
} from '@/pages/ManageLives/pendingChanges'

export function ReviewChangesPage() {
  const navigate = useNavigate()
  const { changes, removeChange, clearChanges } = usePendingChanges()
  const [enrolment, setEnrolment] = useState(emptyEnrolmentSettings)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState<{
    reference: string
    count: number
    net: number
    hasAdditions: boolean
  } | null>(null)
  const [simulateFailure, setSimulateFailure] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [expanded, setExpanded] = useState<string | null>(null)

  const grouped = useMemo(() => {
    const map: Record<string, PendingChange[]> = {
      additions: [],
      edits: [],
      dependants: [],
      exits: [],
      bulk: [],
    }
    for (const change of changes) {
      map[actionGroup(change.action)].push(change)
    }
    return map
  }, [changes])

  const totals = useMemo(() => {
    let premium = 0
    let refunds = 0
    let additions = 0
    let removals = 0
    for (const change of changes) {
      if (change.costImpact?.type === 'charge') premium += change.costImpact.amount
      if (change.costImpact?.type === 'refund') refunds += change.costImpact.amount
      if (change.action === 'add_employee' || change.action === 'bulk_add') {
        additions += 1
      }
      if (
        change.action === 'employee_exit' ||
        change.action === 'bulk_remove' ||
        change.action === 'remove_dependant'
      ) {
        removals += 1
      }
    }
    return { premium, refunds, additions, removals, net: premium - refunds }
  }, [changes])

  const submit = async () => {
    setSubmitError(null)
    setSubmitting(true)
    await new Promise((resolve) => window.setTimeout(resolve, 900))
    if (simulateFailure) {
      setSubmitting(false)
      setSubmitError('Submission failed. Pending Changes were kept so you can retry.')
      return
    }
    const reference = `ENDO-${Date.now().toString(36).toUpperCase()}`
    const count = changes.length
    const net = totals.net
    const hasAdditions = changes.some(
      (change) =>
        change.action === 'add_employee' || change.action === 'bulk_add',
    )
    clearChanges()
    setSubmitting(false)
    setSubmitted({ reference, count, net, hasAdditions })
  }

  if (submitted) {
    return (
      <SubmittedStage>
        <EndorsementCostPanel
          rows={[]}
          title="You’ve successfully submitted your data to Loop!"
          caption="Here is your submission summary"
          summaryItems={[
            { label: 'Reference number', value: submitted.reference },
            { label: 'Changes submitted', value: `${submitted.count}` },
            { label: 'Estimated net impact', value: formatINR(submitted.net) },
            { label: 'Processing status', value: 'Queued' },
          ]}
          notice="Your changes will be reviewed by Loop before they are sent to the insurer."
          showAccess={submitted.hasAdditions}
          onDone={() => navigate('/manage-lives')}
        />
      </SubmittedStage>
    )
  }

  return (
    <Page>
      <Back to="/manage-lives">← Continue managing lives</Back>
      <Title>Review changes</Title>
      {changes.length === 0 ? (
        <Empty>No pending changes. Add work from Manage Lives first.</Empty>
      ) : (
        <>
          {(Object.keys(GROUP_LABELS) as Array<keyof typeof GROUP_LABELS>).map(
            (key) =>
              grouped[key].length ? (
                <Card key={key}>
                  <h2>{GROUP_LABELS[key]}</h2>
                  {grouped[key].map((change) => (
                    <Row key={change.id}>
                      <div>
                        <strong>{change.employeeName}</strong>
                        <span>{change.description}</span>
                        <span>
                          {change.entityName ?? '—'} · {change.dealName ?? '—'}
                          {change.effectiveDate ? ` · ${change.effectiveDate}` : ''}
                        </span>
                        <span>
                          {change.costImpact
                            ? `${change.costImpact.type} ${formatINR(change.costImpact.amount)}`
                            : 'No financial impact'}
                        </span>
                        {change.action.startsWith('bulk') ? (
                          <Ghost
                            type="button"
                            onClick={() =>
                              setExpanded((current) =>
                                current === change.id ? null : change.id,
                              )
                            }
                          >
                            {expanded === change.id ? 'Hide employees' : 'View employees'}
                          </Ghost>
                        ) : null}
                        {expanded === change.id ? (
                          <BulkList>
                            {((change.payload as { rows?: { employee: string; employeeId: string }[] })
                              ?.rows ?? []).map((row) => (
                              <li key={row.employeeId}>
                                {row.employee} · {row.employeeId}
                              </li>
                            ))}
                          </BulkList>
                        ) : null}
                      </div>
                      <Ghost type="button" onClick={() => removeChange(change.id)}>
                        Remove
                      </Ghost>
                    </Row>
                  ))}
                </Card>
              ) : null,
          )}

          <Card>
            <h2>Summary</h2>
            <Field>Total additions {totals.additions}</Field>
            <Field>Total removals {totals.removals}</Field>
            <Field>Estimated premium {formatINR(totals.premium)}</Field>
            <Field>Estimated refunds {formatINR(totals.refunds)}</Field>
            <Field>Net impact {formatINR(totals.net)}</Field>
          </Card>

          {changes.some(
            (change) =>
              change.action === 'add_employee' || change.action === 'bulk_add',
          ) ? (
          <Card>
            <h2>Enrolment (optional)</h2>
            <EnrolmentSettings value={enrolment} onChange={setEnrolment} />
          </Card>
          ) : null}

          <label>
            <input
              type="checkbox"
              checked={simulateFailure}
              onChange={(event) => setSimulateFailure(event.target.checked)}
            />{' '}
            Simulate submit failure
          </label>
          {submitError ? <ErrorText>{submitError}</ErrorText> : null}
          <ButtonRow>
            <Primary type="button" disabled={submitting} onClick={() => void submit()}>
              {submitting ? 'Submitting…' : 'Submit changes'}
            </Primary>
            <Ghost type="button" onClick={() => navigate('/manage-lives')}>
              Continue managing lives
            </Ghost>
          </ButtonRow>
        </>
      )}
    </Page>
  )
}

const Page = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 32px ${({ theme }) => theme.layout.contentPadX} 64px;

  @media (max-width: ${({ theme }) => theme.breakpoints.md}) {
    padding: 20px ${({ theme }) => theme.layout.contentPadXMobile} 40px;
  }
`

const SubmittedStage = styled.div`
  display: flex;
  width: 100%;
  min-height: calc(100vh - ${({ theme }) => theme.layout.topNavHeight});
`

const Back = styled(Link)`
  color: ${({ theme }) => theme.colors.emerald};
  text-decoration: none;
`

const Title = styled.h1`
  margin: 0;
  font-size: 24px;
`

const Empty = styled.p`
  color: ${({ theme }) => theme.colors.textSecondary};
`

const Card = styled.section`
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 20px;
  border-radius: 16px;
  background: ${({ theme }) => theme.colors.surface1};
  border: 1px solid ${({ theme }) => theme.colors.disableFill};

  h1,
  h2 {
    margin: 0;
  }
`

const Row = styled.div`
  display: flex;
  justify-content: space-between;
  gap: 16px;
  padding: 12px 0;
  border-top: 1px solid ${({ theme }) => theme.colors.disableFill};

  div {
    display: flex;
    flex-direction: column;
    gap: 4px;
    font-size: 13px;
  }
`

const Field = styled.div`
  font-size: 14px;
`

const ButtonRow = styled.div`
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
`

const Primary = styled.button`
  height: 44px;
  padding: 0 20px;
  border: 0;
  border-radius: 12px;
  background: ${({ theme }) => theme.colors.fillGreen};
  color: ${({ theme }) => theme.colors.emerald};
  font: inherit;
  font-weight: 600;
  cursor: pointer;
`

const Ghost = styled.button`
  border: 0;
  background: transparent;
  color: ${({ theme }) => theme.colors.emerald};
  font: inherit;
  cursor: pointer;
`

const BulkList = styled.ul`
  margin: 8px 0 0;
  padding-left: 18px;
`

const ErrorText = styled.p`
  color: ${({ theme }) => theme.colors.textError};
`
