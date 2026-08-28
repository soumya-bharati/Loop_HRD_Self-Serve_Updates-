import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import styled from 'styled-components'

import { assets } from '@/assets/figma'
import {
  emptyDependantForm,
  emptyEmployeeForm,
  sampleEmployees,
  type SearchableEmployee,
} from '@/data/employees'
import { FlowStepper, WizardChrome } from '@/pages/LivesWizard/WizardChrome'
import { useLivesWizard } from '@/pages/LivesWizard/WizardContext'

export function SearchEmployeeStep() {
  const navigate = useNavigate()
  const {
    action,
    method,
    selectedEmployeeId,
    setSelectedEmployeeId,
    selectedDependantId,
    setSelectedDependantId,
    setDependants,
    setEmployee,
    selectDeal,
    setStep,
    organisationEntityName,
  } = useLivesWizard()
  const [query, setQuery] = useState('')

  const isAddDependant = action === 'add'
  const isEditDependant = action === 'edit' && method === 'single-dependant'
  const isDelete = action === 'delete'
  const isEdit = action === 'edit'

  const results = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return isAddDependant ? [] : sampleEmployees
    return sampleEmployees.filter((e) => {
      const hay =
        `${e.employeeId} ${e.firstName} ${e.lastName} ${e.email} ${e.department}`.toLowerCase()
      const depHay = e.dependants
        .map((d) => `${d.firstName} ${d.lastName}`)
        .join(' ')
        .toLowerCase()
      return hay.includes(q) || depHay.includes(q)
    })
  }, [isAddDependant, query])

  const visibleResults = useMemo(() => {
    if (!isAddDependant || query.trim()) return results
    const selected = sampleEmployees.find((e) => e.id === selectedEmployeeId)
    return selected ? [selected] : []
  }, [isAddDependant, query, results, selectedEmployeeId])

  const title = isDelete
    ? 'Delete employee'
    : isEdit
      ? isEditDependant
        ? 'Edit dependant'
        : 'Edit employee'
      : 'Add Dependants'

  const steps = isDelete
    ? ['Search', 'Date of leaving', 'Refund summary']
    : isEdit
      ? ['Search', 'Edit details', 'Review']
      : ['Search Employee', 'Dependant Details', 'Plan', 'Review Cost']

  const proceedToNext = () => {
    const emp = sampleEmployees.find((e) => e.id === selectedEmployeeId)
    if (!emp) return
    if (emp.dealId) selectDeal(emp.dealId)

    if (action === 'add') {
      setDependants([emptyDependantForm('dep-1')])
      setStep('dependant-details')
      return
    }

    if (action === 'delete') {
      setStep('date-of-leaving')
      return
    }

    if (isEditDependant) {
      const dep = emp.dependants.find((d) => d.id === selectedDependantId)
      if (!dep) return
      setEmployee({
        ...emptyEmployeeForm(),
        employeeId: emp.employeeId,
        firstName: dep.firstName,
        lastName: dep.lastName,
        gender: dep.gender,
        dateOfBirth: dep.dateOfBirth,
        email: dep.email,
        mobile: dep.mobile,
        relationship: dep.relationship,
      })
    } else {
      setEmployee({
        ...emptyEmployeeForm(),
        employeeId: emp.employeeId,
        firstName: emp.firstName,
        lastName: emp.lastName,
        gender: emp.gender,
        dateOfBirth: emp.dateOfBirth,
        email: emp.email,
        mobile: emp.mobile,
        dateOfJoining: emp.dateOfJoining,
        relationship: 'Self',
      })
    }
    setStep('edit-form')
  }

  return (
    <WizardChrome
      title={title}
      hideTitle={isAddDependant}
      exitLabel={isAddDependant ? 'Cancel' : 'Exit'}
      onBack={isAddDependant ? undefined : () => navigate('/endorsements')}
      onExit={() => navigate('/endorsements')}
      footerLeft={isAddDependant ? <span /> : undefined}
      primaryLabel="Proceed"
      primaryDisabled={
        !selectedEmployeeId || (isEditDependant && !selectedDependantId)
      }
      onPrimary={proceedToNext}
    >
      {isAddDependant ? null : (
        <FlowStepper steps={steps} activeIndex={0} bare />
      )}

      {isAddDependant ? (
        <AddLayout>
          <SearchCard>
            <CardTitles>
              <CardTitle>Add Dependants</CardTitle>
              <CardSubtitle>
                Search for the employee name or ID to add their dependant
              </CardSubtitle>
            </CardTitles>
            <EntityRow>
              <img
                src={assets.iconCompany}
                alt=""
                width={20}
                height={20}
                aria-hidden
              />
              <EntityLabel>This addition is for</EntityLabel>
              <EntityName>{organisationEntityName}</EntityName>
            </EntityRow>
            <SearchField>
              <SearchIconWrap>
                <img
                  src={assets.iconSearchField}
                  alt=""
                  width={20}
                  height={20}
                />
              </SearchIconWrap>
              <SearchInput
                value={query}
                placeholder="Search by name or employee ID"
                onChange={(e) => {
                  setQuery(e.target.value)
                  setSelectedEmployeeId(null)
                  setSelectedDependantId(null)
                }}
              />
            </SearchField>
            {visibleResults.length > 0 ? (
              <List>
                {visibleResults.map((employee) => (
                  <EmployeeResult
                    key={employee.id}
                    employee={employee}
                    selected={selectedEmployeeId === employee.id}
                    onSelect={() => {
                      setSelectedEmployeeId(employee.id)
                      setSelectedDependantId(null)
                      setQuery(`${employee.firstName} ${employee.lastName}`)
                    }}
                  />
                ))}
              </List>
            ) : query.trim() ? (
              <EmptyResults>No employees match that search.</EmptyResults>
            ) : null}
          </SearchCard>

          <InfoCard>
            <InfoHeader>
              <CardTitle>Whom can you add?</CardTitle>
              <ImportantBadge>Important!</ImportantBadge>
            </InfoHeader>
            <BulletList>
              <Bullet>
                <CheckMark>
                  <img
                    src={assets.iconCheckWhite}
                    alt=""
                    width={14}
                    height={14}
                  />
                </CheckMark>
                <BulletText>
                  <strong>If employee is insured -</strong> You can add spouse
                  or children as dependants. No other dependants can be added.
                </BulletText>
              </Bullet>
              <Bullet>
                <CheckMark>
                  <img
                    src={assets.iconCheckWhite}
                    alt=""
                    width={14}
                    height={14}
                  />
                </CheckMark>
                <BulletText>
                  <strong>If employee is not insured - </strong>
                  You can add any dependants.
                </BulletText>
              </Bullet>
            </BulletList>
            <InfoDivider />
            <CsmAlert>
              <MailBox>
                <img src={assets.iconMailCsm} alt="" width={14} height={14} />
              </MailBox>
              <CsmText>
                For any other dependant addition, contact your CSM
              </CsmText>
            </CsmAlert>
          </InfoCard>
        </AddLayout>
      ) : (
        <Card>
          <LegacyCardTitle>
            {isEditDependant
              ? 'Search employee, then pick a dependant'
              : 'Search & choose employee'}
          </LegacyCardTitle>
          <LegacySearchInput
            value={query}
            placeholder="Search by name, employee ID, email…"
            onChange={(e) => setQuery(e.target.value)}
          />

          <List>
            {results.map((employee) => {
              const selected = selectedEmployeeId === employee.id
              return (
                <div key={employee.id}>
                  <EmployeeResult
                    employee={employee}
                    selected={selected}
                    onSelect={() => {
                      setSelectedEmployeeId(employee.id)
                      setSelectedDependantId(null)
                    }}
                  />

                  {isEditDependant && selected ? (
                    <DepList>
                      {employee.dependants.length === 0 ? (
                        <Meta>No dependants on this employee</Meta>
                      ) : (
                        employee.dependants.map((d) => (
                          <DepCard
                            key={d.id}
                            type="button"
                            $selected={selectedDependantId === d.id}
                            onClick={() => setSelectedDependantId(d.id)}
                          >
                            {d.firstName} {d.lastName} · {d.relationship} ·{' '}
                            {d.gender} · DOB {d.dateOfBirth}
                          </DepCard>
                        ))
                      )}
                    </DepList>
                  ) : null}

                  {!isEditDependant &&
                  selected &&
                  employee.dependants.length > 0 ? (
                    <DepList>
                      {employee.dependants.map((d) => (
                        <ExistingDepNote key={d.id}>
                          {d.firstName} {d.lastName} · {d.relationship} ·{' '}
                          {d.gender} · DOB {d.dateOfBirth}
                          {d.mobile ? ` · ${d.mobile}` : ''}
                        </ExistingDepNote>
                      ))}
                    </DepList>
                  ) : null}
                </div>
              )
            })}
          </List>
        </Card>
      )}
    </WizardChrome>
  )
}

