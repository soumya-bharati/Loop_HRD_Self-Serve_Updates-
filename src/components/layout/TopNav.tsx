import styled from 'styled-components'

import { assets } from '@/assets/figma'
import { LoopLogo } from '@/components/brand/LoopLogo'
import { ChevronIcon } from '@/components/icons/ChevronIcon'
import { endorsementsSummary } from '@/data/endorsements'

export function TopNav({
  mobileNavOpen,
  onMenuClick,
}: {
  mobileNavOpen: boolean
  onMenuClick: () => void
}) {
  return (
    <Bar>
      <LogoCell>
        <MenuButton
          type="button"
          aria-label={mobileNavOpen ? 'Close navigation' : 'Open navigation'}
          aria-expanded={mobileNavOpen}
          onClick={onMenuClick}
        >
          <MenuLine />
          <MenuLine />
          <MenuLine />
        </MenuButton>
        <LoopLogo />
      </LogoCell>

      <RightNest>
        <SearchArea>
          <SearchFrame>
            <Placeholder>Search any employee for claims, e-cards, etc</Placeholder>
            <SearchButton type="button" aria-label="Search">
              <SearchIcon aria-hidden>
                <img src={assets.searchCircle} alt="" width={18} height={18} />
                <Handle src={assets.searchHandle} alt="" width={6} height={6} />
              </SearchIcon>
            </SearchButton>
          </SearchFrame>
        </SearchArea>

        <AlertsButton type="button">
          <AlertsContent>
            <AlertsLabel>Alerts (03)</AlertsLabel>
            <AlertIcon aria-hidden>
              <Triangle src={assets.alertTriangle} alt="" />
              <Mark src={assets.alertMark} alt="" />
            </AlertIcon>
          </AlertsContent>
        </AlertsButton>

        <Profile type="button">
          <Avatar src={assets.avatar} alt="" width={32} height={32} />
          <span>{endorsementsSummary.profileName}</span>
          <ChevronIcon direction="down" size={20} />
        </Profile>
      </RightNest>
    </Bar>
  )
}

const Bar = styled.header`
  height: ${({ theme }) => theme.layout.topNavHeight};
  background: ${({ theme }) => theme.colors.surface1};
  box-shadow: ${({ theme }) => theme.shadows.nav};
  display: flex;
  align-items: center;
  width: 100%;
  position: sticky;
  top: 0;
  z-index: 20;
`

const LogoCell = styled.div`
  width: ${({ theme }) => theme.layout.sidebarWidth};
  min-width: ${({ theme }) => theme.layout.sidebarWidth};
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  border-right: 1px solid ${({ theme }) => theme.colors.disableFill};

  @media (max-width: ${({ theme }) => theme.breakpoints.lg}) {
    width: auto;
    min-width: auto;
    gap: 14px;
    padding: 0 16px;
    border-right: 0;
  }
`

const MenuButton = styled.button`
  display: none;

  @media (max-width: ${({ theme }) => theme.breakpoints.lg}) {
    display: flex;
    width: 44px;
    height: 44px;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 5px;
    padding: 0;
    border: 0;
    border-radius: ${({ theme }) => theme.radii.sm};
    background: transparent;
    cursor: pointer;
  }
`

const MenuLine = styled.span`
  width: 20px;
  height: 2px;
  border-radius: 2px;
  background: ${({ theme }) => theme.colors.emerald};
`

const RightNest = styled.div`
  flex: 1;
  min-width: 0;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 24px;
  padding-right: 56px;
  padding-left: 56px;

  @media (max-width: ${({ theme }) => theme.breakpoints.xl}) {
    gap: 16px;
    padding-right: ${({ theme }) => theme.layout.contentPadXTablet};
    padding-left: ${({ theme }) => theme.layout.contentPadXTablet};
  }

  @media (max-width: ${({ theme }) => theme.breakpoints.lg}) {
    gap: 10px;
    padding-right: 16px;
    padding-left: 0;
  }
`

const SearchArea = styled.div`
  flex: 1;
  min-width: 0;
  display: flex;
  align-items: center;

  @media (max-width: ${({ theme }) => theme.breakpoints.md}) {
    justify-content: flex-end;
    flex: 0 0 44px;
  }
`

