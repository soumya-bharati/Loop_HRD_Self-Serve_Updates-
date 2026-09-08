import styled from 'styled-components'

import { assets } from '@/assets/figma'
import {
  formatINRExact,
  type CoverDefinition,
  type InsurerCostGroup,
} from '@/data/coverPlans'

type Props = {
  groups: InsurerCostGroup[]
  totalLives: number
  totalCost: number
  emptyMessage?: string
}

/**
 * Endorsement cost review: one card per insurer, each cover broken down by the
 * plan its lives landed on, with a receipt-style total alongside.
 */
export function EndorsementCostReview({
  groups,
  totalLives,
  totalCost,
  emptyMessage = 'No covers assigned yet.',
}: Props) {
  return (
    <Layout>
      <InsurerColumn>
        {groups.length === 0 ? (
          <EmptyCard>{emptyMessage}</EmptyCard>
        ) : (
          groups.map((group) => (
            <InsurerCard key={group.key}>
              <InsurerHeader>
                <InsurerIdentity>
                  <InsurerMark logo={group.insurerLogo} />
                  <div>
                    <InsurerName>{group.insurerName}</InsurerName>
                    <InsurerMeta>{group.cdAccountName}</InsurerMeta>
                  </div>
                </InsurerIdentity>
                <CdPill>CD Balance: {formatINRExact(group.cdBalance)}</CdPill>
              </InsurerHeader>

              <CardBody>
                {group.covers.map((item) => (
                  <CoverBox key={item.cover.id}>
                    <CoverHeader>
                      <CoverName>{item.cover.name}</CoverName>
                      <CoverCode>{item.cover.shortLabel}</CoverCode>
                    </CoverHeader>

                    <PlanGrid>
                      <HeadRow>
                        <span>Plan</span>
                        <span>Lives Added</span>
                        <span>Endorsement Cost</span>
                      </HeadRow>
                      {item.plans.map((plan) => (
                        <PlanRow key={plan.planId}>
                          <span data-label="Plan">{plan.planLabel}</span>
                          <span data-label="Lives Added">{plan.lives}</span>
                          <span data-label="Endorsement Cost">
                            {formatINRExact(plan.cost)}
                          </span>
                        </PlanRow>
                      ))}
                      <TotalRow>
                        <span data-label="Plan">All plans</span>
                        <span data-label="Lives Added">{item.lives}</span>
                        <span data-label="Endorsement Cost">
                          {formatINRExact(item.cost)}
                        </span>
                      </TotalRow>
                    </PlanGrid>
                  </CoverBox>
                ))}
              </CardBody>
            </InsurerCard>
          ))
        )}
      </InsurerColumn>

      <ReceiptCard>
        <ReceiptTitle>
          <ReceiptIcon />
          Total Endorsement Cost
        </ReceiptTitle>
        <ReceiptRow>
          <span>Total Lives Added</span>
          <strong>{totalLives}</strong>
        </ReceiptRow>
        <ReceiptRow>
          <span>Total Endorsement Cost</span>
          <strong>{formatINRExact(totalCost)}</strong>
        </ReceiptRow>
        <ReceiptNote>
          <InfoDot>
            <img src={assets.infoMark} alt="" width={10} height={10} />
          </InfoDot>
          Final amount may change once endorsement is processed.
        </ReceiptNote>
        <ReceiptJagged aria-hidden />
      </ReceiptCard>
    </Layout>
  )
}

function InsurerMark({ logo }: { logo: CoverDefinition['insurerLogo'] }) {
  if (logo === 'digit') return <Logo src={assets.digitLogo} alt="" />
  if (logo === 'icici') return <Logo src={assets.iciciLogo} alt="" />
  return (
    <TextMark $tone={logo} aria-hidden>
      {logo === 'aditya-birla' ? 'AB' : 'care'}
    </TextMark>
  )
}

function ReceiptIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 28 28" fill="none" aria-hidden>
      <circle cx="14" cy="14" r="14" fill="#FDD506" />
      <rect x="9" y="7.5" width="10" height="13" rx="1.5" fill="#fff" />
      <path
        d="M9 18.5l1.4 1.4 1.4-1.4 1.4 1.4 1.4-1.4 1.4 1.4 1.4-1.4 1.6 1.4V20a1.5 1.5 0 01-1.5 1.5H10.5A1.5 1.5 0 019 20v-1.5z"
        fill="#fff"
      />
      <path
        d="M11.2 12.2h5.2M11.2 15h3.4"
        stroke="#1A1A1A"
        strokeWidth="1.2"
        strokeLinecap="round"
      />
    </svg>
  )
}

