import { useNavigate } from 'react-router-dom'
import styled from 'styled-components'

import { emptyEmployeeForm } from '@/data/employees'
import { FlowStepper, WizardChrome } from '@/pages/LivesWizard/WizardChrome'
import { useLivesWizard } from '@/pages/LivesWizard/WizardContext'

export function CorrectionBatchStep() {
  const navigate = useNavigate()
  const {
    correctionBatch,
    removeCorrection,
    setEmployee,
    setSelectedEmployeeId,
    setSelectedDependantId,
    completeFlow,
    setStep,
  } = useLivesWizard()

  const addAnother = () => {
    setEmployee(emptyEmployeeForm())
    setSelectedEmployeeId(null)
    setSelectedDependantId(null)
    setStep('search-employee')
  }

  return (
    <WizardChrome
      title="Corrections to Submit"
      onBack={() => setStep('edit-form')}
      onExit={() => navigate('/endorsements')}
      secondaryLabel="Add another correction"
      onSecondary={addAnother}
      primaryLabel={`Submit ${correctionBatch.length} correction${
        correctionBatch.length === 1 ? '' : 's'
      }`}
      primaryDisabled={correctionBatch.length === 0}
      onPrimary={completeFlow}
    >
      <FlowStepper
        steps={['Search', 'Edit details', 'Corrections']}
        activeIndex={2}
        bare
      />

      <Note>
        Only changed fields will be submitted. Plan and benefit assignments
        remain unchanged.
      </Note>

      {correctionBatch.length === 0 ? (
        <Empty>No valid corrections have been added yet.</Empty>
      ) : (
        <Table>
          <Header>
            <span>Member</span>
            <span>Change</span>
            <span />
          </Header>
          {correctionBatch.map((correction) => (
            <Row key={correction.memberId}>
              <Member data-label="Member">
                <strong>{correction.memberName}</strong>
                <span>{correction.relationship}</span>
              </Member>
              <Diffs data-label="Change">
                {correction.diffs.map((diff) => (
                  <Diff key={diff.field}>
                    <strong>{diff.label}</strong>
                    <span>
                      {diff.from || '—'} → {diff.to || '—'}
                    </span>
                  </Diff>
                ))}
              </Diffs>
              <Remove
                type="button"
                data-label="Action"
                onClick={() => removeCorrection(correction.memberId)}
              >
                Remove
              </Remove>
            </Row>
          ))}
        </Table>
      )}
    </WizardChrome>
  )
}

const Note = styled.p`
  margin: 0;
  font-size: 13px;
  color: ${({ theme }) => theme.colors.textSecondary};
`

const Empty = styled.div`
  padding: 20px;
  border-radius: 12px;
  background: ${({ theme }) => theme.colors.disableFill};
  font-size: 13px;
  color: ${({ theme }) => theme.colors.textSecondary};
`

const Table = styled.div`
  display: flex;
  flex-direction: column;
  border-radius: 12px;
  overflow: hidden;
  border: 1px solid ${({ theme }) => theme.colors.defaultBorder};
  max-width: 100%;
  box-sizing: border-box;
`

const Header = styled.div`
  display: grid;
  grid-template-columns: 1fr 2fr 80px;
  gap: 16px;
  padding: 10px 14px;
  background: ${({ theme }) => theme.colors.disableFill};
  font-size: 11px;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.textSecondary};

  @media (max-width: 640px) {
    display: none;
  }
`

const Row = styled.div`
  display: grid;
  grid-template-columns: 1fr 2fr 80px;
  align-items: start;
  gap: 16px;
  padding: 14px;
  background: ${({ theme }) => theme.colors.surface1};
  border-top: 1px solid ${({ theme }) => theme.colors.disableFill};

  @media (max-width: 640px) {
    display: flex;
    flex-direction: column;
    gap: 0;
    padding: 12px;

    > [data-label] {
      display: flex;
      flex-direction: column;
      gap: 6px;
      padding: 10px 0;

      &::before {
        content: attr(data-label);
        font-size: 11px;
        font-weight: 600;
        color: ${({ theme }) => theme.colors.textSecondary};
      }

      &:not(:last-child) {
        border-bottom: 1px solid ${({ theme }) => theme.colors.disableFill};
      }
    }
  }
`

const Member = styled.div`
  display: flex;
  flex-direction: column;
  gap: 3px;
  font-size: 11px;
  color: ${({ theme }) => theme.colors.textSecondary};

  strong {
    font-size: 13px;
    color: ${({ theme }) => theme.colors.textPrimary};
  }
`

const Diffs = styled.div`
  display: flex;
  flex-direction: column;
  gap: 7px;
`

const Diff = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
  font-size: 11px;
  color: ${({ theme }) => theme.colors.textSecondary};

  strong {
    color: ${({ theme }) => theme.colors.textPrimary};
  }
`

const Remove = styled.button`
  border: none;
  background: transparent;
  font-family: ${({ theme }) => theme.fontFamily};
  font-size: 12px;
  color: ${({ theme }) => theme.colors.textError};
  cursor: pointer;
  text-align: left;

  @media (max-width: 640px) {
    align-self: flex-start;
    padding: 4px 0;
  }
`
