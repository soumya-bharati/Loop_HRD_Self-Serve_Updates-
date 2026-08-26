import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import styled from 'styled-components'

import {
  emptyDependantForm,
  emptyEmployeeForm,
  sampleEmployees,
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
  } = useLivesWizard()
  const [query, setQuery] = useState('')

  const isEditDependant = action === 'edit' && method === 'single-dependant'
  const isDelete = action === 'delete'
  const isEdit = action === 'edit'

  const results = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return sampleEmployees
    return sampleEmployees.filter((e) => {
      const hay =
        `${e.employeeId} ${e.firstName} ${e.lastName} ${e.email} ${e.department}`.toLowerCase()
      const depHay = e.dependants
        .map((d) => `${d.firstName} ${d.lastName}`)
        .join(' ')
        .toLowerCase()
      return hay.includes(q) || depHay.includes(q)
    })
  }, [query])

  const title = isDelete
    ? 'Delete employee'
    : isEdit
      ? isEditDependant
        ? 'Edit dependant'
        : 'Edit employee'
      : 'Add single dependant'

  const steps = isDelete
    ? ['Search', 'Date of leaving', 'Refund summary']
    : isEdit
      ? ['Search', 'Edit details', 'Review']
      : ['Search Employee', 'Dependant Details', 'Plan', 'Review Cost']

  return (
    <WizardChrome
      title={title}
      onBack={() => navigate('/endorsements')}
      onExit={() => navigate('/endorsements')}
      primaryLabel="Proceed"
      primaryDisabled={
        !selectedEmployeeId || (isEditDependant && !selectedDependantId)
      }
      onPrimary={() => {
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

        // edit
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
      }}
    >
      <FlowStepper steps={steps} activeIndex={0} bare />

      <Card>
        <CardTitle>
          {isEditDependant
            ? 'Search employee, then pick a dependant'
            : 'Search & choose employee'}
        </CardTitle>
        <SearchInput
          value={query}
          placeholder="Search by name, employee ID, email…"
          onChange={(e) => setQuery(e.target.value)}
        />

        <List>
          {results.map((employee) => {
            const selected = selectedEmployeeId === employee.id
            return (
              <div key={employee.id}>
                <EmployeeCard
                  type="button"
                  $selected={selected}
                  onClick={() => {
                    setSelectedEmployeeId(employee.id)
                    setSelectedDependantId(null)
                  }}
                >
                  <Name>
                    {employee.firstName} {employee.lastName}
                  </Name>
                  <Meta>
                    {employee.employeeId} · {employee.department} ·{' '}
                    {employee.email}
                  </Meta>
                  <Meta>
                    On {employee.coverages.length} covers ·{' '}
                    {employee.dependants.length} dependant
                    {employee.dependants.length === 1 ? '' : 's'}
                  </Meta>
                </EmployeeCard>

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

                {!isEditDependant && selected && employee.dependants.length > 0 ? (
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
    </WizardChrome>
  )
}

const Card = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 24px;
  border-radius: 16px;
  background: ${({ theme }) => theme.colors.surface1};
`

const CardTitle = styled.h2`
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.beyondGrey};
`

const SearchInput = styled.input`
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
