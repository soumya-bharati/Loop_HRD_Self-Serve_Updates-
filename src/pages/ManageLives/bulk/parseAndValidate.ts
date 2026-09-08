import { sampleBulkDeleteRows, sampleBulkRows } from '@/data/flexDeal'

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

const ADD_UPLOADED_COLUMNS = [
  'Emp Code',
  'Full Name',
  'First Name',
  'Last Name',
  'Work Email',
  'Personal Email',
  'Birth Date',
  'Date of Joining',
  'Grade',
  'Department',
  'Location',
  'Coverage Tier',
  'Plan Name',
  'Sum Insured',
  'Relation',
  'Gender',
  'Phone Number',
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
  'Full Name': 'Neeru Yadav',
  'First Name': 'Neeru',
  'Last Name': 'Yadav',
  'Work Email': 'neeru.yadav@herbalife.com',
  'Personal Email': 'neeru.y@gmail.com',
  'Birth Date': '12/03/1992',
  'Date of Joining': '01/08/2026',
  'Grade': 'L2',
  'Department': 'Operations',
  'Location': 'Bengaluru',
  'Coverage Tier': 'Gold',
  'Plan Name': 'Parental Plan',
  'Sum Insured': '500000',
  'Relation': 'Self',
  'Gender': 'Female',
  'Phone Number': '9876543210',
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

function employeeCountFor(operation: BulkOperation) {
  if (operation === 'remove') return sampleBulkDeleteRows.length
  return new Set(
    sampleBulkRows
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
): Promise<ColumnDetectionResult> {
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
          sourceColumn: null,
          confidence: 'manual',
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
        id: 'employee-name',
        loopField: 'Employee Name',
        required: true,
        sourceColumn: 'Full Name',
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
        id: 'date-of-birth',
        loopField: 'Date of Birth',
        required: true,
        sourceColumn: 'Birth Date',
        confidence: 'high',
      },
      {
        id: 'grade',
        loopField: 'Grade',
        required: true,
        sourceColumn: 'Grade',
        confidence: 'high',
      },
      {
        id: 'core-cover',
        loopField: 'Coverage Plan',
        required: true,
        sourceColumn: null,
        confidence: 'manual',
        expectedSourceColumn: 'Coverage Tier',
      },
      {
        id: 'relationship',
        loopField: 'Relationship',
        required: false,
        sourceColumn: 'Relation',
        confidence: 'high',
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
): Promise<ParsedSheet> {
  await new Promise((resolve) => window.setTimeout(resolve, 1200))

  return {
    fileName: file.name || 'uploaded-file',
    rowCount:
      operation === 'remove' ? sampleBulkDeleteRows.length : sampleBulkRows.length,
    employeeCount: employeeCountFor(operation),
  }
}
