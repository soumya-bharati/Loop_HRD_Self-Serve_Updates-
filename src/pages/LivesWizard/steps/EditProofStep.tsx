import { useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import styled from 'styled-components'

import { FlowStepper, WizardChrome } from '@/pages/LivesWizard/WizardChrome'
import { useLivesWizard } from '@/pages/LivesWizard/WizardContext'

export function EditProofStep() {
  const navigate = useNavigate()
  const {
    editProofFileName,
    setEditProofFileName,
    simulateEditSaveFailure,
    setSimulateEditSaveFailure,
    pendingCorrection,
    addPendingCorrection,
    setStep,
  } = useLivesWizard()
  const inputRef = useRef<HTMLInputElement>(null)

  return (
    <WizardChrome
      title="Upload supporting proof"
      onBack={() => setStep('edit-form')}
      onExit={() => navigate('/endorsements')}
      secondaryLabel="Back"
      onSecondary={() => setStep('edit-form')}
      primaryLabel="Add to corrections"
      primaryDisabled={!editProofFileName}
      onPrimary={() => {
        addPendingCorrection()
        setStep('correction-batch')
      }}
    >
      <FlowStepper
        steps={['Search', 'Edit details', 'Review']}
        activeIndex={1}
        bare
      />

      <Lead>
        {pendingCorrection?.kycTriggerFields.length
          ? `Changes to ${pendingCorrection.kycTriggerFields.join(', ')} require supporting KYC before submission.`
          : 'This correction requires supporting proof before it can be submitted.'}
      </Lead>

      <Drop
        type="button"
        onClick={() => inputRef.current?.click()}
      >
        {editProofFileName ?? 'Click to upload proof document'}
        <input
          ref={inputRef}
          type="file"
          hidden
          onChange={(e) => {
            const file = e.target.files?.[0]
            if (file) setEditProofFileName(file.name)
          }}
        />
      </Drop>

      <Toggle>
        <input
          type="checkbox"
          checked={simulateEditSaveFailure}
          onChange={(e) => setSimulateEditSaveFailure(e.target.checked)}
        />
        <span>
          Simulate save failure after confirm (proof will be cleared)
        </span>
      </Toggle>
    </WizardChrome>
  )
}

const Lead = styled.p`
  margin: 0;
  font-size: 14px;
  color: ${({ theme }) => theme.colors.textSecondary};
`

const Drop = styled.button`
  padding: 28px;
  border-radius: 12px;
  border: 1px dashed ${({ theme }) => theme.colors.defaultBorder};
  background: ${({ theme }) => theme.colors.surface1};
  font-family: ${({ theme }) => theme.fontFamily};
  font-size: 14px;
  color: ${({ theme }) => theme.colors.textPrimary};
  cursor: pointer;
`

const Toggle = styled.label`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: ${({ theme }) => theme.colors.textSecondary};
  cursor: pointer;
`
