import { useNavigate } from 'react-router-dom'
import styled from 'styled-components'

import { assets } from '@/assets/figma'
import { flexDeal } from '@/data/flexDeal'
import { FlowStepper, WizardChrome } from '@/pages/LivesWizard/WizardChrome'
import { useLivesWizard } from '@/pages/LivesWizard/WizardContext'
import { SINGLE_ADD_STEPS } from '@/pages/LivesWizard/singleAddSteps'

export function EmployeeDetailsStep() {
  const navigate = useNavigate()
  const {
    employee,
    updateEmployee,
    updateCustomAttribute,
    setStep,
  } = useLivesWizard()

  const requiredAttrs = flexDeal.customAttributes.filter((a) => a.required)
  const attrsOk = requiredAttrs.every((a) =>
    Boolean(employee.customAttributes[a.id]?.trim()),
  )

  const canProceed =
    Boolean(employee.employeeId.trim()) &&
    Boolean(employee.firstName.trim()) &&
    Boolean(employee.gender) &&
    Boolean(employee.dateOfBirth) &&
    Boolean(employee.dateOfJoining) &&
    attrsOk

  return (
    <WizardChrome
      title="Add single employee"
      onBack={() => navigate('/endorsements')}
      onExit={() => navigate('/endorsements')}
      secondaryLabel="Back"
      onSecondary={() => navigate('/endorsements')}
      primaryLabel="Proceed"
      primaryDisabled={!canProceed}
      onPrimary={() => setStep('selection')}
    >
      <FlowStepper steps={[...SINGLE_ADD_STEPS]} activeIndex={0} bare />

      <Sheet>
        <Section>
          <SectionTitle>Primary info</SectionTitle>
          <Grid>
            <Field>
              <Label>
                Employee ID<span>*</span>
              </Label>
              <Input
                value={employee.employeeId}
                placeholder="Enter Here"
                onChange={(e) => updateEmployee({ employeeId: e.target.value })}
              />
            </Field>
            <Field>
              <Label>
                First Name<span>*</span>
              </Label>
              <Input
                value={employee.firstName}
                placeholder="Enter Here"
                onChange={(e) => updateEmployee({ firstName: e.target.value })}
              />
            </Field>
            <Field>
              <Label>Last Name</Label>
              <Input
                value={employee.lastName}
                placeholder="Enter Here"
                onChange={(e) => updateEmployee({ lastName: e.target.value })}
              />
            </Field>
          </Grid>

          <Grid>
            <Field>
              <Label>
                Gender<span>*</span>
              </Label>
              <SelectWrap>
                <Select
                  value={employee.gender}
                  onChange={(e) =>
                    updateEmployee({
                      gender: e.target.value as typeof employee.gender,
                    })
                  }
                >
                  <option value="">Select</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                </Select>
                <SelectChevron
                  src={assets.chevronDown}
                  alt=""
                  width={24}
                  height={24}
                  aria-hidden
                />
              </SelectWrap>
            </Field>
            <Field>
              <Label>
                Date of Birth<span>*</span>
              </Label>
              <DateWrap>
                <Input
                  type="text"
                  inputMode="numeric"
                  placeholder="Enter Date (DD/MM/YYYY)"
                  value={employee.dateOfBirth}
                  onChange={(e) =>
                    updateEmployee({ dateOfBirth: e.target.value })
                  }
                />
                <DateIcon
                  src={assets.iconCalendar24}
                  alt=""
                  width={24}
                  height={24}
                  aria-hidden
                />
              </DateWrap>
            </Field>
            <Field>
              <Label>
                Date of Joining<span>*</span>
              </Label>
              <DateWrap>
                <Input
                  type="text"
                  inputMode="numeric"
                  placeholder="Enter Date (DD/MM/YYYY)"
                  value={employee.dateOfJoining}
                  onChange={(e) =>
                    updateEmployee({ dateOfJoining: e.target.value })
                  }
                />
                <DateIcon
                  src={assets.iconCalendar24}
                  alt=""
                  width={24}
                  height={24}
                  aria-hidden
                />
              </DateWrap>
            </Field>
          </Grid>

          <Grid>
            <Field>
              <Label>Work Email</Label>
              <Input
                type="email"
                value={employee.email}
                placeholder="Enter Here"
                onChange={(e) => updateEmployee({ email: e.target.value })}
              />
            </Field>
            <Field>
              <Label>Mobile Number</Label>
              <PhoneWrap>
                <PhonePrefix>+91</PhonePrefix>
                <PhoneDivider aria-hidden />
                <PhoneInput
                  value={employee.mobile}
                  placeholder="Enter phone number"
                  onChange={(e) => updateEmployee({ mobile: e.target.value })}
                />
              </PhoneWrap>
            </Field>
          </Grid>
        </Section>

        {flexDeal.customAttributes.length > 0 ? (
          <Section>
            <SectionTitle>Other important info</SectionTitle>
            <Grid>
              {flexDeal.customAttributes.map((attr) => (
                <Field key={attr.id}>
                  <Label>
                    {attr.label}
                    {attr.required ? <span>*</span> : null}
                  </Label>
                  {attr.allowedValues ? (
                    <SelectWrap>
                      <Select
                        value={employee.customAttributes[attr.id] ?? ''}
                        onChange={(e) =>
                          updateCustomAttribute(attr.id, e.target.value)
                        }
                      >
                        <option value="">Select</option>
                        {attr.allowedValues.map((v) => (
                          <option key={v} value={v}>
                            {v}
                          </option>
                        ))}
                      </Select>
                      <SelectChevron
                        src={assets.chevronDown}
                        alt=""
                        width={24}
                        height={24}
                        aria-hidden
                      />
                    </SelectWrap>
                  ) : (
                    <Input
                      value={employee.customAttributes[attr.id] ?? ''}
                      placeholder="Enter Here"
                      onChange={(e) =>
                        updateCustomAttribute(attr.id, e.target.value)
                      }
                    />
                  )}
                </Field>
              ))}
            </Grid>
          </Section>
        ) : null}
      </Sheet>
    </WizardChrome>
  )
}

