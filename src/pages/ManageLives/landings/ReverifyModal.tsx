import { useEffect, useRef, useState } from 'react'
import styled, { keyframes } from 'styled-components'

import { assets } from '@/assets/figma'
import { ModalPortal } from '@/components/ModalPortal'

const SPREADSHEET_EXTENSIONS = /\.(xlsx?|csv)$/i
const VERIFY_MS = 1800

type Props = {
  open: boolean
  onCancel: () => void
  onVerified: (file: File) => void
}

function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

/**
 * Re-checks a corrected sheet without sending HR back to the first step.
 * The parent keeps already-approved lives and adds any that now pass.
 */
export function ReverifyModal({ open, onCancel, onVerified }: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const onVerifiedRef = useRef(onVerified)
  onVerifiedRef.current = onVerified
  const [file, setFile] = useState<File | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [verifying, setVerifying] = useState(false)

  useEffect(() => {
    if (open) return
    setFile(null)
    setError(null)
    setVerifying(false)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }, [open])

  useEffect(() => {
    if (!verifying || !file) return
    const timer = window.setTimeout(() => onVerifiedRef.current(file), VERIFY_MS)
    return () => window.clearTimeout(timer)
  }, [verifying, file])

  if (!open) return null

  function pick(next: File | null) {
    if (!next || verifying) return
    if (!SPREADSHEET_EXTENSIONS.test(next.name)) {
      setError('Please upload a spreadsheet (XLS, XLSX, or CSV).')
      return
    }
    setError(null)
    setFile(next)
  }

  return (
    <ModalPortal>
      <Overlay
        role="presentation"
        onMouseDown={() => {
          if (!verifying) onCancel()
        }}
      >
        <Dialog
          role="dialog"
          aria-modal
          aria-labelledby="reverify-title"
          onMouseDown={(event) => event.stopPropagation()}
        >
          <Header>
            <div>
              <Title id="reverify-title">Re-verify corrected lives</Title>
              <Lead>
                Upload the sheet with your fixes. We’ll check it here and add
                any lives that now pass — you won’t lose the ones already
                approved.
              </Lead>
            </div>
            <CloseButton
              type="button"
              aria-label="Close"
              disabled={verifying}
              onClick={onCancel}
            >
              <img
                src={assets.mlIconModalClose24}
                alt=""
                width={24}
                height={24}
              />
            </CloseButton>
          </Header>

          {verifying && file ? (
            <ScanCard role="status" aria-busy>
              <FileMeta>
                <FileIconWrap aria-hidden>
                  <img
                    src={assets.mlIconFileUploaded}
                    alt=""
                    width={20}
                    height={20}
                  />
                </FileIconWrap>
                <div>
                  <FileName title={file.name}>{file.name}</FileName>
                  <FileSize>{formatFileSize(file.size)}</FileSize>
                </div>
              </FileMeta>
              <ScanCopy>
                <LoaderSpin
                  src={assets.mlIconLoaderScan}
                  alt=""
                  width={28}
                  height={28}
                />
                Re-checking corrected rows…
              </ScanCopy>
            </ScanCard>
          ) : file ? (
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
                <div>
                  <FileName title={file.name}>{file.name}</FileName>
                  <FileSize>{formatFileSize(file.size)}</FileSize>
                </div>
              </FileMeta>
              <ClearFile
                type="button"
                onClick={() => {
                  setFile(null)
                  if (fileInputRef.current) fileInputRef.current.value = ''
                }}
              >
                Change file
              </ClearFile>
            </FileCard>
          ) : (
            <DropZone
              role="button"
              tabIndex={0}
              onDragOver={(event) => event.preventDefault()}
              onDrop={(event) => {
                event.preventDefault()
                pick(event.dataTransfer.files[0] ?? null)
              }}
              onClick={() => fileInputRef.current?.click()}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault()
                  fileInputRef.current?.click()
                }
              }}
            >
              Drag and drop the corrected sheet here or{' '}
              <Choose>Choose file</Choose>
            </DropZone>
          )}

          <HiddenFile
            ref={fileInputRef}
            type="file"
            accept=".xls,.xlsx,.csv"
            onChange={(event) => pick(event.target.files?.[0] ?? null)}
          />
          {error ? <ErrorText>{error}</ErrorText> : null}

          <Actions>
            <Ghost type="button" disabled={verifying} onClick={onCancel}>
              Cancel
            </Ghost>
            <Primary
              type="button"
              disabled={!file || verifying}
              onClick={() => setVerifying(true)}
            >
              {verifying ? 'Re-verifying…' : 'Re-verify and add lives'}
            </Primary>
          </Actions>
        </Dialog>
      </Overlay>
    </ModalPortal>
  )
}

const fadeIn = keyframes`
  from { opacity: 0; }
  to { opacity: 1; }
`

