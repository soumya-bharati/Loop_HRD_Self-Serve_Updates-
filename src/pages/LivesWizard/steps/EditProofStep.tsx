import { useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import styled from 'styled-components'

import { GuidedStepLayout } from '@/pages/LivesWizard/components/GuidedStepLayout'
import { editGuidedSteps } from '@/pages/LivesWizard/guidedFlowSteps'
import { useLivesWizard } from '@/pages/LivesWizard/WizardContext'
import { employeeDetailsPath } from '@/pages/ManageLives/launchWizard'

export function EditProofStep() {
  const navigate = useNavigate()
  const {
    editProofFileName,
    setEditProofFileName,
    simulateEditSaveFailure,
    setSimulateEditSaveFailure,
    pendingCorrection,
    addPendingCorrection,
    selectedEmployeeId,
    setStep,
  } = useLivesWizard()
  const inputRef = useRef<HTMLInputElement>(null)

  const kycFieldLabels = (pendingCorrection?.kycTriggerFields ?? []).map(
    (field) =>
      pendingCorrection?.diffs.find((diff) => diff.field === field)?.label ??
      field,
  )

  return (
    <GuidedStepLayout
      steps={editGuidedSteps(true)}
      activeIndex={1}
      onExit={() => navigate(employeeDetailsPath(selectedEmployeeId))}
      title="Upload official ID proof"
      onBack={() => setStep('edit-form')}
      primaryLabel="Add to corrections"
      primaryDisabled={!editProofFileName}
      onPrimary={() => {
        addPendingCorrection()
        setStep('correction-batch')
      }}
    >
      <Lead>
        {kycFieldLabels.length
          ? `Changes to ${kycFieldLabels.join(', ')} require an official ID proof for KYC verification before you can submit.`
          : 'This correction requires an official ID proof for KYC verification before you can submit.'}
      </Lead>

      <Drop
        type="button"
        onClick={() => inputRef.current?.click()}
      >
        {editProofFileName ?? 'Upload official ID proof (PDF, JPG or PNG)'}
        <input
          ref={inputRef}
          type="file"
          accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png"
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
    </GuidedStepLayout>
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
