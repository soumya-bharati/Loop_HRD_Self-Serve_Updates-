export type ProtoVersionId = string

export interface ProtoVersion {
  id: ProtoVersionId
  label: string
  description?: string
}

export const PROTO_VERSIONS: ProtoVersion[] = [
  {
    id: 'manage-lives-cards',
    label: 'V1 · Cards',
    description: 'Bulk + add + search cards',
  },
]

export const DEFAULT_PROTO_VERSION_ID = 'manage-lives-cards'

export function resolveProtoVersion(id: string | null | undefined): ProtoVersion {
  return (
    PROTO_VERSIONS.find((version) => version.id === id) ??
    PROTO_VERSIONS.find((version) => version.id === DEFAULT_PROTO_VERSION_ID) ??
    PROTO_VERSIONS[0]
  )
}
