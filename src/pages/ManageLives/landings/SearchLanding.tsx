import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import styled from 'styled-components'

import { launchWizardPath } from '@/pages/ManageLives/launchWizard'
import { usePendingChanges } from '@/pages/ManageLives/PendingChangesContext'
import {
  dealNameForEmployee,
  entityNameForEmployee,
  searchEmployees,
} from '@/pages/ManageLives/searchEmployees'
import { useProtoConfig } from '@/proto/ProtoConfigContext'

export function SearchLanding() {
  const navigate = useNavigate()
  const { entities, deals } = useProtoConfig()
  const { lifecycleFor } = usePendingChanges()
  const [query, setQuery] = useState('')
  const [entityFilter, setEntityFilter] = useState('all')
  const [dealFilter, setDealFilter] = useState('all')
  const [searched, setSearched] = useState(false)

  const results = useMemo(
    () =>
      searchEmployees(query, {
        entityId: entityFilter === 'all' ? undefined : entityFilter,
        dealId: dealFilter === 'all' ? undefined : dealFilter,
      }),
    [dealFilter, entityFilter, query],
  )

  const defaultEntity =
    entityFilter !== 'all' ? entityFilter : (entities[0]?.id ?? 'symphony-eyc')
  const defaultDeal = dealFilter !== 'all' ? dealFilter : deals[0]?.id

  const bulkPath = useMemo(() => {
    const params = new URLSearchParams()
    if (defaultEntity) params.set('entity', defaultEntity)
    if (defaultDeal) params.set('deal', defaultDeal)
    const qs = params.toString()
    return qs ? `/manage-lives/bulk?${qs}` : '/manage-lives/bulk'
  }, [defaultDeal, defaultEntity])

  return (
    <Page>
      <Intro>
        <IntroCopy>
          <Title>Manage Lives</Title>
          <Copy>Find someone, or add people to cover.</Copy>
        </IntroCopy>
        <ScopeFilters>
          <Select
            value={entityFilter}
            onChange={(event) => setEntityFilter(event.target.value)}
            aria-label="Entity"
          >
            <option value="all">All entities</option>
            {entities.map((entity) => (
              <option key={entity.id} value={entity.id}>
                {entity.name}
              </option>
            ))}
          </Select>
          <Select
            value={dealFilter}
            onChange={(event) => setDealFilter(event.target.value)}
            aria-label="Deal"
          >
            <option value="all">All deals</option>
            {deals.map((deal) => (
              <option key={deal.id} value={deal.id}>
                {deal.name}
              </option>
            ))}
          </Select>
        </ScopeFilters>
      </Intro>

      <SearchBlock>
        <SearchInput
          value={query}
          placeholder="Name, employee ID, email, or phone"
          autoFocus
          onChange={(event) => {
            setQuery(event.target.value)
            setSearched(true)
          }}
        />
        <QuietActions>
          <QuietButton
            type="button"
            onClick={() =>
              navigate(
                launchWizardPath({
                  action: 'add',
                  method: 'single',
                  entity: defaultEntity,
                  deal: defaultDeal,
                }),
              )
            }
          >
            Add employee
          </QuietButton>
          <QuietLink to={bulkPath}>Upload a sheet</QuietLink>
        </QuietActions>
      </SearchBlock>

      {!searched && !query ? (
        <Empty>Type a name, employee ID, email, or phone.</Empty>
      ) : results.length === 0 ? (
        <Empty>No employees match that search.</Empty>
      ) : (
        <ResultList>
          {results.map((employee) => {
            const status =
              lifecycleFor(employee.id) !== 'active'
                ? lifecycleFor(employee.id)
                : lifecycleFor(employee.employeeId)
            return (
              <ResultLink
                key={employee.id}
                to={`/manage-lives/employee/${employee.id}`}
              >
                <strong>
                  {employee.firstName} {employee.lastName}
                </strong>
                <span>{employee.employeeId}</span>
                <span>{entityNameForEmployee(employee)}</span>
                <span>{dealNameForEmployee(employee)}</span>
                <span>
                  {employee.dependants.length} dependant
                  {employee.dependants.length === 1 ? '' : 's'}
                </span>
                <Status $tone={status}>{status}</Status>
              </ResultLink>
            )
          })}
        </ResultList>
      )}
    </Page>
  )
}

