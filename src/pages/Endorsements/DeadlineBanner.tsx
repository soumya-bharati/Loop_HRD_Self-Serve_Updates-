import { useNavigate } from 'react-router-dom'
import styled from 'styled-components'

import { BannerCalendarArt } from '@/components/brand/BannerCalendarArt'
import { BannerPersonDeskArt } from '@/components/brand/BannerPersonDeskArt'

interface DeadlineBannerProps {
  monthLabel: string
  deadline: string
  /** Employees banner is informational. Default is Endorsements with a Manage Lives CTA. */
  variant?: 'manage-lives' | 'employees'
}

export function DeadlineBanner({
  monthLabel,
  deadline,
  variant = 'manage-lives',
}: DeadlineBannerProps) {
  const navigate = useNavigate()
  const isEmployees = variant === 'employees'

  return (
    <Banner $variant={variant}>
      {isEmployees ? (
        <Lead>
          <IllustrationWrap $compact>
            <BannerPersonDeskArt />
          </IllustrationWrap>
          <Copy $variant="employees">
            <Title $variant="employees">Manage employees, your way</Title>
            <Subtitle $variant="employees">
              Add a single employee when you need to, or use bulk actions to add
              or remove multiple lives at once.
            </Subtitle>
          </Copy>
        </Lead>
      ) : (
        <>
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
          <Cta type="button" onClick={() => navigate('/manage-lives')}>
            Manage Lives
          </Cta>
        </>
      )}
    </Banner>
  )
}

const Banner = styled.section<{ $variant?: 'manage-lives' | 'employees' }>`
  position: relative;
  display: flex;
  align-items: center;
  justify-content: ${({ $variant }) =>
    $variant === 'employees' ? 'space-between' : 'flex-start'};
  gap: ${({ $variant }) => ($variant === 'employees' ? '24px' : '0')};
  min-height: ${({ $variant }) => ($variant === 'employees' ? '0' : '101px')};
  background: ${({ theme }) => theme.colors.planeGreenLight};
  border-bottom: 1px solid ${({ theme }) => theme.colors.defaultBorder};
  padding: ${({ $variant }) =>
    $variant === 'employees' ? '16px 56px' : '0 57px 0 4px'};
  overflow: ${({ $variant }) =>
    $variant === 'employees' ? 'visible' : 'hidden'};
  width: 100%;
  box-sizing: border-box;

  @media (max-width: 1100px) {
    flex-wrap: wrap;
    gap: 12px 16px;
    padding: 16px 24px;
    min-height: 0;
  }

  @media (max-width: 720px) {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
    padding: 16px 20px;
  }

  @media (max-width: 560px) {
    padding: 14px 16px;
    gap: 10px;
  }
`

const Lead = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 16px;
  min-width: 0;
  flex: 1;
  max-width: 560px;

  @media (max-width: 1100px) {
    flex: 1 1 280px;
    max-width: none;
  }

  @media (max-width: 720px) {
    flex: none;
    width: 100%;
  }
`

const IllustrationWrap = styled.div<{ $compact?: boolean }>`
  margin: ${({ $compact }) => ($compact ? '0' : '-2px 0')};
  flex-shrink: 0;

  @media (max-width: 720px) {
    margin: 0;
  }

  @media (max-width: 560px) {
    display: none;
  }
`

const Copy = styled.div<{ $variant?: 'manage-lives' | 'employees' }>`
  display: flex;
  flex-direction: column;
  gap: ${({ $variant }) => ($variant === 'employees' ? '4px' : '6px')};
  margin-left: 0;
  min-width: 0;
  flex: 1;
  max-width: ${({ $variant }) =>
    $variant === 'employees' ? 'none' : '498px'};

  @media (max-width: 1100px) {
    flex: 1 1 220px;
  }

  @media (max-width: 720px) {
    flex: none;
    width: 100%;
    max-width: none;
  }
`

const Title = styled.h2<{ $variant?: 'manage-lives' | 'employees' }>`
  margin: 0;
  font-size: ${({ $variant }) => ($variant === 'employees' ? '16px' : '18px')};
  font-weight: ${({ $variant }) => ($variant === 'employees' ? 500 : 600)};
  line-height: 24px;
  letter-spacing: ${({ $variant }) =>
    $variant === 'employees' ? '0.2px' : 'normal'};
  color: ${({ theme, $variant }) =>
    $variant === 'employees'
      ? theme.colors.textPrimary
      : theme.colors.emerald};
`

const Subtitle = styled.p<{ $variant?: 'manage-lives' | 'employees' }>`
  margin: 0;
  font-size: ${({ $variant }) => ($variant === 'employees' ? '12px' : '14px')};
  font-weight: 400;
  line-height: ${({ $variant }) =>
    $variant === 'employees' ? '18px' : '20px'};
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
  font: inherit;
  font-size: 14px;
  font-weight: 500;
  line-height: 20px;
  letter-spacing: 0.2px;
  cursor: pointer;
  white-space: nowrap;

  @media (max-width: 720px) {
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  @media (max-width: 560px) {
    height: 44px;
    padding: 12px 16px;
    white-space: normal;
    text-align: center;
  }
`
