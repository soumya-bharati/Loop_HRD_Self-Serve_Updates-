import { coverAssignmentsForRow } from '@/data/coverPlans'
import type { BulkMemberRow } from '@/data/flexDeal'

export const assignmentSheetFileName =
  "Loop's Format - Benefits Assignment.csv"

/** The Loop-format sheet handed back to HR, with every life's assigned covers. */
export function buildAssignmentSheet(rows: BulkMemberRow[]) {
  const lines = [
    ['Employee ID', 'Name', 'Relationship', 'Assigned benefits'],
    ...rows.map((row) => [
      row.employeeId,
      row.name,
      row.relationship,
      coverAssignmentsForRow(row, rows)
        .map((item) => `${item.coverName} - ${item.planLabel}`)
        .join('; '),
    ]),
  ]
  const csv = lines
    .map((line) =>
      line.map((value) => `"${String(value).replaceAll('"', '""')}"`).join(','),
    )
    .join('\n')

  return {
    fileName: assignmentSheetFileName,
    csv,
    sizeBytes: new Blob([csv]).size,
  }
}

export function downloadAssignmentSheet(rows: BulkMemberRow[]) {
  const sheet = buildAssignmentSheet(rows)
  const url = URL.createObjectURL(new Blob([sheet.csv], { type: 'text/csv' }))
  const link = document.createElement('a')
  link.href = url
  link.download = sheet.fileName
  link.click()
  URL.revokeObjectURL(url)
}
