import { useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import styled from 'styled-components'

import { assets } from '@/assets/figma'
import { ChevronIcon } from '@/components/icons/ChevronIcon'
import {
  parseDateOnly,
  resolveAttributeFields,
  validateAttributeValues,
} from '@/domain/flex'
import {
  ADD_EMPLOYEES_CSV_TEMPLATE,
  areMembersValid,
  emptyAddEmployeeMember,
  isEmployeeValid,
  parseEmployeesCsv,
} from '@/pages/LivesWizard/addEmployees'
import { WizardChrome } from '@/pages/LivesWizard/WizardChrome'
import { DealSelector } from '@/pages/LivesWizard/components/DealSelector'
import { DynamicAttributeForm } from '@/pages/LivesWizard/components/DynamicAttributeForm'
import { EmployeeOnboardingPage } from '@/pages/LivesWizard/components/EmployeeOnboardingPage'
import { useLivesWizard } from '@/pages/LivesWizard/WizardContext'
import {
  addEmployeesPageTitle,
} from '@/pages/LivesWizard/singleAddSteps'
import { useProtoConfig } from '@/proto/ProtoConfigContext'

/** "1986-04-24" or "24/04/1986" → "Apr 24, 1986"; falls back to the raw value. */
function formatSummaryDate(value: string) {
  const parsed = parseDateOnly(value)
  if (!parsed) return value
  return new Date(
    parsed.year,
    parsed.month - 1,
    parsed.day,
  ).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

export function UserDetailsStep() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { deals } = useProtoConfig()
  const dealPickedUpfront = Boolean(searchParams.get('deal'))
  const {
    intakeMode,
    setIntakeMode,
    addEmployees,
    updateAddEmployeeFields,
    updateAddEmployeeCustomAttribute,
    removeAddEmployee,
    editingAddEmployeeIds,
    setAddEmployeeEditing,
    setAddEmployees,
    fileName,
    setFileName,
    setTemplateDownloaded,
    activeDeal,
    activeDealId,
    selectDeal,
    completeAddEmployeeAssignment,
    setStep,
  } = useLivesWizard()

  const inputRef = useRef<HTMLInputElement>(null)
  const [parseError, setParseError] = useState<string | null>(null)
  const [uploadSummary, setUploadSummary] = useState<string | null>(null)
  const [expandedIds, setExpandedIds] = useState<Set<string>>(() => new Set())
  const [manualStarted, setManualStarted] = useState(false)
  const [assignmentMemberId, setAssignmentMemberId] = useState<string | null>(
    null,
  )

  const editingIds = new Set(editingAddEmployeeIds)

  const toggleExpanded = (id: string, force?: boolean) => {
    setExpandedIds((prev) => {
      const next = new Set(prev)
      const shouldAdd = force ?? !next.has(id)
      if (shouldAdd) next.add(id)
      else next.delete(id)
      return next
    })
  }

  const employeeAttributeFields = activeDeal
    ? resolveAttributeFields({
        deal: activeDeal,
        entity: 'employee',
      }).fields
    : []
  const employeeIsReady = (member: (typeof addEmployees)[number]) =>
    isEmployeeValid(member.employee) &&
    Object.keys(
      validateAttributeValues(
        employeeAttributeFields,
        member.employee.customAttributes,
      ),
    ).length === 0
  const formOk =
    Boolean(activeDeal) &&
    intakeMode === 'form' &&
    addEmployees.length > 0 &&
    addEmployees.every(
      (member) =>
        member.assignmentCompleted && !editingIds.has(member.id),
    ) &&
    areMembersValid(addEmployees) &&
    addEmployees.every(
      (m) =>
        Object.keys(
          validateAttributeValues(
            employeeAttributeFields,
            m.employee.customAttributes,
          ),
        ).length === 0,
    )
  const excelOk =
    Boolean(activeDeal) &&
    intakeMode === 'excel' &&
    Boolean(fileName) &&
    areMembersValid(addEmployees)
  const canProceed = formOk || excelOk
  const assignmentMember =
    addEmployees.find((member) => member.id === assignmentMemberId) ?? null
  const hasEmployeeContent = addEmployees.some((member) => {
    const employee = member.employee
    return (
      member.assignmentCompleted ||
      Boolean(
        employee.employeeId ||
          employee.firstName ||
          employee.lastName ||
          employee.gender ||
          employee.dateOfBirth ||
          employee.dateOfJoining ||
          employee.email ||
          employee.mobile,
      )
    )
  })
  const showManualRows = manualStarted || hasEmployeeContent

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
      title={addEmployeesPageTitle(activeDeal?.name)}
      onExit={() => navigate('/endorsements')}
      primaryLabel="Review Cost of Adding"
      primaryWidth={280}
      primaryDisabled={!canProceed}
      onPrimary={() =>
        setStep(intakeMode === 'form' ? 'endo-costs' : 'benefits')
      }
    >
      {dealPickedUpfront ? null : (
        <DealSelector
          deals={deals}
          value={activeDealId}
          onChange={(dealId) => {
            const hasDownstreamSelections = addEmployees.some(
              (member) =>
                member.selectedBenefitIds.length > 0 ||
                Object.values(member.employee.customAttributes).some(Boolean) ||
                member.dependants.some(
                  (dependant) =>
                    dependant.selectedBenefitIds.length > 0 ||
                    Object.values(dependant.customAttributes).some(Boolean),
                ),
            )
            if (
              activeDealId &&
              activeDealId !== dealId &&
              hasDownstreamSelections &&
              !window.confirm(
                'Changing the deal will clear benefit assignments and deal-specific details. Continue?',
              )
            ) {
              return
            }
            selectDeal(dealId)
          }}
        />
      )}

      {!activeDeal ? (
        <DealPrompt>
          Select a Flex deal to load the required employee details.
        </DealPrompt>
      ) : (
        <>
          <BulkPanel>
            <BulkIllustration src={assets.bulkUpload} alt="" aria-hidden />
            <BulkCopy>
              <BulkTitle>Add employees in bulk</BulkTitle>
              <BulkDescription>
                Upload an Excel file to add multiple employees at once. Download
                the template, fill in the employee details, and upload it when
                you&apos;re ready.
              </BulkDescription>
              <TutorialButton type="button">
                <PlayIcon
                  src={assets.iconPlayEmerald}
                  alt=""
                  width={16}
                  height={16}
                  aria-hidden
                />
                Watch Tutorial
              </TutorialButton>
            </BulkCopy>
            <BulkActions>
              <DownloadButton type="button" onClick={downloadTemplate}>
                Download Template
              </DownloadButton>
              <UploadButton
                type="button"
                onClick={() => inputRef.current?.click()}
              >
                Upload An Excel
              </UploadButton>
              <input
                ref={inputRef}
                type="file"
                accept=".csv,.xlsx,.xls,text/csv"
                hidden
                onChange={(event) => {
                  const file = event.target.files?.[0]
                  if (!file) return
                  setIntakeMode('excel')
                  void handleFile(file)
                }}
              />
            </BulkActions>
          </BulkPanel>

          <SectionDivider />
          <ManualIntro>
            Or you can manually add one or more employees.
          </ManualIntro>

          <EmployeeList>
            <EmployeeListHeader>
              <NumberHeading>#</NumberHeading>
              <EmployeeHeading>Employee</EmployeeHeading>
              <ActionsHeading>Actions</ActionsHeading>
            </EmployeeListHeader>

            {!showManualRows ? (
              <EmptyState>
                <EmptyIllustration
                  src={assets.employeeEmpty}
                  alt=""
                  aria-hidden
                />
                <EmptyTitle>No Employee found</EmptyTitle>
                <EmptyCopy>Start by adding details</EmptyCopy>
              </EmptyState>
            ) : (
              <EmployeeRows>
                {addEmployees.map((member, index) => {
            const saved =
              member.assignmentCompleted && !editingIds.has(member.id)
            const expanded = expandedIds.has(member.id)

            if (saved) {
              const fullName =
                [member.employee.firstName, member.employee.lastName]
                  .filter(Boolean)
                  .join(' ') || member.employee.employeeId
              const detailFields = employeeAttributeFields.filter(
                (field) => field.visible,
              )

              return (
                <SummaryCard key={member.id}>
                  <SummaryRow>
                    <SummaryIndex>#{index + 1}</SummaryIndex>
                    <SummaryData>
                      <Avatar aria-hidden>
                        {(fullName.trim()[0] ?? '?').toUpperCase()}
                      </Avatar>
                      <SummaryCopy>
                        <SummaryNameRow>
                          <SummaryName>{fullName}</SummaryName>
                          {member.planId ? (
                            <AssignmentBadge>
                              {
                                activeDeal.plans.find(
                                  (plan) => plan.id === member.planId,
                                )?.name
                              }
                              {member.dependants.length > 0
                                ? ` · ${member.dependants.length} dependant${member.dependants.length === 1 ? '' : 's'}`
                                : ''}
                            </AssignmentBadge>
                          ) : null}
                        </SummaryNameRow>
                        <MetaRow>
                          {member.employee.employeeId ? (
                            <MetaChip>
                              <MetaIcon
                                src={assets.iconBusiness}
                                alt=""
                                width={14}
                                height={14}
                                aria-hidden
                              />
                              ID: {member.employee.employeeId}
                            </MetaChip>
                          ) : null}
                          {member.employee.gender ? (
                            <>
                              <MetaDivider aria-hidden />
                              <MetaChip>
                                <MetaIcon
                                  src={assets.iconGender}
                                  alt=""
                                  width={16}
                                  height={16}
                                  aria-hidden
                                />
                                {member.employee.gender}
                              </MetaChip>
                            </>
                          ) : null}
                          {member.employee.dateOfBirth ? (
                            <>
                              <MetaDivider aria-hidden />
                              <MetaChip>
                                <MetaIcon
                                  src={assets.iconCake}
                                  alt=""
                                  width={16}
                                  height={16}
                                  aria-hidden
                                />
                                {formatSummaryDate(member.employee.dateOfBirth)}
                              </MetaChip>
                            </>
                          ) : null}
                          {member.employee.email ? (
                            <>
                              <MetaDivider aria-hidden />
                              <MetaChip>
                                <MetaIcon
                                  src={assets.iconMail}
                                  alt=""
                                  width={14}
                                  height={14}
                                  aria-hidden
                                />
                                {member.employee.email}
                              </MetaChip>
                            </>
                          ) : null}
                          {member.employee.mobile ? (
                            <>
                              <MetaDivider aria-hidden />
                              <MetaChip>
                                <MetaIcon
                                  src={assets.iconCall}
                                  alt=""
                                  width={16}
                                  height={16}
                                  aria-hidden
                                />
                                {member.employee.mobile}
                              </MetaChip>
                            </>
                          ) : null}
                        </MetaRow>
                      </SummaryCopy>
                    </SummaryData>
                    <SummaryActions>
                      <EditButton
                        type="button"
                        onClick={() => {
                          toggleExpanded(member.id, false)
                          setAssignmentMemberId(member.id)
                        }}
                      >
                        <img
                          src={assets.iconEditPencil}
                          alt=""
                          width={20}
                          height={20}
                          aria-hidden
                        />
                        Edit
                      </EditButton>
                      {addEmployees.length > 1 ? (
                        <DeleteButton
                          type="button"
                          onClick={() => {
                            toggleExpanded(member.id, false)
                            removeAddEmployee(member.id)
                          }}
                        >
                          Delete
                        </DeleteButton>
                      ) : null}
                    </SummaryActions>
                    {detailFields.length > 0 ? (
                      <SummaryChevron
                        type="button"
                        aria-label={
                          expanded
                            ? 'Hide additional details'
                            : 'Show additional details'
                        }
                        aria-expanded={expanded}
                        aria-controls={`employee-details-${member.id}`}
                        onClick={() => toggleExpanded(member.id)}
                      >
                        <ChevronIcon
                          direction={expanded ? 'up' : 'down'}
                          size={24}
                        />
                      </SummaryChevron>
                    ) : null}
                  </SummaryRow>

                  {expanded && detailFields.length > 0 ? (
                    <DetailsPanel id={`employee-details-${member.id}`}>
                      <DetailsTitle>Additional Details</DetailsTitle>
                      <DetailsGrid>
                        {detailFields.map(({ definition }) => (
                          <DetailItem key={definition.id}>
                            <DetailLabel>{definition.label}</DetailLabel>
                            <DetailValue>
                              {member.employee.customAttributes[
                                definition.id
                              ] || '—'}
                            </DetailValue>
                          </DetailItem>
                        ))}
                      </DetailsGrid>
                    </DetailsPanel>
                  ) : null}
                </SummaryCard>
              )
            }

                  return (
            <MemberCard key={member.id}>
              <MemberHeader>
                <HeaderLeft>
                  <MemberTitle>Employee {index + 1}</MemberTitle>
                </HeaderLeft>
              </MemberHeader>

              <MemberBody id={`employee-form-${member.id}`}>
              <Grid>
                <Field>
                  <Label>
                    Employee ID<span>*</span>
                  </Label>
                  <Input
                    value={member.employee.employeeId}
                    placeholder="Enter employee ID"
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
                    placeholder="Enter first name"
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
                    placeholder="Enter last name"
                    onChange={(e) =>
                      updateAddEmployeeFields(member.id, {
                        lastName: e.target.value,
                      })
                    }
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
                      $placeholder={!member.employee.gender}
                      value={member.employee.gender}
                      onChange={(e) =>
                        updateAddEmployeeFields(member.id, {
                          gender: e.target.value as typeof member.employee.gender,
                        })
                      }
                    >
                      <option value="">Select gender</option>
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
                      value={member.employee.dateOfBirth}
                      onChange={(e) =>
                        updateAddEmployeeFields(member.id, {
                          dateOfBirth: e.target.value,
                        })
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
                      value={member.employee.dateOfJoining}
                      onChange={(e) =>
                        updateAddEmployeeFields(member.id, {
                          dateOfJoining: e.target.value,
                        })
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
                    value={member.employee.email}
                    placeholder="Enter work email"
                    onChange={(e) =>
                      updateAddEmployeeFields(member.id, {
                        email: e.target.value,
                      })
                    }
                  />
                </Field>
                <Field>
                  <Label>Mobile Number</Label>
                  <PhoneWrap>
                    <PhonePrefix>+91</PhonePrefix>
                    <PhoneDivider aria-hidden />
                    <PhoneInput
                      value={member.employee.mobile}
                      placeholder="Enter phone number"
                      onChange={(e) =>
                        updateAddEmployeeFields(member.id, {
                          mobile: e.target.value,
                        })
                      }
                    />
                  </PhoneWrap>
                </Field>
              </Grid>

              <DynamicAttributeForm
                fields={employeeAttributeFields}
                values={member.employee.customAttributes}
                onChange={(attributeId, value) =>
                  updateAddEmployeeCustomAttribute(
                    member.id,
                    attributeId,
                    value,
                  )
                }
              />

              <CardActions $split={addEmployees.length > 1}>
                {addEmployees.length > 1 ? (
                  <RemoveLink
                    type="button"
                    onClick={() => {
                      toggleExpanded(member.id, false)
                      removeAddEmployee(member.id)
                    }}
                  >
                    Remove
                  </RemoveLink>
                ) : null}
                <SaveButton
                  type="button"
                  disabled={!employeeIsReady(member)}
                  onClick={() => setAssignmentMemberId(member.id)}
                >
                  Save
                </SaveButton>
              </CardActions>
              </MemberBody>
            </MemberCard>
                  )
                })}
              </EmployeeRows>
            )}

          <AddEmployeeBtn
            type="button"
            onClick={() => {
              setIntakeMode('form')
              setParseError(null)
              const availableBlank = addEmployees.find(
                (member) =>
                  !member.assignmentCompleted &&
                  !member.employee.employeeId &&
                  !member.employee.firstName,
              )
              if (availableBlank) {
                setAssignmentMemberId(availableBlank.id)
              } else {
                const nextMember = emptyAddEmployeeMember()
                setAddEmployees([...addEmployees, nextMember])
                setAssignmentMemberId(nextMember.id)
              }
              setManualStarted(true)
            }}
          >
            <img
              src={assets.iconPlusEmerald}
              alt=""
              width={20}
              height={20}
              aria-hidden
            />
            {showManualRows ? 'Add another employee' : 'Add new employee'}
          </AddEmployeeBtn>
          </EmployeeList>

          {parseError ? <ErrorText>{parseError}</ErrorText> : null}
          {uploadSummary ? <SummaryBanner>{uploadSummary}</SummaryBanner> : null}
          {!uploadSummary && employeeCount > 0 && fileName ? (
            <SummaryBanner>
              {employeeCount} employee{employeeCount === 1 ? '' : 's'} ·{' '}
              {dependantCount} dependant{dependantCount === 1 ? '' : 's'}{' '}
              detected
            </SummaryBanner>
          ) : null}
      {activeDeal ? (
        <EmployeeOnboardingPage
          open={Boolean(assignmentMember)}
          member={assignmentMember}
          deal={activeDeal}
          onCancel={() => {
            if (assignmentMember && !assignmentMember.assignmentCompleted) {
              removeAddEmployee(assignmentMember.id)
              if (
                !addEmployees.some(
                  (member) =>
                    member.id !== assignmentMember.id &&
                    member.assignmentCompleted,
                )
              ) {
                setManualStarted(false)
              }
            }
            setAssignmentMemberId(null)
          }}
          onSave={(assignment) => {
            if (!assignmentMember) return
            updateAddEmployeeFields(assignmentMember.id, assignment.employee)
            completeAddEmployeeAssignment(assignmentMember.id, assignment)
            setAddEmployeeEditing(assignmentMember.id, false)
            setAssignmentMemberId(null)
          }}
        />
      ) : null}
        </>
      )}
    </WizardChrome>
  )
}

const BulkPanel = styled.section`
  display: flex;
  align-items: center;
  gap: 24px;
  min-height: 124px;
  padding: 16px 24px;
  border-radius: 12px;
  background: ${({ theme }) => theme.colors.planeGreenLight};
  box-sizing: border-box;

  @media (max-width: 900px) {
    align-items: flex-start;
    flex-wrap: wrap;
  }
`

const BulkIllustration = styled.img`
  width: 96px;
  height: 82px;
  flex-shrink: 0;
  object-fit: contain;
`

const BulkCopy = styled.div`
  display: flex;
  flex: 1;
  min-width: 240px;
  flex-direction: column;
  gap: 6px;
`

const BulkTitle = styled.h2`
  margin: 0;
  font-size: 18px;
  font-weight: 500;
  line-height: 24px;
  color: ${({ theme }) => theme.colors.textPrimary};
`

const BulkDescription = styled.p`
  max-width: 600px;
  margin: 0;
  font-size: 14px;
  font-weight: 400;
  line-height: 20px;
  letter-spacing: 0.2px;
  color: ${({ theme }) => theme.colors.textPrimary};
`

const TutorialButton = styled.button`
  display: inline-flex;
  align-items: center;
  align-self: flex-start;
  gap: 8px;
  padding: 0;
  border: none;
  background: transparent;
  font-family: ${({ theme }) => theme.fontFamily};
  font-size: 13px;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.emerald};
  cursor: pointer;
`

const PlayIcon = styled.img`
  display: block;
  width: 16px;
  height: 16px;
  flex-shrink: 0;
`

const BulkActions = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
  flex-shrink: 0;

  @media (max-width: 560px) {
    width: 100%;
    flex-direction: column;
    align-items: stretch;
  }
`

const DownloadButton = styled.button`
  height: 48px;
  padding: 0 24px;
  border: 1px solid ${({ theme }) => theme.colors.emerald};
  border-radius: 12px;
  background: transparent;
  font-family: ${({ theme }) => theme.fontFamily};
  font-size: 14px;
  font-weight: 500;
  color: ${({ theme }) => theme.colors.emerald};
  cursor: pointer;
`

const UploadButton = styled(DownloadButton)`
  border-color: ${({ theme }) => theme.colors.fillGreen};
  background: ${({ theme }) => theme.colors.fillGreen};
`

const SectionDivider = styled.hr`
  width: 100%;
  margin: -8px 0 -8px;
  border: 0;
  border-top: 1px dashed ${({ theme }) => theme.colors.defaultBorder};
`

const ManualIntro = styled.p`
  margin: 0;
  font-size: 14px;
  line-height: 20px;
  letter-spacing: 0.2px;
  color: ${({ theme }) => theme.colors.textSecondary};
`

const EmployeeList = styled.section`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  overflow: hidden;
  border-radius: 8px;
`

const EmployeeListHeader = styled.div`
  display: grid;
  grid-template-columns: 48px minmax(0, 1fr) 280px;
  width: 100%;
  padding: 12px 16px;
  background: ${({ theme }) => theme.colors.planeGreenLight};
  box-sizing: border-box;
  font-size: 12px;
  font-weight: 500;
  line-height: 18px;
  letter-spacing: 0.2px;
  color: ${({ theme }) => theme.colors.emerald};
`

const NumberHeading = styled.span``
const EmployeeHeading = styled.span``
const ActionsHeading = styled.span`
  padding-right: 32px;
  text-align: right;
`

const EmployeeRows = styled.div`
  display: flex;
  width: 100%;
  flex-direction: column;
  gap: 12px;
`

const EmptyState = styled.div`
  display: flex;
  width: 100%;
  min-height: 256px;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 8px 24px 20px;
  box-sizing: border-box;
`

const EmptyIllustration = styled.img`
  display: block;
  width: 250px;
  height: 140px;
  object-fit: contain;
`

const EmptyTitle = styled.h3`
  margin: 0;
  font-size: 20px;
  font-weight: 500;
  line-height: 24px;
  color: ${({ theme }) => theme.colors.textSecondary};
`

const EmptyCopy = styled.p`
  margin: 0;
  font-size: 12px;
  line-height: 18px;
  letter-spacing: 0.2px;
  color: ${({ theme }) => theme.colors.textSecondary};
`

const DealPrompt = styled.div`
  padding: 16px;
  border-radius: 10px;
  background: ${({ theme }) => theme.colors.disableFill};
  font-size: 13px;
  color: ${({ theme }) => theme.colors.textSecondary};
`

const MemberCard = styled.div`
  display: flex;
  flex-direction: column;
  gap: 24px;
  padding: 24px;
  border-radius: 16px;
  background: ${({ theme }) => theme.colors.surface1};
  overflow: hidden;
`

const MemberHeader = styled.div`
  display: flex;
  align-items: center;
  width: 100%;
`

const SummaryCard = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
  width: 100%;
  padding: 16px;
  border-radius: 12px;
  background: ${({ theme }) => theme.colors.surface1};
  box-sizing: border-box;
`

const SummaryRow = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
  width: 100%;
`

const SummaryIndex = styled.span`
  flex-shrink: 0;
  font-size: 14px;
  font-weight: 500;
  line-height: 20px;
  letter-spacing: 0.2px;
  color: ${({ theme }) => theme.colors.textSecondary};
`

const SummaryData = styled.div`
  display: flex;
  flex: 1 0 0;
  align-items: center;
  gap: 11px;
  min-width: 0;
`

const Avatar = styled.span`
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  width: 42px;
  height: 42px;
  border-radius: 40px;
  background: ${({ theme }) => theme.colors.planeGreenDark};
  color: ${({ theme }) => theme.colors.textTertiary};
  font-size: 13px;
  font-weight: 500;
  letter-spacing: 0.2px;
`

const SummaryCopy = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 4px;
  min-width: 0;
`

const SummaryNameRow = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
`

const SummaryName = styled.span`
  font-size: 14px;
  font-weight: 500;
  line-height: 20px;
  letter-spacing: 0.2px;
  color: ${({ theme }) => theme.colors.textPrimary};
`

const AssignmentBadge = styled.span`
  display: inline-flex;
  align-items: center;
  padding: 3px 8px;
  border-radius: 99px;
  background: ${({ theme }) => theme.colors.planeGreenLight};
  color: ${({ theme }) => theme.colors.emerald};
  font-size: 11px;
  font-weight: 600;
  line-height: 16px;
`

const MetaRow = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
`

const MetaChip = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  font-weight: 400;
  line-height: 18px;
  letter-spacing: 0.2px;
  color: ${({ theme }) => theme.colors.textSecondary};
`

const MetaIcon = styled.img`
  display: block;
  flex-shrink: 0;
`

const MetaDivider = styled.span`
  width: 1px;
  height: 8px;
  flex-shrink: 0;
  background: ${({ theme }) => theme.colors.defaultBorder};
`

const SummaryActions = styled.div`
  display: flex;
  align-items: center;
  flex-shrink: 0;
  gap: 12px;
`

const EditButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  flex-shrink: 0;
  width: 72px;
  padding: 0;
  border: none;
  background: transparent;
  font-family: ${({ theme }) => theme.fontFamily};
  font-size: 14px;
  font-weight: 500;
  line-height: 20px;
  letter-spacing: 0.2px;
  color: ${({ theme }) => theme.colors.emerald};
  cursor: pointer;
`

const DeleteButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  padding: 0;
  border: none;
  background: transparent;
  font-family: ${({ theme }) => theme.fontFamily};
  font-size: 14px;
  font-weight: 500;
  line-height: 20px;
  letter-spacing: 0.2px;
  color: ${({ theme }) => theme.colors.textError};
  cursor: pointer;
`

const SummaryChevron = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  width: 24px;
  height: 24px;
  padding: 0;
  border: none;
  background: transparent;
  cursor: pointer;
`

const DetailsPanel = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
  width: 100%;
  padding: 16px;
  border-radius: 12px;
  background: ${({ theme }) => theme.colors.surface0};
  box-sizing: border-box;
`

const DetailsTitle = styled.h4`
  margin: 0;
  font-size: 12px;
  font-weight: 500;
  line-height: 18px;
  letter-spacing: 0.2px;
  color: ${({ theme }) => theme.colors.textSecondary};
`

const DetailsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 20px;

  @media (max-width: 720px) {
    grid-template-columns: 1fr;
  }
`

const DetailItem = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
`

const DetailLabel = styled.span`
  font-size: 12px;
  font-weight: 500;
  line-height: 18px;
  letter-spacing: 0.2px;
  color: ${({ theme }) => theme.colors.textPrimary};
`

const DetailValue = styled.span`
  font-size: 12px;
  font-weight: 400;
  line-height: 18px;
  letter-spacing: 0.2px;
  color: ${({ theme }) => theme.colors.textPrimary};
`

const HeaderLeft = styled.span`
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 0;
`

const MemberTitle = styled.h3`
  margin: 0;
  font-size: 18px;
  font-weight: 500;
  line-height: 24px;
  color: ${({ theme }) => theme.colors.textPrimary};
  white-space: nowrap;
`

const MemberBody = styled.div`
  display: flex;
  flex-direction: column;
  gap: 24px;
`

const RemoveLink = styled.button`
  padding: 0;
  border: none;
  background: transparent;
  color: ${({ theme }) => theme.colors.textError};
  font-family: ${({ theme }) => theme.fontFamily};
  font-size: 13px;
  cursor: pointer;
`

const CardActions = styled.div<{ $split?: boolean }>`
  display: flex;
  align-items: center;
  justify-content: ${({ $split }) => ($split ? 'space-between' : 'flex-end')};
  gap: 16px;
  width: 100%;
`

const SaveButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 104px;
  height: 36px;
  padding: 8px 16px;
  border: none;
  border-radius: 8px;
  background: ${({ theme }) => theme.colors.fillGreen};
  color: ${({ theme }) => theme.colors.emerald};
  font-family: ${({ theme }) => theme.fontFamily};
  font-size: 12px;
  font-weight: 500;
  line-height: 18px;
  letter-spacing: 0.2px;
  cursor: pointer;
  box-sizing: border-box;
`

const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 24px;

  @media (max-width: 960px) {
    grid-template-columns: 1fr;
  }
`

const Field = styled.label`
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-width: 0;
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
  font-weight: 400;
  line-height: 20px;
  letter-spacing: 0.2px;
  color: ${({ theme }) => theme.colors.textPrimary};
  background: ${({ theme }) => theme.colors.surface1};
  box-sizing: border-box;

  &::placeholder {
    color: ${({ theme }) => theme.colors.textSecondary};
  }

  &:focus {
    outline: 1px solid ${({ theme }) => theme.colors.emerald};
  }
`

const SelectWrap = styled.div`
  position: relative;
`

const Select = styled.select<{ $placeholder?: boolean }>`
  width: 100%;
  height: 48px;
  padding: 12px 48px 12px 20px;
  border: 1px solid ${({ theme }) => theme.colors.defaultBorder};
  border-radius: ${({ theme }) => theme.radii.sm};
  font-family: ${({ theme }) => theme.fontFamily};
  font-size: 14px;
  font-weight: 400;
  line-height: 20px;
  letter-spacing: 0.2px;
  color: ${({ theme, $placeholder }) =>
    $placeholder ? theme.colors.textSecondary : theme.colors.textPrimary};
  background: ${({ theme }) => theme.colors.surface1};
  appearance: none;
  cursor: pointer;
  box-sizing: border-box;
`

const SelectChevron = styled.img`
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  width: 24px;
  height: 24px;
  pointer-events: none;
`

const DateWrap = styled.div`
  position: relative;

  ${Input} {
    padding-right: 48px;
  }
`

const DateIcon = styled.img`
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  width: 24px;
  height: 24px;
  pointer-events: none;
`

const PhoneWrap = styled.div`
  display: flex;
  align-items: center;
  height: 48px;
  padding: 0 20px;
  border: 1px solid ${({ theme }) => theme.colors.defaultBorder};
  border-radius: ${({ theme }) => theme.radii.sm};
  background: ${({ theme }) => theme.colors.surface1};
  box-sizing: border-box;
`

const PhonePrefix = styled.span`
  font-size: 14px;
  font-weight: 400;
  line-height: 20px;
  letter-spacing: 0.2px;
  color: ${({ theme }) => theme.colors.textSecondary};
  white-space: nowrap;
`

const PhoneDivider = styled.span`
  width: 1px;
  height: 20px;
  margin: 0 8px;
  background: ${({ theme }) => theme.colors.defaultBorder};
  flex-shrink: 0;
`

const PhoneInput = styled.input`
  flex: 1;
  min-width: 0;
  height: 100%;
  border: none;
  padding: 0;
  font-family: ${({ theme }) => theme.fontFamily};
  font-size: 14px;
  font-weight: 400;
  line-height: 20px;
  letter-spacing: 0.2px;
  color: ${({ theme }) => theme.colors.textPrimary};
  background: transparent;

  &::placeholder {
    color: ${({ theme }) => theme.colors.textSecondary};
  }

  &:focus {
    outline: none;
  }
`

const AddEmployeeBtn = styled.button`
  align-self: flex-start;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  padding: 14px 24px;
  border: 1px dashed ${({ theme }) => theme.colors.emerald};
  border-radius: 12px;
  background: transparent;
  color: ${({ theme }) => theme.colors.emerald};
  font-family: ${({ theme }) => theme.fontFamily};
  font-size: 14px;
  font-weight: 500;
  line-height: 20px;
  letter-spacing: 0.2px;
  cursor: pointer;
  box-sizing: border-box;

  img {
    display: block;
    width: 20px;
    height: 20px;
  }
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
