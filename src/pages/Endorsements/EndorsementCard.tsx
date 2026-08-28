import styled from 'styled-components'

import { assets } from '@/assets/figma'
import { ChevronIcon } from '@/components/icons/ChevronIcon'
import type { EndorsementRecord } from '@/data/endorsements'

interface EndorsementCardProps {
  endorsement: EndorsementRecord
}

export function EndorsementCard({ endorsement }: EndorsementCardProps) {
  const logo = endorsement.insurerLogo === 'digit' ? assets.digitLogo : assets.iciciLogo

  return (
    <Card>
      <Header>
        <Identity>
          <LogoWrap>
            <Logo src={logo} alt="" />
          </LogoWrap>
          <div>
            <PolicyName>{endorsement.policyName}</PolicyName>
            <Meta>
              <span>{endorsement.insurerName}</span>
              <Sep src={assets.sepDot} alt="" width={6} height={6} />
              <span>{endorsement.policyLabel}</span>
              <Sep src={assets.sepDot} alt="" width={6} height={6} />
              <span>Policy No: {endorsement.policyNumber}</span>
            </Meta>
          </div>
        </Identity>
        <TrackButton type="button">
          Track Status
          <ChevronIcon direction="right" size={20} />
        </TrackButton>
      </Header>

      <Divider />

      <Stats>
        <Stat>
          <MetricIcon src={assets.metricPeople} alt="" width={28} height={28} />
          <StatCopy>
            <StatLabel>Total Life Count</StatLabel>
            <StatValue>{endorsement.totalLifeCount}</StatValue>
          </StatCopy>
        </Stat>

        <Stat>
          <MetricIcon src={assets.metricCost} alt="" width={28} height={28} />
          <StatCopy>
            <StatLabel>Endorsement Cost</StatLabel>
            <CostRow>
              <StatValue>
                {endorsement.costLabel}
                {endorsement.costNote ? <Note> {endorsement.costNote}</Note> : null}
              </StatValue>
              {endorsement.showCostInfo ? (
                <Info aria-hidden>
                  <img src={assets.infoCircle} alt="" width={17} height={17} />
                  <img src={assets.infoMark} alt="" width={2} height={10} />
                </Info>
              ) : null}
            </CostRow>
          </StatCopy>
        </Stat>

        <Stat>
          <MetricIcon src={assets.metricCalendar} alt="" width={28} height={28} />
          <StatCopy>
            <StatLabel>Lives last updated on</StatLabel>
            <StatValue>{endorsement.livesLastUpdatedOn}</StatValue>
          </StatCopy>
        </Stat>

        <Stat>
          {endorsement.statusTone === 'accepting' ? (
            <YellowHourglass aria-hidden>
              <img src={assets.hourglassYellowBg} alt="" width={28} height={28} />
              <img src={assets.hourglassYellowIcon} alt="" width={20} height={20} />
            </YellowHourglass>
          ) : (
            <MetricIcon src={assets.metricHourglass} alt="" width={28} height={28} />
          )}
          <StatCopy>
            <StatLabel>Current Status</StatLabel>
            <StatValue>{endorsement.currentStatus}</StatValue>
          </StatCopy>
        </Stat>
      </Stats>
    </Card>
  )
}

const Card = styled.article`
  background: ${({ theme }) => theme.colors.surface1};
  display: flex;
  flex-direction: column;
  gap: 36px;
  padding: 36px ${({ theme }) => theme.layout.contentPadX};
  width: 100%;

  @media (max-width: 900px) {
    gap: 28px;
    padding: 28px 24px;
  }

  @media (max-width: 720px) {
    gap: 24px;
    padding: 24px 20px;
  }

  @media (max-width: 560px) {
    gap: 20px;
    padding: 20px 16px;
  }
`

const Header = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;

  @media (max-width: 900px) {
    flex-wrap: wrap;
    align-items: flex-start;
  }

  @media (max-width: 720px) {
    flex-direction: column;
    align-items: stretch;
    gap: 12px;
  }
`

const Identity = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
  min-width: 0;
`

const LogoWrap = styled.div`
  width: 48px;
  height: 48px;
  border-radius: ${({ theme }) => theme.radii.sm};
  border: 0.8px solid ${({ theme }) => theme.colors.defaultBorder};
  overflow: hidden;
  flex-shrink: 0;
  background: ${({ theme }) => theme.colors.surface1};
`

const Logo = styled.img`
  width: 100%;
  height: 100%;
  object-fit: cover;
`

const PolicyName = styled.h3`
  margin: 0 0 8px;
  font-size: 16px;
  font-weight: 600;
  line-height: 24px;
  letter-spacing: 0.2px;
  color: ${({ theme }) => theme.colors.textPrimary};
`

const Meta = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
  font-size: 14px;
  font-weight: 400;
  line-height: 20px;
  letter-spacing: 0.2px;
  color: ${({ theme }) => theme.colors.textSecondary};
`

const Sep = styled.img`
  width: 6px;
  height: 6px;
`

const TrackButton = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  height: 48px;
  padding: 14px 24px;
  border: 1px solid ${({ theme }) => theme.colors.emerald};
  border-radius: ${({ theme }) => theme.radii.md};
  background: ${({ theme }) => theme.colors.surface1};
  color: ${({ theme }) => theme.colors.emerald};
  font-size: 14px;
  font-weight: 500;
  line-height: 20px;
  letter-spacing: 0.2px;
  cursor: pointer;
  white-space: nowrap;
  flex-shrink: 0;

  @media (max-width: 900px) {
    margin-left: auto;
  }

  @media (max-width: 720px) {
    margin-left: 0;
    width: 100%;
  }

  @media (max-width: 560px) {
    height: 44px;
    padding: 12px 16px;
  }
`

const Divider = styled.div`
  height: 1px;
  width: 100%;
  background: ${({ theme }) => theme.colors.defaultBorder};
`

const Stats = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 40px;
  flex-wrap: wrap;

  @media (max-width: 900px) {
    gap: 24px 32px;
  }

  @media (max-width: 720px) {
    gap: 20px;
  }

  @media (max-width: 560px) {
    flex-direction: column;
    gap: 16px;
  }
`

const Stat = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;

  @media (max-width: 900px) {
    flex: 1 1 calc(50% - 16px);
    min-width: 180px;
  }

  @media (max-width: 560px) {
    flex: none;
    width: 100%;
    min-width: 0;
  }
`

const MetricIcon = styled.img`
  width: 28px;
  height: 28px;
  flex-shrink: 0;
`

const YellowHourglass = styled.span`
  position: relative;
  width: 28px;
  height: 28px;
  flex-shrink: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;

  img:first-child {
    position: absolute;
    inset: 0;
    width: 28px;
    height: 28px;
  }

  img:last-child {
    position: relative;
    width: 20px;
    height: 20px;
  }
`

const StatCopy = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
`

const StatLabel = styled.div`
  font-size: 12px;
  font-weight: 400;
  line-height: 18px;
  letter-spacing: 0.2px;
  color: ${({ theme }) => theme.colors.textPrimary};
`

const StatValue = styled.div`
  font-size: 16px;
  font-weight: 500;
  line-height: 24px;
  letter-spacing: 0.2px;
  color: ${({ theme }) => theme.colors.textPrimary};
`

const Note = styled.span`
  font-size: 12px;
  font-weight: 400;
  line-height: 18px;
  color: ${({ theme }) => theme.colors.textSecondary};
`

const CostRow = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
`

const Info = styled.span`
  position: relative;
  width: 20px;
  height: 20px;
  display: inline-flex;
  align-items: center;
  justify-content: center;

  img:last-child {
    position: absolute;
  }
`
