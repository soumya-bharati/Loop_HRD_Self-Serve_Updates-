import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import styled, { keyframes } from 'styled-components'

import { assets } from '@/assets/figma'
import { bulkDeleteTemplateFileName } from '@/data/employees'
import { ExitConfirmationModal } from '@/pages/LivesWizard/components/ExitConfirmationModal'
import {
  detectSheetColumns,
  parseSheet,
  type ColumnDetectionResult,
} from '@/pages/ManageLives/bulk/parseAndValidate'
import { ColumnMappingPanel } from '@/pages/ManageLives/landings/ColumnMappingPanel'
import { EndorsementCostPanel } from '@/pages/ManageLives/landings/EndorsementCostPanel'
import { EnrollmentSettingsModal } from '@/pages/ManageLives/landings/EnrollmentSettingsModal'
import { ValidationIssuesPanel } from '@/pages/ManageLives/landings/ValidationIssuesPanel'
import { usePendingChanges } from '@/pages/ManageLives/PendingChangesContext'
import { nextPendingId } from '@/pages/ManageLives/pendingChanges'
import {
  isReadyToSubmit,
  sampleBulkDeleteRowsForPrototype,
  sampleBulkRowsForPrototype,
  validationIssuesFor,
  type BulkMemberRow,
} from '@/data/flexDeal'
import { useProtoConfig } from '@/proto/ProtoConfigContext'

type BulkMode = 'add' | 'remove'

function bulkModeFromSearch(value: string | null): BulkMode {
  return value === 'remove' || value === 'delete' ? 'remove' : 'add'
}

function toggleIgnored(
  rows: BulkMemberRow[],
  rowId: string,
  ignored: boolean,
) {
  const target = rows.find((row) => row.id === rowId)
  if (!target) return rows
  return rows.map((row) => {
    if (row.id === rowId) return { ...row, ignored }
    if (
      target.relationship === 'Self' &&
      row.relationship !== 'Self' &&
      row.employeeId === target.employeeId
    ) {
      return { ...row, ignored }
    }
    return row
  })
}

const ASSIGNING_BENEFITS_MS = 2000

/** Narrates the document scan so the mapping card never appears instantly. */
const SCAN_STAGES = [
  'Opening your document...',
  'Reading the header row...',
  'Matching columns to Loop fields...',
]
const SCAN_STAGE_MS = 900

const WIZARD_STEPS = [
  {
    title: 'Upload document',
    description: 'Choose an action and upload the sheet.',
    icon: 'upload',
  },
  {
    title: 'Validate Data',
    description: 'Map your columns, then review lives and benefits.',
    icon: 'validate',
  },
  {
    title: 'Review & Submit',
    description: 'Review the assignments, then submit to Loop.',
    icon: 'review',
  },
] as const

function ReviewCheckIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 12 12" fill="none" aria-hidden>
      <path
        d="M10 3L4.5 8.5L2 6"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

type StepStatus = 'done' | 'active' | 'pending'

const ADD_SAMPLE_TEMPLATE_FILE_NAME = 'Sample Bulk Add Sheet.xlsx'
const ADD_SAMPLE_TEMPLATE_HREF = `${import.meta.env.BASE_URL}templates/${encodeURIComponent(ADD_SAMPLE_TEMPLATE_FILE_NAME)}`
const SPREADSHEET_EXTENSIONS = /\.(xlsx?|csv)$/i

function downloadBulkTemplate(operation: BulkMode) {
  if (operation === 'add') {
    const link = document.createElement('a')
    link.href = ADD_SAMPLE_TEMPLATE_HREF
    link.download = ADD_SAMPLE_TEMPLATE_FILE_NAME
    link.click()
    return
  }

  const blob = new Blob(['Employee ID,Date of Leaving,Confirm Delete\n'], {
    type: 'text/csv',
  })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = bulkDeleteTemplateFileName.replace('.xlsx', '.csv')
  link.click()
  URL.revokeObjectURL(url)
}

function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) {
    const kb = bytes / 1024
    return `${kb >= 10 ? kb.toFixed(0) : kb.toFixed(1)} KB`
  }
  const mb = bytes / (1024 * 1024)
  return `${mb >= 10 ? mb.toFixed(0) : mb.toFixed(1)} MB`
}

