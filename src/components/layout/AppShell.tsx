import { useEffect, useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import styled from 'styled-components'

import { Sidebar } from '@/components/layout/Sidebar'
import { TopNav } from '@/components/layout/TopNav'
import { ProtoControlBar } from '@/proto/ProtoControlBar'

export function AppShell() {
  const { pathname, search } = useLocation()
  const [mobileNavOpen, setMobileNavOpen] = useState(false)
  const normalized = pathname.replace(/\/+$/, '') || '/'
  const params = new URLSearchParams(search)
  // These setup screens provide their own full-bleed guided-flow chrome.
  const method = params.get('method') ?? ''
  const isSingleMethod = method === 'single' || method === 'single-dependant'
  const isGuidedSetup =
    normalized === '/manage-lives' ||
    (normalized === '/endorsements/lives/add' && method === 'single') ||
    // Edit / add-dependant / delete are guided once they target one employee.
    (/^\/endorsements\/lives\/(add|edit|delete)$/.test(normalized) &&
      isSingleMethod &&
      Boolean(params.get('employee')))
  const showProtoBar =
    normalized === '/endorsements' ||
    normalized === '/manage-lives' ||
    normalized.startsWith('/manage-lives/')

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
    <Shell $fillViewport={isGuidedSetup}>
      {showProtoBar ? <ProtoControlBar /> : null}
      {isGuidedSetup ? (
        <Main $fillViewport>
          <Outlet />
        </Main>
      ) : (
        <>
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
        </>
      )}
    </Shell>
  )
}

const Shell = styled.div<{ $fillViewport?: boolean }>`
  /* Height available to guided-flow chrome, which the top nav eats into. */
  --guided-viewport: ${({ $fillViewport, theme }) =>
    $fillViewport ? '100vh' : `calc(100vh - ${theme.layout.topNavHeight})`};

  ${({ $fillViewport }) =>
    $fillViewport
      ? `
    display: flex;
    height: 100vh;
    flex-direction: column;
    overflow: hidden;
  `
      : ''}
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

const Main = styled.main<{ $fillViewport?: boolean }>`
  flex: 1;
  min-width: 0;
  max-width: 100%;
  background: ${({ theme }) => theme.colors.surface0};
  ${({ $fillViewport }) =>
    $fillViewport
      ? `
    min-height: 0;
    overflow: hidden;
  `
      : ''}
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
