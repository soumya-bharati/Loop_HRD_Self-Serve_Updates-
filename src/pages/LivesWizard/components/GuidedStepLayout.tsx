import type { ReactNode } from 'react'
import styled from 'styled-components'

import {
  GuidedFlowChrome,
  type GuidedFlowStep,
} from '@/pages/LivesWizard/components/GuidedFlowChrome'

/**
 * One screen of a guided flow: the bulk-style progress chrome plus the content
 * rhythm and footer buttons every step shares.
 */
export function GuidedStepLayout({
  steps,
  activeIndex,
  onExit,
  title,
  children,
  backLabel = 'Go Back',
  onBack,
  secondaryLabel,
  onSecondary,
  primaryLabel,
  onPrimary,
  primaryDisabled,
}: {
  steps: readonly GuidedFlowStep[]
  activeIndex: number
  onExit: () => void
  title?: string
  children: ReactNode
  backLabel?: string
  onBack?: () => void
  secondaryLabel?: string
  onSecondary?: () => void
  primaryLabel?: string
  onPrimary?: () => void
  primaryDisabled?: boolean
}) {
  return (
    <GuidedFlowChrome
      steps={steps}
      activeIndex={activeIndex}
      onExit={onExit}
    >
      <Content>
        {title ? <Title>{title}</Title> : null}
        {children}
        {primaryLabel || onBack || secondaryLabel ? (
          <Footer>
            {onBack ? (
              <OutlineButton type="button" onClick={onBack}>
                {backLabel}
              </OutlineButton>
            ) : null}
            {secondaryLabel && onSecondary ? (
              <OutlineButton type="button" onClick={onSecondary}>
                {secondaryLabel}
              </OutlineButton>
            ) : null}
            {primaryLabel && onPrimary ? (
              <PrimaryButton
                type="button"
                disabled={primaryDisabled}
                onClick={onPrimary}
              >
                {primaryLabel}
              </PrimaryButton>
            ) : null}
          </Footer>
        ) : null}
      </Content>
    </GuidedFlowChrome>
  )
}

const Content = styled.div`
  display: flex;
  width: 100%;
  flex-direction: column;
  gap: 24px;
  padding: 72px 40px 24px;
  box-sizing: border-box;

  @media (max-width: ${({ theme }) => theme.breakpoints.md}) {
    padding: 72px ${({ theme }) => theme.layout.contentPadXMobile} 32px;
  }
`

const Title = styled.h1`
  margin: 0;
  color: ${({ theme }) => theme.colors.textPrimary};
  font-size: 18px;
  font-weight: 500;
  line-height: 24px;
  letter-spacing: 0.2px;
`

const Footer = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 16px;
  padding-top: 8px;
`

const OutlineButton = styled.button`
  height: 48px;
  padding: 14px 24px;
  border: 1px solid ${({ theme }) => theme.colors.emerald};
  border-radius: 12px;
  background: ${({ theme }) => theme.colors.surface1};
  color: ${({ theme }) => theme.colors.emerald};
  font: inherit;
  font-size: 14px;
  font-weight: 500;
  line-height: 20px;
  letter-spacing: 0.2px;
  cursor: pointer;
`

const PrimaryButton = styled.button`
  height: 48px;
  padding: 14px 24px;
  border: 0;
  border-radius: 12px;
  background: ${({ theme }) => theme.colors.fillGreen};
  color: ${({ theme }) => theme.colors.emerald};
  font: inherit;
  font-size: 14px;
  font-weight: 500;
  line-height: 20px;
  letter-spacing: 0.2px;
  cursor: pointer;

  &:disabled {
    background: ${({ theme }) => theme.colors.disableFill};
    color: ${({ theme }) => theme.colors.textSecondary};
    cursor: not-allowed;
  }
`
