import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import styled, { keyframes } from 'styled-components'

import { assets } from '@/assets/figma'
import {
  bulkDeleteTemplateFileName,
  bulkTemplateFileName,
} from '@/data/employees'
import { parseSheet } from '@/pages/ManageLives/bulk/parseAndValidate'
import { launchWizardPath } from '@/pages/ManageLives/launchWizard'
import { useProtoConfig } from '@/proto/ProtoConfigContext'

type BulkMode = 'add' | 'remove'

const SCAN_STAGES = [
  'Scanning through the document',
  'Checking the format',
  'Validating the information',
  'Assigning benefits to employees',
  'Configuring dependants',
] as const

const STAGE_MS = 1000

function downloadBulkTemplate(operation: BulkMode) {
  const isRemove = operation === 'remove'
  const headers = isRemove
    ? 'Employee ID,Date of Leaving,Confirm Delete\n'
    : 'Employee ID,First Name,Last Name,Grade,Core Cover,Email,DOB\n'
  const blob = new Blob([headers], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = (isRemove ? bulkDeleteTemplateFileName : bulkTemplateFileName)
    .replace('.xlsx', '.csv')
  link.click()
  URL.revokeObjectURL(url)
}

function stageDuration(index: number) {
  return STAGE_MS + (index % 3) * 100
}

export function CardsLanding() {
  const navigate = useNavigate()
  const { entities, deals } = useProtoConfig()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const parseDoneRef = useRef(false)
  const stagesDoneRef = useRef(false)
  const pendingFileRef = useRef<File | null>(null)

  const [bulkMode, setBulkMode] = useState<BulkMode>('add')
  const [entityId, setEntityId] = useState(entities[0]?.id ?? 'symphony-eyc')
  const [phase, setPhase] = useState<'idle' | 'scanning'>('idle')
  const [scanStage, setScanStage] = useState(0)
  const [error, setError] = useState<string | null>(null)

  const dealId = deals[0]?.id
  const scanning = phase === 'scanning'

  const launchRef = useRef({
    bulkMode,
    entityId,
    dealId,
    navigate,
  })
  launchRef.current = { bulkMode, entityId, dealId, navigate }

  function tryNavigate() {
    const file = pendingFileRef.current
    if (!file || !parseDoneRef.current || !stagesDoneRef.current) return
    const launch = launchRef.current
    launch.navigate(
      launchWizardPath({
        action: launch.bulkMode === 'add' ? 'add' : 'delete',
        method: 'bulk',
        entity: launch.entityId,
        deal: launch.dealId,
        file: file.name,
      }),
    )
  }

  useEffect(() => {
    if (phase !== 'scanning') return

    let cancelled = false
    let timer: number | undefined
    let index = 0
    setScanStage(0)

    const advance = () => {
      if (cancelled) return
      if (index >= SCAN_STAGES.length - 1) {
        stagesDoneRef.current = true
        tryNavigate()
        return
      }
      index += 1
      setScanStage(index)
      timer = window.setTimeout(advance, stageDuration(index))
    }

    timer = window.setTimeout(advance, stageDuration(0))

    return () => {
      cancelled = true
      if (timer !== undefined) window.clearTimeout(timer)
    }
  }, [phase])

  async function onFile(next: File | null) {
    setError(null)
    if (!next || scanning) return

    parseDoneRef.current = false
    stagesDoneRef.current = false
    pendingFileRef.current = next
    setPhase('scanning')
    setScanStage(0)

    try {
      await parseSheet(next, bulkMode)
      parseDoneRef.current = true
      tryNavigate()
    } catch {
      pendingFileRef.current = null
      setError('We could not read that file. Try again with any document.')
      setPhase('idle')
      setScanStage(0)
    }
  }

  return (
    <Page>
      <Top>
        <Back type="button" onClick={() => navigate('/employees')}>
          <img src={assets.mlArrowBack} alt="" width={20} height={20} />
          Back
        </Back>
        <Title>Add/Deletes Lives in Bulk</Title>
      </Top>

      <ModeBar>
        <ModeLeft>
          <ModeLabel>You want to?</ModeLabel>
          <Pill
            type="button"
            $active={bulkMode === 'add'}
            onClick={() => {
              if (scanning) return
              setBulkMode('add')
              setError(null)
              setPhase('idle')
              setScanStage(0)
            }}
          >
            Add in Bulk
          </Pill>
          <Pill
            type="button"
            $active={bulkMode === 'remove'}
            onClick={() => {
              if (scanning) return
              setBulkMode('remove')
              setError(null)
              setPhase('idle')
              setScanStage(0)
            }}
          >
            Delete in Bulk
          </Pill>
        </ModeLeft>

        <ForWrap>
          <ForLabel>For</ForLabel>
          <EntitySelectWrap>
            <EntitySelect
              value={entityId}
              disabled={scanning}
              onChange={(event) => setEntityId(event.target.value)}
              aria-label="Company entity"
            >
              {entities.map((entity) => (
                <option key={entity.id} value={entity.id}>
                  {entity.name}
                </option>
              ))}
            </EntitySelect>
            <Chevron src={assets.mlChevronDown24} alt="" />
          </EntitySelectWrap>
        </ForWrap>
      </ModeBar>

      <ContentPad>
        <Card>
          <Columns>
            <UploadCol>
              <DropZone
                $scanning={scanning}
                onDragOver={(event) => event.preventDefault()}
                onDrop={(event) => {
                  event.preventDefault()
                  if (scanning) return
                  void onFile(event.dataTransfer.files[0] ?? null)
                }}
                onClick={() => {
                  if (scanning) return
                  fileInputRef.current?.click()
                }}
                role="button"
                tabIndex={scanning ? -1 : 0}
                aria-busy={scanning}
                onKeyDown={(event) => {
                  if (scanning) return
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault()
                    fileInputRef.current?.click()
                  }
                }}
              >
                {scanning ? (
                  <ScanPanel role="status" aria-live="polite">
                    <Orbit aria-hidden>
                      <OrbitDot />
                      <OrbitCenter>✓</OrbitCenter>
                    </Orbit>
                    <ScanTitle>{SCAN_STAGES[scanStage]}</ScanTitle>
                    <ScanCopy>
                      Step {scanStage + 1} of {SCAN_STAGES.length}
                    </ScanCopy>
                    <StageList>
                      {SCAN_STAGES.map((label, index) => (
                        <StageItem
                          key={label}
                          $state={
                            index < scanStage
                              ? 'done'
                              : index === scanStage
                                ? 'active'
                                : 'pending'
                          }
                        >
                          {label}
                        </StageItem>
                      ))}
                    </StageList>
                    <ProgressTrack aria-hidden>
                      <ProgressBar
                        key={scanStage}
                        $durationMs={stageDuration(scanStage)}
                      />
                    </ProgressTrack>
                  </ScanPanel>
                ) : (
                  <DropInner>
                    <UploadArt aria-hidden>
                      <PdfIcon src={assets.mlIconPdfUpload} alt="" />
                      <UploadBadge>
                        <img
                          src={assets.mlIconUploadPlusSmall}
                          alt=""
                          width={12}
                          height={12}
                        />
                      </UploadBadge>
                    </UploadArt>
                    <DropCopy>
                      Drag and Drop file here or <Choose>Choose file</Choose>
                    </DropCopy>
                  </DropInner>
                )}
                <HiddenFile
                  ref={fileInputRef}
                  type="file"
                  disabled={scanning}
                  onChange={(event) =>
                    void onFile(event.target.files?.[0] ?? null)
                  }
                />
              </DropZone>
              <Formats>
                <span>Supported Formats: Any document (proto)</span>
                <span>Maximum Size: 25MB</span>
              </Formats>
              {error ? <ErrorText>{error}</ErrorText> : null}
            </UploadCol>

            <Divider aria-hidden />

            <StepsCol>
              <StepsHeading>How it works:</StepsHeading>
              <Steps>
                <Step>
                  <StepNum>1</StepNum>
                  <StepCopy>
                    <StepTitle>Download Template</StepTitle>
                    <StepDesc>
                      Not sure where to begin? Download our template.
                    </StepDesc>
                  </StepCopy>
                  <OutlineBtn
                    type="button"
                    onClick={() => downloadBulkTemplate(bulkMode)}
                  >
                    Download Template
                  </OutlineBtn>
                </Step>
                <Step>
                  <StepNum>2</StepNum>
                  <StepCopy>
                    <StepTitle>Fill the Sheet</StepTitle>
                    <StepDesc>
                      Stuck? Watch our step-by-step video tutorial.
                    </StepDesc>
                  </StepCopy>
                </Step>
                <Step>
                  <StepNum>3</StepNum>
                  <StepCopy>
                    <StepTitle>Upload and Relax</StepTitle>
                    <StepDesc>
                      Done? Great! Upload your sheet and you’re done.
                    </StepDesc>
                  </StepCopy>
                </Step>
              </Steps>

              <TutorialRow>
                <TutorialCopy>
                  Or if you’re ever stuck, our guided tutorial is just a click
                  away.
                </TutorialCopy>
                <OutlineBtn
                  type="button"
                  onClick={() =>
                    window.alert(
                      'Prototype: tutorial video would open here.',
                    )
                  }
                >
                  Watch Tutorial
                </OutlineBtn>
              </TutorialRow>
            </StepsCol>
          </Columns>
        </Card>
      </ContentPad>
    </Page>
  )
}