export function CardsLanding() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { entities, deals, includeValidationErrors, allowProgressCollapse } =
    useProtoConfig()
  const { addChange } = usePendingChanges()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const workspaceRef = useRef<HTMLElement>(null)
  const pendingFileRef = useRef<File | null>(null)
  const demoRows = useMemo(
    () => sampleBulkRowsForPrototype(includeValidationErrors),
    [includeValidationErrors],
  )
  const deleteDemoRows = useMemo<BulkMemberRow[]>(
    () =>
      sampleBulkDeleteRowsForPrototype(includeValidationErrors).map((row) => ({
        id: row.id,
        employeeId: row.employeeId,
        name: row.name,
        email: '',
        department: '',
        relationship: 'Self',
        assignedPlanId: 'plan-standard',
        benefitIds: ['ben-gmc', 'ben-gpa'],
        purchaseGroupSelections: { 'pg-core': ['opt-standard'] },
        assignmentSource: 'sheet',
        needsManualAssignment: false,
        validationError: row.error,
        validationField: row.error ? 'Employee ID' : undefined,
        status: row.status,
        dealId: deals[0]?.id ?? 'deal-default',
        payrollDelta: 0,
        insurerRefund: row.insurerRefund,
        payrollRefund: row.payrollRefund,
        dateOfLeaving: row.dateOfLeaving,
      })),
    [deals, includeValidationErrors],
  )
  const [bulkMode, setBulkMode] = useState<BulkMode>(() =>
    bulkModeFromSearch(searchParams.get('mode')),
  )
  const [entityId, setEntityId] = useState(entities[0]?.id ?? 'symphony-eyc')
  const [file, setFile] = useState<File | null>(null)
  const [phase, setPhase] = useState<
    'idle' | 'scanning' | 'issues' | 'results' | 'cost'
  >('idle')
  const [validatedRows, setValidatedRows] =
    useState<BulkMemberRow[]>(() => sampleBulkRowsForPrototype(true))
  const [columnDetection, setColumnDetection] =
    useState<ColumnDetectionResult | null>(null)
  const [assigningBenefits, setAssigningBenefits] = useState(false)
  const [scanStage, setScanStage] = useState(0)
  const [enrollmentOpen, setEnrollmentOpen] = useState(false)
  const [exitConfirmOpen, setExitConfirmOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [progressCollapsed, setProgressCollapsed] = useState(false)
  const rowsForMode = bulkMode === 'remove' ? deleteDemoRows : demoRows
  const sidebarCollapsed = allowProgressCollapse && progressCollapsed

  useEffect(() => {
    if (!allowProgressCollapse) setProgressCollapsed(false)
  }, [allowProgressCollapse])

  const wizardSteps = useMemo(
    () =>
      WIZARD_STEPS.map((step, index) => {
        if (index === 0) {
          return {
            ...step,
            description:
              entities.length > 1
                ? 'Choose an action, select a company, and upload the sheet.'
                : 'Choose an action and upload the sheet.',
          }
        }
        if (index === 1) {
          return {
            ...step,
            description:
              bulkMode === 'remove'
                ? 'Map your columns, then review the lives being removed.'
                : step.description,
          }
        }
        if (index === 2) {
          return {
            ...step,
            description:
              bulkMode === 'remove'
                ? 'Review the covers ending, then submit to Loop.'
                : step.description,
          }
        }
        return step
      }),
    [bulkMode, entities.length],
  )
  const dealId = deals[0]?.id
  const scanning = phase === 'scanning'
  const showingIssues = phase === 'issues'
  const showingCost = phase === 'cost'
  const activeWizardStep = showingCost
    ? 2
    : scanning || showingIssues
      ? 1
      : 0
  const scanFile = pendingFileRef.current ?? file

  function stepStatus(index: number): StepStatus {
    if (index < activeWizardStep) return 'done'
    if (index === activeWizardStep) return 'active'
    return 'pending'
  }

  useEffect(() => {
    if (phase !== 'scanning' || !assigningBenefits) return

    const timer = window.setTimeout(() => {
      setValidatedRows(
        bulkMode === 'remove'
          ? deleteDemoRows
          : sampleBulkRowsForPrototype(includeValidationErrors),
      )
      setPhase('issues')
    }, ASSIGNING_BENEFITS_MS)

    return () => window.clearTimeout(timer)
  }, [
    phase,
    assigningBenefits,
    bulkMode,
    includeValidationErrors,
    deleteDemoRows,
  ])

  useEffect(() => {
    if (phase !== 'scanning' || columnDetection || assigningBenefits) return
    if (scanStage >= SCAN_STAGES.length - 1) return

    const timer = window.setTimeout(
      () => setScanStage((current) => current + 1),
      SCAN_STAGE_MS,
    )

    return () => window.clearTimeout(timer)
  }, [phase, columnDetection, assigningBenefits, scanStage])

  /** Each step animates in from the top, so start the scroller there too. */
  useEffect(() => {
    workspaceRef.current?.scrollTo({ top: 0, behavior: 'smooth' })
  }, [phase])

  function selectFile(next: File | null) {
    if (!next || scanning) return
    if (!SPREADSHEET_EXTENSIONS.test(next.name)) {
      setError('Please upload a spreadsheet (XLS, XLSX, or CSV).')
      return
    }
    setError(null)
    setFile(next)
    setColumnDetection(null)
    setValidatedRows(rowsForMode)
    setAssigningBenefits(false)
  }

  function clearFile() {
    if (scanning) return
    setFile(null)
    setError(null)
    setColumnDetection(null)
    setAssigningBenefits(false)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  function goBackToSetup() {
    pendingFileRef.current = null
    setColumnDetection(null)
    setValidatedRows(rowsForMode)
    setAssigningBenefits(false)
    setScanStage(0)
    setPhase('idle')
  }

  function goBackToMapping() {
    setAssigningBenefits(false)
    setPhase('scanning')
  }

  function mapColumn(mappingId: string, sourceColumn: string) {
    setColumnDetection((current) => {
      if (!current) return current
      return {
        ...current,
        mappings: current.mappings.map((mapping) =>
          mapping.id === mappingId
            ? { ...mapping, sourceColumn: sourceColumn || null, confidence: 'manual' }
            : mapping,
        ),
      }
    })
  }

  function confirmColumnMapping() {
    setAssigningBenefits(true)
  }

  function ignoreValidationIssue(rowId: string) {
    setValidatedRows((current) => toggleIgnored(current, rowId, true))
  }

  function restoreValidationIssue(rowId: string) {
    setValidatedRows((current) => toggleIgnored(current, rowId, false))
  }

  function applyReverifiedSheet(next: File) {
    pendingFileRef.current = next
    setFile(next)
    setValidatedRows((current) =>
      current.map((row) => {
        if (row.ignored) return row
        const issues = validationIssuesFor(row)
        if (issues.length === 0) return row
        return {
          ...row,
          needsManualAssignment: false,
          assignedPlanId: row.assignedPlanId ?? 'plan-standard',
          benefitIds:
            row.benefitIds.length > 0
              ? row.benefitIds
              : ['ben-gmc', 'ben-gpa'],
          purchaseGroupSelections:
            Object.keys(row.purchaseGroupSelections).length > 0
              ? row.purchaseGroupSelections
              : { 'pg-core': ['opt-standard'] },
          assignmentSource: 'manual',
          status: 'pass' as const,
          validationIssues: [],
          validationError: undefined,
          validationField: undefined,
          resolvedIssues: undefined,
        }
      }),
    )
  }

  function resolveValidationIssue(
    rowId: string,
    fixes: { field: string; value: string }[],
  ) {
    setValidatedRows((current) =>
      current.map((row) => {
        if (row.id !== rowId) return row

        const remaining = validationIssuesFor(row).filter(
          (issue) =>
            !fixes.some(
              (fix) => fix.field.toLowerCase() === issue.field.toLowerCase(),
            ),
        )

        let employeeId = row.employeeId
        let email = row.email
        let assignedPlanId = row.assignedPlanId
        let needsManualAssignment = row.needsManualAssignment

        for (const fix of fixes) {
          const field = fix.field.toLowerCase()
          if (field.includes('employee id')) employeeId = fix.value
          if (field.includes('email')) email = fix.value
          if (field.includes('cover') || field.includes('plan')) {
            assignedPlanId = fix.value
            needsManualAssignment = false
          }
        }

        const parental = assignedPlanId === 'plan-parental'
        const originalIssues = validationIssuesFor(row)
        const resolved = remaining.length === 0

        return {
          ...row,
          employeeId,
          email,
          assignedPlanId: assignedPlanId ?? (resolved ? 'plan-standard' : null),
          benefitIds: parental
            ? ['ben-gmc', 'ben-gpa', 'ben-gmc-parental']
            : row.benefitIds.length > 0
              ? row.benefitIds
              : ['ben-gmc', 'ben-gpa'],
          purchaseGroupSelections: {
            'pg-core': [parental ? 'opt-parental' : 'opt-standard'],
          },
          assignmentSource: 'manual',
          needsManualAssignment: resolved ? false : needsManualAssignment,
          status: resolved ? 'pass' : row.status,
          payrollDelta: parental ? 2100 : Math.max(row.payrollDelta, 1250),
          validationIssues: remaining,
          validationError: remaining[0]?.error,
          validationField: remaining[0]?.field,
          resolvedIssues: resolved
            ? originalIssues.map((issue) => ({
                ...issue,
                resolvedValue: fixes.find(
                  (fix) =>
                    fix.field.toLowerCase() === issue.field.toLowerCase(),
                )?.value,
              }))
            : row.resolvedIssues,
        }
      }),
    )
  }

  /**
   * Adding lives asks about an enrollment window first; deletions go straight
   * to the cost review.
   */
  function submitForReview() {
    if (bulkMode === 'add') {
      setEnrollmentOpen(true)
      return
    }
    continueToReview()
  }

  function continueToReview() {
    setEnrollmentOpen(false)
    const target = pendingFileRef.current ?? file
    const lives = validatedRows.filter(isReadyToSubmit).length
    const entityName =
      entities.find((entity) => entity.id === entityId)?.name ?? entityId
    addChange({
      id: nextPendingId(),
      employeeId: 'bulk',
      employeeName: target?.name ?? 'Bulk upload',
      entityId,
      entityName,
      dealId,
      dealName: deals[0]?.name,
      action: bulkMode === 'add' ? 'bulk_add' : 'bulk_remove',
      description:
        bulkMode === 'add'
          ? `Submitted ${lives} lives for addition`
          : `Submitted ${lives} lives for deletion`,
      createdAt: new Date().toISOString(),
      payload: {
        fileName: target?.name,
        lives,
      },
    })
    setPhase('cost')
  }

  async function proceedToValidate() {
    if (!file || scanning) return

    setError(null)
    pendingFileRef.current = file
    setPhase('scanning')
    setColumnDetection(null)
    setAssigningBenefits(false)
    setScanStage(0)

    try {
      const [detection] = await Promise.all([
        detectSheetColumns(bulkMode, {
          includeErrors: includeValidationErrors,
        }),
        parseSheet(file, bulkMode, {
          includeErrors: includeValidationErrors,
        }),
      ])
      setColumnDetection(detection)
    } catch {
      pendingFileRef.current = null
      setError('We could not read that file. Try again with any document.')
      setPhase('idle')
      setColumnDetection(null)
      setAssigningBenefits(false)
    }
  }

  if (showingCost) {
    return (
      <>
        <EndorsementCostPanel
          rows={validatedRows}
          isDelete={bulkMode === 'remove'}
          onDone={() => navigate('/employees')}
        />
        <EnrollmentSettingsModal
          open={enrollmentOpen}
          recipientCount={
            validatedRows.filter(
              (row) => isReadyToSubmit(row) && row.relationship === 'Self',
            ).length
          }
          onCancel={() => setEnrollmentOpen(false)}
          onConfirm={continueToReview}
        />
      </>
    )
  }

  return (
    <Page>
      <ProgressPanel
        id="bulk-progress-panel"
        $collapsed={sidebarCollapsed}
      >
        {allowProgressCollapse ? (
          <CollapseToggle
            type="button"
            aria-expanded={!sidebarCollapsed}
            aria-controls="bulk-progress-panel"
            aria-label={
              sidebarCollapsed ? 'Expand progress' : 'Collapse progress'
            }
            onClick={() => setProgressCollapsed((collapsed) => !collapsed)}
          >
            <CollapseChevron
              src={assets.chevronRight}
              alt=""
              $collapsed={sidebarCollapsed}
            />
          </CollapseToggle>
        ) : null}
        <Logo
          src={assets.loopLogo}
          alt="loop"
          $collapsed={sidebarCollapsed}
        />
        <ProgressList
          aria-label="Bulk update progress"
          $collapsed={sidebarCollapsed}
        >
          {wizardSteps.map((step, index) => {
            const status = stepStatus(index)
            const iconSrc =
              step.icon === 'upload'
                ? assets.mlIconFileUploaded
                : step.icon === 'validate'
                  ? assets.mlIconInstructions
                  : null
            return (
              <ProgressStep key={step.title} $collapsed={sidebarCollapsed}>
                <StepRail $collapsed={sidebarCollapsed}>
                  <StepDot
                    $status={status}
                    $collapsed={sidebarCollapsed}
                    aria-hidden
                  />
                  <StepIconNode
                    $status={status}
                    $collapsed={sidebarCollapsed}
                    title={step.title}
                    aria-label={step.title}
                    aria-hidden={!sidebarCollapsed}
                  >
                    {iconSrc ? (
                      <StepIconImg src={iconSrc} alt="" />
                    ) : (
                      <ReviewCheckIcon />
                    )}
                    <VisuallyHidden>{step.title}</VisuallyHidden>
                  </StepIconNode>
                  {index < wizardSteps.length - 1 ? (
                    <StepConnector $done={status === 'done'} />
                  ) : null}
                </StepRail>
                <StepCopy
                  $last={index === wizardSteps.length - 1}
                  $collapsed={sidebarCollapsed}
                >
                  <StepTitle $status={status}>{step.title}</StepTitle>
                  {status === 'active' ? (
                    <StepDesc>{step.description}</StepDesc>
                  ) : null}
                </StepCopy>
              </ProgressStep>
            )
          })}
        </ProgressList>
      </ProgressPanel>

      <Workspace ref={workspaceRef}>
        <ExitButton type="button" onClick={() => setExitConfirmOpen(true)}>
          Exit
        </ExitButton>

        <PhaseView key={phase}>
          {scanning ? (
          <Content>
            <Setup>
              {columnDetection && !assigningBenefits ? (
                <ColumnMappingPanel
                  mappings={columnDetection.mappings}
                  uploadedColumns={columnDetection.uploadedColumns}
                  sampleValues={columnDetection.sampleValues}
                  fileName={scanFile?.name}
                  fileSize={scanFile?.size}
                  onMap={mapColumn}
                  onConfirm={confirmColumnMapping}
                  onBack={goBackToSetup}
                />
              ) : (
                <ScanPanel role="status" aria-busy aria-live="polite">
                  <ScanFileCard>
                    <FileMeta>
                      <FileIconWrap aria-hidden>
                        <img
                          src={assets.mlIconFileUploaded}
                          alt=""
                          width={20}
                          height={20}
                        />
                      </FileIconWrap>
                      <FileCopy>
                        <FileName title={scanFile?.name}>
                          {scanFile?.name}
                        </FileName>
                        <FileSize>{formatFileSize(scanFile?.size ?? 0)}</FileSize>
                      </FileCopy>
                    </FileMeta>
                    <LoaderSpin
                      src={assets.mlIconLoaderScan}
                      alt=""
                      width={32}
                      height={32}
                    />
                  </ScanFileCard>
                  <DetectionIntro>
                    <LoaderSpin
                      src={assets.mlIconLoaderSm}
                      alt=""
                      width={12}
                      height={12}
                    />
                    {assigningBenefits
                      ? bulkMode === 'remove'
                        ? 'Matching lives to existing cover...'
                        : 'Assigning benefits to employees...'
                      : SCAN_STAGES[scanStage]}
                  </DetectionIntro>
                </ScanPanel>
              )}
            </Setup>
          </Content>
        ) : showingIssues ? (
          <ValidationIssuesPanel
            rows={validatedRows}
            fileName={scanFile?.name}
            fileSize={scanFile?.size}
            isDelete={bulkMode === 'remove'}
            onResolve={resolveValidationIssue}
            onIgnore={ignoreValidationIssue}
            onRestore={restoreValidationIssue}
            onReverify={applyReverifiedSheet}
            onBack={goBackToMapping}
            onContinue={submitForReview}
          />
        ) : (
          <Content>
            <Setup>
              {entities.length > 1 ? (
                <CompanySection>
                  <SectionTitle>
                    Which company are you taking this action for?
                  </SectionTitle>
                  <CompanyCards role="group" aria-label="Company">
                    {entities.map((entity) => (
                      <CompanyCard
                        key={entity.id}
                        type="button"
                        $active={entityId === entity.id}
                        aria-pressed={entityId === entity.id}
                        onClick={() => setEntityId(entity.id)}
                      >
                        <CompanyName>{entity.name}</CompanyName>
                        <SelectedBadge
                          $shown={entityId === entity.id}
                          aria-hidden
                        >
                          <img src={assets.mlBulkSelectedCheck} alt="" />
                        </SelectedBadge>
                      </CompanyCard>
                    ))}
                  </CompanyCards>
                </CompanySection>
              ) : null}

              <Section>
                <SectionTitle>What would you like to do today?</SectionTitle>
                <ActionCards role="group" aria-label="Bulk action">
                  <ActionCard
                    type="button"
                    $active={bulkMode === 'add'}
                    aria-pressed={bulkMode === 'add'}
                    onClick={() => {
                      setBulkMode('add')
                      setError(null)
                      setColumnDetection(null)
                      setAssigningBenefits(false)
                    }}
                  >
                    <ActionIcon src={assets.mlBulkAddLives} alt="" />
                    <ActionCopy>
                      <ActionTitle>Add Lives</ActionTitle>
                      <ActionDescription>
                        Bulk add employees or dependants via Excel.
                      </ActionDescription>
                    </ActionCopy>
                    <SelectedBadge $shown={bulkMode === 'add'} aria-hidden>
                      <img src={assets.mlBulkSelectedCheck} alt="" />
                    </SelectedBadge>
                  </ActionCard>
                  <ActionCard
                    type="button"
                    $active={bulkMode === 'remove'}
                    aria-pressed={bulkMode === 'remove'}
                    onClick={() => {
                      setBulkMode('remove')
                      setError(null)
                      setColumnDetection(null)
                      setAssigningBenefits(false)
                    }}
                  >
                    <ActionIcon src={assets.mlBulkDeleteLives} alt="" />
                    <ActionCopy>
                      <ActionTitle>Delete Lives</ActionTitle>
                      <ActionDescription>
                        Remove employees or dependants via Excel.
                      </ActionDescription>
                    </ActionCopy>
                    <SelectedBadge $shown={bulkMode === 'remove'} aria-hidden>
                      <img src={assets.mlBulkSelectedCheck} alt="" />
                    </SelectedBadge>
                  </ActionCard>
                </ActionCards>
              </Section>

              <UploadPanel>
                <UploadHeading>
                  <SmallTitle>Upload your spreadsheet</SmallTitle>
                  <UploadDescription>
                    {file ? (
                      'We’ll read this sheet and match your columns next. You can swap the file if this isn’t the right one.'
                    ) : (
                      <>
                        Use the sheet you already have. It{' '}
                        <DescriptionEmphasis>
                          doesn’t need to follow a specific format
                        </DescriptionEmphasis>
                        , we’ll help you map your columns after upload.
                      </>
                    )}
                  </UploadDescription>
                </UploadHeading>

                <UploadBlock>
                  {file ? (
                    <>
                      <FileCard>
                        <FileMeta>
                          <FileIconWrap aria-hidden>
                            <img
                              src={assets.mlIconFileUploaded}
                              alt=""
                              width={20}
                              height={20}
                            />
                          </FileIconWrap>
                          <FileCopy>
                            <FileName title={file.name}>{file.name}</FileName>
                            <FileSize>{formatFileSize(file.size)}</FileSize>
                          </FileCopy>
                        </FileMeta>
                        <DeleteFileButton type="button" onClick={clearFile}>
                          <img
                            src={assets.mlIconTrashDelete}
                            alt=""
                            width={18}
                            height={18}
                          />
                          Delete
                        </DeleteFileButton>
                      </FileCard>
                      <ProceedButton
                        type="button"
                        onClick={() => void proceedToValidate()}
                      >
                        Proceed to Validate
                      </ProceedButton>
                    </>
                  ) : (
                    <>
                      <DropZone
                        role="button"
                        tabIndex={0}
                        onDragOver={(event) => event.preventDefault()}
                        onDrop={(event) => {
                          event.preventDefault()
                          selectFile(event.dataTransfer.files[0] ?? null)
                        }}
                        onClick={() => fileInputRef.current?.click()}
                        onKeyDown={(event) => {
                          if (event.key === 'Enter' || event.key === ' ') {
                            event.preventDefault()
                            fileInputRef.current?.click()
                          }
                        }}
                      >
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
                            Drag and Drop file here or{' '}
                            <Choose>Choose file</Choose>
                          </DropCopy>
                        </DropInner>
                      </DropZone>
                      <Formats>
                        <span>Supported Formats: XLS, XLSX</span>
                        <span>Maximum Size: 25MB</span>
                      </Formats>
                    </>
                  )}
                  <HiddenFile
                    ref={fileInputRef}
                    type="file"
                    accept=".xls,.xlsx,.csv"
                    onChange={(event) =>
                      selectFile(event.target.files?.[0] ?? null)
                    }
                  />
                  {error ? <ErrorText>{error}</ErrorText> : null}
                </UploadBlock>

                {file ? null : (
                  <>
                    <OrSeparator role="separator" aria-label="Or">
                      <i aria-hidden />
                      <span>Or</span>
                      <i aria-hidden />
                    </OrSeparator>
                    <UploadHeading>
                      <SmallTitle>Prefer a ready-made format?</SmallTitle>
                      <UploadDescription>
                        Use our template if you’d rather start with predefined
                        columns.
                      </UploadDescription>
                    </UploadHeading>
                    <TemplateCard>
                      <TemplateCopy>
                        <TemplateTitle>
                          <ExcelMark
                            src={assets.mlIconExcelFile}
                            alt=""
                            aria-hidden
                          />
                          {bulkMode === 'add'
                            ? 'Sample Template for Addition'
                            : 'Sample Template for Deletion'}
                        </TemplateTitle>
                        <TemplateDescription>
                          Use this template with predefined columns and enter
                          details
                        </TemplateDescription>
                      </TemplateCopy>
                      <DownloadButton
                        type="button"
                        onClick={() => downloadBulkTemplate(bulkMode)}
                      >
                        Download
                      </DownloadButton>
                    </TemplateCard>
                  </>
                )}
              </UploadPanel>
            </Setup>
          </Content>
          )}
        </PhaseView>
      </Workspace>

      <EnrollmentSettingsModal
        open={enrollmentOpen}
        recipientCount={
          validatedRows.filter(
            (row) => isReadyToSubmit(row) && row.relationship === 'Self',
          ).length
        }
        onCancel={() => setEnrollmentOpen(false)}
        onConfirm={continueToReview}
      />
      <ExitConfirmationModal
        open={exitConfirmOpen}
        onStay={() => setExitConfirmOpen(false)}
        onConfirm={() => {
          setExitConfirmOpen(false)
          navigate('/employees')
        }}
      />
    </Page>
  )
}

const Page = styled.div`
  display: flex;
  align-items: stretch;
  gap: 10px;
  width: 100%;
  height: 100%;
  min-height: 0;
  max-height: 100%;
  padding: 6px;
  box-sizing: border-box;
  overflow: hidden;
  background: ${({ theme }) => theme.colors.surface1};

  @media (max-width: ${({ theme }) => theme.breakpoints.md}) {
    flex-direction: column;
    height: auto;
    min-height: 100vh;
    max-height: none;
    overflow: visible;
  }
`

const ProgressPanel = styled.aside<{ $collapsed: boolean }>`
  position: relative;
  isolation: isolate;
  width: ${({ $collapsed }) => ($collapsed ? '72px' : '330px')};
  height: 100%;
  min-height: 0;
  flex-shrink: 0;
  padding: ${({ $collapsed }) => ($collapsed ? '16px 12px' : '24px')};
  border-radius: 16px;
  background: ${({ theme }) => theme.colors.hoverSurface1};
  box-sizing: border-box;
  overflow: hidden;
  transition:
    width 200ms ease,
    padding 200ms ease;

  &::before {
    content: '';
    position: absolute;
    inset: 0;
    z-index: 0;
    background: image-set(url(${assets.mlBulkSidebarNoise}) 2x) top left / 17.36%
      auto repeat;
    mix-blend-mode: overlay;
    opacity: 0.3;
    pointer-events: none;
  }

  &::after {
    content: '';
    position: absolute;
    left: -312px;
    bottom: -194px;
    z-index: 1;
    width: 442px;
    height: 442px;
    background: url(${assets.mlBulkSidebarLeaves}) no-repeat center / contain;
    transform: rotate(0.45deg);
    pointer-events: none;
    display: ${({ $collapsed }) => ($collapsed ? 'none' : 'block')};
  }

  @media (max-width: ${({ theme }) => theme.breakpoints.lg}) {
    width: ${({ $collapsed }) => ($collapsed ? '72px' : '270px')};
  }

  @media (max-width: ${({ theme }) => theme.breakpoints.md}) {
    width: 100%;
    height: auto;
    min-height: 0;
    padding: 24px;

    &::after {
      display: block;
    }
  }
`

const CollapseToggle = styled.button`
  position: absolute;
  top: 16px;
  right: 12px;
  z-index: 3;
  display: inline-flex;
  width: 28px;
  height: 28px;
  align-items: center;
  justify-content: center;
  padding: 0;
  border: 1px solid ${({ theme }) => theme.colors.defaultBorder};
  border-radius: ${({ theme }) => theme.radii.full};
  background: ${({ theme }) => theme.colors.surface1};
  cursor: pointer;

  &:hover {
    border-color: ${({ theme }) => theme.colors.emerald};
  }

  @media (max-width: ${({ theme }) => theme.breakpoints.md}) {
    display: none;
  }
`

const CollapseChevron = styled.img<{ $collapsed: boolean }>`
  display: block;
  width: 16px;
  height: 16px;
  transform: rotate(${({ $collapsed }) => ($collapsed ? '0deg' : '180deg')});
  transition: transform 200ms ease;
`

const Logo = styled.img<{ $collapsed: boolean }>`
  position: relative;
  z-index: 2;
  display: ${({ $collapsed }) => ($collapsed ? 'none' : 'block')};
  width: 70px;
  height: 34px;
  object-fit: contain;

  @media (max-width: ${({ theme }) => theme.breakpoints.md}) {
    display: block;
  }
`

const ProgressList = styled.div<{ $collapsed: boolean }>`
  position: relative;
  z-index: 2;
  display: flex;
  flex-direction: column;
  gap: 4px;
  align-items: ${({ $collapsed }) => ($collapsed ? 'center' : 'stretch')};
  margin-top: ${({ $collapsed }) => ($collapsed ? '48px' : '38px')};

  @media (max-width: ${({ theme }) => theme.breakpoints.md}) {
    align-items: stretch;
    margin-top: 24px;
  }
`

const ProgressStep = styled.div<{ $collapsed: boolean }>`
  display: flex;
  gap: ${({ $collapsed }) => ($collapsed ? '0' : '12px')};
  width: ${({ $collapsed }) => ($collapsed ? 'auto' : '100%')};
  justify-content: ${({ $collapsed }) => ($collapsed ? 'center' : 'flex-start')};

  @media (max-width: ${({ theme }) => theme.breakpoints.md}) {
    gap: 12px;
    width: 100%;
    justify-content: flex-start;
  }
`

const StepRail = styled.div<{ $collapsed: boolean }>`
  display: flex;
  flex-direction: column;
  align-items: center;
  width: ${({ $collapsed }) => ($collapsed ? '28px' : '14px')};
  flex-shrink: 0;
  padding-top: 4px;

  @media (max-width: ${({ theme }) => theme.breakpoints.md}) {
    width: 14px;
  }
`

const StepDot = styled.span<{ $status: StepStatus; $collapsed: boolean }>`
  display: ${({ $collapsed }) => ($collapsed ? 'none' : 'block')};
  width: 14px;
  height: 14px;
  flex-shrink: 0;
  border-radius: 50%;
  box-sizing: border-box;
  background: ${({ theme, $status }) =>
    $status === 'pending' ? 'transparent' : theme.colors.fillGreen};
  border: ${({ theme, $status }) =>
    $status === 'pending'
      ? `1.5px solid ${theme.colors.defaultBorder}`
      : `2px solid ${theme.colors.emerald}`};

  @media (max-width: ${({ theme }) => theme.breakpoints.md}) {
    display: block;
  }
`

const StepIconNode = styled.span<{ $status: StepStatus; $collapsed: boolean }>`
  position: relative;
  display: ${({ $collapsed }) => ($collapsed ? 'flex' : 'none')};
  width: 28px;
  height: 28px;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  box-sizing: border-box;
  color: ${({ theme }) => theme.colors.emerald};
  background: ${({ theme, $status }) =>
    $status === 'pending' ? 'transparent' : theme.colors.fillGreen};
  border: ${({ theme, $status }) =>
    $status === 'pending'
      ? `1.5px solid ${theme.colors.defaultBorder}`
      : `2px solid ${theme.colors.emerald}`};
  outline: ${({ theme, $status }) =>
    $status === 'active' ? `2px solid ${theme.colors.emerald}` : 'none'};
  outline-offset: 1px;

  @media (max-width: ${({ theme }) => theme.breakpoints.md}) {
    display: none;
  }
`

const StepIconImg = styled.img`
  display: block;
  width: 16px;
  height: 16px;
  object-fit: contain;
`

const VisuallyHidden = styled.span`
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
`

const StepConnector = styled.span<{ $done?: boolean }>`
  flex: 1;
  min-height: 8px;
  margin-top: 8px;
  border-left: 1px
    ${({ $done }) => ($done ? 'solid' : 'dashed')}
    ${({ theme }) => theme.colors.defaultBorder};
`

const StepCopy = styled.div<{ $last?: boolean; $collapsed?: boolean }>`
  display: ${({ $collapsed }) => ($collapsed ? 'none' : 'flex')};
  flex-direction: column;
  flex: 1;
  min-width: 0;
  padding-bottom: ${({ $last }) => ($last ? '24px' : '36px')};

  @media (max-width: ${({ theme }) => theme.breakpoints.md}) {
    display: flex;
  }
`

const StepTitle = styled.p<{ $status: StepStatus }>`
  margin: 0;
  font-size: 16px;
  font-weight: 500;
  line-height: 24px;
  letter-spacing: 0.2px;
  color: ${({ theme, $status }) =>
    $status === 'pending'
      ? theme.colors.textSecondary
      : theme.colors.textPrimary};
`

const StepDesc = styled.p`
  margin: 0;
  font-size: 14px;
  font-weight: 400;
  line-height: 20px;
  letter-spacing: 0.2px;
  color: ${({ theme }) => theme.colors.textPrimary};
`

const Workspace = styled.main`
  position: relative;
  flex: 1;
  min-width: 0;
  overflow-x: hidden;
  overflow-y: auto;
  overscroll-behavior: contain;
  background: ${({ theme }) => theme.colors.surface1};
`

const ExitButton = styled.button`
  position: absolute;
  top: 18px;
  right: 18px;
  /* Above PhaseView, whose animation transform makes it paint over this. */
  z-index: 2;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 96px;
  height: 36px;
  padding: 8px 16px;
  border: 1px solid ${({ theme }) => theme.colors.defaultBorder};
  border-radius: ${({ theme }) => theme.radii.sm};
  background: transparent;
  box-sizing: border-box;
  font: inherit;
  font-size: 12px;
  font-weight: 500;
  line-height: 18px;
  letter-spacing: 0.2px;
  color: ${({ theme }) => theme.colors.textPrimary};
  cursor: pointer;

  &:hover:not(:disabled) {
    border-color: ${({ theme }) => theme.colors.emerald};
  }

  &:disabled {
    cursor: not-allowed;
    opacity: 0.6;
  }
`

const stepIn = keyframes`
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
`

/** Remounted per phase so every step rises into place like a new chat message. */
const PhaseView = styled.div`
  width: 100%;
  animation: ${stepIn} 800ms cubic-bezier(0.22, 1, 0.36, 1) both;

  @media (prefers-reduced-motion: reduce) {
    animation: none;
  }
`

const Content = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 24px;
  width: 100%;
  max-width: none;
  padding: 72px 40px 24px;
  box-sizing: border-box;

  @media (max-width: ${({ theme }) => theme.breakpoints.md}) {
    padding: 72px ${({ theme }) => theme.layout.contentPadXMobile} 32px;
  }

  @media (max-width: ${({ theme }) => theme.breakpoints.sm}) {
    flex-direction: column;
  }
`

const Setup = styled.div`
  display: flex;
  min-width: 0;
  width: 100%;
  max-width: none;
  flex: 1;
  flex-direction: column;
  gap: 16px;
  padding-top: 13px;

  @media (max-width: ${({ theme }) => theme.breakpoints.md}) {
    max-width: none;
  }

  @media (max-width: ${({ theme }) => theme.breakpoints.sm}) {
    width: 100%;
    padding-top: 0;
  }
`

const spin = keyframes`
  to { transform: rotate(360deg); }
`

const LoaderSpin = styled.img`
  display: block;
  animation: ${spin} 1s linear infinite;

  @media (prefers-reduced-motion: reduce) {
    animation: none;
  }
`

const DetectionIntro = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 2px 0;
  color: ${({ theme }) => theme.colors.textSecondary};
  font-size: 12px;
  line-height: 18px;
  letter-spacing: 0.2px;
`

const Section = styled.section`
  display: flex;
  flex-direction: column;
  gap: 16px;
  width: 100%;
`

const SectionTitle = styled.h2`
  margin: 0;
  font-family: inherit;
  font-size: 18px;
  font-weight: 500;
  font-style: normal;
  line-height: 24px;
  letter-spacing: 0.2px;
  color: ${({ theme }) => theme.colors.textPrimary};
`

const ActionCards = styled.div`
  display: flex;
  gap: 16px;
  width: 100%;

  @media (max-width: ${({ theme }) => theme.breakpoints.lg}) {
    flex-direction: column;
  }
`

/**
 * Selected state matches Figma `option-Add Lives` (146:4337): keep the 1px
 * #EEE card border, and draw a 1.5px emerald ring 3.5px outside it.
 */
const ActionCard = styled.button<{ $active: boolean }>`
  position: relative;
  display: flex;
  min-width: 0;
  min-height: 80px;
  flex: 1;
  align-items: center;
  gap: 16px;
  padding: 16px;
  border: 1px solid ${({ theme }) => theme.colors.disableFill};
  border-radius: 12px;
  background: ${({ theme }) => theme.colors.surface1};
  box-shadow: ${({ $active, theme }) =>
    $active
      ? `0 0 0 3.5px ${theme.colors.surface1}, 0 0 0 5px ${theme.colors.emerald}`
      : 'none'};
  box-sizing: border-box;
  color: inherit;
  font: inherit;
  text-align: left;
  cursor: pointer;
  transition:
    border-color 200ms ease,
    box-shadow 200ms ease;

  &:hover {
    border-color: ${({ theme, $active }) =>
      $active ? theme.colors.disableFill : theme.colors.emerald};
  }

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.colors.emerald};
    outline-offset: 6px;
  }

  @media (prefers-reduced-motion: reduce) {
    transition: none;
  }
`

const ActionIcon = styled.img`
  display: block;
  width: 48px;
  height: 48px;
  flex: 0 0 48px;
`

const ActionCopy = styled.span`
  display: flex;
  min-width: 0;
  flex: 1;
  flex-direction: column;
  gap: 4px;
`

const ActionTitle = styled.span`
  color: ${({ theme }) => theme.colors.textPrimary};
  font-size: 16px;
  font-weight: 500;
  line-height: 24px;
  letter-spacing: 0.2px;
`

const ActionDescription = styled.span`
  color: ${({ theme }) => theme.colors.textSecondary};
  font-size: 14px;
  font-weight: 400;
  line-height: 20px;
  letter-spacing: 0.2px;
`

const SelectedBadge = styled.span<{ $shown: boolean }>`
  position: absolute;
  top: 7px;
  right: 7px;
  display: grid;
  width: 20px;
  height: 20px;
  place-items: center;
  border-radius: 50%;
  background: ${({ theme }) => theme.colors.emerald};
  opacity: ${({ $shown }) => ($shown ? 1 : 0)};
  transform: scale(${({ $shown }) => ($shown ? 1 : 0.6)});
  transition:
    opacity 200ms ease,
    transform 200ms ease;

  img {
    display: block;
    width: 12px;
    height: 12px;
  }

  @media (prefers-reduced-motion: reduce) {
    transition: none;
  }
`

const CompanySection = styled.section`
  display: flex;
  flex-direction: column;
  gap: 16px;
  width: 100%;
  margin-bottom: 16px;
`

const CompanyCards = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: stretch;
  gap: 16px;
  width: 100%;
`

const CompanyCard = styled.button<{ $active: boolean }>`
  position: relative;
  display: flex;
  align-items: center;
  min-width: 0;
  padding: 16px 48px 16px 16px;
  border: 1px solid
    ${({ $active, theme }) =>
      $active ? theme.colors.emerald : theme.colors.disableFill};
  border-radius: 12px;
  background: ${({ theme }) => theme.colors.surface1};
  box-shadow: 0 0 0 ${({ $active }) => ($active ? '2px' : '0')}
    ${({ theme }) => theme.colors.emerald};
  box-sizing: border-box;
  color: inherit;
  font: inherit;
  text-align: left;
  cursor: pointer;
  transition:
    border-color 200ms ease,
    box-shadow 200ms ease;

  &:hover {
    border-color: ${({ theme }) => theme.colors.emerald};
  }

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.colors.emerald};
    outline-offset: 2px;
  }

  @media (prefers-reduced-motion: reduce) {
    transition: none;
  }
