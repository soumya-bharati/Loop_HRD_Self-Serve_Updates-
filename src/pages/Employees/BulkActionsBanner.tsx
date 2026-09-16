import { useNavigate } from 'react-router-dom'
import styled from 'styled-components'

import { assets } from '@/assets/figma'

export function BulkActionsBanner() {
  const navigate = useNavigate()

  return (
    <Banner>
      <Lead>
        <IllustrationSlot aria-hidden>
          <Art
            src={assets.bannerManageLives}
            alt=""
            width={117}
            height={80}
          />
        </IllustrationSlot>
        <Copy>
          <Title>Manage lives, your way</Title>
          <Subtitle>Add or remove multiple lives in one go.</Subtitle>
        </Copy>
      </Lead>
      <Cta type="button" onClick={() => navigate('/manage-lives')}>
        Add/Deletes Lives in Bulk
      </Cta>
    </Banner>
  )
}

const Banner = styled.section`
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-shrink: 0;
  width: 640px;
  max-width: 100%;
  height: 80px;
  padding: 16px 16px 16px 40px;
  border-radius: 16px;
  background: ${({ theme }) => theme.colors.planeGreenLight};
  box-sizing: border-box;
  overflow: hidden;

  @media (max-width: ${({ theme }) => theme.breakpoints.lg}) {
    width: 100%;
    height: auto;
    min-height: 80px;
    flex-wrap: wrap;
    gap: 12px;
    padding: 16px;
  }
`

const Lead = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
  width: 320px;
  max-width: 100%;
`

const IllustrationSlot = styled.div`
  position: relative;
  width: 73px;
  height: 80px;
  margin: -16px 0;
  flex-shrink: 0;
  overflow: visible;
`

const Art = styled.img`
  position: absolute;
  left: -40px;
  top: 0;
  display: block;
  width: 117px;
  height: 80px;
  max-width: none;
`

const Copy = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
  flex: 1;
`

const Title = styled.h2`
  margin: 0;
  font-size: 16px;
  font-weight: 500;
  line-height: 24px;
  letter-spacing: 0.2px;
  color: ${({ theme }) => theme.colors.textPrimary};
  white-space: nowrap;
`

const Subtitle = styled.p`
  margin: 0;
  font-size: 12px;
  font-weight: 400;
  line-height: 18px;
  letter-spacing: 0.2px;
  color: ${({ theme }) => theme.colors.textPrimary};
`

const Cta = styled.button`
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  height: 48px;
  padding: 14px 24px;
  border: 1px solid ${({ theme }) => theme.colors.emerald};
  border-radius: ${({ theme }) => theme.radii.md};
  background: transparent;
  color: ${({ theme }) => theme.colors.emerald};
  font: inherit;
  font-size: 14px;
  font-weight: 500;
  line-height: 20px;
  letter-spacing: 0.2px;
  cursor: pointer;
  white-space: nowrap;
  box-sizing: border-box;

  @media (max-width: ${({ theme }) => theme.breakpoints.md}) {
    width: 100%;
  }
`