const Page = styled.div`
  display: flex;
  flex-direction: column;
  gap: 24px;
  padding: 36px 0 64px;
  width: 100%;
  box-sizing: border-box;
  background: ${({ theme }) => theme.colors.surface0};
  min-height: 100%;
`

const Top = styled.div`
  display: flex;
  flex-direction: column;
  gap: 24px;
  padding: 0 ${({ theme }) => theme.layout.contentPadX};

  @media (max-width: ${({ theme }) => theme.breakpoints.lg}) {
    padding: 0 ${({ theme }) => theme.layout.contentPadXTablet};
  }

  @media (max-width: ${({ theme }) => theme.breakpoints.md}) {
    padding: 0 ${({ theme }) => theme.layout.contentPadXMobile};
  }
`

const Back = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 0;
  border: 0;
  background: transparent;
  font: inherit;
  font-size: 16px;
  font-weight: 500;
  line-height: 24px;
  letter-spacing: 0.2px;
  color: ${({ theme }) => theme.colors.emerald};
  cursor: pointer;
  align-self: flex-start;
`

const Title = styled.h1`
  margin: 0;
  font-size: 24px;
  font-weight: 500;
  line-height: 28px;
  color: ${({ theme }) => theme.colors.textPrimary};
`

const ModeBar = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
  padding: 16px ${({ theme }) => theme.layout.contentPadX};
  background: ${({ theme }) => theme.colors.surface1};
  box-sizing: border-box;

  @media (max-width: ${({ theme }) => theme.breakpoints.lg}) {
    padding: 16px ${({ theme }) => theme.layout.contentPadXTablet};
  }

  @media (max-width: ${({ theme }) => theme.breakpoints.md}) {
    padding: 16px ${({ theme }) => theme.layout.contentPadXMobile};
  }
`

