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

export function Sidebar() {
  return (
    <Aside>
      {navItems.map(({ to, label, icon }) => (
        <Item key={to} to={to}>
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

const Aside = styled.aside`
  width: ${({ theme }) => theme.layout.sidebarWidth};
  min-width: ${({ theme }) => theme.layout.sidebarWidth};
  background: ${({ theme }) => theme.colors.emerald};
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 20px 0;
  align-self: stretch;
  min-height: calc(100vh - ${({ theme }) => theme.layout.topNavHeight});
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

  &.active {
    background: ${({ theme }) => theme.colors.planeGreenDark};
    color: ${({ theme }) => theme.colors.textTertiary};

    ${ActiveBar} {
      background: ${({ theme }) => theme.colors.surface1};
    }

  }
`