function EmployeeResult({
  employee,
  selected,
  onSelect,
}: {
  employee: SearchableEmployee
  selected: boolean
  onSelect: () => void
}) {
  return (
    <EmployeeCard type="button" $selected={selected} onClick={onSelect}>
      <Name>
        {employee.firstName} {employee.lastName}
      </Name>
      <Meta>
        {employee.employeeId} · {employee.department} · {employee.email}
      </Meta>
      <Meta>
        On {employee.coverages.length} covers · {employee.dependants.length}{' '}
        dependant
        {employee.dependants.length === 1 ? '' : 's'}
      </Meta>
    </EmployeeCard>
  )
}

const AddLayout = styled.div`
  display: flex;
  align-items: flex-start;
  flex-wrap: wrap;
  gap: 24px;
  width: 100%;
`

const SearchCard = styled.div`
  display: flex;
  flex-direction: column;
  gap: 24px;
  width: min(880px, 100%);
  padding: 24px;
  border-radius: 16px;
  background: ${({ theme }) => theme.colors.surface1};
  box-shadow: 0px 4px 12px rgba(0, 0, 0, 0.06);
  box-sizing: border-box;

  @media (max-width: ${({ theme }) => theme.breakpoints.sm}) {
    gap: 16px;
    padding: 16px;
  }
`

