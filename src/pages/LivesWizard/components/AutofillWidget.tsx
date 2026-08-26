import { useEffect, useRef, useState } from 'react'
import styled from 'styled-components'

import {
  demoPersonas,
  randomPersonaIndex,
} from '@/pages/LivesWizard/autofill/personas'
import { useStepAutofill } from '@/pages/LivesWizard/autofill/useStepAutofill'

const RANDOM = 'random'

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
  const [open, setOpen] = useState(false)
  const [personaChoice, setPersonaChoice] = useState<string>(RANDOM)
  const [status, setStatus] = useState<string | null>(null)
  const statusTimer = useRef<number | null>(null)

  useEffect(
    () => () => {
      if (statusTimer.current) window.clearTimeout(statusTimer.current)
    },
    [],
  )

  const fill = () => {
    const index =
      personaChoice === RANDOM
        ? randomPersonaIndex()
        : demoPersonas.findIndex((persona) => persona.id === personaChoice)
    const message = autofill.run(Math.max(index, 0))
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
  }, [autofill, personaChoice])

  if (!open) {
    return (
      <Dock>
        {status ? <Toast role="status">{status}</Toast> : null}
        <Fab type="button" onClick={() => setOpen(true)}>
          <SparkIcon />
          Autofill
        </Fab>
      </Dock>
    )
  }

  return (
    <Dock>
      <Panel role="dialog" aria-label="Demo autofill">
        <PanelHeader>
          <PanelTitle>
            <SparkIcon size={16} />
            Demo autofill
          </PanelTitle>
          <CloseButton
            type="button"
            aria-label="Close autofill"
            onClick={() => setOpen(false)}
          >
            ×
          </CloseButton>
        </PanelHeader>

        <StepRow>
          <StepBadge>{autofill.stepLabel}</StepBadge>
        </StepRow>
        <Hint>{autofill.hint}</Hint>

        <FieldLabel htmlFor="autofill-persona">Sample data</FieldLabel>
        <Select
          id="autofill-persona"
          value={personaChoice}
          onChange={(event) => setPersonaChoice(event.target.value)}
        >
          <option value={RANDOM}>Random employee</option>
          {demoPersonas.map((persona) => (
            <option key={persona.id} value={persona.id}>
              {persona.label}
            </option>
          ))}
        </Select>

        <FillButton
          type="button"
          disabled={!autofill.supported}
          onClick={fill}
        >
          Fill this step
        </FillButton>

        {status ? <Status role="status">{status}</Status> : null}
        <Shortcut>⌘/Ctrl + Shift + F</Shortcut>
      </Panel>
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

  &:hover {
    background: ${({ theme }) => theme.colors.planeGreenDark};
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
`

const Panel = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
  width: 288px;
  padding: 16px;
  border-radius: 16px;
  background: ${({ theme }) => theme.colors.surface1};
  border: 1px solid ${({ theme }) => theme.colors.defaultBorder};
  box-shadow: 0 16px 40px rgba(16, 24, 40, 0.16);
  box-sizing: border-box;
`

const PanelHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
`

const PanelTitle = styled.h2`
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0;
  font-size: 14px;
  font-weight: 600;
  letter-spacing: 0.2px;
  color: ${({ theme }) => theme.colors.emerald};
`

const CloseButton = styled.button`
  width: 24px;
  height: 24px;
  padding: 0;
  border: none;
  background: transparent;
  font-size: 20px;
  line-height: 1;
  color: ${({ theme }) => theme.colors.textSecondary};
  cursor: pointer;
`

const StepRow = styled.div`
  display: flex;
`

const StepBadge = styled.span`
  padding: 4px 10px;
  border-radius: ${({ theme }) => theme.radii.full};
  background: ${({ theme }) => theme.colors.planeGreenLight};
  font-size: 11px;
  font-weight: 500;
  letter-spacing: 0.2px;
  color: ${({ theme }) => theme.colors.emerald};
`

const Hint = styled.p`
  margin: 0;
  font-size: 12px;
  line-height: 18px;
  color: ${({ theme }) => theme.colors.textSecondary};
`

const FieldLabel = styled.label`
  margin-top: 2px;
  font-size: 12px;
  font-weight: 500;
  letter-spacing: 0.2px;
  color: ${({ theme }) => theme.colors.textPrimary};
`

const Select = styled.select`
  width: 100%;
  height: 40px;
  padding: 0 12px;
  border: 1px solid ${({ theme }) => theme.colors.defaultBorder};
  border-radius: ${({ theme }) => theme.radii.sm};
  background: ${({ theme }) => theme.colors.surface1};
  font-family: ${({ theme }) => theme.fontFamily};
  font-size: 13px;
  color: ${({ theme }) => theme.colors.textPrimary};
  box-sizing: border-box;
  cursor: pointer;
`

const FillButton = styled.button`
  height: 40px;
  border: none;
  border-radius: ${({ theme }) => theme.radii.sm};
  background: ${({ theme }) => theme.colors.fillGreen};
  color: ${({ theme }) => theme.colors.emerald};
  font-family: ${({ theme }) => theme.fontFamily};
  font-size: 13px;
  font-weight: 500;
  letter-spacing: 0.2px;
  cursor: pointer;

  &:disabled {
    background: ${({ theme }) => theme.colors.disableFill};
    color: ${({ theme }) => theme.colors.textSecondary};
    cursor: not-allowed;
  }
`

const Status = styled.p`
  margin: 0;
  padding: 8px 10px;
  border-radius: 8px;
  background: ${({ theme }) => theme.colors.bannerMint};
  font-size: 12px;
  line-height: 18px;
  color: ${({ theme }) => theme.colors.emerald};
`

const Shortcut = styled.span`
  font-size: 11px;
  letter-spacing: 0.2px;
  color: ${({ theme }) => theme.colors.textSecondary};
`