const ModeLeft = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
`

const ModeLabel = styled.span`
  font-size: 14px;
  font-weight: 500;
  line-height: 20px;
  letter-spacing: 0.2px;
  color: ${({ theme }) => theme.colors.textSecondary};
`

const Pill = styled.button<{ $active: boolean }>`
  height: 36px;
  padding: 8px 16px;
  border: 1px solid
    ${({ $active, theme }) =>
      $active ? theme.colors.emerald : theme.colors.defaultBorder};
  border-radius: 30px;
  background: ${({ $active, theme }) =>
    $active ? theme.colors.emerald : theme.colors.surface1};
  color: ${({ $active, theme }) =>
    $active ? theme.colors.textTertiary : theme.colors.textPrimary};
  font: inherit;
  font-size: 12px;
  font-weight: ${({ $active }) => ($active ? 500 : 400)};
  letter-spacing: 0.2px;
  line-height: 18px;
  cursor: pointer;
`

const ForWrap = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
`

const ForLabel = styled.span`
  font-size: 14px;
  font-weight: 500;
  line-height: 20px;
  letter-spacing: 0.2px;
  color: ${({ theme }) => theme.colors.textSecondary};
`

const EntitySelectWrap = styled.div`
  position: relative;
  width: 360px;
  max-width: 100%;
`

const EntitySelect = styled.select`
  width: 100%;
  height: 48px;
  padding: 12px 48px 12px 20px;
  border: 1px solid ${({ theme }) => theme.colors.defaultBorder};
  border-radius: 8px;
  background: ${({ theme }) => theme.colors.surface1};
  font: inherit;
  font-size: 14px;
  font-weight: 500;
  letter-spacing: 0.2px;
  line-height: 20px;
  color: ${({ theme }) => theme.colors.textPrimary};
  appearance: none;
  cursor: pointer;
  box-sizing: border-box;
`

