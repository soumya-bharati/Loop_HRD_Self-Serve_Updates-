import { useEffect, useState } from 'react'
import styled, { keyframes } from 'styled-components'

import { assets } from '@/assets/figma'
import { ModalPortal } from '@/components/ModalPortal'

type Props = {
  open: boolean
  /** Lives the invite would go out to, shown above the email preview. */
  recipientCount: number
  onCancel: () => void
  onConfirm: () => void
}

/**
 * Asks whether the newly added employees should also get an enrollment window,
 * between submitting the validated sheet and seeing the endorsement cost.
 */
export function EnrollmentSettingsModal({
  open,
  recipientCount,
  onCancel,
  onConfirm,
}: Props) {
  const [launchEnrolment, setLaunchEnrolment] = useState(true)
  const [inviteSchedule, setInviteSchedule] = useState<'now' | 'later'>('later')

  useEffect(() => {
    if (open) return
    setLaunchEnrolment(true)
    setInviteSchedule('later')
  }, [open])

  if (!open) return null

  return (
    <ModalPortal>
      <Overlay role="presentation" onMouseDown={onCancel}>
        <Dialog
          role="dialog"
          aria-modal="true"
          aria-labelledby="enrollment-settings-title"
          onMouseDown={(event) => event.stopPropagation()}
        >
          <Header>
            <Title id="enrollment-settings-title">Enrollment Settings</Title>
            <CloseButton type="button" aria-label="Close" onClick={onCancel}>
              <img
                src={assets.mlIconModalClose24}
                alt=""
                width={24}
                height={24}
              />
            </CloseButton>
          </Header>

          <Body>
            <Field>
              <Question>
                Do you want to launch an enrollment window for these employee?
              </Question>
              <Choices role="group" aria-label="Launch enrollment window">
                <Choice
                  type="button"
                  $active={launchEnrolment}
                  aria-pressed={launchEnrolment}
                  onClick={() => setLaunchEnrolment(true)}
                >
                  Yes, launch enrolment
                </Choice>
                <Choice
                  type="button"
                  $active={!launchEnrolment}
                  aria-pressed={!launchEnrolment}
                  onClick={() => setLaunchEnrolment(false)}
                >
                  No, just add the employee
                </Choice>
              </Choices>
            </Field>

            {launchEnrolment ? (
              <>
                <Field>
                  <FieldLabel htmlFor="enrollment-due-date">
                    Enrollment due date<Required>*</Required>
                  </FieldLabel>
                  <TextBox>
                    <input id="enrollment-due-date" defaultValue="27/08/2026" />
                    <img
                      src={assets.mlIconCalendarField24}
                      alt=""
                      width={24}
                      height={24}
                    />
                  </TextBox>
                </Field>

                <Field>
                  <Question as="p">Invitation email</Question>
                  <Choices role="group" aria-label="Invitation email timing">
                    <Choice
                      type="button"
                      $active={inviteSchedule === 'now'}
                      aria-pressed={inviteSchedule === 'now'}
                      onClick={() => setInviteSchedule('now')}
                    >
                      Send Invite Now
                    </Choice>
                    <Choice
                      type="button"
                      $active={inviteSchedule === 'later'}
                      aria-pressed={inviteSchedule === 'later'}
                      onClick={() => setInviteSchedule('later')}
                    >
                      Schedule for a later date
                    </Choice>
                  </Choices>
                </Field>

                {inviteSchedule === 'later' ? (
                  <FieldRow>
                    <TextBox>
                      <input
                        defaultValue="14/8/2026"
                        aria-label="Invite date"
                      />
                      <img
                        src={assets.mlIconCalendarField24}
                        alt=""
                        width={24}
                        height={24}
                      />
                    </TextBox>
                    <TextBox>
                      <input defaultValue="09:00 AM" aria-label="Invite time" />
                      <img
                        src={assets.mlIconChevronDownField}
                        alt=""
                        width={24}
                        height={24}
                      />
                    </TextBox>
                  </FieldRow>
                ) : null}

                <Divider />

                <SendTo>
                  Send to : All {recipientCount}{' '}
                  {recipientCount === 1 ? 'Employee' : 'Employees'}
                </SendTo>

                <EmailPreview>
                  <img src={assets.mlEnrollmentEmailPreview} alt="" />
                </EmailPreview>
              </>
            ) : null}
          </Body>

          <Footer>
            <ReportLink type="button">Report an Issue</ReportLink>
            <SecondaryButton type="button" onClick={onCancel}>
              Cancel
            </SecondaryButton>
            <PrimaryButton type="button" onClick={onConfirm}>
              Confirm &amp; Submit
            </PrimaryButton>
          </Footer>
        </Dialog>
      </Overlay>
    </ModalPortal>
  )
}

const fadeIn = keyframes`
  from { opacity: 0; }
  to { opacity: 1; }
`

const scaleIn = keyframes`
  from { opacity: 0; transform: translateY(12px) scale(0.98); }
  to { opacity: 1; transform: translateY(0) scale(1); }
`

const Overlay = styled.div`
  position: fixed;
  inset: 0;
  z-index: 180;
  display: grid;
  place-items: center;
  padding: 24px 5vw;
  background: rgba(45, 55, 72, 0.48);
  animation: ${fadeIn} 160ms ease-out;
`