`

const CompanyName = styled.span`
  color: ${({ theme }) => theme.colors.textPrimary};
  font-size: 16px;
  font-weight: 500;
  line-height: 24px;
  letter-spacing: 0.2px;
`

const SmallTitle = styled.h3`
  margin: 0;
  color: ${({ theme }) => theme.colors.textPrimary};
  font-size: 16px;
  font-weight: 500;
  line-height: 24px;
  letter-spacing: 0.2px;
`

const UploadPanel = styled.section`
  display: flex;
  flex-direction: column;
  gap: 16px;
  width: 100%;
  padding: 16px;
  border: 1px solid ${({ theme }) => theme.colors.disableFill};
  border-radius: 12px;
  background: ${({ theme }) => theme.colors.surface1};
  box-sizing: border-box;
  overflow: hidden;
`

const ScanPanel = styled(UploadPanel)``

const UploadHeading = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
`

const UploadDescription = styled.p`
  margin: 0;
  color: ${({ theme }) => theme.colors.textSecondary};
  font-size: 12px;
  font-weight: 400;
  line-height: 18px;
  letter-spacing: 0.2px;
`

const DescriptionEmphasis = styled.span`
  font-weight: 500;
`

const OrSeparator = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
  width: 100%;
  color: ${({ theme }) => theme.colors.textSecondary};
  font-size: 12px;
  font-weight: 500;
  line-height: 18px;
  letter-spacing: 0.2px;

  i {
    height: 1px;
    flex: 1;
    background: ${({ theme }) => theme.colors.disableFill};
  }
