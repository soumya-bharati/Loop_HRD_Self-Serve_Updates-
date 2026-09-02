import { Link, useSearchParams } from 'react-router-dom'
import styled from 'styled-components'

import { BulkSection } from '@/pages/ManageLives/BulkSection'
import { useProtoConfig } from '@/proto/ProtoConfigContext'

export function BulkUploadPage() {
  const [params] = useSearchParams()
  const { entities, deals } = useProtoConfig()

  const entityId =
    params.get('entity') ?? entities[0]?.id ?? 'symphony-eyc'
  const dealId = params.get('deal') ?? deals[0]?.id

  return (
    <Page>
      <Back to="/manage-lives">← Manage Lives</Back>
      <Title>Upload a sheet</Title>
      <Copy>
        Choose add or remove first. You will get the matching instructions and
        template, then upload the filled sheet for validation and cost.
      </Copy>
      <Card>
        <BulkSection
          entityId={entityId}
          dealId={dealId}
          showCardChrome={false}
        />
      </Card>
    </Page>
  )
}

const Page = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 32px ${({ theme }) => theme.layout.contentPadX} 64px;

  @media (max-width: ${({ theme }) => theme.breakpoints.lg}) {
    padding: 24px ${({ theme }) => theme.layout.contentPadXTablet} 48px;
  }

  @media (max-width: ${({ theme }) => theme.breakpoints.md}) {
    padding: 20px ${({ theme }) => theme.layout.contentPadXMobile} 40px;
  }
`

const Back = styled(Link)`
  color: ${({ theme }) => theme.colors.emerald};
  text-decoration: none;
  font-weight: 500;
  align-self: flex-start;
`

const Title = styled.h1`
  margin: 0;
  font-size: 24px;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.beyondGrey};
`

const Copy = styled.p`
  margin: 0;
  max-width: 720px;
  font-size: 14px;
  line-height: 20px;
  color: ${({ theme }) => theme.colors.textSecondary};
`

const Card = styled.section`
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 24px;
  border-radius: 16px;
  background: ${({ theme }) => theme.colors.surface1};
  border: 1px solid ${({ theme }) => theme.colors.disableFill};
`