const Dialog = styled.div`
  display: flex;
  width: min(858px, 100%);
  max-height: min(90vh, 760px);
  flex-direction: column;
  gap: 20px;
  padding: 24px;
  border: 1px solid ${({ theme }) => theme.colors.defaultBorder};
  border-radius: 16px;
  background: ${({ theme }) => theme.colors.surface1};
  box-sizing: border-box;
  box-shadow:
    0 10px 10px -2px rgba(55, 65, 81, 0.05),
    0 20px 25px -3px rgba(55, 65, 81, 0.05);
  animation: ${scaleIn} 200ms ease-out;
`

const Header = styled.header`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
`

const Title = styled.h2`
  margin: 0;
  color: ${({ theme }) => theme.colors.textPrimary};
  font-size: 18px;
  font-weight: 600;
  line-height: 24px;
  letter-spacing: -0.2px;
`

const CloseButton = styled.button`
  display: grid;
  width: 24px;
  height: 24px;
  flex-shrink: 0;
  padding: 0;
  place-items: center;
  border: 0;
  background: transparent;
  cursor: pointer;

  img {
    display: block;
    width: 24px;
    height: 24px;
  }
`

/**
 * Children must not shrink: the tall email preview would otherwise be squeezed
 * to fit this box instead of overflowing it, leaving nothing to scroll.
 */
const Body = styled.div`
  display: flex;
  min-height: 0;
  flex: 1;
  flex-direction: column;
  gap: 20px;
  overflow-y: auto;
  overscroll-behavior: contain;

  > * {
    flex-shrink: 0;
  }
`

const Field = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
`

const FieldRow = styled.div`
  display: flex;
  gap: 24px;

  > * {
    min-width: 0;
    flex: 1;
  }
`

const Question = styled.h3`
  margin: 0;
  color: ${({ theme }) => theme.colors.textPrimary};
  font-size: 14px;
  font-weight: 500;
  line-height: 20px;
  letter-spacing: 0.2px;
`

const FieldLabel = styled.label`
  color: ${({ theme }) => theme.colors.textPrimary};
  font-size: 14px;
  font-weight: 500;
  line-height: 20px;
  letter-spacing: 0.2px;
`

const Required = styled.span`
  color: ${({ theme }) => theme.colors.textError};
`

const Choices = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
`

const Choice = styled.button<{ $active: boolean }>`
  display: inline-flex;
  height: 36px;
  align-items: center;
  justify-content: center;
  padding: 8px 16px;
  border: 1px solid
    ${({ $active, theme }) =>
      $active ? 'transparent' : theme.colors.defaultBorder};
  border-radius: 30px;
  background: ${({ $active, theme }) =>
    $active ? theme.colors.planeGreenLight : 'transparent'};
  color: ${({ $active, theme }) =>
    $active ? theme.colors.emerald : theme.colors.textPrimary};
  font: inherit;
  font-size: 12px;
  font-weight: ${({ $active }) => ($active ? 500 : 400)};
  line-height: 18px;
  letter-spacing: 0.2px;
  cursor: pointer;
`

const TextBox = styled.div`
  display: flex;
  height: 48px;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 12px 20px;
  border: 1px solid ${({ theme }) => theme.colors.defaultBorder};
  border-radius: 8px;
  background: ${({ theme }) => theme.colors.surface1};
  box-sizing: border-box;

  input {
    min-width: 0;
    flex: 1;
    border: 0;
    background: transparent;
    color: ${({ theme }) => theme.colors.textPrimary};
    font: inherit;
    font-size: 14px;
    font-weight: 500;
    line-height: 20px;
    letter-spacing: 0.2px;

    &:focus {
      outline: none;
    }
  }

  img {
    display: block;
    width: 24px;
    height: 24px;
    flex-shrink: 0;
  }
`

const Divider = styled.hr`
  width: 100%;
  height: 0;
  margin: 0;
  border: 0;
  border-top: 1px solid ${({ theme }) => theme.colors.defaultBorder};
`

const SendTo = styled.p`
  margin: 0;
  color: #777777;
  font-size: 12px;
  line-height: 18px;
  letter-spacing: -0.2px;
`

const EmailPreview = styled.div`
  overflow: hidden;
  width: 100%;
  border-bottom: 1px solid rgba(0, 0, 0, 0.12);

  img {
    display: block;
    width: 100%;
    height: auto;
  }
`

const Footer = styled.footer`
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 8px;
`

const ReportLink = styled.button`
  flex: 1;
  padding: 0;
  border: 0;
  background: transparent;
  color: ${({ theme }) => theme.colors.emerald};
  font: inherit;
  font-size: 16px;
  font-weight: 600;
  line-height: 24px;
  letter-spacing: -0.2px;
  text-align: left;
  text-decoration: underline;
  cursor: pointer;
`

const SecondaryButton = styled.button`
  height: 48px;
  padding: 8px 24px;
  border: 1px solid ${({ theme }) => theme.colors.emerald};
  border-radius: 12px;
  background: transparent;
  color: ${({ theme }) => theme.colors.emerald};
  font: inherit;
  font-size: 14px;
  font-weight: 500;
  line-height: 20px;
  letter-spacing: 0.2px;
  cursor: pointer;
`

const PrimaryButton = styled.button`
  height: 48px;
  padding: 12px 24px;
  border: 0;
  border-radius: 12px;
  background: ${({ theme }) => theme.colors.fillGreen};
  color: ${({ theme }) => theme.colors.emerald};
  font: inherit;
  font-size: 14px;
  font-weight: 500;
  line-height: 20px;
  letter-spacing: 0.2px;
  cursor: pointer;
`
