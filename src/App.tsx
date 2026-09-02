import { Navigate, Route, Routes } from 'react-router-dom'
import { ThemeProvider } from 'styled-components'

import { AppShell } from '@/components/layout/AppShell'
import { EndorsementsPage } from '@/pages/Endorsements'
import { LivesWizardPage } from '@/pages/LivesWizard'
import { ManageLivesPage } from '@/pages/ManageLives'
import { AddEmployeeRedirect } from '@/pages/ManageLives/AddEmployeeRedirect'
import { BulkUploadPage } from '@/pages/ManageLives/BulkUploadPage'
import { EmployeeDetailsPage } from '@/pages/ManageLives/EmployeeDetailsPage'
import { PendingChangesProvider } from '@/pages/ManageLives/PendingChangesContext'
import { ReviewChangesPage } from '@/pages/ManageLives/ReviewChangesPage'
import { EmployeesPage } from '@/pages/Employees'
import { PlaceholderPage } from '@/pages/PlaceholderPage'
import { ProtoConfigProvider } from '@/proto/ProtoConfigContext'
import { GlobalStyle } from '@/styles/GlobalStyle'
import { theme } from '@/theme'

function App() {
  return (
    <ThemeProvider theme={theme}>
      <GlobalStyle />
      <ProtoConfigProvider>
        <PendingChangesProvider>
          <Routes>
            <Route element={<AppShell />}>
              <Route index element={<Navigate to="/endorsements" replace />} />
              <Route path="endorsements" element={<EndorsementsPage />} />
              <Route
                path="endorsements/lives/:action"
                element={<LivesWizardPage />}
              />
              <Route path="manage-lives" element={<ManageLivesPage />} />
              <Route path="manage-lives/bulk" element={<BulkUploadPage />} />
              <Route
                path="manage-lives/add-employee"
                element={<AddEmployeeRedirect />}
              />
              <Route
                path="manage-lives/employee/:employeeId"
                element={<EmployeeDetailsPage />}
              />
              <Route path="manage-lives/review" element={<ReviewChangesPage />} />
              <Route path="policies" element={<PlaceholderPage title="Policies & Benefits" />} />
              <Route path="ask-loop" element={<PlaceholderPage title="Ask Loop" />} />
              <Route path="enrollments" element={<PlaceholderPage title="Enrollments" />} />
              <Route path="healthcare" element={<PlaceholderPage title="Healthcare" />} />
              <Route path="employees" element={<EmployeesPage />} />
              <Route path="claim-details" element={<PlaceholderPage title="Claims" />} />
              <Route path="claim-analytics" element={<PlaceholderPage title="Claim Analytics" />} />
              <Route path="cd-accounts" element={<PlaceholderPage title="CD Accounts" />} />
              <Route path="*" element={<Navigate to="/endorsements" replace />} />
            </Route>
          </Routes>
        </PendingChangesProvider>
      </ProtoConfigProvider>
    </ThemeProvider>
  )
}

export default App