const InfoCard = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
  flex: 1 0 0;
  min-width: 280px;
  padding: 24px;
  border-radius: 16px;
  background: ${({ theme }) => theme.colors.surface1};
  box-sizing: border-box;

  @media (max-width: ${({ theme }) => theme.breakpoints.sm}) {
    min-width: 0;
    width: 100%;
    padding: 16px;
  }
`

const CardTitles = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
`

const CardTitle = styled.h2`
  margin: 0;
  font-size: 18px;
  font-weight: 500;
  line-height: 24px;
  color: ${({ theme }) => theme.colors.textPrimary};
`

const CardSubtitle = styled.p`
  margin: 0;
  font-size: 14px;
  font-weight: 400;
  line-height: 20px;
  letter-spacing: 0.2px;
  color: ${({ theme }) => theme.colors.textPrimary};
`

const EntityRow = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`

const EntityLabel = styled.span`
  font-size: 14px;
  font-weight: 500;
  line-height: 20px;
  letter-spacing: 0.2px;
  color: ${({ theme }) => theme.colors.textSecondary};
`

const EntityName = styled.span`
  font-size: 14px;
  font-weight: 600;
  line-height: 20px;
  letter-spacing: 0.2px;
  color: ${({ theme }) => theme.colors.textPrimary};
`

const SearchField = styled.label`
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  padding: 14px 16px;
  border: 1px solid #dce2e0;
  border-radius: ${({ theme }) => theme.radii.sm};
  background: ${({ theme }) => theme.colors.surface1};
  box-sizing: border-box;
`

const SearchIconWrap = styled.span`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  overflow: hidden;
  flex-shrink: 0;

  img {
    display: block;
    width: 20px;
    height: 20px;
  }
`

const SearchInput = styled.input`
  flex: 1;
  min-width: 0;
  border: none;
  outline: none;
  padding: 0;
  background: transparent;
  font-family: ${({ theme }) => theme.fontFamily};
  font-size: 14px;
  font-weight: 400;
  color: ${({ theme }) => theme.colors.beyondGrey};

  &::placeholder {
    color: ${({ theme }) => theme.colors.textSecondary};
  }
