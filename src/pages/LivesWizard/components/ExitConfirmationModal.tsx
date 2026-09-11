import { useEffect, useRef } from 'react'
import styled from 'styled-components'

import { assets } from '@/assets/figma'

export function ExitConfirmationModal({
  open,
  onStay,
  onConfirm,
}: {
  open: boolean
  onStay: () => void
  onConfirm: () => void
}) {
  const stayButtonRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!open) return

    stayButtonRef.current?.focus()
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onStay()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [onStay, open])

  if (!open) return null

  return (
    <Overlay role="presentation" onClick={onStay}>
      <Dialog
        role="dialog"
        aria-modal="true"
        aria-labelledby="exit-confirm-title"
        aria-describedby="exit-confirm-description"
        onClick={(event) => event.stopPropagation()}
      >
        <Header>
          <Title id="exit-confirm-title">Exit this flow?</Title>
          <CloseButton type="button" aria-label="Close" onClick={onStay}>
            <img src={assets.modalDismiss} alt="" width={24} height={24} />
          </CloseButton>
        </Header>
        <Body id="exit-confirm-description">
          Your progress isn’t saved until you submit. If you exit now, your
          changes will be lost.
        </Body>
        <Actions>
          <StayButton ref={stayButtonRef} type="button" onClick={onStay}>
            Keep editing
          </StayButton>
          <ExitButton type="button" onClick={onConfirm}>
            Exit without saving
          </ExitButton>
        </Actions>
      </Dialog>
    </Overlay>
  )
}

const Overlay = styled.div`
  position: fixed;
  inset: 0;
  z-index: 300;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  background: rgba(45, 55, 72, 0.45);
`

const Dialog = styled.div`
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

const Header = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
`

const Title = styled.h2`
  margin: 0;
  font-size: 18px;
  font-weight: 500;
  line-height: 24px;
  color: ${({ theme }) => theme.colors.textPrimary};
`

const CloseButton = styled.button`
  display: grid;
  width: 24px;
  height: 24px;
  flex-shrink: 0;
  place-items: center;
  padding: 0;
  border: none;
  background: transparent;
  cursor: pointer;
`

const Body = styled.p`
  margin: 0;
  font-size: 14px;
  font-weight: 400;
  line-height: 20px;
  color: ${({ theme }) => theme.colors.textSecondary};
`

const Actions = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 8px;

  @media (max-width: ${({ theme }) => theme.breakpoints.sm}) {
    flex-direction: column-reverse;

    button {
      width: 100%;
    }
  }
`

const StayButton = styled.button`
  display: inline-flex;
  min-width: 112px;
  height: 40px;
  align-items: center;
  justify-content: center;
  padding: 0 16px;
  border: 1px solid ${({ theme }) => theme.colors.emerald};
  border-radius: ${({ theme }) => theme.radii.md};
  background: transparent;
  color: ${({ theme }) => theme.colors.emerald};
  font-family: ${({ theme }) => theme.fontFamily};
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
`

const ExitButton = styled.button`
  display: inline-flex;
  min-width: 152px;
  height: 40px;
  align-items: center;
  justify-content: center;
  padding: 0 16px;
  border: none;
  border-radius: ${({ theme }) => theme.radii.md};
  background: ${({ theme }) => theme.colors.fillRed};
  color: ${({ theme }) => theme.colors.surface1};
  font-family: ${({ theme }) => theme.fontFamily};
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
`