const spin = keyframes`
  to { transform: rotate(360deg); }
`

const Overlay = styled.div`
  position: fixed;
  inset: 0;
  z-index: 180;
  display: grid;
  place-items: center;
  padding: 24px 5vw;
  background: rgba(45, 55, 72, 0.48);
  animation: ${fadeIn} 160ms ease-out;
`

const Dialog = styled.div`
  display: flex;
  width: min(560px, 100%);
  flex-direction: column;
  gap: 16px;
  padding: 24px;
  border: 1px solid ${({ theme }) => theme.colors.defaultBorder};
  border-radius: 16px;
  background: ${({ theme }) => theme.colors.surface1};
  box-sizing: border-box;
`

const Header = styled.header`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
`

const Title = styled.h2`
  margin: 0;
  color: ${({ theme }) => theme.colors.textPrimary};
  font-size: 18px;
  font-weight: 600;
  line-height: 24px;
`

const Lead = styled.p`
  margin: 6px 0 0;
  color: ${({ theme }) => theme.colors.textSecondary};
  font-size: 13px;
  line-height: 20px;
`

const CloseButton = styled.button`
  display: grid;
  width: 24px;
  height: 24px;
  flex-shrink: 0;
  padding: 0;
  place-items: center;
  border: 0;
  background: transparent;
  cursor: pointer;

  &:disabled {
    cursor: not-allowed;
    opacity: 0.5;
  }

  img {
    display: block;
    width: 24px;
    height: 24px;
  }
`

const DropZone = styled.div`
  padding: 28px 16px;
  border: 1px dashed ${({ theme }) => theme.colors.defaultBorder};
  border-radius: 12px;
  color: ${({ theme }) => theme.colors.textSecondary};
  font-size: 14px;
  line-height: 20px;
  text-align: center;
  cursor: pointer;

  &:hover {
    border-color: ${({ theme }) => theme.colors.emerald};
  }
`

const Choose = styled.span`
  font-weight: 500;
  color: ${({ theme }) => theme.colors.emerald};
`

const FileCard = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 12px 16px;
  border: 1px solid ${({ theme }) => theme.colors.defaultBorder};
  border-radius: 12px;
`

const ScanCard = styled(FileCard)`
  flex-direction: column;
  align-items: stretch;
`

const FileMeta = styled.div`
  display: flex;
  min-width: 0;
  align-items: center;
  gap: 12px;
`

const FileIconWrap = styled.div`
  display: grid;
  width: 40px;
  height: 40px;
  flex: 0 0 40px;
  place-items: center;
  border-radius: 50%;
  background: ${({ theme }) => theme.colors.planeGreenLight};
`

const FileName = styled.p`
  margin: 0;
  overflow: hidden;
  color: ${({ theme }) => theme.colors.textPrimary};
  font-size: 14px;
  font-weight: 500;
  line-height: 20px;
  text-overflow: ellipsis;
  white-space: nowrap;
`

const FileSize = styled.p`
  margin: 2px 0 0;
  color: ${({ theme }) => theme.colors.textSecondary};
  font-size: 12px;
  line-height: 18px;
`

const ClearFile = styled.button`
  flex-shrink: 0;
  padding: 0;
  border: 0;
  background: transparent;
  color: ${({ theme }) => theme.colors.emerald};
  font: inherit;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
`

const ScanCopy = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  color: ${({ theme }) => theme.colors.textSecondary};
  font-size: 12px;
  line-height: 18px;
`

const LoaderSpin = styled.img`
  display: block;
  animation: ${spin} 1s linear infinite;

  @media (prefers-reduced-motion: reduce) {
    animation: none;
  }
`

const HiddenFile = styled.input`
  display: none;
`

const ErrorText = styled.p`
  margin: 0;
  color: ${({ theme }) => theme.colors.textError};
  font-size: 13px;
`

const Actions = styled.div`
  display: flex;
  justify-content: flex-end;
  flex-wrap: wrap;
  gap: 12px;
`

const Ghost = styled.button`
  height: 44px;
  padding: 10px 20px;
  border: 1px solid ${({ theme }) => theme.colors.defaultBorder};
  border-radius: 12px;
  background: transparent;
  color: ${({ theme }) => theme.colors.textPrimary};
  font: inherit;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;

  &:disabled {
    cursor: not-allowed;
    opacity: 0.6;
  }
`

const Primary = styled.button`
  height: 44px;
  padding: 10px 20px;
  border: 0;
  border-radius: 12px;
  background: ${({ theme }) => theme.colors.fillGreen};
  color: ${({ theme }) => theme.colors.emerald};
  font: inherit;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;

  &:disabled {
    background: ${({ theme }) => theme.colors.disableFill};
    color: ${({ theme }) => theme.colors.textSecondary};
    cursor: not-allowed;
  }
`
