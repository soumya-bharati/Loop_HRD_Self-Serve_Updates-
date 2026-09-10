import {
  sampleBulkDeleteRowsForPrototype,
  sampleBulkRowsForPrototype,
} from '@/data/flexDeal'

export type BulkOperation = 'add' | 'remove'

export interface ParsedSheet {
  fileName: string
  rowCount: number
  employeeCount: number
}

export interface ColumnMapping {
  id: string
  loopField: string
  required: boolean
  sourceColumn: string | null
  confidence: 'high' | 'manual'
  expectedSourceColumn?: string
}

export interface ColumnDetectionResult {
  uploadedColumns: string[]
  sampleValues: Record<string, string>
  mappings: ColumnMapping[]
}

export type DetectSheetOptions = {
  includeErrors?: boolean
}

export type ParseSheetOptions = {
  includeErrors?: boolean
}

const ADD_UPLOADED_COLUMNS = [
  'Emp Code',
  'Member Name',
  'Full Name',
  'Relation',
  'Gender',
  'Date of Joining',
  'Birth Date',
  'CTC',
  'Mobile',
  'Phone Number',
  'Work Email',
  'Marital Status',
  'Emp Type',
  'Department',
  'Location',
] as const

const REMOVE_UPLOADED_COLUMNS = [
  'Staff ID',
  'Employee Name',
  'Exit Date',
  'Last Working Day',
  'Relieve Date',
  'Remove Record',
  'Reason for Exit',
  'Confirm Flag',
  'Department',
] as const

const ADD_SAMPLE_VALUES: Record<string, string> = {
  'Emp Code': 'EMP-1001',
  'Member Name': 'Neeru Yadav',
  'Full Name': 'Neeru Yadav',
  'Relation': 'Father',
  'Gender': 'Female',
  'Date of Joining': '2026-08-01',
  'Birth Date': '12/03/1992',
  'CTC': '8L',
  'Mobile': '+91 98765 43210',
  'Phone Number': '9876543210',
  'Work Email': 'neeru.yadav@herbalife.com',
  'Marital Status': 'Married',
  'Emp Type': 'Permanent',
  'Department': 'Operations',
  'Location': 'Bengaluru',
}

const REMOVE_SAMPLE_VALUES: Record<string, string> = {
  'Staff ID': 'EMP-20487',
  'Employee Name': 'Rahul Sharma',
  'Exit Date': '10/08/2026',
  'Last Working Day': '09/08/2026',
  'Relieve Date': '10/08/2026',
  'Remove Record': 'Yes',
  'Reason for Exit': 'Resignation',
  'Confirm Flag': 'Y',
  'Department': 'Sales',
}

function employeeCountFor(operation: BulkOperation, includeErrors: boolean) {
  if (operation === 'remove') {
    return sampleBulkDeleteRowsForPrototype(includeErrors).length
  }
  return new Set(
    sampleBulkRowsForPrototype(includeErrors)
      .filter((row) => row.relationship === 'Self')
      .map((row) => row.employeeId),
  ).size
}

/**
 * Prototype-only column detection. Most fields are confidently auto-mapped,
 * while one field deliberately needs confirmation so the recovery flow can be
 * exercised without parsing the real workbook.
 */
export async function detectSheetColumns(
  operation: BulkOperation = 'add',
  options: DetectSheetOptions = {},
): Promise<ColumnDetectionResult> {
  const includeErrors = options.includeErrors !== false
  await new Promise((resolve) => window.setTimeout(resolve, 1600))

  if (operation === 'remove') {
    return {
      uploadedColumns: [...REMOVE_UPLOADED_COLUMNS],
      sampleValues: REMOVE_SAMPLE_VALUES,
      mappings: [
        {
          id: 'employee-id',
          loopField: 'Employee ID',
          required: true,
          sourceColumn: 'Staff ID',
          confidence: 'high',
        },
        {
          id: 'date-of-leaving',
          loopField: 'Date of Leaving',
          required: true,
          sourceColumn: includeErrors ? null : 'Exit Date',
          confidence: includeErrors ? 'manual' : 'high',
          expectedSourceColumn: 'Exit Date',
        },
        {
          id: 'confirm-delete',
          loopField: 'Confirm Delete',
          required: true,
          sourceColumn: 'Remove Record',
          confidence: 'high',
        },
      ],
    }
  }

  return {
    uploadedColumns: [...ADD_UPLOADED_COLUMNS],
    sampleValues: ADD_SAMPLE_VALUES,
    mappings: [
      {
        id: 'employee-id',
        loopField: 'Employee ID',
        required: true,
        sourceColumn: 'Emp Code',
        confidence: 'high',
      },
      {
        id: 'member-name',
        loopField: 'Member Name',
        required: true,
        sourceColumn: 'Member Name',
        confidence: 'high',
      },
      {
        id: 'relationship',
        loopField: 'Relationship',
        required: true,
        sourceColumn: 'Relation',
        confidence: 'high',
      },
      {
        id: 'gender',
        loopField: 'Gender',
        required: true,
        sourceColumn: 'Gender',
        confidence: 'high',
      },
      {
        id: 'date-of-joining',
        loopField: 'Date of Joining',
        required: true,
        sourceColumn: 'Date of Joining',
        confidence: 'high',
      },
      {
        id: 'date-of-birth',
        loopField: 'Date of Birth',
        required: true,
        sourceColumn: 'Birth Date',
        confidence: 'high',
      },
      {
        id: 'ctc',
        loopField: 'CTC',
        required: true,
        sourceColumn: 'CTC',
        confidence: 'high',
      },
      {
        id: 'mobile',
        loopField: 'Mobile',
        required: true,
        sourceColumn: 'Mobile',
        confidence: 'high',
      },
      {
        id: 'email',
        loopField: 'Email',
        required: true,
        sourceColumn: 'Work Email',
        confidence: 'high',
      },
      {
        id: 'marital-status',
        loopField: 'Marital Status',
        required: true,
        sourceColumn: 'Marital Status',
        confidence: 'high',
      },
      {
        id: 'employee-type',
        loopField: 'Employee Type',
        required: true,
        sourceColumn: includeErrors ? null : 'Emp Type',
        confidence: includeErrors ? 'manual' : 'high',
        expectedSourceColumn: 'Emp Type',
      },
    ],
  }
}

/**
 * Prototype dummy parse — accepts any file, waits briefly, then returns
 * mock row counts so Bulk Add / Delete can continue into the wizard.
 */
export async function parseSheet(
  file: File,
  operation: BulkOperation = 'add',
  options: ParseSheetOptions = {},
): Promise<ParsedSheet> {
  const includeErrors = options.includeErrors !== false
  await new Promise((resolve) => window.setTimeout(resolve, 1200))

  const rows =
    operation === 'remove'
      ? sampleBulkDeleteRowsForPrototype(includeErrors)
      : sampleBulkRowsForPrototype(includeErrors)

  return {
    fileName: file.name || 'uploaded-file',
    rowCount: rows.length,
    employeeCount: employeeCountFor(operation, includeErrors),
  }
}