const Layout = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 1fr) 340px;
  gap: 24px;
  align-items: start;
  max-width: 100%;
  box-sizing: border-box;

  @media (max-width: ${({ theme }) => theme.breakpoints.xl}) {
    grid-template-columns: 1fr;
  }

  @media (max-width: 640px) {
    gap: 16px;
  }
`

const InsurerColumn = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
  min-width: 0;
`

const InsurerCard = styled.section`
  overflow: hidden;
  border-radius: 16px;
  background: ${({ theme }) => theme.colors.surface1};
  border: 1px solid ${({ theme }) => theme.colors.disableFill};
  max-width: 100%;
  box-sizing: border-box;
`

const InsurerHeader = styled.header`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 16px 20px;
  background: ${({ theme }) => theme.colors.bannerMint};
  border-bottom: 1px solid ${({ theme }) => theme.colors.disableFill};

  @media (max-width: 640px) {
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
  }
`

const InsurerIdentity = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 0;
`

const Logo = styled.img`
  height: 32px;
  width: auto;
  max-width: 110px;
  object-fit: contain;
  flex-shrink: 0;
`

const TextMark = styled.div<{ $tone: 'care' | 'aditya-birla' }>`
  width: 32px;
  height: 32px;
  border-radius: 8px;
  display: grid;
  place-items: center;
  flex-shrink: 0;
  color: #fff;
  font-size: ${({ $tone }) => ($tone === 'care' ? '11px' : '13px')};
  font-weight: 700;
  line-height: 1;
  background: ${({ $tone }) =>
    $tone === 'aditya-birla'
      ? 'linear-gradient(135deg, #C8102E 0%, #8E0B21 100%)'
      : 'linear-gradient(135deg, #F36F21 0%, #E31C23 100%)'};
`

const InsurerName = styled.div`
  font-size: 15px;
  font-weight: 600;
  line-height: 20px;
  color: ${({ theme }) => theme.colors.beyondGrey};
`

const InsurerMeta = styled.div`
  margin-top: 2px;
  font-size: 12px;
  line-height: 16px;
  color: ${({ theme }) => theme.colors.textSecondary};
`

const CdPill = styled.div`
  flex-shrink: 0;
  padding: 8px 14px;
  border-radius: 8px;
  background: ${({ theme }) => theme.colors.surface1};
  border: 1px solid ${({ theme }) => theme.colors.defaultBorder};
  font-size: 13px;
  font-weight: 500;
  color: ${({ theme }) => theme.colors.textPrimary};
  white-space: nowrap;

  @media (max-width: 640px) {
    width: 100%;
    box-sizing: border-box;
    text-align: center;
  }
`

const CardBody = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 20px;

  @media (max-width: 640px) {
    padding: 14px;
  }
`

const CoverBox = styled.div`
  border: 1px solid ${({ theme }) => theme.colors.disableFill};
  border-radius: 12px;
  padding: 16px 20px;
  min-width: 0;

  @media (max-width: 640px) {
    padding: 12px 14px;
  }
`

const CoverHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  padding-bottom: 12px;
  border-bottom: 1px solid ${({ theme }) => theme.colors.disableFill};
`

const CoverName = styled.h3`
  margin: 0;
  font-size: 14px;
  font-weight: 600;
  line-height: 20px;
  color: ${({ theme }) => theme.colors.beyondGrey};
`

const CoverCode = styled.span`
  padding: 3px 8px;
  border-radius: 999px;
  background: ${({ theme }) => theme.colors.planeGreenLight};
  color: ${({ theme }) => theme.colors.emerald};
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.2px;
`

const PlanGrid = styled.div`
  display: flex;
  flex-direction: column;
  min-width: 0;
`

/* Rows sit flush so the column dividers read as continuous vertical lines. */
const gridRow = `
  display: grid;
  grid-template-columns: 1.4fr 1fr 1.2fr;
  min-width: 0;

  > span {
    padding: 10px 0;
    min-width: 0;
    overflow-wrap: anywhere;
  }

  > span:not(:first-child) {
    padding-left: 20px;
  }
