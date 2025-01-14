// SPDX-FileCopyrightText: 2017-2022 City of Espoo
//
// SPDX-License-Identifier: LGPL-2.1-or-later

import { otherIncome } from 'lib-common/api-types/incomeStatement'

export const attachmentType = [
  ...otherIncome,
  'ALIMONY_PAYOUT',
  'PAYSLIP',
  'STARTUP_GRANT',
  'SALARY',
  'ACCOUNTANT_REPORT',
  'ACCOUNTANT_REPORT_LLC',
  'PROFIT_AND_LOSS_STATEMENT',
  'PROOF_OF_STUDIES',
  'CHILD_INCOME'
] as const

export type AttachmentType = (typeof attachmentType)[number]
