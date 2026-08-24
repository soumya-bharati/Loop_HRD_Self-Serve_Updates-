import { useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import styled from 'styled-components'

import { ChevronIcon } from '@/components/icons/ChevronIcon'
import { flexDeal } from '@/data/flexDeal'
import {
  ADD_EMPLOYEES_CSV_TEMPLATE,
  areMembersValid,
  emptyAddEmployeeMember,
  parseEmployeesCsv,
} from '@/pages/LivesWizard/addEmployees'
import { FlowStepper, WizardChrome } from '@/pages/LivesWizard/WizardChrome'
import { useLivesWizard } from '@/pages/LivesWizard/WizardContext'
import { SINGLE_ADD_STEPS } from '@/pages/LivesWizard/singleAddSteps'

export function UserDetailsStep() {
  const navigate = useNavigate()
  const {
    intakeMode,
    setIntakeMode,
    addEmployees,
    updateAddEmployeeFields,
    updateAddEmployeeCustomAttribute,
    addAddEmployee,
    removeAddEmployee,
    addAddEmployeeDependant,
    updateAddEmployeeDependant,
    removeAddEmployeeDependant,
    setAddEmployees,
    fileName,
    setFileName,
    setTemplateDownloaded,
    setStep,
  } = useLivesWizard()

  const inputRef = useRef<HTMLInputElement>(null)
  const [parseError, setParseError] = useState<string | null>(null)
  const [uploadSummary, setUploadSummary] = useState<string | null>(null)
  const [collapsedIds, setCollapsedIds] = useState<Set<string>>(() => new Set())

  const toggleMemberCollapsed = (id: string) => {
    setCollapsedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const requiredAttrs = flexDeal.customAttributes.filter((a) => a.required)
  const formOk =
    intakeMode === 'form' &&
    areMembersValid(addEmployees) &&
    addEmployees.every((m) =>
      requiredAttrs.every((a) =>
        Boolean(m.employee.customAttributes[a.id]?.trim()),
      ),
    )
  const excelOk =
    intakeMode === 'excel' &&
    Boolean(fileName) &&
    areMembersValid(addEmployees)
  const canProceed = formOk || excelOk

  const employeeCount = addEmployees.length
  const dependantCount = addEmployees.reduce(
    (sum, m) => sum + m.dependants.length,
    0,
  )

  const downloadTemplate = () => {
    setTemplateDownloaded(true)
    const blob = new Blob([ADD_EMPLOYEES_CSV_TEMPLATE], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'add-employees-template.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleFile = async (file: File) => {
    setParseError(null)
    setUploadSummary(null)
    setFileName(file.name)
    if (!file.name.toLowerCase().endsWith('.csv')) {
      setParseError(
        'Please upload a CSV file (export your Excel sheet as CSV). Template download is CSV.',
      )
      return
    }
    const text = await file.text()
    const result = parseEmployeesCsv(text)
    if (result.error) {
      setParseError(result.error)
      setAddEmployees([])
      return
    }
    setAddEmployees(result.members)
    const deps = result.members.reduce((s, m) => s + m.dependants.length, 0)
    setUploadSummary(
      `${result.members.length} employee${result.members.length === 1 ? '' : 's'} · ${deps} dependant${deps === 1 ? '' : 's'} detected`,
    )
  }

  return (
    <WizardChrome
      title="Add new employee(s)"
      onBack={() => navigate('/endorsements')}
      onExit={() => navigate('/endorsements')}
      secondaryLabel="Back"
      onSecondary={() => navigate('/endorsements')}
      primaryLabel="Proceed"
      primaryDisabled={!canProceed}
      onPrimary={() => setStep('benefits')}
    >
      <FlowStepper steps={[...SINGLE_ADD_STEPS]} activeIndex={0} bare />

      <ModeToggle>
        <ModeButton
          type="button"
          $active={intakeMode === 'form'}
          onClick={() => {
            setIntakeMode('form')
            setParseError(null)
            if (addEmployees.length === 0) {
              setAddEmployees([emptyAddEmployeeMember()])
            }
          }}
        >
          Fill form
        </ModeButton>
        <ModeButton
          type="button"
          $active={intakeMode === 'excel'}
          onClick={() => setIntakeMode('excel')}
        >
          Upload excel
        </ModeButton>
      </ModeToggle>

      {intakeMode === 'form' ? (
        <>
          <Hint>
            Add one or more employees. Optionally nest dependants under each
            employee before choosing benefits.
          </Hint>
          {addEmployees.map((member, index) => {
            const collapsed = collapsedIds.has(member.id)
            const displayName = [member.employee.firstName, member.employee.lastName]
              .filter(Boolean)
              .join(' ')
            const collapsedMeta = [
              displayName || member.employee.employeeId,
              `${member.dependants.length} dependant${member.dependants.length === 1 ? '' : 's'}`,
            ]
              .filter(Boolean)
              .join(' · ')

            return (
            <MemberCard key={member.id}>
              <MemberHeader>
                <CollapseToggle
                  type="button"
                  aria-expanded={!collapsed}
                  aria-controls={`employee-form-${member.id}`}
                  onClick={() => toggleMemberCollapsed(member.id)}
                >
                  <MemberTitle>Employee {index + 1}</MemberTitle>
                  {collapsed && collapsedMeta ? (
                    <CollapsedMeta>{collapsedMeta}</CollapsedMeta>
                  ) : null}
                  <ChevronWrap>
                    <ChevronIcon
                      direction={collapsed ? 'down' : 'up'}
                      size={20}
                    />
                  </ChevronWrap>
                </CollapseToggle>
                {addEmployees.length > 1 ? (
                  <RemoveLink
                    type="button"
                    onClick={() => removeAddEmployee(member.id)}
                  >
                    Remove
                  </RemoveLink>
                ) : null}
              </MemberHeader>

              {collapsed ? null : (
              <MemberBody id={`employee-form-${member.id}`}>
              <Grid>
                <Field>
                  <Label>
                    Employee ID<span>*</span>
                  </Label>
                  <Input
                    value={member.employee.employeeId}
                    placeholder="Enter Here"
                    onChange={(e) =>
                      updateAddEmployeeFields(member.id, {
                        employeeId: e.target.value,
                      })
                    }
                  />
                </Field>
                <Field>
                  <Label>
                    First Name<span>*</span>
                  </Label>
                  <Input
                    value={member.employee.firstName}
                    placeholder="Enter Here"
                    onChange={(e) =>
                      updateAddEmployeeFields(member.id, {
                        firstName: e.target.value,
                      })
                    }
                  />
                </Field>
                <Field>
                  <Label>Last Name</Label>
                  <Input
                    value={member.employee.lastName}
                    placeholder="Enter Here"
                    onChange={(e) =>
                      updateAddEmployeeFields(member.id, {
                        lastName: e.target.value,
                      })
                    }
                  />
                </Field>
                <Field>
                  <Label>
                    Gender<span>*</span>
                  </Label>
                  <Select
                    value={member.employee.gender}
                    onChange={(e) =>
                      updateAddEmployeeFields(member.id, {
                        gender: e.target.value as typeof member.employee.gender,
                      })
                    }
                  >
                    <option value="">Select</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                  </Select>
                </Field>
                <Field>
                  <Label>
                    Date of Birth<span>*</span>
                  </Label>
                  <Input
                    type="date"
                    value={member.employee.dateOfBirth}
                    onChange={(e) =>
                      updateAddEmployeeFields(member.id, {
                        dateOfBirth: e.target.value,
                      })
                    }
                  />
                </Field>
                <Field>
                  <Label>
                    Date of Joining<span>*</span>
                  </Label>
                  <Input
                    type="date"
                    value={member.employee.dateOfJoining}
                    onChange={(e) =>
                      updateAddEmployeeFields(member.id, {
                        dateOfJoining: e.target.value,
                      })
                    }
                  />
                </Field>
                <Field>
                  <Label>Work Email</Label>
                  <Input
                    value={member.employee.email}
                    placeholder="Enter Here"
                    onChange={(e) =>
                      updateAddEmployeeFields(member.id, {
                        email: e.target.value,
                      })
                    }
                  />
                </Field>
                <Field>
                  <Label>Mobile</Label>
                  <Input
                    value={member.employee.mobile}
                    placeholder="Enter Here"
                    onChange={(e) =>
                      updateAddEmployeeFields(member.id, {
                        mobile: e.target.value,
                      })
                    }
                  />
                </Field>
                {requiredAttrs.map((attr) => (
                  <Field key={attr.id}>
                    <Label>
                      {attr.label}
                      <span>*</span>
                    </Label>
                    {attr.allowedValues?.length ? (
                      <Select
                        value={member.employee.customAttributes[attr.id] ?? ''}
                        onChange={(e) =>
                          updateAddEmployeeCustomAttribute(
                            member.id,
                            attr.id,
                            e.target.value,
                          )
                        }
                      >
                        <option value="">Select</option>
                        {attr.allowedValues.map((v) => (
                          <option key={v} value={v}>
                            {v}
                          </option>
                        ))}
                      </Select>
                    ) : (
                      <Input
                        value={member.employee.customAttributes[attr.id] ?? ''}
                        onChange={(e) =>
                          updateAddEmployeeCustomAttribute(
                            member.id,
                            attr.id,
                            e.target.value,
                          )
                        }
                      />
                    )}
                  </Field>
                ))}
              </Grid>

              <DependantBlock>
                <DependantHeader>
                  <SubTitle>Dependants</SubTitle>
                  <AddLink
                    type="button"
                    onClick={() => addAddEmployeeDependant(member.id)}
                  >
                    + Add dependant
                  </AddLink>
                </DependantHeader>
                {member.dependants.length === 0 ? (
                  <EmptyDeps>No dependants added</EmptyDeps>
                ) : (
                  member.dependants.map((dep, dIndex) => (
                    <DependantCard key={dep.id}>
                      <MemberHeader>
                        <SubTitle>Dependant {dIndex + 1}</SubTitle>
                        <RemoveLink
                          type="button"
                          onClick={() =>
                            removeAddEmployeeDependant(member.id, dep.id)
                          }
                        >
                          Remove
                        </RemoveLink>
                      </MemberHeader>
                      <Grid>
                        <Field>
                          <Label>
                            Relationship<span>*</span>
                          </Label>
                          <Select
                            value={dep.relationship}
                            onChange={(e) =>
                              updateAddEmployeeDependant(member.id, dep.id, {
                                relationship: e.target
                                  .value as typeof dep.relationship,
                              })
                            }
                          >
                            <option value="">Select</option>
                            <option value="Spouse">Spouse</option>
                            <option value="Child">Child</option>
                            <option value="Parent">Parent</option>
                            <option value="Parent-in-law">Parent-in-law</option>
                          </Select>
                        </Field>
                        <Field>
                          <Label>
                            First Name<span>*</span>
                          </Label>
                          <Input
                            value={dep.firstName}
                            onChange={(e) =>
                              updateAddEmployeeDependant(member.id, dep.id, {
                                firstName: e.target.value,
                              })
                            }
                          />
                        </Field>
                        <Field>
                          <Label>Last Name</Label>
                          <Input
                            value={dep.lastName}
                            onChange={(e) =>
                              updateAddEmployeeDependant(member.id, dep.id, {
                                lastName: e.target.value,
                              })
                            }
                          />
                        </Field>
                        <Field>
                          <Label>
                            Gender<span>*</span>
                          </Label>
                          <Select
                            value={dep.gender}
                            onChange={(e) =>
                              updateAddEmployeeDependant(member.id, dep.id, {
                                gender: e.target.value as typeof dep.gender,
                              })
                            }
                          >
                            <option value="">Select</option>
                            <option value="Male">Male</option>
                            <option value="Female">Female</option>
                          </Select>
                        </Field>
                        <Field>
                          <Label>
                            Date of Birth<span>*</span>
                          </Label>
                          <Input
                            type="date"
                            value={dep.dateOfBirth}
                            onChange={(e) =>
                              updateAddEmployeeDependant(member.id, dep.id, {
                                dateOfBirth: e.target.value,
                              })
                            }
                          />
                        </Field>
                      </Grid>
                    </DependantCard>
                  ))
                )}
              </DependantBlock>
              </MemberBody>
              )}
            </MemberCard>
            )
          })}

          <AddEmployeeBtn type="button" onClick={addAddEmployee}>
            + Add another employee
          </AddEmployeeBtn>
        </>
      ) : (
        <ExcelPanel>
          <Hint>
            Download the template (includes Relationship so Self + dependants
            share an Employee ID), or upload your own CSV with the same
            columns.
          </Hint>
          <ActionsGrid>
            <ActionCard>
              <ActionTitle>1. Download template</ActionTitle>
              <ActionCopy>
                CSV with Employee ID, names, DOB, Relationship, Grade, and more.
              </ActionCopy>
              <PrimaryGhost type="button" onClick={downloadTemplate}>
                Download CSV template
              </PrimaryGhost>
            </ActionCard>
            <ActionCard>
              <ActionTitle>2. Upload sheet</ActionTitle>
              <ActionCopy>
                Accepts .csv (export Excel as CSV). We detect dependants by
                Relationship.
              </ActionCopy>
              <FileRow>
                <PrimaryGhost
                  type="button"
                  onClick={() => inputRef.current?.click()}
                >
                  {fileName ? 'Replace file' : 'Choose file'}
                </PrimaryGhost>
                <input
                  ref={inputRef}
                  type="file"
                  accept=".csv,.xlsx,.xls,text/csv"
                  hidden
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) void handleFile(file)
                  }}
                />
                {fileName ? <FileName>{fileName}</FileName> : null}
              </FileRow>
            </ActionCard>
          </ActionsGrid>
          {parseError ? <ErrorText>{parseError}</ErrorText> : null}
          {uploadSummary ? <SummaryBanner>{uploadSummary}</SummaryBanner> : null}
          {!uploadSummary && employeeCount > 0 && fileName ? (
            <SummaryBanner>
              {employeeCount} employee{employeeCount === 1 ? '' : 's'} ·{' '}
              {dependantCount} dependant{dependantCount === 1 ? '' : 's'}{' '}
              detected
            </SummaryBanner>
          ) : null}
        </ExcelPanel>
      )}
    </WizardChrome>
  )
}

