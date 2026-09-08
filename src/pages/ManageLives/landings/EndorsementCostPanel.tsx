import { useMemo } from 'react'
import styled from 'styled-components'

import { assets } from '@/assets/figma'
import {
  breakupTotals,
  buildCoverBreakup,
  buildInsurerGroups,
  formatINRExact,
  type CoverDefinition,
} from '@/data/coverPlans'
import { sampleBulkRows } from '@/data/flexDeal'
import { downloadAssignmentSheet } from '@/pages/ManageLives/bulk/downloadAssignmentSheet'

export function EndorsementCostPanel({
  isDelete = false,
  onDone,
}: {
  isDelete?: boolean
  onDone: () => void
}) {
  const acceptedRows = useMemo(
    () => sampleBulkRows.filter((row) => row.status !== 'fail'),
    [],
  )
  const breakup = useMemo(() => buildCoverBreakup(acceptedRows), [acceptedRows])
  const groups = useMemo(() => buildInsurerGroups(breakup), [breakup])
  const totals = useMemo(
    () => breakupTotals(acceptedRows, breakup),
    [acceptedRows, breakup],
  )

  return (
    <Panel>
      <AssistantAvatar
        src={assets.mlBulkAssistantAvatar}
        alt=""
        width={48}
        height={48}
      />
      <Results>
        <Title>
          {isDelete
            ? 'Here is the cost of deletion'
            : 'Here is the cost of addition'}
        </Title>

        {groups.map((group) => (
          <InsurerCard key={group.key}>
            <InsurerHeader>
              <Brand>
                <LogoWrap>
                  <img src={logoFor(group.insurerLogo)} alt="" />
                </LogoWrap>
                <div>
                  <InsurerName>{group.insurerName}</InsurerName>
                  <AccountLine>
                    Account No:{' '}
                    <strong>
                      {group.covers[0]?.cover.policyNumber.slice(-4) ?? '—'}
                    </strong>
                  </AccountLine>
                </div>
              </Brand>
              <CdPill>
                CD Balance: <strong>{formatINRExact(group.cdBalance)}</strong>
              </CdPill>
            </InsurerHeader>
            {group.covers.map((item) => (
              <PolicyRow key={item.cover.id}>
                <PolicyCopy>
                  <PolicyName>{item.cover.name}</PolicyName>
                  <PolicyMeta>
                    <span>ID: {item.cover.policyNumber}</span>
                    <Dot aria-hidden />
                    <span>
                      {item.lives} {item.lives === 1 ? 'Life' : 'Lives'}{' '}
                      {isDelete ? 'Removed' : 'Added'}
                    </span>
                  </PolicyMeta>
                </PolicyCopy>
                <PolicyCost>{formatINRExact(item.cost)}</PolicyCost>
              </PolicyRow>
            ))}
          </InsurerCard>
        ))}

        <SummaryCard>
          <SummaryRow>
            <span>Total Endorsement Cost</span>
            <strong>{formatINRExact(totals.cost)}</strong>
          </SummaryRow>
          <Warning>
            <img src={assets.mlIconInfoWarning} alt="" width={20} height={20} />
            <p>
              Final amount includes GST, but it could change after the
              endorsement is processed.
            </p>
          </Warning>
          <Actions>
            <OkayButton type="button" onClick={onDone}>
              Okay, Got it
            </OkayButton>
            <DownloadButton
              type="button"
              onClick={() => downloadAssignmentSheet(acceptedRows)}
            >
              Download Assignment Sheet
            </DownloadButton>
          </Actions>
        </SummaryCard>
      </Results>
    </Panel>
  )
}

function logoFor(logo: CoverDefinition['insurerLogo']) {
  if (logo === 'icici') return assets.iciciLogo
  if (logo === 'digit') return assets.digitLogo
  if (logo === 'aditya-birla') return assets.mlLogoIciciPru
  return assets.mlLogoOriental
}

const Panel = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 24px;
  width: 100%;
  padding: 72px 72px 40px 0;
  box-sizing: border-box;

  @media (max-width: ${({ theme }) => theme.breakpoints.md}) {
    padding: 72px 16px 40px;
  }
`

const AssistantAvatar = styled.img`
  display: block;
  width: 48px;
  height: 48px;
  flex: 0 0 48px;
  border-radius: 50%;
  object-fit: cover;
