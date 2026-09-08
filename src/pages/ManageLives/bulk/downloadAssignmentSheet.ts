import { coverAssignmentsForRow } from '@/data/coverPlans'
import type { BulkMemberRow } from '@/data/flexDeal'

export function downloadAssignmentSheet(rows: BulkMemberRow[]) {
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
  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }))
  const link = document.createElement('a')
  link.href = url
  link.download = 'benefit-assignment-sheet.csv'
  link.click()
  URL.revokeObjectURL(url)
}
