import { useEffect, useRef, useState, type ReactNode } from 'react'
import styled, { keyframes } from 'styled-components'

import { assets } from '@/assets/figma'
import { ExitConfirmationModal } from '@/pages/LivesWizard/components/ExitConfirmationModal'
import { useProtoConfig } from '@/proto/ProtoConfigContext'

export type GuidedFlowStepIcon = 'details' | 'benefits' | 'review'

export type GuidedFlowStep = {
  title: string
  description: string
  icon?: GuidedFlowStepIcon
}

type StepStatus = 'done' | 'active' | 'pending'

const DEFAULT_STEP_ICONS: GuidedFlowStepIcon[] = [
  'details',
  'benefits',
  'review',
]

function ReviewCheckIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 12 12" fill="none" aria-hidden>
      <path
        d="M10 3L4.5 8.5L2 6"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
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
  const { allowProgressCollapse } = useProtoConfig()
  const workspaceRef = useRef<HTMLElement>(null)
  const [progressCollapsed, setProgressCollapsed] = useState(false)
  const [exitConfirmOpen, setExitConfirmOpen] = useState(false)
  const collapsed = allowProgressCollapse && progressCollapsed

  useEffect(() => {
    if (!allowProgressCollapse) setProgressCollapsed(false)
  }, [allowProgressCollapse])

  /** Each step animates in from the top, so start the scroller there too. */
  useEffect(() => {
    workspaceRef.current?.scrollTo({ top: 0, behavior: 'smooth' })
  }, [activeIndex])

  function stepStatus(index: number): StepStatus {
    if (index < activeIndex) return 'done'
    if (index === activeIndex) return 'active'
    return 'pending'
  }

  return (
    <Page>
      <ProgressPanel id="guided-progress-panel" $collapsed={collapsed}>
        {allowProgressCollapse ? (
          <CollapseToggle
            type="button"
            aria-expanded={!collapsed}
            aria-controls="guided-progress-panel"
            aria-label={collapsed ? 'Expand progress' : 'Collapse progress'}
            onClick={() => setProgressCollapsed((current) => !current)}
          >
            <CollapseChevron
              src={assets.chevronRight}
              alt=""
              $collapsed={collapsed}
            />
          </CollapseToggle>
        ) : null}
        <Logo src={assets.loopLogo} alt="loop" $collapsed={collapsed} />
        <ProgressList aria-label="Add employee progress" $collapsed={collapsed}>
          {steps.map((step, index) => {
            const status = stepStatus(index)
            const icon = step.icon ?? DEFAULT_STEP_ICONS[index] ?? 'review'
            const iconSrc =
              icon === 'details'
                ? assets.mlIconFileUploaded
                : icon === 'benefits'
                  ? assets.mlIconInstructions
                  : null
            return (
              <ProgressStep key={step.title} $collapsed={collapsed}>
                <StepRail $collapsed={collapsed}>
                  <StepDot $status={status} $collapsed={collapsed} aria-hidden />
                  <StepIconNode
                    $status={status}
                    $collapsed={collapsed}
                    title={step.title}
                    aria-label={step.title}
                    aria-hidden={!collapsed}
                  >
                    {iconSrc ? (
                      <StepIconImg src={iconSrc} alt="" />
                    ) : (
                      <ReviewCheckIcon />
                    )}
                    <VisuallyHidden>{step.title}</VisuallyHidden>
                  </StepIconNode>
                  {index < steps.length - 1 ? (
                    <StepConnector $done={status === 'done'} />
                  ) : null}
                </StepRail>
                <StepCopy
                  $last={index === steps.length - 1}
                  $collapsed={collapsed}
                >
                  <StepTitle>{step.title}</StepTitle>
                  <StepDesc>{step.description}</StepDesc>
                </StepCopy>
              </ProgressStep>
            )
          })}
        </ProgressList>
      </ProgressPanel>

      <Workspace ref={workspaceRef}>
        <ExitButton type="button" onClick={() => setExitConfirmOpen(true)}>
          Exit
        </ExitButton>
        <PhaseView key={activeIndex}>{children}</PhaseView>
      </Workspace>
      <ExitConfirmationModal
        open={exitConfirmOpen}
        onStay={() => setExitConfirmOpen(false)}
        onConfirm={() => {
          setExitConfirmOpen(false)
          onExit()
        }}
      />
    </Page>
  )
}