`

const EmptyResults = styled.p`
  margin: 0;
  font-size: 14px;
  line-height: 20px;
  color: ${({ theme }) => theme.colors.textSecondary};
`

const InfoHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
`

const ImportantBadge = styled.span`
  display: inline-flex;
  align-items: center;
  padding: 5px 12px;
  border-radius: 100px;
  background: #f87171;
  font-family: Inter, ${({ theme }) => theme.fontFamily};
  font-size: 11px;
  font-weight: 700;
  line-height: normal;
  color: ${({ theme }) => theme.colors.textTertiary};
  white-space: nowrap;
`

const BulletList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
`

const Bullet = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 12px;
`

const CheckMark = styled.span`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  border-radius: 17px;
  background: ${({ theme }) => theme.colors.planeGreenDark};
  flex-shrink: 0;

  img {
    display: block;
    width: 14px;
    height: 14px;
  }
`

const BulletText = styled.p`
  margin: 0;
  font-size: 14px;
  font-weight: 400;
  line-height: 20px;
  letter-spacing: 0.2px;
  color: ${({ theme }) => theme.colors.textSecondary};

  strong {
    font-weight: 400;
    color: ${({ theme }) => theme.colors.textPrimary};
  }
`

const InfoDivider = styled.hr`
  margin: 0;
  width: 100%;
  border: none;
  border-top: 1px solid ${({ theme }) => theme.colors.disableFill};
`

const CsmAlert = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  padding: 12px;
  border-radius: 10px;
  background: ${({ theme }) => theme.colors.surface0};
  box-sizing: border-box;
`

const MailBox = styled.span`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border-radius: 6px;
  border: 1px solid #d1d5db;
  background: ${({ theme }) => theme.colors.surface1};
  flex-shrink: 0;

  img {
    display: block;
    width: 14px;
    height: 14px;
  }
`

const CsmText = styled.p`
  margin: 0;
  font-size: 14px;
  font-weight: 400;
  line-height: 20px;
  letter-spacing: 0.2px;
  color: #4b5563;
`

const Card = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 24px;
  border-radius: 16px;
  background: ${({ theme }) => theme.colors.surface1};
`

const LegacyCardTitle = styled.h2`
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.beyondGrey};
`

const LegacySearchInput = styled.input`
  height: 48px;
  padding: 0 16px;
  border: 1px solid ${({ theme }) => theme.colors.defaultBorder};
  border-radius: ${({ theme }) => theme.radii.sm};
  font-family: ${({ theme }) => theme.fontFamily};
  font-size: 14px;
`

const List = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
`

const EmployeeCard = styled.button<{ $selected: boolean }>`
  width: 100%;
  text-align: left;
  padding: 14px 16px;
  border-radius: 12px;
  border: 1.5px solid
    ${({ theme, $selected }) =>
      $selected ? theme.colors.emerald : theme.colors.defaultBorder};
  background: ${({ theme, $selected }) =>
    $selected ? theme.colors.planeGreenLight : theme.colors.surface1};
  cursor: pointer;
  font-family: ${({ theme }) => theme.fontFamily};
`

const Name = styled.div`
  font-size: 14px;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.textPrimary};
`

const Meta = styled.div`
  margin-top: 4px;
  font-size: 12px;
  color: ${({ theme }) => theme.colors.textSecondary};
  overflow-wrap: anywhere;
`

const DepList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin: 8px 0 0 16px;
`

const DepCard = styled.button<{ $selected: boolean }>`
  text-align: left;
  padding: 10px 12px;
  border-radius: 8px;
  border: 1px solid
    ${({ theme, $selected }) =>
      $selected ? theme.colors.emerald : theme.colors.defaultBorder};
  background: ${({ theme }) => theme.colors.surface1};
  font-family: ${({ theme }) => theme.fontFamily};
  font-size: 13px;
  cursor: pointer;
`

const ExistingDepNote = styled.div`
  padding: 10px 12px;
  border-radius: 8px;
  border: 1px solid ${({ theme }) => theme.colors.disableFill};
  background: ${({ theme }) => theme.colors.surface0};
  font-size: 13px;
  color: ${({ theme }) => theme.colors.textSecondary};
`
