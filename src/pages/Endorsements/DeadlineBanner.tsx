import styled from 'styled-components'

import { BannerCalendarArt } from '@/components/brand/BannerCalendarArt'

interface DeadlineBannerProps {
  monthLabel: string
  deadline: string
  onAddLives?: () => void
}

export function DeadlineBanner({ monthLabel, deadline, onAddLives }: DeadlineBannerProps) {
  return (
    <Banner>
      <IllustrationWrap>
        <BannerCalendarArt />
      </IllustrationWrap>
      <Copy>
        <Title>Submit your endorsement for {monthLabel}!</Title>
        <Subtitle>
          Accepting any additions, edits and deletions for the month till{' '}
          <Deadline>{deadline}</Deadline>
        </Subtitle>
      </Copy>
      <Cta type="button" onClick={onAddLives}>
        Add/Edit/Delete Lives
      </Cta>
    </Banner>
  )
}

const Banner = styled.section`
  position: relative;
  display: flex;
  align-items: center;
  min-height: 101px;
  background: ${({ theme }) => theme.colors.planeGreenLight};
  border-bottom: 1px solid ${({ theme }) => theme.colors.defaultBorder};
  padding: 0 57px 0 24px;
  overflow: hidden;
`

const IllustrationWrap = styled.div`
  margin: -2px 0;
  flex-shrink: 0;
`

const Copy = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-left: 13px;
  min-width: 0;
  flex: 1;
`

const Title = styled.h2`
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  line-height: 24px;
  color: ${({ theme }) => theme.colors.emerald};
`

const Subtitle = styled.p`
  margin: 0;
  font-size: 14px;
  font-weight: 400;
  line-height: 20px;
  letter-spacing: 0.2px;
  color: ${({ theme }) => theme.colors.textPrimary};
`

const Deadline = styled.span`
  font-weight: 600;
  color: ${({ theme }) => theme.colors.textError};
`

const Cta = styled.button`
  flex-shrink: 0;
  height: 48px;
  padding: 14px 24px;
  border: none;
  border-radius: ${({ theme }) => theme.radii.md};
  background: ${({ theme }) => theme.colors.fillGreen};
  color: ${({ theme }) => theme.colors.emerald};
  font-size: 14px;
  font-weight: 500;
  line-height: 20px;
  letter-spacing: 0.2px;
  cursor: pointer;
  white-space: nowrap;
`
