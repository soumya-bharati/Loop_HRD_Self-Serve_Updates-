import styled, { keyframes } from 'styled-components'

import { assets } from '@/assets/figma'
import { ModalPortal } from '@/components/ModalPortal'
import { coverCatalog } from '@/data/coverPlans'
import { flexDeal } from '@/data/flexDeal'

type Props = {
  open: boolean
  onClose: () => void
}

export function BulkAssignmentKnowMoreModal({ open, onClose }: Props) {
  if (!open) return null

  return (
    <ModalPortal>
      <Overlay role="presentation" onMouseDown={onClose}>
        <Dialog
          role="dialog"
          aria-modal="true"
          aria-labelledby="bulk-know-more-title"
          onMouseDown={(event) => event.stopPropagation()}
        >
          <Header>
            <div>
              <Title id="bulk-know-more-title">How benefits are assigned</Title>
              <Subtitle>
                We match each life against {flexDeal.name} assignment rules,
                then fall back to the company default or sheet values.
              </Subtitle>
            </div>
            <CloseButton type="button" aria-label="Close" onClick={onClose}>
              <img src={assets.modalDismiss} alt="" width={16} height={16} />
            </CloseButton>
          </Header>

          <Body>
            <RuleCard>
              <RuleLabel>1. Assignment rules</RuleLabel>
              <RuleCopy>
                Employee attributes (for example department) are matched to a
                recommended plan — same logic as single-add auto-assign.
              </RuleCopy>
              <RuleList>
                {flexDeal.assignmentRules.map((rule) => {
                  const plan = flexDeal.plans.find((p) => p.id === rule.planId)
                  return (
                    <li key={rule.id}>
                      {rule.department} → {plan?.name ?? rule.planId}
                    </li>
                  )
                })}
              </RuleList>
            </RuleCard>

            <RuleCard>
              <RuleLabel>2. Covers and plans</RuleLabel>
              <RuleCopy>
                That plan then decides which cover and which plan within it each
                life is enrolled on.
              </RuleCopy>
              {coverCatalog.map((cover) => (
                <CoverRule key={cover.id}>
                  <CoverRuleHead>
                    <CoverRuleName>{cover.name}</CoverRuleName>
                    <CoverRuleCode>{cover.shortLabel}</CoverRuleCode>
                  </CoverRuleHead>
                  <PlanPills>
                    {cover.plans.map((plan) => (
                      <PlanPill key={plan.id}>{plan.label}</PlanPill>
                    ))}
                  </PlanPills>
                  <RuleCopy>{cover.assignmentNote}</RuleCopy>
                </CoverRule>
              ))}
            </RuleCard>

            <RuleCard>
              <RuleLabel>3. Sheet / manual</RuleLabel>
              <RuleCopy>
                Choose “Use plan/benefit from the sheet” to honour uploaded
                values, or pick a plan inline when a life needs review.
              </RuleCopy>
            </RuleCard>
          </Body>

          <Footer>
            <PrimaryButton type="button" onClick={onClose}>
              Got it
            </PrimaryButton>
          </Footer>
        </Dialog>
      </Overlay>
    </ModalPortal>
  )
}

const fadeIn = keyframes`
  from { opacity: 0; }
  to { opacity: 1; }
`

const scaleIn = keyframes`
  from { opacity: 0; transform: translateY(12px) scale(0.98); }
  to { opacity: 1; transform: translateY(0) scale(1); }
`

const Overlay = styled.div`
  position: fixed;
  inset: 0;
  z-index: 180;
  display: grid;
  place-items: center;
  padding: 24px 5vw;
  background: rgba(45, 55, 72, 0.48);
  animation: ${fadeIn} 160ms ease-out;
`

const Dialog = styled.div`
  width: min(560px, 100%);
  max-height: min(90vh, 720px);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  border-radius: 16px;
  background: ${({ theme }) => theme.colors.surface0};
  box-shadow: 0 20px 60px rgba(16, 24, 40, 0.2);
  animation: ${scaleIn} 200ms ease-out;
`

const Header = styled.header`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  padding: 20px 24px;
  background: ${({ theme }) => theme.colors.surface1};
  border-bottom: 0.5px solid ${({ theme }) => theme.colors.defaultBorder};
`

const Title = styled.h2`
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.textPrimary};
`

const Subtitle = styled.p`
  margin: 6px 0 0;
  font-size: 13px;
  line-height: 18px;
  color: ${({ theme }) => theme.colors.textSecondary};
`

const CloseButton = styled.button`
  flex-shrink: 0;
  display: grid;
  place-items: center;
  width: 32px;
  height: 32px;
  padding: 0;
  border: 0;
  border-radius: 8px;
  background: transparent;
  cursor: pointer;

  &:hover {
    background: ${({ theme }) => theme.colors.disableFill};
  }
`

const Body = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 20px 24px;
  overflow: auto;
`

const RuleCard = styled.section`
  padding: 14px 16px;
  border-radius: 12px;
  background: ${({ theme }) => theme.colors.surface1};
  border: 1px solid ${({ theme }) => theme.colors.disableFill};
`

const RuleLabel = styled.h3`
  margin: 0;
  font-size: 14px;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.textPrimary};
`

const RuleCopy = styled.p`
  margin: 6px 0 0;
  font-size: 13px;
  line-height: 18px;
  color: ${({ theme }) => theme.colors.textSecondary};
`

const RuleList = styled.ul`
  margin: 10px 0 0;
  padding-left: 18px;
  font-size: 13px;
  color: ${({ theme }) => theme.colors.textPrimary};
  display: flex;
  flex-direction: column;
  gap: 4px;
`

const CoverRule = styled.div`
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid ${({ theme }) => theme.colors.disableFill};
`

const CoverRuleHead = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`

const CoverRuleName = styled.h4`
  margin: 0;
  font-size: 13px;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.textPrimary};
`

const CoverRuleCode = styled.span`
  padding: 2px 8px;
  border-radius: 999px;
  background: ${({ theme }) => theme.colors.surface0};
  border: 1px solid ${({ theme }) => theme.colors.disableFill};
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 0.2px;
  color: ${({ theme }) => theme.colors.textSecondary};
`

const PlanPills = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 10px;
`

const PlanPill = styled.span`
  padding: 6px 10px;
  border-radius: 999px;
  background: ${({ theme }) => theme.colors.planeGreenLight};
  color: ${({ theme }) => theme.colors.emerald};
  font-size: 12px;
  font-weight: 500;
`

const Footer = styled.footer`
  display: flex;
  justify-content: flex-end;
  padding: 16px 24px 20px;
  border-top: 0.5px solid ${({ theme }) => theme.colors.defaultBorder};
`

const PrimaryButton = styled.button`
  height: 40px;
  padding: 0 18px;
  border: 0;
  border-radius: 8px;
  background: ${({ theme }) => theme.colors.emerald};
  color: white;
  font: inherit;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;

  &:hover {
    filter: brightness(0.96);
  }
`
