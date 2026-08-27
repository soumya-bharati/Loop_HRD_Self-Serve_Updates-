import { Navigate, Route, Routes } from 'react-router-dom'
import { ThemeProvider } from 'styled-components'

import { AppShell } from '@/components/layout/AppShell'
import { EndorsementsPage } from '@/pages/Endorsements'
import { LivesWizardPage } from '@/pages/LivesWizard'
import { PlaceholderPage } from '@/pages/PlaceholderPage'
import { ProtoConfigProvider } from '@/proto/ProtoConfigContext'
import { GlobalStyle } from '@/styles/GlobalStyle'
import { theme } from '@/theme'

function App() {
  return (
    <ThemeProvider theme={theme}>
      <GlobalStyle />
      <ProtoConfigProvider>
        <Routes>
          <Route element={<AppShell />}>
            <Route index element={<Navigate to="/endorsements" replace />} />
            <Route path="endorsements" element={<EndorsementsPage />} />
            <Route
              path="endorsements/lives/:action"
              element={<LivesWizardPage />}
            />
            <Route path="policies" element={<PlaceholderPage title="Policies" />} />
            <Route path="employees" element={<PlaceholderPage title="Employees" />} />
            <Route path="claim-details" element={<PlaceholderPage title="Claim Details" />} />
            <Route path="claim-analytics" element={<PlaceholderPage title="Claim Analytics" />} />
            <Route path="cd-accounts" element={<PlaceholderPage title="CD Accounts" />} />
            <Route path="*" element={<Navigate to="/endorsements" replace />} />
          </Route>
        </Routes>
      </ProtoConfigProvider>
    </ThemeProvider>
  )
}

export default App
