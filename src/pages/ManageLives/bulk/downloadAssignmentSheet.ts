import { coverAssignmentsForRow } from '@/data/coverPlans'
import { validationIssuesFor, type BulkMemberRow } from '@/data/flexDeal'

export const assignmentSheetFileName =
  "Loop's Format - Benefits Assignment.csv"

export const issuesSheetFileName = 'Lives with issues.csv'
export const deletionSheetFileName = "Loop's Format - Deletion Review.csv"

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

/** The deletion review sheet lists who leaves, when, and which covers end. */
export function buildDeletionSheet(rows: BulkMemberRow[]) {
  const lines = [
    [
      'Employee ID',
      'Name',
      'Date of Leaving',
      'Removed from',
      'Insurer refund',
      'Employee refund',
    ],
    ...rows.map((row) => [
      row.employeeId,
      row.name,
      row.dateOfLeaving ?? '',
      coverAssignmentsForRow(row, rows)
        .map((item) => item.coverName)
        .join('; '),
      String(row.insurerRefund ?? 0),
      String(row.payrollRefund ?? 0),
    ]),
  ]
  const csv = toCsv(lines)
  return {
    fileName: deletionSheetFileName,
    csv,
    sizeBytes: new Blob([csv]).size,
  }
}

export function downloadDeletionSheet(rows: BulkMemberRow[]) {
  const sheet = buildDeletionSheet(rows)
  const url = URL.createObjectURL(new Blob([sheet.csv], { type: 'text/csv' }))
  const link = document.createElement('a')
  link.href = url
  link.download = sheet.fileName
  link.click()
  URL.revokeObjectURL(url)
}

function toCsv(lines: string[][]) {
  return lines
    .map((line) =>
      line.map((value) => `"${String(value).replaceAll('"', '""')}"`).join(','),
    )
    .join('\n')
}

/** One row per open issue so HR can share or fix them offline. */
export function downloadIssuesSheet(rows: BulkMemberRow[]) {
  const lines = [
    ['Employee ID', 'Name', 'Relationship', 'Field', 'Issue'],
    ...rows.flatMap((row) =>
      validationIssuesFor(row).map((issue) => [
        row.employeeId,
        row.name,
        row.relationship,
        issue.field,
        issue.error,
      ]),
    ),
  ]
  const url = URL.createObjectURL(
    new Blob([toCsv(lines)], { type: 'text/csv' }),
  )
  const link = document.createElement('a')
  link.href = url
  link.download = issuesSheetFileName
  link.click()
  URL.revokeObjectURL(url)
}