`

const mobileStack = `
  @media (max-width: 640px) {
    display: flex;
    flex-direction: column;

    > span {
      display: flex;
      flex-direction: column;
      gap: 2px;
      padding: 8px 0;

      &::before {
        content: attr(data-label);
        font-size: 11px;
        font-weight: 600;
        color: #7f8785;
      }
    }

    > span:not(:first-child) {
      padding-left: 0;
      border-left: none;
    }
  }
`

const HeadRow = styled.div`
  ${gridRow}
  font-size: 12px;
  font-weight: 500;
  line-height: 16px;
  color: ${({ theme }) => theme.colors.textSecondary};

  > span:not(:first-child) {
    border-left: 1px solid ${({ theme }) => theme.colors.disableFill};
  }

  @media (max-width: 640px) {
    display: none;
  }
`

const PlanRow = styled.div`
  ${gridRow}
  font-size: 15px;
  font-weight: 500;
  line-height: 20px;
  color: ${({ theme }) => theme.colors.beyondGrey};

  > span:not(:first-child) {
    border-left: 1px solid ${({ theme }) => theme.colors.disableFill};
  }

  ${mobileStack}

  @media (max-width: 640px) {
    border-top: 1px solid ${({ theme }) => theme.colors.disableFill};
  }
`

const TotalRow = styled.div`
  ${gridRow}
  border-top: 1px solid ${({ theme }) => theme.colors.disableFill};
  font-size: 14px;
  font-weight: 600;
  line-height: 20px;
  color: ${({ theme }) => theme.colors.emerald};

  > span:not(:first-child) {
    border-left: 1px solid ${({ theme }) => theme.colors.disableFill};
  }

  ${mobileStack}
`

const EmptyCard = styled.div`
  padding: 24px;
  border-radius: 16px;
  background: ${({ theme }) => theme.colors.surface1};
  border: 1px solid ${({ theme }) => theme.colors.disableFill};
  font-size: 14px;
  color: ${({ theme }) => theme.colors.textSecondary};
`

const ReceiptCard = styled.aside`
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 24px 24px 32px;
  margin-bottom: 10px;
  background: ${({ theme }) => theme.colors.surface1};
  border: 1px solid ${({ theme }) => theme.colors.defaultBorder};
  border-bottom: none;
  border-radius: 12px 12px 0 0;
  max-width: 100%;
  box-sizing: border-box;

  @media (max-width: 640px) {
    padding: 16px 16px 28px;
    gap: 12px;
  }
`

const ReceiptTitle = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  padding-bottom: 16px;
  border-bottom: 1px solid ${({ theme }) => theme.colors.disableFill};
  font-size: 16px;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.beyondGrey};
`

const ReceiptRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  gap: 12px;
  font-size: 14px;
  color: ${({ theme }) => theme.colors.textSecondary};

  strong {
    font-size: 16px;
    font-weight: 600;
    color: ${({ theme }) => theme.colors.beyondGrey};
    text-align: right;
    flex-shrink: 0;
  }

  @media (max-width: 640px) {
    flex-wrap: wrap;

    strong {
      font-size: 15px;
    }
  }
`

const ReceiptNote = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 8px;
  margin-top: 4px;
  font-size: 12px;
  line-height: 16px;
  color: ${({ theme }) => theme.colors.textSecondary};
`

const InfoDot = styled.span`
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: ${({ theme }) => theme.colors.turquoise};
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  margin-top: 1px;
`

const ReceiptJagged = styled.div`
  position: absolute;
  left: -1px;
  right: -1px;
  bottom: -12px;
  height: 12px;
  background: ${({ theme }) => theme.colors.surface1};
  background-image: ${({ theme }) =>
    `linear-gradient(135deg, ${theme.colors.surface0} 33.33%, ${theme.colors.surface1} 33.33% 66.66%, ${theme.colors.surface0} 66.66%), linear-gradient(45deg, ${theme.colors.surface0} 33.33%, ${theme.colors.surface1} 33.33% 66.66%, ${theme.colors.surface0} 66.66%)`};
  background-size: 16px 12px;
  background-position: 0 0, 8px 0;
  background-repeat: repeat-x;
  border-left: 1px solid ${({ theme }) => theme.colors.defaultBorder};
  border-right: 1px solid ${({ theme }) => theme.colors.defaultBorder};
`
