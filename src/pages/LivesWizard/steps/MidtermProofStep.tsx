import { useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import styled from 'styled-components'

import { FlowStepper, WizardChrome } from '@/pages/LivesWizard/WizardChrome'
import { useLivesWizard } from '@/pages/LivesWizard/WizardContext'

export function MidtermProofStep() {
  const navigate = useNavigate()
  const {
    rows,
    midtermProofUploaded,
    setMidtermProofUploaded,
    setStep,
  } = useLivesWizard()
  const inputRef = useRef<HTMLInputElement>(null)
  const midtermRows = rows.filter((r) => r.needsMidtermProof)

  return (
    <WizardChrome
      title="Mid-term supporting certificate"
      onBack={() => setStep('bulk-validate')}
      onExit={() => navigate('/endorsements')}
      secondaryLabel="Back"
      onSecondary={() => setStep('bulk-validate')}
      primaryLabel="Continue to review"
      primaryDisabled={!midtermProofUploaded}
      onPrimary={() => setStep('bulk-review')}
    >
      <FlowStepper
        steps={['Upload', 'Validate', 'Review', 'Enrolment']}
        activeIndex={1}
        bare
      />

      <Lead>
        Some dependants have coverage start dates after the employee start date,
        and the backing endorsement has already been sent. Upload a supporting
        certificate to proceed.
      </Lead>

      <List>
        {midtermRows.map((r) => (
          <li key={r.id}>
            {r.name} — coverage {r.coverageStartDate} (employee start{' '}
            {r.employeeStartDate})
          </li>
        ))}
      </List>

      <Drop type="button" onClick={() => inputRef.current?.click()}>
        {midtermProofUploaded
          ? 'Certificate uploaded ✓'
          : 'Upload supporting certificate'}
        <input
          ref={inputRef}
          type="file"
          hidden
          onChange={(e) => {
            if (e.target.files?.[0]) setMidtermProofUploaded(true)
          }}
        />
      </Drop>
    </WizardChrome>
  )
}

const Lead = styled.p`
  margin: 0;
  font-size: 14px;
  color: ${({ theme }) => theme.colors.textSecondary};
`

const List = styled.ul`
  margin: 0;
  padding-left: 18px;
  font-size: 13px;
  color: ${({ theme }) => theme.colors.textPrimary};
`

const Drop = styled.button`
  padding: 24px;
  border-radius: 12px;
  border: 1px dashed ${({ theme }) => theme.colors.defaultBorder};
  background: ${({ theme }) => theme.colors.surface1};
  font-family: ${({ theme }) => theme.fontFamily};
  font-size: 14px;
  cursor: pointer;
`
