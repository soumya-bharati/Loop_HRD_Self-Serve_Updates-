import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import styled from 'styled-components'

import { assets } from '@/assets/figma'
import type { Gender } from '@/data/employees'
import { sampleEmployees } from '@/data/employees'
import {
  FIGMA_DEMO_TOTAL,
  FIGMA_DEAL_LABEL,
  figmaDemoRows,
} from '@/pages/Employees/figmaDemoRows'
import {
  PAGE_SIZE,
  buildEmployeeRows,
  filterRoster,
  formatCount,
  type RosterRow,
} from '@/pages/Employees/stats'
import { launchWizardPath } from '@/pages/ManageLives/launchWizard'
import { usePendingChanges } from '@/pages/ManageLives/PendingChangesContext'
import { findEmployee } from '@/pages/ManageLives/searchEmployees'
import { useProtoConfig } from '@/proto/ProtoConfigContext'

type ScopeTab = 'all' | 'policy'
type RosterTab = 'active' | 'deleted'

function genderIcon(gender: Gender) {
  return gender === 'Female' ? assets.iconGenderFemale : assets.iconGender
}

function SortHeader({ label }: { label: string }) {
  return (
    <SortHead>
      <span>{label}</span>
      <img src={assets.employeesSort} alt="" width={12} height={12} />
    </SortHead>
  )
}

