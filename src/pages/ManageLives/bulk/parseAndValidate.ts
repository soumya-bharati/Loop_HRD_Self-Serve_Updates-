import { sampleBulkDeleteRows, sampleBulkRows } from '@/data/flexDeal'

export interface ParsedSheet {
  fileName: string
  rowCount: number
  employeeCount: number
}

function employeeCountFor(operation: 'add' | 'remove') {
  if (operation === 'remove') return sampleBulkDeleteRows.length
  return new Set(
    sampleBulkRows
      .filter((row) => row.relationship === 'Self')
      .map((row) => row.employeeId),
  ).size
}

/**
 * Prototype dummy parse — accepts any file, waits briefly, then returns
 * mock row counts so Bulk Add / Delete can continue into the wizard.
 */
export async function parseSheet(
  file: File,
  operation: 'add' | 'remove' = 'add',
): Promise<ParsedSheet> {
  await new Promise((resolve) => window.setTimeout(resolve, 700))

  return {
    fileName: file.name || 'uploaded-file',
    rowCount:
      operation === 'remove' ? sampleBulkDeleteRows.length : sampleBulkRows.length,
    employeeCount: employeeCountFor(operation),
  }
}