const Chevron = styled.img`
  position: absolute;
  right: 16px;
  top: 50%;
  width: 24px;
  height: 24px;
  transform: translateY(-50%);
  pointer-events: none;
`

const ContentPad = styled.div`
  padding: 0 ${({ theme }) => theme.layout.contentPadX};
  box-sizing: border-box;

  @media (max-width: ${({ theme }) => theme.breakpoints.lg}) {
    padding: 0 ${({ theme }) => theme.layout.contentPadXTablet};
  }

  @media (max-width: ${({ theme }) => theme.breakpoints.md}) {
    padding: 0 ${({ theme }) => theme.layout.contentPadXMobile};
  }
`

const Card = styled.section`
  width: 100%;
  max-width: 1138px;
  padding: 16px;
  border-radius: 16px;
  background: ${({ theme }) => theme.colors.surface1};
  box-sizing: border-box;
`

const Columns = styled.div`
  display: flex;
  align-items: stretch;
  gap: 16px;

  @media (max-width: ${({ theme }) => theme.breakpoints.lg}) {
    flex-direction: column;
  }
`

const UploadCol = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
  width: 545px;
  max-width: 100%;
  flex-shrink: 0;

  @media (max-width: ${({ theme }) => theme.breakpoints.lg}) {
    width: 100%;
  }
`

const orbit = keyframes`
  to { transform: rotate(360deg); }
`

const progressFill = keyframes`
  from { width: 8%; }
  to { width: 100%; }
`

const DropZone = styled.div<{ $scanning?: boolean }>`
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 276px;
  height: ${({ $scanning }) => ($scanning ? 'auto' : '276px')};
  padding: ${({ $scanning }) => ($scanning ? '28px 20px' : '66px 12px')};
  border: 1px dashed
    ${({ theme, $scanning }) =>
      $scanning ? theme.colors.emerald : theme.colors.defaultBorder};
  border-radius: 12px;
  background: ${({ theme }) => theme.colors.surface1};
  cursor: ${({ $scanning }) => ($scanning ? 'default' : 'pointer')};
  box-sizing: border-box;
  overflow: hidden;

  &:hover {
    border-color: ${({ theme }) => theme.colors.emerald};
  }

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.colors.emerald};
    outline-offset: 2px;
  }
`

const ScanPanel = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
  max-width: 360px;
  text-align: center;
`

const Orbit = styled.div`
  position: relative;
  width: 72px;
  height: 72px;
  margin-bottom: 16px;
  border: 2px solid ${({ theme }) => theme.colors.planeGreenLight};
  border-top-color: ${({ theme }) => theme.colors.fillGreen};
  border-radius: 50%;
  animation: ${orbit} 900ms linear infinite;

  @media (prefers-reduced-motion: reduce) {
    animation: none;
  }
`

const OrbitDot = styled.span`
  position: absolute;
  top: 4px;
  right: 8px;
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: ${({ theme }) => theme.colors.fillGreen};
`

const OrbitCenter = styled.span`
  position: absolute;
  inset: 12px;
  display: grid;
  place-items: center;
  border-radius: 50%;
  background: ${({ theme }) => theme.colors.emerald};
  color: white;
  font-size: 22px;
  transform: rotate(-360deg);
`

const ScanTitle = styled.strong`
  font-size: 15px;
  font-weight: 600;
  line-height: 22px;
  color: ${({ theme }) => theme.colors.textPrimary};
`

const ScanCopy = styled.span`
  margin-top: 4px;
  font-size: 12px;
  color: ${({ theme }) => theme.colors.textSecondary};
`

const StageList = styled.ul`
  list-style: none;
  margin: 16px 0 0;
  padding: 0;
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 6px;
  text-align: left;
`

const StageItem = styled.li<{ $state: 'done' | 'active' | 'pending' }>`
  font-size: 12px;
  line-height: 18px;
  letter-spacing: 0.2px;
  color: ${({ theme, $state }) =>
    $state === 'active'
      ? theme.colors.emerald
      : $state === 'done'
        ? theme.colors.textPrimary
        : theme.colors.textSecondary};
  font-weight: ${({ $state }) => ($state === 'active' ? 600 : 400)};
  opacity: ${({ $state }) => ($state === 'pending' ? 0.55 : 1)};

  &::before {
    content: ${({ $state }) =>
      $state === 'done' ? '"✓ "' : $state === 'active' ? '"• "' : '"○ "'};
  }
`