const SearchFrame = styled.div`
  position: relative;
  width: min(575px, 100%);
  height: 40px;
  background: ${({ theme }) => theme.colors.surface0};
  border: 1px solid ${({ theme }) => theme.colors.defaultBorder};
  border-radius: ${({ theme }) => theme.radii.sm};
  overflow: hidden;

  @media (max-width: ${({ theme }) => theme.breakpoints.md}) {
    width: 44px;
    height: 44px;
    border: 0;
    background: transparent;
  }
`

const Placeholder = styled.span`
  position: absolute;
  left: 15px;
  top: 50%;
  transform: translateY(-50%);
  color: ${({ theme }) => theme.colors.textSecondary};
  font-size: 14px;
  line-height: 20px;
  letter-spacing: 0.2px;
  white-space: nowrap;
  pointer-events: none;

  @media (max-width: ${({ theme }) => theme.breakpoints.md}) {
    display: none;
  }
`

const SearchButton = styled.button`
  position: absolute;
  right: -1px;
  top: 50%;
  transform: translateY(-50%);
  width: 56px;
  height: 48px;
  border: none;
  background: ${({ theme }) => theme.colors.fillGreen};
  border-radius: 0 12px 12px 0;
  display: grid;
  place-items: center;
  cursor: pointer;

  @media (max-width: ${({ theme }) => theme.breakpoints.md}) {
    inset: 0;
    width: 44px;
    height: 44px;
    transform: none;
    border-radius: ${({ theme }) => theme.radii.sm};
  }
`

const SearchIcon = styled.span`
  position: relative;
  width: 24px;
  height: 24px;
  display: grid;
  place-items: center;
`

const Handle = styled.img`
  position: absolute;
  right: 2px;
  bottom: 2px;
`

const AlertsButton = styled.button`
  display: inline-flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 36px;
  padding: 8px 16px;
  border: none;
  border-radius: ${({ theme }) => theme.radii.sm};
  background: ${({ theme }) => theme.colors.fillRed};
  cursor: pointer;
  flex-shrink: 0;
  font-family: ${({ theme }) => theme.fontFamily};

  @media (max-width: ${({ theme }) => theme.breakpoints.sm}) {
    width: 44px;
    height: 44px;
    padding: 0;
  }
`

const AlertsContent = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
`

const AlertsLabel = styled.span`
  color: ${({ theme }) => theme.colors.textTertiary};
  font-size: 12px;
  font-weight: 500;
  line-height: 18px;
  letter-spacing: 0.2px;
  white-space: nowrap;

  @media (max-width: ${({ theme }) => theme.breakpoints.sm}) {
    display: none;
  }
`

/** 16×16 icon — triangle + bang positioned to Figma insets */
const AlertIcon = styled.span`
  position: relative;
  width: 16px;
  height: 16px;
  flex-shrink: 0;
  display: block;
  overflow: hidden;
`

const Triangle = styled.img`
  position: absolute;
  inset: 12.5% 8.33% 14.58% 8.33%;
  width: auto;
  height: auto;
  max-width: none;
  display: block;
`

const Mark = styled.img`
  position: absolute;
  top: 45.83%;
  bottom: 29.17%;
  left: 50%;
  width: 1.5px;
  height: auto;
  transform: translateX(-50%);
  display: block;
`

const Profile = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 10px;
  border: none;
  background: transparent;
  cursor: pointer;
  color: ${({ theme }) => theme.colors.beyondGrey};
  font-size: 14px;
  font-weight: 500;
  line-height: 20px;
  letter-spacing: 0.2px;
  flex-shrink: 0;
  padding: 0;
  font-family: ${({ theme }) => theme.fontFamily};

  span {
    white-space: nowrap;
  }

  @media (max-width: ${({ theme }) => theme.breakpoints.md}) {
    gap: 0;

    span,
    svg {
      display: none;
    }
  }
`

const Avatar = styled.img`
  width: 32px;
  height: 32px;
  border-radius: 4px;
  object-fit: cover;
`
