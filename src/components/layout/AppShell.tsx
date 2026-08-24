import { Outlet } from 'react-router-dom'
import styled from 'styled-components'

import { Sidebar } from '@/components/layout/Sidebar'
import { TopNav } from '@/components/layout/TopNav'

export function AppShell() {
  return (
    <Shell>
      <TopNav />
      <Body>
        <Sidebar />
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
  background: ${({ theme }) => theme.colors.surface0};
`