/** Stretches inside the wizard's column shell so the workspace scrolls alone. */
const Page = styled.div`
  display: flex;
  align-items: stretch;
  gap: 10px;
  width: 100%;
  flex: 1;
  /* Fills the shell exactly, whether or not the top nav is on screen. */
  min-height: var(--guided-viewport, 100vh);
  max-height: var(--guided-viewport, 100vh);
  padding: 6px;
  box-sizing: border-box;
  overflow: hidden;
  background: ${({ theme }) => theme.colors.surface1};

  @media (max-width: ${({ theme }) => theme.breakpoints.md}) {
    flex-direction: column;
    min-height: var(--guided-viewport, 100vh);
    max-height: none;
    overflow: visible;
  }
`

const ProgressPanel = styled.aside<{ $collapsed: boolean }>`
  position: relative;
  isolation: isolate;
  width: ${({ $collapsed }) => ($collapsed ? '72px' : '330px')};
  /* Stretch instead of height:100%, which the flexed Page cannot resolve. */
  align-self: stretch;
  min-height: 0;
  flex-shrink: 0;
  padding: ${({ $collapsed }) => ($collapsed ? '16px 12px' : '24px')};
  border-radius: 16px;
  background: ${({ theme }) => theme.colors.hoverSurface1};
  box-sizing: border-box;
  overflow: hidden;
  transition:
    width 200ms ease,
    padding 200ms ease;

  &::before {
    content: '';
    position: absolute;
    inset: 0;
    z-index: 0;
    background: image-set(url(${assets.mlBulkSidebarNoise}) 2x) top left / 17.36%
      auto repeat;
    mix-blend-mode: overlay;
    opacity: 0.3;
    pointer-events: none;
  }

  &::after {
    content: '';
    position: absolute;
    left: -312px;
    bottom: -194px;
    z-index: 1;
    width: 442px;
    height: 442px;
    background: url(${assets.mlBulkSidebarLeaves}) no-repeat center / contain;
    transform: rotate(0.45deg);
    pointer-events: none;
    display: ${({ $collapsed }) => ($collapsed ? 'none' : 'block')};
  }

  @media (max-width: ${({ theme }) => theme.breakpoints.lg}) {
    width: ${({ $collapsed }) => ($collapsed ? '72px' : '270px')};
  }

  @media (max-width: ${({ theme }) => theme.breakpoints.md}) {
    width: 100%;
    align-self: auto;
    min-height: 0;
    padding: 24px;

    &::after {
      display: block;
    }
  }
`

const CollapseToggle = styled.button`
  position: absolute;
  top: 16px;
  right: 12px;
  z-index: 3;
  display: inline-flex;
  width: 28px;
  height: 28px;
  align-items: center;
  justify-content: center;
  padding: 0;
  border: 1px solid ${({ theme }) => theme.colors.defaultBorder};
  border-radius: ${({ theme }) => theme.radii.full};
  background: ${({ theme }) => theme.colors.surface1};
  cursor: pointer;

  &:hover {
    border-color: ${({ theme }) => theme.colors.emerald};
  }

  @media (max-width: ${({ theme }) => theme.breakpoints.md}) {
    display: none;
  }
`

const CollapseChevron = styled.img<{ $collapsed: boolean }>`
  display: block;
  width: 16px;
  height: 16px;
  transform: rotate(${({ $collapsed }) => ($collapsed ? '0deg' : '180deg')});
  transition: transform 200ms ease;
`

const Logo = styled.img<{ $collapsed: boolean }>`
  position: relative;
  z-index: 2;
  display: ${({ $collapsed }) => ($collapsed ? 'none' : 'block')};
  width: 70px;
  height: 34px;
  object-fit: contain;

  @media (max-width: ${({ theme }) => theme.breakpoints.md}) {
    display: block;
  }
`

const ProgressList = styled.div<{ $collapsed: boolean }>`
  position: relative;
  z-index: 2;
  display: flex;
  flex-direction: column;
  align-items: ${({ $collapsed }) => ($collapsed ? 'center' : 'stretch')};
  margin-top: ${({ $collapsed }) => ($collapsed ? '48px' : '36px')};

  @media (max-width: ${({ theme }) => theme.breakpoints.md}) {
    align-items: stretch;
    margin-top: 24px;
  }
`

const ProgressStep = styled.div<{ $collapsed: boolean }>`
  display: flex;
  gap: ${({ $collapsed }) => ($collapsed ? '0' : '12px')};
  width: ${({ $collapsed }) => ($collapsed ? 'auto' : '100%')};
  justify-content: ${({ $collapsed }) => ($collapsed ? 'center' : 'flex-start')};

  @media (max-width: ${({ theme }) => theme.breakpoints.md}) {
    gap: 12px;
    width: 100%;
    justify-content: flex-start;
  }
`

const StepRail = styled.div<{ $collapsed: boolean }>`
  display: flex;
  flex-direction: column;
  align-items: center;
  width: ${({ $collapsed }) => ($collapsed ? '28px' : '14px')};
  flex-shrink: 0;
  padding-top: 4px;

  @media (max-width: ${({ theme }) => theme.breakpoints.md}) {
    width: 14px;
  }
`