const ModeToggle = styled.div`
  display: inline-flex;
  gap: 0;
  padding: 4px;
  border-radius: 10px;
  background: ${({ theme }) => theme.colors.disableFill};
  width: fit-content;
`

const ModeButton = styled.button<{ $active: boolean }>`
  border: none;
  border-radius: 8px;
  padding: 8px 16px;
  font-family: ${({ theme }) => theme.fontFamily};
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  background: ${({ theme, $active }) =>
    $active ? theme.colors.surface1 : 'transparent'};
  color: ${({ theme, $active }) =>
    $active ? theme.colors.emerald : theme.colors.textSecondary};
  box-shadow: ${({ $active, theme }) => ($active ? theme.shadows.smooth : 'none')};
`

const Hint = styled.p`
  margin: 0;
  font-size: 14px;
  line-height: 20px;
  color: ${({ theme }) => theme.colors.textSecondary};
`

const MemberCard = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 20px 24px;
  border-radius: 12px;
  background: ${({ theme }) => theme.colors.surface1};
  border: 1px solid ${({ theme }) => theme.colors.defaultBorder};
`

const MemberHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
`

const CollapseToggle = styled.button`
  flex: 1;
  min-width: 0;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 0;
  border: none;
  background: transparent;
  cursor: pointer;
  text-align: left;
  font-family: ${({ theme }) => theme.fontFamily};
`