export function EmployeesPage() {
  const navigate = useNavigate()
  const { entities, deals } = useProtoConfig()
  const { changes, lifecycleFor } = usePendingChanges()
  const [scopeTab, setScopeTab] = useState<ScopeTab>('all')
  const [entityFilter, setEntityFilter] = useState('all')
  const [dealFilter, setDealFilter] = useState(deals[0]?.id ?? 'all')
  const [tab, setTab] = useState<RosterTab>('active')
  const [query, setQuery] = useState('')
  const [page, setPage] = useState(0)

  const scopedEmployees = useMemo(
    () =>
      filterRoster(sampleEmployees, {
        entityId: entityFilter === 'all' ? undefined : entityFilter,
        dealId:
          scopeTab === 'policy' && dealFilter !== 'all'
            ? dealFilter
            : undefined,
        query,
      }),
    [dealFilter, entityFilter, query, scopeTab],
  )

  const mapLifecycle = (employee: (typeof sampleEmployees)[number]) => {
    const status =
      lifecycleFor(employee.id) !== 'active'
        ? lifecycleFor(employee.id)
        : lifecycleFor(employee.employeeId)
    if (status === 'leaving') return 'Leaving' as const
    if (status === 'inactive') return 'Inactive' as const
    return 'Active' as const
  }

  const insuranceStatusFor = (
    employee: (typeof sampleEmployees)[number],
    index: number,
  ) => {
    const status = mapLifecycle(employee)
    if (status !== 'Active') return 'In Progress' as const
    // Prototype: alternate a couple of pending enrollments like the Figma frame.
    if (index % 3 === 1) return 'In Progress' as const
    return 'Insured' as const
  }

  const activeRows = useMemo(
    () =>
      buildEmployeeRows(
        scopedEmployees,
        (employee) =>
          insuranceStatusFor(
            employee,
            scopedEmployees.findIndex((item) => item.id === employee.id),
          ),
        mapLifecycle,
      ),
    [lifecycleFor, scopedEmployees],
  )

  const deletedRows = useMemo(() => {
    const exits = changes.filter((item) => item.action === 'employee_exit')
    return exits
      .map((item) => {
        const payload = item.payload as { employeeId?: string } | undefined
        const employee =
          findEmployee(item.employeeId) ??
          (payload?.employeeId ? findEmployee(payload.employeeId) : undefined)
        if (!employee) return null
        const stillInScope = filterRoster([employee], {
          entityId: entityFilter === 'all' ? undefined : entityFilter,
          dealId:
            scopeTab === 'policy' && dealFilter !== 'all'
              ? dealFilter
              : undefined,
          query,
        })
        if (stillInScope.length === 0) return null
        return buildEmployeeRows(
          [employee],
          () => 'In Progress',
          () => 'Leaving',
        )[0]
      })
      .filter((row): row is RosterRow => row != null)
  }, [changes, dealFilter, entityFilter, query, scopeTab])

  const rows = tab === 'active' ? activeRows : deletedRows
  const useFigmaDemo =
    scopeTab === 'all' &&
    tab === 'active' &&
    !query.trim() &&
    entityFilter === 'all'
  const activeCount =
    scopeTab === 'all' && !query.trim() && entityFilter === 'all'
      ? FIGMA_DEMO_TOTAL
      : activeRows.length
  const deletedCount = deletedRows.length
  const displayTotal = useFigmaDemo ? FIGMA_DEMO_TOTAL : rows.length
  const displayRows = useFigmaDemo ? figmaDemoRows : rows
  const pageCount = Math.max(1, Math.ceil(displayTotal / PAGE_SIZE))
  const safePage = Math.min(page, pageCount - 1)
  const pageRows = useFigmaDemo
    ? figmaDemoRows.slice(
        safePage * PAGE_SIZE,
        safePage * PAGE_SIZE + PAGE_SIZE,
      )
    : rows.slice(
        safePage * PAGE_SIZE,
        safePage * PAGE_SIZE + PAGE_SIZE,
      )
  const rangeStart =
    displayTotal === 0 ? 0 : safePage * PAGE_SIZE + 1
  const rangeEnd = Math.min(displayTotal, safePage * PAGE_SIZE + PAGE_SIZE)
  const showPolicyColumns = scopeTab === 'policy'

  async function copyEmployeeId(employeeId: string) {
    try {
      await navigator.clipboard.writeText(employeeId)
    } catch {
      /* prototype: ignore clipboard failures */
    }
  }

  return (
    <Page>
      <PageIntro>
        <Header>
          <HeaderCopy>
            <Title>Employees</Title>
            <Subtitle>
              Comprehensive list of all employees and dependents in your company
            </Subtitle>
          </HeaderCopy>
          <BulkLivesButton
            type="button"
            onClick={() => navigate('/manage-lives')}
          >
            Add/Deletes Lives in Bulk
          </BulkLivesButton>
        </Header>

        <ScopeTabs role="tablist" aria-label="Employees scope">
        <ScopeTabButton
          type="button"
          role="tab"
          aria-selected={scopeTab === 'all'}
          $active={scopeTab === 'all'}
          onClick={() => {
            setScopeTab('all')
            setPage(0)
          }}
        >
          All Employees
        </ScopeTabButton>
        <ScopeTabButton
          type="button"
          role="tab"
          aria-selected={scopeTab === 'policy'}
          $active={scopeTab === 'policy'}
          onClick={() => {
            setScopeTab('policy')
            setPage(0)
          }}
        >
          Policy Active Roster
        </ScopeTabButton>
      </ScopeTabs>

      <FiltersRow>
        <FilterGroup>
          <FilterSelectWrap>
            <FilterSelect
              value={entityFilter}
              onChange={(event) => {
                setEntityFilter(event.target.value)
                setPage(0)
              }}
              aria-label="Companies"
            >
              <option value="all">All Companies</option>
              {entities.map((entity) => (
                <option key={entity.id} value={entity.id}>
                  {entity.name}
                </option>
              ))}
            </FilterSelect>
            <Chevron src={assets.employeesChevronDown} alt="" />
          </FilterSelectWrap>

          <FilterSelectWrap $muted data-muted="true">
            <FilterSelect
              value={dealFilter}
              onChange={(event) => {
                setDealFilter(event.target.value)
                setPage(0)
              }}
              aria-label="Benefits period"
              disabled={deals.length === 0}
            >
              {deals.length === 0 ? (
                <option value="">No active deal found</option>
              ) : (
                deals.map((deal, index) => (
                  <option key={deal.id} value={deal.id}>
                    {index === 0 ? FIGMA_DEAL_LABEL : deal.name}
                  </option>
                ))
              )}
            </FilterSelect>
            <Chevron src={assets.employeesChevronDown} alt="" />
          </FilterSelectWrap>
        </FilterGroup>
      </FiltersRow>
      </PageIntro>

      <RosterCard>
        <Toolbar>
          <PillTabs role="tablist" aria-label="Roster status">
            <Pill
              type="button"
              role="tab"
              aria-selected={tab === 'active'}
              aria-label={`Active, ${activeCount} employees`}
              $active={tab === 'active'}
              onClick={() => {
                setTab('active')
                setPage(0)
              }}
            >
              Active ({formatCount(activeCount)})
            </Pill>
            <Pill
              type="button"
              role="tab"
              aria-selected={tab === 'deleted'}
              aria-label={`Deleted, ${deletedCount} employees`}
              $active={tab === 'deleted'}
              onClick={() => {
                setTab('deleted')
                setPage(0)
              }}
            >
              Deleted ({formatCount(deletedCount)})
            </Pill>
          </PillTabs>

          <ToolbarActions>
            <SearchWrap>
              <SearchIcon src={assets.searchPerson} alt="" />
              <Search
                value={query}
                onChange={(event) => {
                  setQuery(event.target.value)
                  setPage(0)
                }}
                placeholder="Search by name, employee ID, or user ID..."
                aria-label="Search employees"
              />
            </SearchWrap>
            <AddEmployeeButton
              type="button"
              onClick={() =>
                navigate(
                  launchWizardPath({
                    action: 'add',
                    method: 'single',
                    entity: entities[0]?.id ?? 'symphony-eyc',
                    deal: deals[0]?.id,
                  }),
                )
              }
            >
              Add Single Employee
            </AddEmployeeButton>
          </ToolbarActions>
        </Toolbar>

        {displayRows.length === 0 ? (
          <EmptyCard>
            <EmptyImage src={assets.employeeEmpty} alt="" />
            <EmptyTitle>
              {tab === 'deleted'
                ? 'No deleted employees'
                : 'No employees match these filters'}
            </EmptyTitle>
          </EmptyCard>
        ) : (
          <TableWrap>
            <Table $wide={showPolicyColumns}>
              <thead>
                <tr>
                  <th>Employee</th>
                  <th>
                    <SortHeader label="Cov. start date" />
                  </th>
                  <th>
                    <SortHeader label="Emp. Status" />
                  </th>
                  <th>
                    <SortHeader label="Enr. Status" />
                  </th>
                  <th>Dependents Covered</th>
                  {showPolicyColumns ? (
                    <>
                      <th>
                        <SplitHead>
                          <span>Plans Selected</span>
                          <span>Total. Premium</span>
                        </SplitHead>
                      </th>
                      <th>
                        <SplitHead>
                          <span>Benefits Selected</span>
                          <span>Total. Premium</span>
                        </SplitHead>
                      </th>
                      <th>Wallet</th>
                      <th>Prepaid</th>
                      <th>
                        Payroll
                        <br />
                        Deduction
                      </th>
                    </>
                  ) : (
                    <th>Actions</th>
                  )}
                </tr>
              </thead>
              <tbody>
                {pageRows.map((row) => (
                <tr key={row.id}>
                  <td>
                    <EmployeeCell>
                      <Avatar aria-hidden>{row.initials}</Avatar>
                      <EmployeeMeta>
                        <IdLine>
                          <span>ID: {row.employeeId}</span>
                          {row.reminderScheduled ? (
                            <Reminder>
                              <img
                                src={assets.employeesClock}
                                alt=""
                                width={12}
                                height={12}
                              />
                              <span>Reminder Scheduled</span>
                            </Reminder>
                          ) : null}
                        </IdLine>
                        <NameRow>
                          <NameText>{row.name}</NameText>
                          <CopyButton
                            type="button"
                            aria-label={`Copy ${row.employeeId}`}
                            onClick={() => copyEmployeeId(row.employeeId)}
                          >
                            <img
                              src={assets.iconDocumentCopy}
                              alt=""
                              width={12}
                              height={12}
                            />
                          </CopyButton>
                        </NameRow>
                        <DetailRow>
                          <DetailItem>
                            <img
                              src={genderIcon(row.gender)}
                              alt=""
                              width={16}
                              height={16}
                            />
                            {row.gender}
                          </DetailItem>
                          <DetailItem>
                            <img
                              src={assets.iconCake}
                              alt=""
                              width={16}
                              height={16}
                            />
                            {row.dateOfBirth}
                          </DetailItem>
                        </DetailRow>
                      </EmployeeMeta>
                    </EmployeeCell>
                  </td>
                  <td>
                    <PlainCell>{row.coverageStart}</PlainCell>
                  </td>
                  <td>
                    <Status $tone={row.empStatus}>{row.empStatus}</Status>
                  </td>
                  <td>
                    <Status $tone={row.enrStatus}>{row.enrStatus}</Status>
                  </td>
                  <td>
                    {row.dependants.length === 0 ? (
                      <PlainCell>—</PlainCell>
                    ) : (
                      <DepList>
                        {row.dependants.map((dep) => (
                          <DepItem
                            key={`${row.id}-${dep.name}-${dep.relationship}`}
                          >
                            <img
                              src={genderIcon(dep.gender)}
                              alt=""
                              width={16}
                              height={16}
                            />
                            <span>
                              {dep.name} ({dep.relationship})
                            </span>
                          </DepItem>
                        ))}
                      </DepList>
                    )}
                  </td>
                  {showPolicyColumns ? (
                    <>
                      <td>
                        <PremiumPair>
                          <TagWrap>
                            {row.plans.length === 0 ? (
                              <PlainCell>—</PlainCell>
                            ) : (
                              row.plans.map((plan) => (
                                <Tag key={plan}>{plan}</Tag>
                              ))
                            )}
                          </TagWrap>
                          <Premium>{row.planPremium}</Premium>
                        </PremiumPair>
                      </td>
                      <td>
                        <PremiumPair>
                          <TagWrap>
                            {row.benefits.length === 0 ? (
                              <PlainCell>—</PlainCell>
                            ) : (
                              row.benefits.map((benefit) => (
                                <Tag key={benefit}>{benefit}</Tag>
                              ))
                            )}
                          </TagWrap>
                          <Premium>{row.benefitPremium}</Premium>
                        </PremiumPair>
                      </td>
                      <td>
                        <MoneyCell>{row.wallet}</MoneyCell>
                      </td>
                      <td>
                        <MoneyCell>{row.prepaid}</MoneyCell>
                      </td>
                      <td>
                        <MoneyCell>{row.payrollDeduction}</MoneyCell>
                      </td>
                    </>
                  ) : (
                    <td>
                      <ActionLink to={row.href}>View</ActionLink>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </Table>
        </TableWrap>
        )}

        <Pager>
          <PagerLabel>
            {rangeStart} to {rangeEnd} of {formatCount(displayTotal)} records
          </PagerLabel>
          <PagerButton
            type="button"
            $variant="muted"
            disabled={safePage === 0}
            onClick={() => setPage((current) => Math.max(0, current - 1))}
          >
            Previous
          </PagerButton>
          <PagerButton
            type="button"
            $variant="outline"
            disabled={safePage >= pageCount - 1 || displayTotal === 0}
            onClick={() =>
              setPage((current) => Math.min(pageCount - 1, current + 1))
            }
          >
            Next
          </PagerButton>
        </Pager>
      </RosterCard>
    </Page>
  )
}

const Page = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0;
  padding: 0;
  width: 100%;
  box-sizing: border-box;
  background: ${({ theme }) => theme.colors.surface0};
`

const PageIntro = styled.div`
  padding: 0 ${({ theme }) => theme.layout.contentPadX};
  box-sizing: border-box;

  @media (max-width: ${({ theme }) => theme.breakpoints.lg}) {
    padding: 0 ${({ theme }) => theme.layout.contentPadXTablet};
  }

  @media (max-width: ${({ theme }) => theme.breakpoints.md}) {
    padding: 0 ${({ theme }) => theme.layout.contentPadXMobile};
  }
`

const Header = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 36px 0 42px;

  @media (max-width: ${({ theme }) => theme.breakpoints.md}) {
    align-items: flex-start;
    flex-direction: column;
  }
`

const HeaderCopy = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-width: 0;
`

const Title = styled.h1`
  margin: 0;
  font-size: 20px;
  font-weight: 600;
  line-height: 24px;
  color: ${({ theme }) => theme.colors.textPrimary};
`

const Subtitle = styled.p`
  margin: 0;
  font-size: 14px;
  line-height: 20px;
  letter-spacing: 0.2px;
  color: ${({ theme }) => theme.colors.textSecondary};
`

const BulkLivesButton = styled.button`
  flex-shrink: 0;
  height: 48px;
  padding: 14px 24px;
  border: none;
  border-radius: ${({ theme }) => theme.radii.md};
  background: ${({ theme }) => theme.colors.fillGreen};
  color: ${({ theme }) => theme.colors.emerald};
  font: inherit;
  font-size: 14px;
  font-weight: 500;
  line-height: 20px;
  letter-spacing: 0.2px;
  cursor: pointer;
  white-space: nowrap;
`

const ScopeTabs = styled.div`
  display: flex;
  gap: 20px;
  border-bottom: 1px solid ${({ theme }) => theme.colors.defaultBorder};
  margin-bottom: 16px;
`

const ScopeTabButton = styled.button<{ $active: boolean }>`
  position: relative;
  height: 48px;
  padding: 14px 0 0;
  border: 0;
  background: transparent;
  font: inherit;
  font-size: 14px;
  font-weight: ${({ $active }) => ($active ? 600 : 500)};
  letter-spacing: 0.2px;
  line-height: 20px;
  color: ${({ $active, theme }) =>
    $active ? theme.colors.emerald : theme.colors.textSecondary};
  cursor: pointer;

  &::after {
    content: '';
    position: absolute;
    left: 0;
    right: 0;
    bottom: 0;
    height: ${({ $active }) => ($active ? '2px' : '1px')};
    background: ${({ $active, theme }) =>
      $active ? theme.colors.emerald : theme.colors.defaultBorder};
  }
`

const FiltersRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
  margin-bottom: 16px;
`

const FilterGroup = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
  min-width: 0;
  flex-wrap: wrap;
`

const FilterSelectWrap = styled.div<{ $muted?: boolean }>`
  position: relative;
  display: flex;
  align-items: center;
  width: 360px;
  max-width: 100%;
  height: 48px;
  padding: 0 20px;
  border: 1px solid
    ${({ $muted, theme }) =>
      $muted ? 'transparent' : theme.colors.defaultBorder};
  border-radius: 8px;
  background: ${({ $muted, theme }) =>
    $muted ? theme.colors.disableFill : theme.colors.surface1};
  box-sizing: border-box;
`

const FilterSelect = styled.select`
  flex: 1;
  min-width: 0;
  height: 100%;
  border: 0;
  padding: 0 28px 0 0;
  background: transparent;
  font: inherit;
  font-size: 14px;
  font-weight: 500;
  letter-spacing: 0.2px;
  line-height: 20px;
  color: ${({ theme }) => theme.colors.textPrimary};
  appearance: none;
  cursor: pointer;

  ${FilterSelectWrap}[data-muted='true'] & {
    font-weight: 400;
    color: ${({ theme }) => theme.colors.textSecondary};
  }

  &:disabled {
    color: ${({ theme }) => theme.colors.textSecondary};
    font-weight: 400;
    cursor: not-allowed;
  }
`

const Chevron = styled.img`
  position: absolute;
  right: 16px;
  width: 24px;
  height: 24px;
  pointer-events: none;
`

const RosterCard = styled.section`
  background: ${({ theme }) => theme.colors.surface1};
  width: 100%;
`

const Toolbar = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
  min-height: 80px;
  padding: 22px 56px;
  box-sizing: border-box;
`

const PillTabs = styled.div`
  display: flex;
  gap: 8px;
`

const Pill = styled.button<{ $active: boolean }>`
  height: 36px;
  padding: 8px 16px;
  border: 1px solid
    ${({ $active, theme }) =>
      $active ? theme.colors.emerald : theme.colors.defaultBorder};
  border-radius: 30px;
  background: ${({ $active, theme }) =>
    $active ? theme.colors.emerald : theme.colors.surface1};
  color: ${({ $active, theme }) =>
    $active ? theme.colors.textTertiary : theme.colors.textPrimary};
  font: inherit;
  font-size: 12px;
  font-weight: ${({ $active }) => ($active ? 500 : 400)};
  letter-spacing: 0.2px;
  line-height: 18px;
  white-space: nowrap;
  cursor: pointer;
`

const ToolbarActions = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  margin-left: auto;
  min-width: 0;
`

const SearchWrap = styled.label`
  position: relative;
  display: flex;
  align-items: center;
  width: 400px;
  max-width: 100%;
  height: 48px;
  padding: 0 20px;
  border: 1px solid ${({ theme }) => theme.colors.defaultBorder};
  border-radius: 8px;
  background: ${({ theme }) => theme.colors.surface1};
  box-sizing: border-box;
`

const SearchIcon = styled.img`
  width: 24px;
  height: 24px;
  flex-shrink: 0;
  margin-right: 8px;
`

const Search = styled.input`
  flex: 1;
  min-width: 0;
  height: 100%;
  border: 0;
  padding: 0;
  background: transparent;
  font: inherit;
  font-size: 14px;
  line-height: 20px;
  letter-spacing: 0.2px;
  color: ${({ theme }) => theme.colors.textPrimary};

  &::placeholder {
    color: ${({ theme }) => theme.colors.textSecondary};
  }

  &:focus {
    outline: none;
  }
`

const AddEmployeeButton = styled.button`
  flex-shrink: 0;
  height: 48px;
  padding: 14px 24px;
  border: none;
  border-radius: ${({ theme }) => theme.radii.md};
  background: ${({ theme }) => theme.colors.fillGreen};
  color: ${({ theme }) => theme.colors.emerald};
  font: inherit;
  font-size: 14px;
  font-weight: 500;
  line-height: 20px;
  letter-spacing: 0.2px;
  cursor: pointer;
  white-space: nowrap;
`

const Pager = styled.div`
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 12px;
  flex-wrap: wrap;
  min-height: 70px;
  padding: 16px 56px;
  box-sizing: border-box;
`

const PagerLabel = styled.span`
  width: 240px;
  font-size: 12px;
  font-weight: 500;
  line-height: 18px;
  letter-spacing: 0.2px;
  text-align: right;
  color: ${({ theme }) => theme.colors.textPrimary};
`

const PagerButton = styled.button<{ $variant: 'muted' | 'outline' }>`
  width: 84px;
  height: 36px;
  padding: 8px 16px;
  border: 1px solid
    ${({ $variant, theme }) =>
      $variant === 'outline' ? theme.colors.emerald : 'transparent'};
  border-radius: 8px;
  background: ${({ $variant, theme }) =>
    $variant === 'muted' ? theme.colors.disableFill : theme.colors.surface1};
  color: ${({ $variant, theme }) =>
    $variant === 'outline' ? theme.colors.emerald : theme.colors.textSecondary};
  font: inherit;
  font-size: 12px;
  font-weight: 500;
  letter-spacing: 0.2px;
  line-height: 18px;
  cursor: pointer;

  &:disabled {
    opacity: 0.7;
    cursor: not-allowed;
  }
`

const TableWrap = styled.div`
  overflow-x: auto;
`

const SortHead = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 4px;
`

const Table = styled.table<{ $wide?: boolean }>`
  width: 100%;
  min-width: ${({ $wide }) => ($wide ? '1680px' : '1100px')};
  border-collapse: collapse;
  font-size: 13px;
  table-layout: fixed;

  th,
  td {
    padding: 16px 20px;
    text-align: left;
    border-bottom: 1px solid ${({ theme }) => theme.colors.disableFill};
    vertical-align: top;
  }

  th:first-child,
  td:first-child {
    padding-left: 56px;
    width: 300px;
  }

  th:nth-child(2),
  td:nth-child(2),
  th:nth-child(3),
  td:nth-child(3),
  th:nth-child(4),
  td:nth-child(4) {
    width: 140px;
  }

  th:nth-child(5),
  td:nth-child(5) {
    width: 280px;
  }

  th:last-child,
  td:last-child {
    width: ${({ $wide }) => ($wide ? 'auto' : '166px')};
  }

  th {
    height: 60px;
    padding-top: 12px;
    padding-bottom: 12px;
    background: ${({ theme }) => theme.colors.surface0};
    color: ${({ theme }) => theme.colors.textPrimary};
    font-size: 12px;
    font-weight: 400;
    letter-spacing: 0.2px;
    line-height: 18px;
    white-space: nowrap;
    box-sizing: border-box;
  }

  tbody tr {
    min-height: 114px;
  }

  tbody tr:last-child td {
    border-bottom: 0;
  }
`

const SplitHead = styled.span`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  min-width: 280px;
`

const EmployeeCell = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 12px;
  min-width: 260px;
`

const Avatar = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 16px;
  background: ${({ theme }) => theme.colors.planeGreenDark};
  color: ${({ theme }) => theme.colors.textTertiary};
  font-size: 13px;
  font-weight: 500;
  letter-spacing: 0.2px;
  flex-shrink: 0;
`

const EmployeeMeta = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
`

const IdLine = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  font-size: 12px;
  line-height: 12px;
  color: ${({ theme }) => theme.colors.textSecondary};
`

const Reminder = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 2px;
  font-size: 10px;
  line-height: normal;
  color: ${({ theme }) => theme.colors.textSecondary};

  span {
    text-decoration: underline;
    text-decoration-style: dotted;
  }
`

const NameRow = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
`

const NameText = styled.span`
  color: ${({ theme }) => theme.colors.textPrimary};
  font-size: 14px;
  font-weight: 500;
  line-height: 20px;
`

const CopyButton = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 16px;
  height: 16px;
  padding: 0;
  border: 0;
  background: transparent;
  cursor: pointer;
  opacity: 0.7;

  &:hover {
    opacity: 1;
  }
`

const DetailRow = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
`

const DetailItem = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  line-height: 18px;
  color: ${({ theme }) => theme.colors.textSecondary};
`

const PlainCell = styled.span`
  display: inline-block;
  padding-top: 6px;
  font-size: 13px;
  line-height: 18px;
  letter-spacing: 0.2px;
  color: ${({ theme }) => theme.colors.textPrimary};
`

const Status = styled.span<{ $tone: string }>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 100px;
  height: 26px;
  padding: 4px 12px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 500;
  letter-spacing: 0.2px;
  line-height: 18px;
  box-sizing: border-box;
  background: ${({ $tone }) =>
    $tone === 'Active' || $tone === 'Enrolled'
      ? 'rgba(54, 214, 195, 0.5)'
      : $tone === 'Pending' || $tone === 'Leaving'
        ? 'rgba(253, 213, 6, 0.4)'
        : '#EEEEEE'};
  color: ${({ $tone, theme }) =>
    $tone === 'Active' || $tone === 'Enrolled'
      ? theme.colors.emerald
      : theme.colors.textPrimary};
`

const DepList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 180px;
  padding-top: 6px;
`

const DepItem = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  line-height: 18px;
  color: ${({ theme }) => theme.colors.textPrimary};
`

const PremiumPair = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  min-width: 300px;
  padding-top: 6px;
`

const TagWrap = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  max-width: 282px;
`

const Tag = styled.span`
  display: inline-flex;
  align-items: center;
  height: 22px;
  padding: 2px 8px;
  border-radius: 16px;
  background: rgba(0, 0, 0, 0.04);
  color: ${({ theme }) => theme.colors.textPrimary};
  font-size: 12px;
  font-weight: 500;
  letter-spacing: 0.2px;
  line-height: 18px;
  white-space: nowrap;
`

const Premium = styled.span`
  width: 110px;
  flex-shrink: 0;
  text-align: right;
  font-size: 13px;
  letter-spacing: 0.2px;
  color: ${({ theme }) => theme.colors.textPrimary};
`

const MoneyCell = styled.span`
  display: inline-block;
  padding-top: 6px;
  width: 100%;
  text-align: right;
  font-size: 13px;
  letter-spacing: 0.2px;
  color: ${({ theme }) => theme.colors.textPrimary};
`

const ActionLink = styled(Link)`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 84px;
  height: 36px;
  margin-top: 6px;
  border: 1px solid ${({ theme }) => theme.colors.emerald};
  border-radius: 8px;
  color: ${({ theme }) => theme.colors.emerald};
  font-size: 12px;
  font-weight: 500;
  letter-spacing: 0.2px;
  line-height: 18px;
  text-decoration: none;
  box-sizing: border-box;

  &:hover {
    background: ${({ theme }) => theme.colors.planeGreenLight};
  }
`

const EmptyCard = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 64px 24px;
  text-align: center;
`

const EmptyImage = styled.img`
  width: min(220px, 70%);
  height: auto;
`

const EmptyTitle = styled.h3`
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.textPrimary};
`