const Sheet = styled.div`
  display: flex;
  flex-direction: column;
  gap: 32px;
  width: 100%;
  padding: 24px;
  background: ${({ theme }) => theme.colors.surface1};
  border-radius: 16px;
  box-sizing: border-box;
`

const Section = styled.section`
  display: flex;
  flex-direction: column;
  gap: 24px;
`

const SectionTitle = styled.h2`
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  line-height: 24px;
  color: ${({ theme }) => theme.colors.beyondGrey};
`

const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 24px;

  @media (max-width: 960px) {
    grid-template-columns: 1fr;
  }
`

const Field = styled.label<{ $fixed?: boolean }>`
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-width: 0;
  width: ${({ $fixed }) => ($fixed ? '342px' : 'auto')};
  max-width: 100%;
`

const Label = styled.span`
  font-size: 14px;
  font-weight: 500;
  line-height: 20px;
  letter-spacing: 0.2px;
  color: ${({ theme }) => theme.colors.textPrimary};

  span {
    color: ${({ theme }) => theme.colors.textError};
  }
`

const Input = styled.input`
  width: 100%;
  height: 48px;
  padding: 12px 20px;
  border: 1px solid ${({ theme }) => theme.colors.defaultBorder};
  border-radius: ${({ theme }) => theme.radii.sm};
  font-family: ${({ theme }) => theme.fontFamily};
  font-size: 14px;
  font-weight: 500;
  line-height: 20px;
  letter-spacing: 0.2px;
  color: ${({ theme }) => theme.colors.textPrimary};
  background: ${({ theme }) => theme.colors.surface1};
  box-sizing: border-box;

  &::placeholder {
    font-weight: 400;
    color: ${({ theme }) => theme.colors.textSecondary};
  }
`

const SelectWrap = styled.div`
  position: relative;
`

const Select = styled.select`
  width: 100%;
  height: 48px;
  padding: 0 48px 0 20px;
  border: 1px solid ${({ theme }) => theme.colors.defaultBorder};
  border-radius: ${({ theme }) => theme.radii.sm};
  font-family: ${({ theme }) => theme.fontFamily};
  font-size: 14px;
  font-weight: 500;
  color: ${({ theme }) => theme.colors.textPrimary};
  background: ${({ theme }) => theme.colors.surface1};
  appearance: none;
  cursor: pointer;
`

const SelectChevron = styled.img`
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  pointer-events: none;
`

const DateWrap = styled.div`
  position: relative;
`

const DateIcon = styled.img`
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  pointer-events: none;
`

const PhoneWrap = styled.div`
  display: flex;
  align-items: center;
  height: 48px;
  border: 1px solid ${({ theme }) => theme.colors.defaultBorder};
  border-radius: ${({ theme }) => theme.radii.sm};
  background: ${({ theme }) => theme.colors.surface1};
  overflow: hidden;
`

const PhonePrefix = styled.span`
  padding: 0 12px;
  font-size: 14px;
  font-weight: 500;
  color: ${({ theme }) => theme.colors.textPrimary};
  white-space: nowrap;
`

const PhoneDivider = styled.span`
  width: 1px;
  align-self: stretch;
  background: ${({ theme }) => theme.colors.defaultBorder};
`

const PhoneInput = styled.input`
  flex: 1;
  min-width: 0;
  height: 100%;
  border: none;
  padding: 0 16px;
  font-family: ${({ theme }) => theme.fontFamily};
  font-size: 14px;
  font-weight: 500;
  color: ${({ theme }) => theme.colors.textPrimary};
  background: transparent;

  &::placeholder {
    font-weight: 400;
    color: ${({ theme }) => theme.colors.textSecondary};
  }

  &:focus {
    outline: none;
  }
`