`

const TemplateCard = styled.div`
  display: flex;
  min-height: 68px;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 16px 24px;
  border-radius: 12px;
  background: ${({ theme }) => theme.colors.surface0};
  box-sizing: border-box;

  @media (max-width: ${({ theme }) => theme.breakpoints.sm}) {
    align-items: stretch;
    flex-direction: column;
  }
`

const TemplateCopy = styled.div`
  display: flex;
  min-width: 0;
  flex-direction: column;
  gap: 4px;
`

const TemplateTitle = styled.p`
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0;
  color: ${({ theme }) => theme.colors.textPrimary};
  font-size: 12px;
  font-weight: 500;
  line-height: 18px;
  letter-spacing: 0.2px;
`

const ExcelMark = styled.img`
  display: block;
  width: 16px;
  height: 16px;
  flex: 0 0 16px;
`

const TemplateDescription = styled.p`
  margin: 0;
  color: ${({ theme }) => theme.colors.textSecondary};
  font-size: 12px;
  font-weight: 400;
  line-height: 18px;
  letter-spacing: 0.2px;
`

const DownloadButton = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  height: 36px;
  padding: 8px 16px;
  border: 1px solid ${({ theme }) => theme.colors.defaultBorder};
  border-radius: ${({ theme }) => theme.radii.sm};
  background: ${({ theme }) => theme.colors.surface1};
  font: inherit;
  font-size: 12px;
  font-weight: 500;
  line-height: 18px;
  letter-spacing: 0.2px;
  color: ${({ theme }) => theme.colors.textPrimary};
  cursor: pointer;
  white-space: nowrap;

  &:hover {
    border-color: ${({ theme }) => theme.colors.emerald};
  }
`

