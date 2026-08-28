import { useEffect, useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import styled from 'styled-components'

import { Sidebar } from '@/components/layout/Sidebar'
import { TopNav } from '@/components/layout/TopNav'
import { ProtoControlBar } from '@/proto/ProtoControlBar'

export function AppShell() {
  const { pathname } = useLocation()
  const [mobileNavOpen, setMobileNavOpen] = useState(false)
  const onEndorsementsDashboard = pathname.replace(/\/+$/, '') === '/endorsements'

  useEffect(() => setMobileNavOpen(false), [pathname])

  useEffect(() => {
    if (!mobileNavOpen) return
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setMobileNavOpen(false)
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [mobileNavOpen])

  return (
    <Shell>
      {onEndorsementsDashboard ? <ProtoControlBar /> : null}
      <TopNav
        mobileNavOpen={mobileNavOpen}
        onMenuClick={() => setMobileNavOpen((current) => !current)}
      />
      <Body>
        <Sidebar open={mobileNavOpen} onClose={() => setMobileNavOpen(false)} />
        {mobileNavOpen ? (
          <Backdrop
            type="button"
            aria-label="Close navigation"
            onClick={() => setMobileNavOpen(false)}
          />
        ) : null}
        <Main>
          <Outlet />
        </Main>
      </Body>
    </Shell>
  )
}

const Shell = styled.div`
  min-height: 100vh;
  background: ${({ theme }) => theme.colors.surface0};
  color: ${({ theme }) => theme.colors.textPrimary};
  font-family: ${({ theme }) => theme.fontFamily};
`

const Body = styled.div`
  display: flex;
  align-items: flex-start;
  min-height: calc(100vh - ${({ theme }) => theme.layout.topNavHeight});
`

const Main = styled.main`
  flex: 1;
  min-width: 0;
  max-width: 100%;
  background: ${({ theme }) => theme.colors.surface0};
`

const Backdrop = styled.button`
  display: none;

  @media (max-width: ${({ theme }) => theme.breakpoints.lg}) {
    position: fixed;
    inset: ${({ theme }) => theme.layout.topNavHeight} 0 0;
    z-index: 29;
    display: block;
    padding: 0;
    border: 0;
    background: rgba(17, 24, 39, 0.42);
  }
`