const MemberTitle = styled.h3`
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.textPrimary};
  white-space: nowrap;
`

const CollapsedMeta = styled.span`
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 13px;
  font-weight: 400;
  color: ${({ theme }) => theme.colors.textSecondary};
`

const ChevronWrap = styled.span`
  margin-left: auto;
  display: flex;
  flex-shrink: 0;
`

const MemberBody = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
`

const SubTitle = styled.h4`
  margin: 0;
  font-size: 14px;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.textPrimary};
`

const RemoveLink = styled.button`
  border: none;
  background: transparent;
  color: ${({ theme }) => theme.colors.textError};
  font-family: ${({ theme }) => theme.fontFamily};
  font-size: 13px;
  cursor: pointer;
`

const AddLink = styled.button`
  border: none;
  background: transparent;
  color: ${({ theme }) => theme.colors.emerald};
  font-family: ${({ theme }) => theme.fontFamily};
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
`

const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 16px;

  @media (max-width: 960px) {
    grid-template-columns: 1fr;
  }
`

const Field = styled.label`
  display: flex;
  flex-direction: column;
  gap: 6px;
`

const Label = styled.span`
  font-size: 13px;
  font-weight: 500;
  color: ${({ theme }) => theme.colors.textPrimary};

  span {
    color: ${({ theme }) => theme.colors.textError};
  }
`

