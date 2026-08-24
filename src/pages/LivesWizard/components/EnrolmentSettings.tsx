import styled from 'styled-components'

import type { EnrolmentSettingsState } from '@/data/flexDeal'

export function EnrolmentSettings({
  value,
  onChange,
  launchTargets,
  requireRunChoice = false,
}: {
  value: EnrolmentSettingsState
  onChange: (next: EnrolmentSettingsState) => void
  launchTargets?: { id: string; label: string }[]
  requireRunChoice?: boolean
}) {
  return (
    <Wrap>
      {requireRunChoice ? (
        <Block>
          <Label>Run enrolment for this batch?</Label>
          <RadioRow>
            <RadioOption>
              <input
                type="radio"
                name="run-enrolment"
                checked={value.runEnrolment === true}
                onChange={() => onChange({ ...value, runEnrolment: true })}
              />
              <span>Yes, set up enrolment</span>
            </RadioOption>
            <RadioOption>
              <input
                type="radio"
                name="run-enrolment"
                checked={value.runEnrolment === false}
                onChange={() =>
                  onChange({ ...value, runEnrolment: false, mode: 'none' })
                }
              />
              <span>No, skip enrolment</span>
            </RadioOption>
          </RadioRow>
        </Block>
      ) : null}

      {(value.runEnrolment === true || !requireRunChoice) && (
        <>
          <Block>
            <Label>Enrolment due date</Label>
            <Input
              type="date"
              value={value.dueDate}
              onChange={(e) => onChange({ ...value, dueDate: e.target.value })}
            />
          </Block>

          <Block>
            <Label>Invitation</Label>
            <RadioRow>
              <RadioOption>
                <input
                  type="radio"
                  name="invite-mode"
                  checked={value.mode === 'now'}
                  onChange={() => onChange({ ...value, mode: 'now' })}
                />
                <span>Send now</span>
              </RadioOption>
              <RadioOption>
                <input
                  type="radio"
                  name="invite-mode"
                  checked={value.mode === 'schedule'}
                  onChange={() => onChange({ ...value, mode: 'schedule' })}
                />
                <span>Schedule for later</span>
              </RadioOption>
            </RadioRow>
          </Block>

          {launchTargets && launchTargets.length > 0 ? (
            <Block>
              <Label>Launch enrolment for</Label>
              <TargetList>
                {launchTargets.map((t) => {
                  const checked = value.launchTargetIds.includes(t.id)
                  return (
                    <TargetOption key={t.id}>
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => {
                          const launchTargetIds = checked
                            ? value.launchTargetIds.filter((id) => id !== t.id)
                            : [...value.launchTargetIds, t.id]
                          onChange({ ...value, launchTargetIds })
                        }}
                      />
                      <span>{t.label}</span>
                    </TargetOption>
                  )
                })}
              </TargetList>
            </Block>
          ) : null}
        </>
      )}
    </Wrap>
  )
}

const Wrap = styled.div`
  display: flex;
  flex-direction: column;
  gap: 20px;
`

const Block = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`

const Label = styled.span`
  font-size: 14px;
  font-weight: 500;
  color: ${({ theme }) => theme.colors.textPrimary};
`

const Input = styled.input`
  width: 280px;
  max-width: 100%;
  height: 48px;
  padding: 0 16px;
  border: 1px solid ${({ theme }) => theme.colors.defaultBorder};
  border-radius: ${({ theme }) => theme.radii.sm};
  font-family: ${({ theme }) => theme.fontFamily};
  font-size: 14px;
  box-sizing: border-box;
`

const RadioRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 20px;
`

const RadioOption = styled.label`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  color: ${({ theme }) => theme.colors.textPrimary};
  cursor: pointer;

  input {
    accent-color: ${({ theme }) => theme.colors.emerald};
  }
`

const TargetList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`

const TargetOption = styled.label`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  color: ${({ theme }) => theme.colors.textPrimary};
  cursor: pointer;

  input {
    accent-color: ${({ theme }) => theme.colors.emerald};
  }
`