const UploadBlock = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 16px;
  width: 100%;
`

const FileCard = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  width: 100%;
  padding: 16px 20px;
  border: 1px solid ${({ theme }) => theme.colors.defaultBorder};
  border-radius: ${({ theme }) => theme.radii.sm};
  background: ${({ theme }) => theme.colors.surface1};
  box-sizing: border-box;
`

const ScanFileCard = styled(FileCard)`
  border-color: transparent;
  background: ${({ theme }) => theme.colors.hoverSurface1};
`

const FileMeta = styled.div`
  display: flex;
  min-width: 0;
  align-items: center;
  gap: 16px;
`

const FileIconWrap = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  width: 40px;
  height: 40px;
  padding: 8px;
  border-radius: 100px;
  background: ${({ theme }) => theme.colors.planeGreenLight};
  box-sizing: border-box;

  img {
    display: block;
    width: 20px;
    height: 20px;
  }
`

const FileCopy = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
  flex: 1;
`

const FileName = styled.p`
  margin: 0;
  font-size: 14px;
  font-weight: 500;
  line-height: 20px;
  letter-spacing: 0.2px;
  color: ${({ theme }) => theme.colors.textPrimary};
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`

const FileSize = styled.p`
  margin: 0;
  font-size: 12px;
  font-weight: 400;
  line-height: 18px;
  letter-spacing: 0.2px;
  color: ${({ theme }) => theme.colors.textSecondary};
`