const Input = styled.input`
  height: 40px;
  padding: 0 12px;
  border: 1px solid ${({ theme }) => theme.colors.defaultBorder};
  border-radius: 8px;
  font-family: ${({ theme }) => theme.fontFamily};
  font-size: 14px;
  color: ${({ theme }) => theme.colors.textPrimary};
  background: ${({ theme }) => theme.colors.surface1};
  box-sizing: border-box;
`

const Select = styled.select`
  height: 40px;
  padding: 0 12px;
  border: 1px solid ${({ theme }) => theme.colors.defaultBorder};
  border-radius: 8px;
  font-family: ${({ theme }) => theme.fontFamily};
  font-size: 14px;
  color: ${({ theme }) => theme.colors.textPrimary};
  background: ${({ theme }) => theme.colors.surface1};
`

const DependantBlock = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding-top: 8px;
  border-top: 1px solid ${({ theme }) => theme.colors.defaultBorder};
`

const DependantHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
`

const DependantCard = styled.div`
  padding: 12px;
  border-radius: 10px;
  background: ${({ theme }) => theme.colors.surface0};
  display: flex;
  flex-direction: column;
  gap: 12px;
`

const EmptyDeps = styled.p`
  margin: 0;
  font-size: 13px;
  color: ${({ theme }) => theme.colors.textSecondary};
`