const StepDot = styled.span<{ $status: StepStatus; $collapsed: boolean }>`
  display: ${({ $collapsed }) => ($collapsed ? 'none' : 'block')};
  width: 14px;
  height: 14px;
  flex-shrink: 0;
  border-radius: 50%;
  box-sizing: border-box;
  background: ${({ theme, $status }) =>
    $status === 'pending' ? 'transparent' : theme.colors.fillGreen};
  border: ${({ theme, $status }) =>
    $status === 'pending'
      ? `1.5px solid ${theme.colors.defaultBorder}`
      : `2px solid ${theme.colors.emerald}`};

  @media (max-width: ${({ theme }) => theme.breakpoints.md}) {
    display: block;
  }
`

const StepIconNode = styled.span<{ $status: StepStatus; $collapsed: boolean }>`
  position: relative;
  display: ${({ $collapsed }) => ($collapsed ? 'flex' : 'none')};
  width: 28px;
  height: 28px;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  box-sizing: border-box;
  color: ${({ theme }) => theme.colors.emerald};
  background: ${({ theme, $status }) =>
    $status === 'pending' ? 'transparent' : theme.colors.fillGreen};
  border: ${({ theme, $status }) =>
    $status === 'pending'
      ? `1.5px solid ${theme.colors.defaultBorder}`
      : `2px solid ${theme.colors.emerald}`};
  outline: ${({ theme, $status }) =>
    $status === 'active' ? `2px solid ${theme.colors.emerald}` : 'none'};
  outline-offset: 1px;

  @media (max-width: ${({ theme }) => theme.breakpoints.md}) {
    display: none;
  }
`

const StepIconImg = styled.img`
  display: block;
  width: 16px;
  height: 16px;
  object-fit: contain;
`

const VisuallyHidden = styled.span`
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
`

const StepConnector = styled.span<{ $done?: boolean }>`
  flex: 1;
  min-height: 44px;
  margin-top: 8px;
  border-left: 1px
    ${({ $done }) => ($done ? 'solid' : 'dashed')}
    ${({ theme }) => theme.colors.defaultBorder};
`

const StepCopy = styled.div<{ $last?: boolean; $collapsed?: boolean }>`
  display: ${({ $collapsed }) => ($collapsed ? 'none' : 'flex')};
  flex-direction: column;
  flex: 1;
  min-width: 0;
  padding-bottom: ${({ $last }) => ($last ? '24px' : '36px')};

  @media (max-width: ${({ theme }) => theme.breakpoints.md}) {
    display: flex;
  }
`

const StepTitle = styled.p`
  margin: 0;
  font-size: 16px;
  font-weight: 500;
  line-height: 24px;
  letter-spacing: 0.2px;
  color: ${({ theme }) => theme.colors.textPrimary};
`

const StepDesc = styled.p`
  margin: 0;
  font-size: 14px;
  font-weight: 400;
  line-height: 20px;
  letter-spacing: 0.2px;
  color: ${({ theme }) => theme.colors.textPrimary};
`

const Workspace = styled.main`
  position: relative;
  flex: 1;
  min-width: 0;
  min-height: 0;
  align-self: stretch;
  overflow-x: hidden;
  overflow-y: auto;
  overscroll-behavior: contain;
  background: ${({ theme }) => theme.colors.surface1};

  @media (max-width: ${({ theme }) => theme.breakpoints.md}) {
    overflow-y: visible;
  }
`

const ExitButton = styled.button`
  position: absolute;
  top: 18px;
  right: 18px;
  /* Above PhaseView, whose animation transform makes it paint over this. */
  z-index: 2;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 96px;
  height: 36px;
  padding: 8px 16px;
  border: 1px solid ${({ theme }) => theme.colors.defaultBorder};
  border-radius: ${({ theme }) => theme.radii.sm};
  background: transparent;
  box-sizing: border-box;
  font: inherit;
  font-size: 12px;
  font-weight: 500;
  line-height: 18px;
  letter-spacing: 0.2px;
  color: ${({ theme }) => theme.colors.textPrimary};
  cursor: pointer;

  &:hover {
    border-color: ${({ theme }) => theme.colors.emerald};
  }
`

const stepIn = keyframes`
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
`

/** Remounted per step so every stage rises into place like a new chat message. */
const PhaseView = styled.div`
  width: 100%;
  animation: ${stepIn} 800ms cubic-bezier(0.22, 1, 0.36, 1) both;

  @media (prefers-reduced-motion: reduce) {
    animation: none;
  }
`