`

const Results = styled.div`
  display: flex;
  min-width: 0;
  flex: 1;
  flex-direction: column;
  gap: 16px;
  padding-top: 13px;
`

const Title = styled.h1`
  margin: 0;
  font-size: 18px;
  font-weight: 500;
  line-height: 24px;
  color: ${({ theme }) => theme.colors.textPrimary};
`

const InsurerCard = styled.article`
  overflow: hidden;
  width: 100%;
  border: 1px solid ${({ theme }) => theme.colors.disableFill};
  border-radius: 12px;
  background: ${({ theme }) => theme.colors.surface1};
`

const InsurerHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 16px;
  background: #f4f8fa;
`

const Brand = styled.div`
  display: flex;
  min-width: 0;
  align-items: center;
  gap: 12px;
`

const LogoWrap = styled.div`
  width: 40px;
  height: 40px;
  flex: 0 0 40px;
  overflow: hidden;
  border-radius: 6px;

  img {
    display: block;
    width: 40px;
    height: 40px;
    object-fit: cover;
  }
`

const InsurerName = styled.p`
  margin: 0;
  font-size: 14px;
  font-weight: 500;
  line-height: 20px;
  letter-spacing: 0.2px;
  color: ${({ theme }) => theme.colors.textPrimary};
`

const AccountLine = styled.p`
  margin: 2px 0 0;
  font-size: 12px;
  line-height: 18px;
  letter-spacing: 0.2px;
  color: #6e7a75;

  strong {
    font-weight: 400;
    color: #2b3632;
  }
`

const CdPill = styled.div`
  display: flex;
  flex-shrink: 0;
  align-items: center;
  gap: 4px;
  padding: 6px 12px;
  border-radius: 7px;
  background: ${({ theme }) => theme.colors.surface1};
  font-size: 14px;
  line-height: 20px;
  letter-spacing: 0.2px;
  color: #6e7a75;

  strong {
    font-weight: 600;
    color: ${({ theme }) => theme.colors.textPrimary};
  }
`

const PolicyRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 16px;
  background: ${({ theme }) => theme.colors.surface1};
`

const PolicyCopy = styled.div`
  min-width: 0;
`

const PolicyName = styled.p`
  margin: 0;
  overflow: hidden;
  font-size: 14px;
  line-height: 20px;
  letter-spacing: 0.2px;
  color: ${({ theme }) => theme.colors.textPrimary};
  text-overflow: ellipsis;
  white-space: nowrap;
`

const PolicyMeta = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 2px;
  color: ${({ theme }) => theme.colors.textSecondary};
  font-size: 12px;
  font-weight: 500;
  line-height: 18px;
  letter-spacing: 0.2px;
`

const Dot = styled.span`
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: ${({ theme }) => theme.colors.disableFill};
`

const PolicyCost = styled.p`
  margin: 0;
  flex-shrink: 0;
  font-size: 14px;
  font-weight: 600;
  line-height: 20px;
  letter-spacing: 0.2px;
  color: ${({ theme }) => theme.colors.textPrimary};
`

const SummaryCard = styled.section`
  display: flex;
  flex-direction: column;
  gap: 16px;
  width: 100%;
  padding: 16px;
  border: 1px solid ${({ theme }) => theme.colors.disableFill};
  border-radius: 12px;
  box-sizing: border-box;
`

const SummaryRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  font-size: 16px;
  line-height: 24px;
  letter-spacing: 0.2px;

  span {
    color: ${({ theme }) => theme.colors.textSecondary};
    font-weight: 500;
  }

  strong {
    color: ${({ theme }) => theme.colors.textPrimary};
    font-weight: 600;
  }
`

const Warning = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  min-height: 44px;
  padding: 12px;
  border-radius: 8px;
  background: #f9fafb;
  box-sizing: border-box;

  img {
    display: block;
    width: 20px;
    height: 20px;
    flex-shrink: 0;
  }

  p {
    margin: 0;
    color: #6e7a75;
    font-size: 12px;
    line-height: 1.4;
  }
`

const Actions = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  align-items: center;
`

const OkayButton = styled.button`
  height: 48px;
  padding: 14px 24px;
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

const DownloadButton = styled(OkayButton)`
  border: 1px solid ${({ theme }) => theme.colors.emerald};
  background: ${({ theme }) => theme.colors.surface1};
`
