import { useEffect, useState, type ReactNode } from 'react'
import styled from 'styled-components'

import { assets } from '@/assets/figma'
import { singleAddEntityName } from '@/data/flexDeal'

export function WizardChrome({
  title,
  onBack,
  onExit,
  children,
  footerLeft,
  primaryLabel,
  onPrimary,
  primaryDisabled,
  secondaryLabel,
  onSecondary,
  primaryHint,
}: {
  title: string
  onBack?: () => void
  onExit: () => void
  children: ReactNode
  footerLeft?: ReactNode
  primaryLabel: string
  onPrimary: () => void
  primaryDisabled?: boolean
  secondaryLabel?: string
  onSecondary?: () => void
  primaryHint?: { title: string; body: string }
}) {
  const [exitConfirmOpen, setExitConfirmOpen] = useState(false)
  const [hintDismissed, setHintDismissed] = useState(false)

  useEffect(() => {
    if (!exitConfirmOpen) return
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setExitConfirmOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [exitConfirmOpen])

  return (
    <Page>
      <Content>
        <HeaderRow>
          <PageTitle>{title}</PageTitle>
          <ExitButton type="button" onClick={() => setExitConfirmOpen(true)}>
            Exit
          </ExitButton>
        </HeaderRow>
        {children}
      </Content>

      <BottomBar>
        <Context>
          {footerLeft ?? (
            <>
              <CompanyIcon
                src={assets.iconCompany}
                alt=""
                width={20}
                height={20}
                aria-hidden
              />
              <ContextText>
                This addition is for <strong>{singleAddEntityName}</strong>
              </ContextText>
            </>
          )}
        </Context>
        <Actions>
          {secondaryLabel && onSecondary ? (
            <SecondaryButton type="button" onClick={onSecondary}>
              {secondaryLabel}
            </SecondaryButton>
          ) : onBack ? (
            <SecondaryButton type="button" onClick={onBack}>
              Back
            </SecondaryButton>
          ) : null}
          <PrimaryWrap>
            {primaryHint && !hintDismissed ? (
              <SubmitHint role="status">
                <SubmitHintClose
                  type="button"
                  aria-label="Dismiss"
                  onClick={() => setHintDismissed(true)}
                >
                  <img src={assets.modalDismiss} alt="" width={16} height={16} />
                </SubmitHintClose>
                <SubmitHintTitle>{primaryHint.title}</SubmitHintTitle>
                <SubmitHintBody>{primaryHint.body}</SubmitHintBody>
                <SubmitHintBeak />
              </SubmitHint>
            ) : null}
            <PrimaryButton
              type="button"
              disabled={primaryDisabled}
              onClick={onPrimary}
            >
              {primaryLabel}
            </PrimaryButton>
          </PrimaryWrap>
        </Actions>
      </BottomBar>

      {exitConfirmOpen ? (
        <ExitOverlay
          role="presentation"
          onClick={() => setExitConfirmOpen(false)}
        >
          <ExitDialog
            role="dialog"
            aria-modal="true"
            aria-labelledby="exit-confirm-title"
            onClick={(e) => e.stopPropagation()}
          >
            <ExitDialogHeader>
              <ExitDialogTitle id="exit-confirm-title">
                Exit this flow?
              </ExitDialogTitle>
              <ExitDialogClose
                type="button"
                aria-label="Close"
                onClick={() => setExitConfirmOpen(false)}
              >
                <img src={assets.modalDismiss} alt="" width={24} height={24} />
              </ExitDialogClose>
            </ExitDialogHeader>
            <ExitDialogBody>
              Any progress you’ve made will be lost. Are you sure you want to
              exit?
            </ExitDialogBody>
            <ExitDialogActions>
              <ExitStayButton
                type="button"
                onClick={() => setExitConfirmOpen(false)}
              >
                Stay
              </ExitStayButton>
              <ExitConfirmButton
                type="button"
                onClick={() => {
                  setExitConfirmOpen(false)
                  onExit()
                }}
              >
                Exit
              </ExitConfirmButton>
            </ExitDialogActions>
          </ExitDialog>
        </ExitOverlay>
      ) : null}
    </Page>
  )
}

export function FlowStepper({
  steps,
  activeIndex,
  bare = false,
}: {
  steps: string[]
  activeIndex: number
  bare?: boolean
}) {
  return (
    <Stepper $bare={bare}>
      {steps.map((label, index) => {
        const done = index < activeIndex
        const active = index === activeIndex
        return (
          <StepFragment key={label}>
            <StepItem $active={active} $done={done}>
              <StepIndex $active={active} $done={done} $bare={bare}>
                {bare ? index + 1 : done ? '✓' : index + 1}
              </StepIndex>
              <StepLabel $active={active} $bare={bare}>
                {label}
              </StepLabel>
            </StepItem>
            {index < steps.length - 1 ? (
              <StepLine $done={done} $bare={bare} />
            ) : null}
          </StepFragment>
        )
      })}
    </Stepper>
  )
}

const Page = styled.div`
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: calc(100vh - ${({ theme }) => theme.layout.topNavHeight});
  background: ${({ theme }) => theme.colors.surface0};
`

const Content = styled.div`
  display: flex;
  flex-direction: column;
  gap: 24px;
  flex: 1;
  padding: 32px 48px 120px;
  box-sizing: border-box;
`

const HeaderRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  min-height: 36px;
`

const PageTitle = styled.h1`
  margin: 0;
  font-size: 18px;
  font-weight: 500;
  line-height: 24px;
  color: ${({ theme }) => theme.colors.textPrimary};
`

const ExitButton = styled.button`
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
  font-family: ${({ theme }) => theme.fontFamily};
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

const ExitOverlay = styled.div`
  position: fixed;
  inset: 0;
  z-index: 300;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  background: rgba(45, 55, 72, 0.45);
`

const ExitDialog = styled.div`
  width: min(420px, 100%);
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 24px;
  border-radius: 16px;
  background: ${({ theme }) => theme.colors.surface1};
  box-shadow: 0 16px 48px rgba(16, 24, 40, 0.16);
  box-sizing: border-box;
`

const ExitDialogHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
`

const ExitDialogTitle = styled.h2`
  margin: 0;
  font-size: 18px;
  font-weight: 500;
  line-height: 24px;
  color: ${({ theme }) => theme.colors.textPrimary};
`

const ExitDialogClose = styled.button`
  border: none;
  background: transparent;
  padding: 0;
  width: 24px;
  height: 24px;
  cursor: pointer;
  display: grid;
  place-items: center;
  flex-shrink: 0;
`

const ExitDialogBody = styled.p`
  margin: 0;
  font-size: 14px;
  font-weight: 400;
  line-height: 20px;
  color: ${({ theme }) => theme.colors.textSecondary};
`

const ExitDialogActions = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 8px;
`

const ExitStayButton = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 96px;
  height: 40px;
  padding: 0 16px;
  border: 1px solid ${({ theme }) => theme.colors.emerald};
  border-radius: ${({ theme }) => theme.radii.md};
  background: transparent;
  font-family: ${({ theme }) => theme.fontFamily};
  font-size: 14px;
  font-weight: 500;
  color: ${({ theme }) => theme.colors.emerald};
  cursor: pointer;
`

const ExitConfirmButton = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 96px;
  height: 40px;
  padding: 0 16px;
  border: none;
  border-radius: ${({ theme }) => theme.radii.md};
  background: ${({ theme }) => theme.colors.fillRed};
  font-family: ${({ theme }) => theme.fontFamily};
  font-size: 14px;
  font-weight: 500;
  color: ${({ theme }) => theme.colors.surface1};
  cursor: pointer;
`

const BottomBar = styled.div`
  position: sticky;
  bottom: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
  width: 100%;
  min-height: 80px;
  padding: 16px 32px;
  border-top: 1px solid ${({ theme }) => theme.colors.defaultBorder};
  background: ${({ theme }) => theme.colors.surface1};
  box-sizing: border-box;
`

const Context = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
`

const CompanyIcon = styled.img`
  display: block;
  width: 20px;
  height: 20px;
  flex-shrink: 0;
`

const ContextText = styled.p`
  margin: 0;
  font-size: 14px;
  font-weight: 500;
  line-height: 20px;
  color: ${({ theme }) => theme.colors.textSecondary};

  strong {
    font-weight: 600;
    color: ${({ theme }) => theme.colors.beyondGrey};
  }
`

const Actions = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
  flex-shrink: 0;
`

const PrimaryWrap = styled.div`
  position: relative;
  display: inline-flex;
`

const SubmitHint = styled.div`
  position: absolute;
  right: 0;
  bottom: calc(100% + 16px);
  width: 280px;
  padding: 16px 20px 18px;
  border-radius: 12px;
  background: ${({ theme }) => theme.colors.yellow};
  box-shadow: 0 8px 24px rgba(55, 65, 81, 0.12);
  box-sizing: border-box;
  z-index: 4;
`

const SubmitHintClose = styled.button`
  position: absolute;
  top: 8px;
  right: 8px;
  border: none;
  background: transparent;
  padding: 0;
  width: 20px;
  height: 20px;
  cursor: pointer;
  display: grid;
  place-items: center;
`

const SubmitHintTitle = styled.div`
  font-size: 14px;
  font-weight: 700;
  line-height: 20px;
  color: ${({ theme }) => theme.colors.beyondGrey};
  padding-right: 16px;
`

const SubmitHintBody = styled.p`
  margin: 6px 0 0;
  font-size: 13px;
  font-weight: 400;
  line-height: 18px;
  color: ${({ theme }) => theme.colors.beyondGrey};
`

const SubmitHintBeak = styled.span`
  position: absolute;
  right: 48px;
  bottom: -8px;
  width: 16px;
  height: 16px;
  background: ${({ theme }) => theme.colors.yellow};
  transform: rotate(45deg);
`

const SecondaryButton = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 180px;
  height: 48px;
  padding: 0 24px;
  border: 1px solid ${({ theme }) => theme.colors.emerald};
  border-radius: ${({ theme }) => theme.radii.md};
  background: transparent;
  font-family: ${({ theme }) => theme.fontFamily};
  font-size: 14px;
  font-weight: 500;
  color: ${({ theme }) => theme.colors.emerald};
  cursor: pointer;
  box-sizing: border-box;
`

const PrimaryButton = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 180px;
  height: 48px;
  padding: 0 24px;
  border: none;
  border-radius: ${({ theme }) => theme.radii.md};
  font-family: ${({ theme }) => theme.fontFamily};
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  background: ${({ theme }) => theme.colors.fillGreen};
  color: ${({ theme }) => theme.colors.emerald};
  box-sizing: border-box;

  &:disabled {
    background: ${({ theme }) => theme.colors.disableFill};
    color: ${({ theme }) => theme.colors.textSecondary};
    cursor: not-allowed;
  }
`

const Stepper = styled.div<{ $bare?: boolean }>`
  display: flex;
  align-items: center;
  gap: ${({ $bare }) => ($bare ? '16px' : '0')};
  width: 100%;
  padding: ${({ $bare }) => ($bare ? '0' : '16px 20px')};
  background: ${({ theme, $bare }) =>
    $bare ? 'transparent' : theme.colors.surface1};
  border-radius: ${({ $bare }) => ($bare ? '0' : '12px')};
  border: ${({ theme, $bare }) =>
    $bare ? 'none' : `1px solid ${theme.colors.disableFill}`};
  box-sizing: border-box;
  overflow-x: auto;
`

const StepFragment = styled.div`
  display: contents;
`

const StepItem = styled.div<{ $active: boolean; $done: boolean }>`
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
`

const StepIndex = styled.span<{ $active: boolean; $done: boolean; $bare?: boolean }>`
  width: ${({ $bare }) => ($bare ? '32px' : '24px')};
  height: ${({ $bare }) => ($bare ? '32px' : '24px')};
  border-radius: ${({ $bare }) => ($bare ? '16px' : '50%')};
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: ${({ $bare }) => ($bare ? '16px' : '12px')};
  font-weight: 500;
  letter-spacing: 0.2px;
  border: ${({ $bare, theme, $active, $done }) =>
    $bare
      ? 'none'
      : `1.5px solid ${
          $active || $done ? theme.colors.emerald : theme.colors.defaultBorder
        }`};
  background: ${({ theme, $active, $done, $bare }) => {
    if ($bare) {
      if ($active || $done) return theme.colors.planeGreenLight
      return theme.colors.surface0
    }
    return $active || $done ? theme.colors.emerald : theme.colors.surface1
  }};
  color: ${({ theme, $active, $done, $bare }) => {
    if ($bare) {
      return $active || $done ? theme.colors.emerald : theme.colors.beyondGrey
    }
    return $active || $done
      ? theme.colors.textTertiary
      : theme.colors.textSecondary
  }};
`

const StepLabel = styled.span<{ $active: boolean; $bare?: boolean }>`
  font-size: 14px;
  font-weight: 500;
  letter-spacing: 0.2px;
  line-height: 20px;
  color: ${({ theme, $active, $bare }) => {
    if ($bare) {
      return $active ? theme.colors.emerald : theme.colors.beyondGrey
    }
    return $active ? theme.colors.emerald : theme.colors.textSecondary
  }};
  white-space: nowrap;
`

const StepLine = styled.span<{ $done: boolean; $bare?: boolean }>`
  ${({ $bare }) =>
    $bare
      ? `
    flex: 1 0 0;
    min-width: 24px;
    height: 1px;
    margin: 0;
  `
      : `
    width: 72px;
    height: 1px;
    margin: 0 16px;
    flex-shrink: 0;
  `}
  background: ${({ theme, $done }) =>
    $done ? theme.colors.emerald : theme.colors.defaultBorder};
`