const Page = styled.div`
  display: flex;
  flex-direction: column;
  gap: 24px;
  padding: 32px ${({ theme }) => theme.layout.contentPadX} 64px;

  @media (max-width: ${({ theme }) => theme.breakpoints.lg}) {
    padding: 24px ${({ theme }) => theme.layout.contentPadXTablet} 48px;
  }

  @media (max-width: ${({ theme }) => theme.breakpoints.md}) {
    padding: 20px ${({ theme }) => theme.layout.contentPadXMobile} 40px;
  }
`

const Intro = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 24px;

  @media (max-width: ${({ theme }) => theme.breakpoints.md}) {
    flex-direction: column;
    gap: 16px;
  }
`

const IntroCopy = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-width: 0;
`

const ScopeFilters = styled.div`
  display: grid;
  grid-template-columns: minmax(180px, 280px) minmax(160px, 220px);
  gap: 12px;
  flex-shrink: 0;
  width: min(520px, 100%);

  @media (max-width: ${({ theme }) => theme.breakpoints.sm}) {
    grid-template-columns: 1fr;
    width: 100%;
  }
`

const Title = styled.h1`
  margin: 0;
  font-size: 24px;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.beyondGrey};
`

const Copy = styled.p`
  margin: 0;
  max-width: 720px;
  font-size: 14px;
  line-height: 20px;
  color: ${({ theme }) => theme.colors.textSecondary};
`

const SearchBlock = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`

const SearchInput = styled.input`
  height: 52px;
  padding: 0 16px;
  border: 1px solid ${({ theme }) => theme.colors.defaultBorder};
  border-radius: 12px;
  font: inherit;
  font-size: 16px;
  width: 100%;
  box-sizing: border-box;
  background: ${({ theme }) => theme.colors.surface1};
`

const QuietActions = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px 20px;
  align-items: center;
`

const QuietButton = styled.button`
  border: 0;
  padding: 0;
  background: transparent;
  color: ${({ theme }) => theme.colors.emerald};
  font: inherit;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
`

const QuietLink = styled(Link)`
  color: ${({ theme }) => theme.colors.emerald};
  font-size: 14px;
  font-weight: 500;
  text-decoration: none;
`

const Select = styled.select`
  height: 44px;
  padding: 0 12px;
  border: 1px solid ${({ theme }) => theme.colors.defaultBorder};
  border-radius: 8px;
  font: inherit;
  background: ${({ theme }) => theme.colors.surface1};
`

const Empty = styled.p`
  margin: 0;
  font-size: 14px;
  color: ${({ theme }) => theme.colors.textSecondary};
`

const ResultList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`

const ResultLink = styled(Link)`
  display: grid;
  grid-template-columns: 1.3fr 0.7fr 1.2fr 1fr 0.8fr auto;
  gap: 12px;
  align-items: center;
  padding: 14px 16px;
  border-radius: 12px;
  border: 1px solid ${({ theme }) => theme.colors.disableFill};
  background: ${({ theme }) => theme.colors.surface1};
  text-decoration: none;
  color: ${({ theme }) => theme.colors.textPrimary};
  font-size: 13px;

  @media (max-width: ${({ theme }) => theme.breakpoints.md}) {
    grid-template-columns: 1fr 1fr;
  }
`

const Status = styled.span<{ $tone: string }>`
  text-transform: capitalize;
  font-weight: 600;
  color: ${({ theme, $tone }) =>
    $tone === 'inactive'
      ? theme.colors.textError
      : $tone === 'leaving'
        ? '#B45309'
        : theme.colors.emerald};
`
