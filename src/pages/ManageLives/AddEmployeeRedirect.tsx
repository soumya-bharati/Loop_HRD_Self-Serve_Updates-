import { Navigate } from 'react-router-dom'

import { launchWizardPath } from '@/pages/ManageLives/launchWizard'
import { useProtoConfig } from '@/proto/ProtoConfigContext'

export function AddEmployeeRedirect() {
  const { entities, deals } = useProtoConfig()
  return (
    <Navigate
      to={launchWizardPath({
        action: 'add',
        method: 'single',
        entity: entities[0]?.id ?? 'symphony-eyc',
        deal: deals[0]?.id,
      })}
      replace
    />
  )
}
