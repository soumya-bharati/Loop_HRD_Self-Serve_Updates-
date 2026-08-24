import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import styled from 'styled-components'

import { assets } from '@/assets/figma'
import { type PolicyCostBreakdown } from '@/data/flexDeal'
import { FlowStepper, WizardChrome } from '@/pages/LivesWizard/WizardChrome'
import { useLivesWizard } from '@/pages/LivesWizard/WizardContext'
import { SINGLE_ADD_STEPS } from '@/pages/LivesWizard/singleAddSteps'

function formatINRExact(amount: number) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)
}

function policyTypeLabel(name: string) {
  const n = name.toLowerCase()
  if (n.includes('opd')) return 'OPD'
  if (n.includes('medical') || n.includes('gmc')) return 'GMC'
  if (n.includes('term life') || n.includes('gtl')) return 'GTL'
  if (n.includes('accident') || n.includes('gpa')) return 'GPA'
  return 'Policy'
}

function insurerLogoSrc(logo: PolicyCostBreakdown['insurerLogo']) {
  if (logo === 'digit') return assets.digitLogo
  if (logo === 'icici') return assets.iciciLogo
  return null
}

type InsurerGroup = {
  insurerName: string
  insurerLogo: PolicyCostBreakdown['insurerLogo']
  cdBalance: number
  policies: PolicyCostBreakdown[]
}

export function EndoCostsStep() {
  const navigate = useNavigate()
  const { costEstimate, setStep, completeFlow } = useLivesWizard()

  const insurerGroups = useMemo(() => {
    const map = new Map<string, InsurerGroup>()
    for (const policy of costEstimate.policies) {
      const existing = map.get(policy.insurerName)
      if (!existing) {
        map.set(policy.insurerName, {
          insurerName: policy.insurerName,
          insurerLogo: policy.insurerLogo,
          cdBalance: policy.cdBalance,
          policies: [policy],
        })
        continue
      }
      existing.policies.push(policy)
    }
    return [...map.values()]
  }, [costEstimate.policies])

  const livesCount = costEstimate.totalLivesAdded

  return (
    <WizardChrome
      title="Submit Addition Request"
      onBack={() => setStep('benefits')}
      onExit={() => navigate('/endorsements')}
      secondaryLabel="Go Back"
      onSecondary={() => setStep('benefits')}
      primaryLabel={`Submit ${livesCount} Lives`}
      primaryDisabled={livesCount === 0}
      onPrimary={() => completeFlow()}
      primaryHint={{
        title: 'Submit Your Endo! ⚡',
        body: 'If everything looks good click below to submit your endo!',
      }}
    >
      <FlowStepper steps={[...SINGLE_ADD_STEPS]} activeIndex={2} bare />

      <Layout>
        <InsurerColumn>
          {insurerGroups.length === 0 ? (
            <EmptyCard>No covers selected yet.</EmptyCard>
          ) : (
            insurerGroups.map((group) => {
              const logoSrc = insurerLogoSrc(group.insurerLogo)
              return (
                <InsurerCard key={group.insurerName}>
                  <InsurerHeader>
                    <InsurerIdentity>
                      {logoSrc ? (
                        <Logo src={logoSrc} alt="" />
                      ) : (
                        <CareMark aria-hidden>
                          <CareC>C</CareC>
                        </CareMark>
                      )}
                      <InsurerName>{group.insurerName}</InsurerName>
                    </InsurerIdentity>
                    <CdPill>
                      CD Balance: {formatINRExact(group.cdBalance)}
                    </CdPill>
                  </InsurerHeader>
                  <PolicyTable>
                    <TableHead>
                      <span>Policy Type</span>
                      <span>Lives Added</span>
                      <span>Endorsement Cost</span>
                    </TableHead>
                    {group.policies.map((policy) => (
                      <TableRow key={policy.policyId}>
                        <span>{policyTypeLabel(policy.policyName)}</span>
                        <span>{policy.livesAdded}</span>
                        <span>{formatINRExact(policy.endorsementCost)}</span>
                      </TableRow>
                    ))}
                  </PolicyTable>
                </InsurerCard>
              )
            })
          )}
        </InsurerColumn>

        <ReceiptCard>
          <ReceiptTitle>
            <ReceiptIcon />
            Total Endorsement Cost
          </ReceiptTitle>
          <ReceiptRow>
            <span>Total Lives Added</span>
            <strong>{livesCount}</strong>
          </ReceiptRow>
          <ReceiptRow>
            <span>Total Endorsement Cost</span>
            <strong>{formatINRExact(costEstimate.totalEndorsementCost)}</strong>
          </ReceiptRow>
          <ReceiptNote>
            <InfoDot>
              <img src={assets.infoMark} alt="" width={10} height={10} />
            </InfoDot>
            Final amount may change once endorsement is processed.
          </ReceiptNote>
          <ReceiptJagged aria-hidden />
        </ReceiptCard>
      </Layout>
    </WizardChrome>
  )
}

function ReceiptIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 28 28" fill="none" aria-hidden>
      <circle cx="14" cy="14" r="14" fill="#FDD506" />
      <rect x="9" y="7.5" width="10" height="13" rx="1.5" fill="#fff" />
      <path
        d="M9 18.5l1.4 1.4 1.4-1.4 1.4 1.4 1.4-1.4 1.4 1.4 1.4-1.4 1.6 1.4V20a1.5 1.5 0 01-1.5 1.5H10.5A1.5 1.5 0 019 20v-1.5z"
        fill="#fff"
      />
      <path
        d="M11.2 12.2h5.2M11.2 15h3.4"
        stroke="#1A1A1A"
        strokeWidth="1.2"
        strokeLinecap="round"
      />
    </svg>
  )
}

const Layout = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 1fr) 340px;
  gap: 24px;
  align-items: start;

  @media (max-width: 1100px) {
    grid-template-columns: 1fr;
  }
`

const InsurerColumn = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
`

const InsurerCard = styled.div`
  display: flex;
  flex-direction: column;
  gap: 20px;
  padding: 20px 24px 24px;
  border-radius: 16px;
  background: ${({ theme }) => theme.colors.surface1};
  border: 1px solid ${({ theme }) => theme.colors.disableFill};
`

const InsurerHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
`

const InsurerIdentity = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 0;
`

const Logo = styled.img`
  height: 36px;
  width: auto;
  max-width: 120px;
  object-fit: contain;
`

const CareMark = styled.div`
  width: 36px;
  height: 36px;
  border-radius: 8px;
  background: linear-gradient(135deg, #f36f21 0%, #e31c23 100%);
  display: grid;
  place-items: center;
  flex-shrink: 0;
`

const CareC = styled.span`
  color: #fff;
  font-size: 20px;
  font-weight: 700;
  line-height: 1;
`

const InsurerName = styled.div`
  font-size: 16px;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.beyondGrey};
`

const CdPill = styled.div`
  flex-shrink: 0;
  padding: 8px 14px;
  border-radius: 8px;
  background: ${({ theme }) => theme.colors.surface0};
  font-size: 13px;
  font-weight: 500;
  color: ${({ theme }) => theme.colors.textPrimary};
`

const PolicyTable = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`

const TableHead = styled.div`
  display: grid;
  grid-template-columns: 1.2fr 1fr 1.2fr;
  gap: 12px;
  font-size: 12px;
  font-weight: 500;
  color: ${({ theme }) => theme.colors.textSecondary};
`

const TableRow = styled.div`
  display: grid;
  grid-template-columns: 1.2fr 1fr 1.2fr;
  gap: 12px;
  font-size: 16px;
  font-weight: 500;
  color: ${({ theme }) => theme.colors.beyondGrey};
`

const EmptyCard = styled.div`
  padding: 24px;
  border-radius: 16px;
  background: ${({ theme }) => theme.colors.surface1};
  font-size: 14px;
  color: ${({ theme }) => theme.colors.textSecondary};
`

const ReceiptCard = styled.div`
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 24px 24px 32px;
  margin-bottom: 10px;
  background: ${({ theme }) => theme.colors.surface1};
  border: 1px solid ${({ theme }) => theme.colors.defaultBorder};
  border-bottom: none;
  border-radius: 12px 12px 0 0;
`

const ReceiptTitle = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 16px;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.beyondGrey};
`

const ReceiptRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  gap: 12px;
  font-size: 14px;
  color: ${({ theme }) => theme.colors.textSecondary};

  strong {
    font-size: 16px;
    font-weight: 600;
    color: ${({ theme }) => theme.colors.beyondGrey};
  }
`

const ReceiptNote = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 8px;
  margin-top: 4px;
  font-size: 12px;
  line-height: 16px;
  color: ${({ theme }) => theme.colors.textSecondary};
`

const InfoDot = styled.span`
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: ${({ theme }) => theme.colors.turquoise};
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  margin-top: 1px;
`

const ReceiptJagged = styled.div`
  position: absolute;
  left: -1px;
  right: -1px;
  bottom: -12px;
  height: 12px;
  background: ${({ theme }) => theme.colors.surface1};
  background-image: ${({ theme }) =>
    `linear-gradient(135deg, ${theme.colors.surface0} 33.33%, ${theme.colors.surface1} 33.33% 66.66%, ${theme.colors.surface0} 66.66%), linear-gradient(45deg, ${theme.colors.surface0} 33.33%, ${theme.colors.surface1} 33.33% 66.66%, ${theme.colors.surface0} 66.66%)`};
  background-size: 16px 12px;
  background-position: 0 0, 8px 0;
  background-repeat: repeat-x;
  border-left: 1px solid ${({ theme }) => theme.colors.defaultBorder};
  border-right: 1px solid ${({ theme }) => theme.colors.defaultBorder};
`
