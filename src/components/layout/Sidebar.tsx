import styled from 'styled-components'
import { NavLink } from 'react-router-dom'

import { assets } from '@/assets/figma'

const navItems = [
  { to: '/policies', label: 'Policies', icon: assets.navPolicies },
  { to: '/employees', label: 'Employees', icon: assets.navEmployees },
  { to: '/claim-details', label: 'Claim Details', icon: assets.navClaims },
  { to: '/claim-analytics', label: 'Claim Analytics', icon: assets.navAnalytics },
  { to: '/endorsements', label: 'Endorsements', icon: assets.navEndorsements },
  { to: '/cd-accounts', label: 'CD Accounts', icon: assets.navCd },
]

export function Sidebar({
  open = false,
  onClose,
}: {
  open?: boolean
  onClose?: () => void
}) {
  return (
    <Aside $open={open} aria-hidden={!open ? undefined : false}>
      {navItems.map(({ to, label, icon }) => (
        <Item key={to} to={to} onClick={onClose}>
          <ActiveBar />
          <ItemInner>
            <Icon src={icon} alt="" width={24} height={24} />
            <span>{label}</span>
          </ItemInner>
        </Item>
      ))}
    </Aside>
  )
}

const Aside = styled.aside<{ $open: boolean }>`
  width: ${({ theme }) => theme.layout.sidebarWidth};
  min-width: ${({ theme }) => theme.layout.sidebarWidth};
  background: ${({ theme }) => theme.colors.emerald};
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 20px 0;
  align-self: stretch;
  min-height: calc(100vh - ${({ theme }) => theme.layout.topNavHeight});

  @media (max-width: ${({ theme }) => theme.breakpoints.lg}) {
    position: fixed;
    top: ${({ theme }) => theme.layout.topNavHeight};
    bottom: 0;
    left: 0;
    z-index: 30;
    width: min(300px, 82vw);
    min-width: 0;
    min-height: 0;
    overflow-y: auto;
    transform: translateX(${({ $open }) => ($open ? '0' : '-105%')});
    visibility: ${({ $open }) => ($open ? 'visible' : 'hidden')};
    transition:
      transform 180ms ease,
      visibility 180ms ease;
    box-shadow: ${({ $open }) =>
      $open ? '12px 0 30px rgba(17, 24, 39, 0.18)' : 'none'};
  }
`

const ActiveBar = styled.span`
  width: 4px;
  height: 44px;
  border-radius: 0 100px 100px 0;
  background: transparent;
  flex-shrink: 0;
`

const ItemInner = styled.span`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 0;
`

const Icon = styled.img`
  width: 24px;
  height: 24px;
  object-fit: contain;
`

const Item = styled(NavLink)`
  display: flex;
  align-items: center;
  gap: 20px;
  width: 100%;
  text-decoration: none;
  color: rgba(255, 255, 255, 0.5);
  font-size: 14px;
  font-weight: 500;
  line-height: 18px;
  letter-spacing: -0.28px;
  padding-right: 16px;
  min-height: 48px;

  &.active {
    background: ${({ theme }) => theme.colors.planeGreenDark};
    color: ${({ theme }) => theme.colors.textTertiary};

    ${ActiveBar} {
      background: ${({ theme }) => theme.colors.surface1};
    }

  }
`
