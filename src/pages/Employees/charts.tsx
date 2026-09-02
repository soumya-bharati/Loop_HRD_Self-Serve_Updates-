import type { ReactNode } from 'react'
import styled from 'styled-components'

import type { RelationshipSlice } from '@/pages/Employees/stats'

export function EcardGauge({
  percent,
  withEcards,
  withEcardsPercent,
  inProgress,
  inProgressPercent,
  footer,
}: {
  percent: number
  withEcards: number
  withEcardsPercent: number
  inProgress: number
  inProgressPercent: number
  footer?: ReactNode
}) {
  const radius = 70
  const stroke = 16
  const circumference = Math.PI * radius
  const filled = (Math.max(0, Math.min(100, percent)) / 100) * circumference
  const progressFilled =
    (Math.max(0, Math.min(100, inProgressPercent)) / 100) * circumference

  return (
    <ChartCard>
      <ChartTitle>E-Card Status for Total Lives</ChartTitle>
      <GaugeBody>
        <GaugeWrap>
          <svg viewBox="0 0 180 110" width="180" height="110" aria-hidden>
            <path
              d="M 20 90 A 70 70 0 0 1 160 90"
              fill="none"
              stroke="#EEEEEE"
              strokeWidth={stroke}
              strokeLinecap="round"
            />
            <path
              d="M 20 90 A 70 70 0 0 1 160 90"
              fill="none"
              stroke="#FDD506"
              strokeWidth={stroke}
              strokeLinecap="round"
              strokeDasharray={`${filled + progressFilled} ${circumference}`}
            />
            <path
              d="M 20 90 A 70 70 0 0 1 160 90"
              fill="none"
              stroke="#025F4C"
              strokeWidth={stroke}
              strokeLinecap="round"
              strokeDasharray={`${filled} ${circumference}`}
            />
          </svg>
          <GaugeLabel>
            <strong>{percent}%</strong>
            <span>Lives</span>
          </GaugeLabel>
        </GaugeWrap>
        <ChipList>
          <InfoChip>
            <ChipLeft>
              <Swatch $color="#025F4C" />
              Lives with E-Cards
            </ChipLeft>
            <ChipRight>
              <strong>
                {withEcards.toLocaleString('en-IN')} lives
              </strong>{' '}
              <Muted>({withEcardsPercent}%)</Muted>
            </ChipRight>
          </InfoChip>
          <InfoChip>
            <ChipLeft>
              <Swatch $color="#FDD506" />
              Lives In Progress
            </ChipLeft>
            <ChipRight>
              <strong>
                {inProgress.toLocaleString('en-IN')} lives
              </strong>{' '}
              <Muted>({inProgressPercent}%)</Muted>
            </ChipRight>
          </InfoChip>
        </ChipList>
      </GaugeBody>
      {footer}
    </ChartCard>
  )
}

export function RelationshipDonut({
  totalLives,
  slices,
}: {
  totalLives: number
  slices: RelationshipSlice[]
}) {
  const size = 172
  const stroke = 22
  const radius = (size - stroke) / 2
  const circumference = 2 * Math.PI * radius
  let offset = 0

  return (
    <ChartCard>
      <ChartTitle>Relationship breakdown for Total Lives</ChartTitle>
      <DonutBody>
        <DonutWrap>
          <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden>
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              stroke="#EEEEEE"
              strokeWidth={stroke}
            />
            {slices.map((slice) => {
              const length =
                totalLives === 0
                  ? 0
                  : (slice.count / totalLives) * circumference
              const dashOffset = -offset
              offset += length
              return (
                <circle
                  key={slice.label}
                  cx={size / 2}
                  cy={size / 2}
                  r={radius}
                  fill="none"
                  stroke={slice.color}
                  strokeWidth={stroke}
                  strokeDasharray={`${length} ${circumference - length}`}
                  strokeDashoffset={dashOffset}
                  transform={`rotate(-90 ${size / 2} ${size / 2})`}
                />
              )
            })}
          </svg>
          <DonutCenter>
            <strong>{totalLives.toLocaleString('en-IN')}</strong>
            <span>Active Lives</span>
          </DonutCenter>
        </DonutWrap>
        <ChipList>
          {slices.map((slice) => (
            <InfoChip key={slice.label}>
              <ChipLeft>
                <Swatch $color={slice.color} />
                {slice.label}
              </ChipLeft>
              <ChipRight>
                <strong>
                  {slice.count.toLocaleString('en-IN')} lives
                </strong>{' '}
                <Muted>({slice.percent}%)</Muted>
              </ChipRight>
            </InfoChip>
          ))}
        </ChipList>
      </DonutBody>
    </ChartCard>
  )
}

const ChartCard = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
  flex: 1;
  min-width: 0;
  min-height: 312px;
  padding: 24px 20px 20px;
  box-sizing: border-box;
  border-radius: 8px;
  background: ${({ theme }) => theme.colors.surface1};
`

const ChartTitle = styled.h3`
  margin: 0;
  font-size: 14px;
  font-weight: 500;
  line-height: 20px;
  letter-spacing: 0.2px;
  color: ${({ theme }) => theme.colors.textSecondary};
`

const GaugeBody = styled.div`
  display: flex;
  align-items: center;
  gap: 24px;
  flex: 1;
  flex-wrap: wrap;
`

const DonutBody = styled.div`
  display: flex;
  align-items: center;
  gap: 24px;
  flex: 1;
  flex-wrap: wrap;
`

const GaugeWrap = styled.div`
  position: relative;
  width: 180px;
  height: 110px;
  flex-shrink: 0;
`

const GaugeLabel = styled.div`
  position: absolute;
  left: 50%;
  top: 44%;
  transform: translateX(-50%);
  display: flex;
  flex-direction: column;
  align-items: center;
  line-height: 1.15;

  strong {
    font-size: 24px;
    font-weight: 500;
    line-height: 28px;
    color: ${({ theme }) => theme.colors.textPrimary};
  }

  span {
    font-size: 12px;
    letter-spacing: 0.2px;
    color: ${({ theme }) => theme.colors.textPrimary};
  }
`

const DonutWrap = styled.div`
  position: relative;
  width: 172px;
  height: 172px;
  flex-shrink: 0;
`

const DonutCenter = styled.div`
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  pointer-events: none;
  gap: 4px;

  strong {
    font-size: 24px;
    font-weight: 500;
    line-height: 28px;
    color: ${({ theme }) => theme.colors.textPrimary};
  }

  span {
    font-size: 12px;
    letter-spacing: 0.2px;
    color: ${({ theme }) => theme.colors.textPrimary};
  }
`

const ChipList = styled.ul`
  display: flex;
  flex-direction: column;
  gap: 14px;
  margin: 0;
  padding: 0;
  list-style: none;
  flex: 1;
  min-width: 220px;
`

const InfoChip = styled.li`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 4px 12px;
  border-radius: 43px;
  background: ${({ theme }) => theme.colors.surface0};
  font-size: 12px;
  color: ${({ theme }) => theme.colors.textPrimary};
`

const ChipLeft = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
`

const ChipRight = styled.span`
  font-size: 14px;
  font-weight: 500;
  white-space: nowrap;

  strong {
    font-weight: 500;
  }
`

const Muted = styled.span`
  font-weight: 400;
  color: ${({ theme }) => theme.colors.textSecondary};
`

const Swatch = styled.span<{ $color: string }>`
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: ${({ $color }) => $color};
  flex-shrink: 0;
`