const ProgressTrack = styled.div`
  width: 100%;
  height: 6px;
  margin-top: 18px;
  overflow: hidden;
  border-radius: 99px;
  background: ${({ theme }) => theme.colors.disableFill};
`

const ProgressBar = styled.div<{ $durationMs: number }>`
  height: 100%;
  border-radius: inherit;
  background: ${({ theme }) => theme.colors.fillGreen};
  animation: ${progressFill} ${({ $durationMs }) => $durationMs}ms ease-out
    forwards;

  @media (prefers-reduced-motion: reduce) {
    width: 100%;
    animation: none;
  }
`

const DropInner = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16px;
`

const UploadArt = styled.div`
  position: relative;
  width: 24px;
  height: 24px;
  flex-shrink: 0;
`

const PdfIcon = styled.img`
  display: block;
  width: 24px;
  height: 24px;
`

const UploadBadge = styled.span`
  position: absolute;
  left: 14px;
  top: 12px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 4px;
  border-radius: 36px;
  background: ${({ theme }) => theme.colors.emerald};
  line-height: 0;
`

const DropCopy = styled.p`
  margin: 0;
  font-size: 14px;
  font-weight: 400;
  line-height: 20px;
  letter-spacing: 0.2px;
  color: ${({ theme }) => theme.colors.textSecondary};
  white-space: nowrap;
`

const Choose = styled.span`
  font-weight: 500;
  color: ${({ theme }) => theme.colors.emerald};
`

const HiddenFile = styled.input`
  display: none;
`

const Formats = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  font-size: 12px;
  font-weight: 400;
  line-height: 18px;
  letter-spacing: 0.2px;
  color: ${({ theme }) => theme.colors.textSecondary};
`

const ErrorText = styled.p`
  margin: 0;
  font-size: 13px;
  color: ${({ theme }) => theme.colors.textError};
`

const Divider = styled.div`
  width: 1px;
  align-self: stretch;
  background: ${({ theme }) => theme.colors.defaultBorder};
  flex-shrink: 0;

  @media (max-width: ${({ theme }) => theme.breakpoints.lg}) {
    width: 100%;
    height: 1px;
  }
`

const StepsCol = styled.div`
  display: flex;
  flex-direction: column;
  gap: 18px;
  flex: 1;
  min-width: 0;
`

const StepsHeading = styled.h2`
  margin: 0;
  font-size: 14px;
  font-weight: 500;
  line-height: 20px;
  letter-spacing: 0.2px;
  color: ${({ theme }) => theme.colors.textSecondary};
`

const Steps = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
`

const Step = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 12px;
  width: 100%;
`

const StepNum = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 16px;
  background: ${({ theme }) => theme.colors.disableFill};
  font-size: 13px;
  font-weight: 500;
  letter-spacing: 0.2px;
  color: ${({ theme }) => theme.colors.textPrimary};
  flex-shrink: 0;
`

const StepCopy = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
  flex: 1;
  min-width: 0;
`

const StepTitle = styled.p`
  margin: 0;
  font-size: 14px;
  font-weight: 500;
  line-height: 20px;
  letter-spacing: 0.2px;
  color: ${({ theme }) => theme.colors.textPrimary};
`

const StepDesc = styled.p`
  margin: 0;
  font-size: 14px;
  font-weight: 400;
  line-height: 20px;
  letter-spacing: 0.2px;
  color: ${({ theme }) => theme.colors.textSecondary};
`

const OutlineBtn = styled.button`
  flex-shrink: 0;
  height: 36px;
  padding: 8px 16px;
  border: 1px solid ${({ theme }) => theme.colors.defaultBorder};
  border-radius: 8px;
  background: ${({ theme }) => theme.colors.surface1};
  font: inherit;
  font-size: 12px;
  font-weight: 500;
  letter-spacing: 0.2px;
  line-height: 18px;
  color: ${({ theme }) => theme.colors.textPrimary};
  cursor: pointer;
  white-space: nowrap;

  &:hover {
    border-color: ${({ theme }) => theme.colors.emerald};
  }
`

const TutorialRow = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
  width: 100%;

  @media (max-width: ${({ theme }) => theme.breakpoints.sm}) {
    flex-direction: column;
    align-items: stretch;
  }
`

const TutorialCopy = styled.p`
  margin: 0;
  flex: 1;
  min-width: 0;
  font-size: 14px;
  font-weight: 500;
  line-height: 20px;
  letter-spacing: 0.2px;
  color: ${({ theme }) => theme.colors.textSecondary};
`