const DeleteFileButton = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  gap: 4px;
  padding: 0;
  border: 0;
  background: transparent;
  font: inherit;
  font-size: 14px;
  font-weight: 500;
  line-height: 18px;
  letter-spacing: -0.28px;
  color: ${({ theme }) => theme.colors.textError};
  cursor: pointer;
  white-space: nowrap;

  img {
    display: block;
    width: 18px;
    height: 18px;
  }
`

const DropZone = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  padding: 36px 12px;
  border: 1px dashed ${({ theme }) => theme.colors.defaultBorder};
  border-radius: ${({ theme }) => theme.radii.md};
  background: ${({ theme }) => theme.colors.surface1};
  cursor: pointer;
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

const DropInner = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;
  min-width: 0;
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
  display: flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  padding: 4px;
  border-radius: 36px;
  background: ${({ theme }) => theme.colors.emerald};
  box-sizing: border-box;
  line-height: 0;

  img {
    display: block;
    width: 12px;
    height: 12px;
  }
`

const DropCopy = styled.p`
  margin: 0;
  min-width: 0;
  font-size: 14px;
  font-weight: 400;
  line-height: 20px;
  letter-spacing: 0.2px;
  text-align: center;
  color: ${({ theme }) => theme.colors.textSecondary};
  overflow-wrap: anywhere;
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
  width: 100%;
  gap: auto;
  font-size: 12px;
  font-weight: 400;
  line-height: 18px;
  letter-spacing: 0.2px;
  color: ${({ theme }) => theme.colors.textSecondary};

  @media (max-width: ${({ theme }) => theme.breakpoints.sm}) {
    flex-direction: column;
    gap: 4px;
  }
`

const ErrorText = styled.p`
  margin: 0;
  font-size: 13px;
  color: ${({ theme }) => theme.colors.textError};
`

const ProceedButton = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  align-self: auto;
  height: 48px;
  padding: 14px 24px;
  border: 0;
  border-radius: ${({ theme }) => theme.radii.md};
  background: ${({ theme }) => theme.colors.fillGreen};
  font: inherit;
  font-size: 14px;
  font-weight: 500;
  line-height: 20px;
  letter-spacing: 0.2px;
  color: ${({ theme }) => theme.colors.emerald};
  cursor: pointer;

  &:disabled {
    background: ${({ theme }) => theme.colors.disableFill};
    color: ${({ theme }) => theme.colors.textSecondary};
    cursor: not-allowed;
  }
`