const AddEmployeeBtn = styled.button`
  align-self: flex-start;
  height: 40px;
  padding: 0 16px;
  border: 1px dashed ${({ theme }) => theme.colors.emerald};
  border-radius: 8px;
  background: transparent;
  color: ${({ theme }) => theme.colors.emerald};
  font-family: ${({ theme }) => theme.fontFamily};
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
`

const ExcelPanel = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
`

const ActionsGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;

  @media (max-width: 800px) {
    grid-template-columns: 1fr;
  }
`

const ActionCard = styled.div`
  padding: 20px;
  border-radius: 12px;
  background: ${({ theme }) => theme.colors.surface1};
  border: 1px solid ${({ theme }) => theme.colors.defaultBorder};
  display: flex;
  flex-direction: column;
  gap: 10px;
`

const ActionTitle = styled.div`
  font-size: 15px;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.textPrimary};
`

const ActionCopy = styled.p`
  margin: 0;
  font-size: 13px;
  line-height: 18px;
  color: ${({ theme }) => theme.colors.textSecondary};
`

const PrimaryGhost = styled.button`
  align-self: flex-start;
  height: 36px;
  padding: 0 14px;
  border: 1px solid ${({ theme }) => theme.colors.emerald};
  border-radius: 8px;
  background: transparent;
  color: ${({ theme }) => theme.colors.emerald};
  font-family: ${({ theme }) => theme.fontFamily};
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
`

const FileRow = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
`

const FileName = styled.span`
  font-size: 13px;
  color: ${({ theme }) => theme.colors.textSecondary};
`

const ErrorText = styled.p`
  margin: 0;
  font-size: 13px;
  color: ${({ theme }) => theme.colors.textError};
`

const SummaryBanner = styled.div`
  padding: 12px 16px;
  border-radius: 10px;
  background: ${({ theme }) => theme.colors.planeGreenLight};
  color: ${({ theme }) => theme.colors.emerald};
  font-size: 14px;
  font-weight: 500;
`
