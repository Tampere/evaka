// SPDX-FileCopyrightText: 2017-2022 City of Espoo
//
// SPDX-License-Identifier: LGPL-2.1-or-later

import LocalDate from 'lib-common/local-date'
import { UUID } from 'lib-common/types'

export interface PartialFeeAlteration {
  personId: UUID
  type: FeeAlterationType
  amount: number
  isAbsolute: boolean
  validFrom: LocalDate
  validTo: LocalDate | null
  notes: string
}

export const feeAlterationTypes = ['DISCOUNT', 'INCREASE', 'RELIEF'] as const

export type FeeAlterationType = (typeof feeAlterationTypes)[number]
