import { useEffect, useRef, useState } from 'react'
import styled from 'styled-components'

import { randomPersonaIndex } from '@/pages/LivesWizard/autofill/personas'
import { useStepAutofill } from '@/pages/LivesWizard/autofill/useStepAutofill'

function SparkIcon({ size = 18 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden
      focusable="false"
    >
      <path
        d="M12 3l1.7 4.6L18.3 9.3 13.7 11 12 15.6 10.3 11 5.7 9.3l4.6-1.7L12 3z"
        fill="currentColor"
      />
      <path
        d="M18.5 14.5l.85 2.15L21.5 17.5l-2.15.85-.85 2.15-.85-2.15L15.5 17.5l2.15-.85.85-2.15z"
        fill="currentColor"
        opacity="0.6"
      />
    </svg>
  )
}

export function AutofillWidget() {
  const autofill = useStepAutofill()
  const [status, setStatus] = useState<string | null>(null)
  const statusTimer = useRef<number | null>(null)

  useEffect(
    () => () => {
      if (statusTimer.current) window.clearTimeout(statusTimer.current)
    },
    [],
  )

  const fill = () => {
    const message = autofill.run(randomPersonaIndex())
    setStatus(message)
    if (statusTimer.current) window.clearTimeout(statusTimer.current)
    statusTimer.current = window.setTimeout(() => setStatus(null), 6000)
  }

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const shortcut =
        (event.metaKey || event.ctrlKey) &&
        event.shiftKey &&
        event.key.toLowerCase() === 'f'
      if (!shortcut || !autofill.supported) return
      event.preventDefault()
      fill()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autofill])

  return (
    <Dock>
      {status ? <Toast role="status">{status}</Toast> : null}
      <Fab
        type="button"
        disabled={!autofill.supported}
        title={`${autofill.stepLabel} — ${autofill.hint}`}
        onClick={fill}
      >
        <SparkIcon />
        Autofill
      </Fab>
    </Dock>
  )
}

const Dock = styled.div`
  position: fixed;
  right: 24px;
  bottom: 104px;
  z-index: 250;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 10px;
  pointer-events: none;

  > * {
    pointer-events: auto;
  }

  @media (max-width: ${({ theme }) => theme.breakpoints.md}) {
    right: 16px;
    bottom: 150px;
  }

  @media (max-width: ${({ theme }) => theme.breakpoints.sm}) {
    right: 12px;
  }
`

const Fab = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  height: 44px;
  padding: 0 18px;
  border: none;
  border-radius: ${({ theme }) => theme.radii.full};
  background: ${({ theme }) => theme.colors.emerald};
  color: ${({ theme }) => theme.colors.textTertiary};
  font-family: ${({ theme }) => theme.fontFamily};
  font-size: 13px;
  font-weight: 500;
  letter-spacing: 0.2px;
  cursor: pointer;
  box-shadow: 0 8px 24px rgba(2, 95, 76, 0.28);

  &:hover:not(:disabled) {
    background: ${({ theme }) => theme.colors.planeGreenDark};
  }

  &:disabled {
    background: ${({ theme }) => theme.colors.disableFill};
    color: ${({ theme }) => theme.colors.textSecondary};
    cursor: not-allowed;
    box-shadow: none;
  }

  @media (max-width: ${({ theme }) => theme.breakpoints.sm}) {
    width: 44px;
    padding: 0;
    justify-content: center;
    overflow: hidden;
    font-size: 0;
  }
`

const Toast = styled.div`
  max-width: 280px;
  padding: 10px 14px;
  border-radius: 10px;
  background: ${({ theme }) => theme.colors.surface1};
  border: 1px solid ${({ theme }) => theme.colors.defaultBorder};
  box-shadow: 0 8px 24px rgba(55, 65, 81, 0.12);
  font-size: 12px;
  line-height: 18px;
  color: ${({ theme }) => theme.colors.textPrimary};

  @media (max-width: ${({ theme }) => theme.breakpoints.sm}) {
    max-width: calc(100vw - 32px);
  }
`
