import { useNavigate } from 'react-router-dom'
import styled from 'styled-components'

import { BannerCalendarArt } from '@/components/brand/BannerCalendarArt'
import { launchWizardPath } from '@/pages/ManageLives/launchWizard'

interface DeadlineBannerProps {
  monthLabel: string
  deadline: string
  /** Figma 18:22166 — dual CTAs for Employees. Default is Endorsements single CTA. */
  variant?: 'manage-lives' | 'employees'
  entityId?: string
  dealId?: string
}

export function DeadlineBanner({
  monthLabel,
  deadline,
  variant = 'manage-lives',
  entityId = 'symphony-eyc',
  dealId,
}: DeadlineBannerProps) {
  const navigate = useNavigate()

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

      {variant === 'employees' ? (
        <Actions>
          <Cta
            type="button"
            onClick={() => navigate('/manage-lives')}
          >
            Add/Deletes Lives in Bulk
          </Cta>
          <Or>or</Or>
          <Cta
            type="button"
            onClick={() =>
              navigate(
                launchWizardPath({
                  action: 'add',
                  method: 'single',
                  entity: entityId,
                  deal: dealId,
                }),
              )
            }
          >
            Add Single Employee
          </Cta>
        </Actions>
      ) : (
        <Cta type="button" onClick={() => navigate('/manage-lives')}>
          Manage Lives
        </Cta>
      )}
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
  padding: 0 57px 0 4px;
  overflow: hidden;
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

const IllustrationWrap = styled.div`
  margin: -2px 0;
  flex-shrink: 0;

  @media (max-width: 720px) {
    margin: 0;
  }

  @media (max-width: 560px) {
    display: none;
  }
`

const Copy = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-left: 0;
  min-width: 0;
  flex: 1;
  max-width: 498px;

  @media (max-width: 1100px) {
    flex: 1 1 220px;
  }

  @media (max-width: 720px) {
    flex: none;
    width: 100%;
    max-width: none;
  }
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

const Actions = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
  flex-shrink: 0;
  margin-left: auto;

  @media (max-width: 1100px) {
    width: 100%;
    margin-left: 0;
    justify-content: flex-end;
    flex-wrap: wrap;
  }

  @media (max-width: 720px) {
    flex-direction: column;
    align-items: stretch;
    gap: 10px;
  }
`

const Or = styled.span`
  font-size: 18px;
  font-weight: 500;
  line-height: 24px;
  color: ${({ theme }) => theme.colors.textPrimary};
  flex-shrink: 0;

  @media (max-width: 720px) {
    text-align: center;
    font-size: 14px;
  }
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
