import type { ReactNode } from 'react'
import styled from 'styled-components'

import { assets } from '@/assets/figma'

export type GuidedFlowStep = {
  title: string
  description: string
}

export function GuidedFlowChrome({
  steps,
  activeIndex,
  onExit,
  children,
}: {
  steps: readonly GuidedFlowStep[]
  activeIndex: number
  onExit: () => void
  children: ReactNode
}) {
  return (
    <Page>
      <ProgressPanel>
        <Logo src={assets.loopLogoYellow} alt="loop" />
        <ProgressList aria-label="Add employee progress">
          {steps.map((step, index) => {
            const active = index === activeIndex
            const done = index < activeIndex
            return (
              <ProgressStep key={step.title}>
                <StepRail>
                  <StepDot $active={active} $done={done} />
                  {index < steps.length - 1 ? (
                    <StepConnector $done={done} />
                  ) : null}
                </StepRail>
                <StepCopy $last={index === steps.length - 1}>
                  <StepTitle>{step.title}</StepTitle>
                  <StepDescription>{step.description}</StepDescription>
                </StepCopy>
              </ProgressStep>
            )
          })}
        </ProgressList>
      </ProgressPanel>

      <Workspace>
        <ExitButton type="button" onClick={onExit}>
          Exit
        </ExitButton>
        {children}
      </Workspace>
    </Page>
  )
}

const Page = styled.div`
  display: flex;
  gap: 10px;
  width: 100%;
  min-height: 100vh;
  padding: 10px;
  background: ${({ theme }) => theme.colors.surface0};

  @media (max-width: ${({ theme }) => theme.breakpoints.md}) {
    flex-direction: column;
  }
`

const ProgressPanel = styled.aside`
  width: 330px;
  min-height: calc(100vh - 20px);
  flex: 0 0 330px;
  padding: 24px;
  overflow: hidden;
  border-radius: ${({ theme }) => theme.radii.sm};
  background: ${({ theme }) => theme.colors.emerald};

  @media (max-width: ${({ theme }) => theme.breakpoints.lg}) {
    width: 270px;
    flex-basis: 270px;
  }

  @media (max-width: ${({ theme }) => theme.breakpoints.md}) {
    width: 100%;
    min-height: auto;
    flex-basis: auto;
  }
`

const Logo = styled.img`
  display: block;
  width: 67px;
  height: 32px;
  object-fit: contain;
`

const ProgressList = styled.div`
  display: flex;
  flex-direction: column;
  margin-top: 16px;
`

const ProgressStep = styled.div`
  display: flex;
  gap: 12px;
`

const StepRail = styled.div`
  display: flex;
  width: 14px;
  flex: 0 0 14px;
  flex-direction: column;
  align-items: center;
  padding-top: 4px;
`

const StepDot = styled.span<{ $active: boolean; $done: boolean }>`
  width: 14px;
  height: 14px;
  flex: 0 0 14px;
  border: 1.5px solid
    ${({ theme, $active, $done }) =>
      $active || $done
        ? theme.colors.textTertiary
        : 'rgba(230, 239, 237, 0.5)'};
  border-radius: 50%;
  background: ${({ theme, $active }) =>
    $active ? theme.colors.textTertiary : 'transparent'};
`

const StepConnector = styled.span<{ $done: boolean }>`
  min-height: 44px;
  flex: 1;
  margin-top: 8px;
  border-left: 1px dashed
    ${({ $done }) =>
      $done ? 'rgba(255, 255, 255, 0.85)' : 'rgba(230, 239, 237, 0.5)'};
`

const StepCopy = styled.div<{ $last: boolean }>`
  display: flex;
  min-width: 0;
  flex: 1;
  flex-direction: column;
  padding-bottom: ${({ $last }) => ($last ? '24px' : '36px')};
`

const StepTitle = styled.span`
  color: ${({ theme }) => theme.colors.textTertiary};
  font-size: 16px;
  font-weight: 500;
  line-height: 24px;
  letter-spacing: 0.2px;
`

const StepDescription = styled.span`
  color: ${({ theme }) => theme.colors.planeGreenLight};
  font-size: 14px;
  font-weight: 400;
  line-height: 20px;
  letter-spacing: 0.2px;
`

const Workspace = styled.main`
  position: relative;
  min-width: 0;
  flex: 1;
`

const ExitButton = styled.button`
  position: absolute;
  top: 14px;
  right: 14px;
  z-index: 2;
  display: inline-flex;
  width: 96px;
  height: 36px;
  align-items: center;
  justify-content: center;
  border: 1px solid ${({ theme }) => theme.colors.defaultBorder};
  border-radius: ${({ theme }) => theme.radii.sm};
  background: transparent;
  color: ${({ theme }) => theme.colors.textPrimary};
  font-size: 12px;
  font-weight: 500;
  line-height: 18px;
  letter-spacing: 0.2px;
  cursor: pointer;

  &:hover {
    border-color: ${({ theme }) => theme.colors.emerald};
  }
`
