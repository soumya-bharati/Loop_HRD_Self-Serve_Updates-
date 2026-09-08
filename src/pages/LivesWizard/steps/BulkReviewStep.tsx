import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import styled from 'styled-components'

import {
  breakupTotals,
  buildCoverBreakup,
  buildInsurerGroups,
  isRowAssigned,
} from '@/data/coverPlans'
import { EndorsementCostReview } from '@/pages/LivesWizard/components/EndorsementCostReview'
import { WizardChrome } from '@/pages/LivesWizard/WizardChrome'
import { useLivesWizard } from '@/pages/LivesWizard/WizardContext'
import { isWorkspaceReturn, wizardExitPath } from '@/pages/ManageLives/launchWizard'

export function BulkReviewStep() {
  const navigate = useNavigate()
  const { rows, setStep, completeFlow } = useLivesWizard()
  const returning = isWorkspaceReturn()

  const { breakup, groups, totals, employees, dependants } = useMemo(() => {
    const assigned = rows.filter(isRowAssigned)
    const coverBreakup = buildCoverBreakup(rows)
    return {
      breakup: coverBreakup,
      groups: buildInsurerGroups(coverBreakup),
      totals: breakupTotals(rows, coverBreakup),
      employees: assigned.filter((row) => row.relationship === 'Self').length,
      dependants: assigned.filter((row) => row.relationship !== 'Self').length,
    }
  }, [rows])

  const coverEnrolments = breakup.reduce((sum, item) => sum + item.lives, 0)
  const goBack = returning
    ? () => navigate('/manage-lives')
    : () => setStep('bulk-validate')

  return (
    <WizardChrome
      title="Review & cost"
      onBack={goBack}
      onExit={() => navigate(wizardExitPath())}
      secondaryLabel="Go Back"
      onSecondary={goBack}
      primaryLabel={
        returning
          ? 'Add to Pending Changes'
          : `Submit ${totals.lives} ${totals.lives === 1 ? 'Life' : 'Lives'}`
      }
      primaryDisabled={totals.lives === 0}
      onPrimary={() => (returning ? completeFlow() : setStep('enrolment'))}
      primaryHint={{
        title: 'Submit Your Endo! ⚡',
        body: 'If everything looks good click below to submit your endo!',
      }}
    >
      <LivesSummary>
        <SummaryStat>
          <SummaryValue>{totals.lives}</SummaryValue>
          <SummaryLabel>Total lives</SummaryLabel>
        </SummaryStat>
        <SummaryStat>
          <SummaryValue>{employees}</SummaryValue>
          <SummaryLabel>
            {employees === 1 ? 'Employee' : 'Employees'}
          </SummaryLabel>
        </SummaryStat>
        <SummaryStat>
          <SummaryValue>{dependants}</SummaryValue>
          <SummaryLabel>
            {dependants === 1 ? 'Dependant' : 'Dependants'}
          </SummaryLabel>
        </SummaryStat>
        <SummaryStat>
          <SummaryValue>{coverEnrolments}</SummaryValue>
          <SummaryLabel>Cover enrolments</SummaryLabel>
        </SummaryStat>
      </LivesSummary>

      <EndorsementCostReview
        groups={groups}
        totalLives={totals.lives}
        totalCost={totals.cost}
        emptyMessage="No lives are assigned yet. Go back and resolve the flagged rows."
      />
    </WizardChrome>
  )
}

const LivesSummary = styled.section`
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;

  @media (max-width: ${({ theme }) => theme.breakpoints.lg}) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  @media (max-width: ${({ theme }) => theme.breakpoints.sm}) {
    gap: 8px;
  }
`

const SummaryStat = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
  padding: 16px 18px;
  border-radius: 14px;
  background: ${({ theme }) => theme.colors.surface1};
  border: 1px solid ${({ theme }) => theme.colors.disableFill};
  box-sizing: border-box;

  @media (max-width: ${({ theme }) => theme.breakpoints.sm}) {
    padding: 12px;
  }
`

const SummaryValue = styled.strong`
  font-size: 24px;
  font-weight: 600;
  line-height: 32px;
  color: ${({ theme }) => theme.colors.emerald};

  @media (max-width: ${({ theme }) => theme.breakpoints.sm}) {
    font-size: 20px;
    line-height: 26px;
  }
`

const SummaryLabel = styled.span`
  font-size: 13px;
  font-weight: 500;
  line-height: 18px;
  color: ${({ theme }) => theme.colors.textSecondary};
`
