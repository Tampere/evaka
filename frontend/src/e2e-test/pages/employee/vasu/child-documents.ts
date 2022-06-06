// SPDX-FileCopyrightText: 2017-2022 City of Espoo
//
// SPDX-License-Identifier: LGPL-2.1-or-later

import { waitUntilEqual } from '../../../utils'
import { Collapsible, Page } from '../../../utils/page'

export class ChildDocumentsPage {
  constructor(readonly page: Page) {}

  readonly vasuCollapsible = new Collapsible(
    this.page.find('[data-qa="vasu-and-leops-collapsible"] >> visible=true')
  )
  readonly #vasuRowStateChip = (vasuId: string) =>
    this.page.find(`[data-qa="state-chip-${vasuId}"] >> visible=true`)
  readonly #vasuRowPublishedAt = (vasuId: string) =>
    this.page.find(`[data-qa="published-at-${vasuId}"] >> visible=true`)

  async assertVasuRow(
    vasuId: string,
    expectedStatus: string,
    expectedPublishedAt: string
  ) {
    await waitUntilEqual(
      () => this.#vasuRowStateChip(vasuId).textContent,
      expectedStatus
    )
    await waitUntilEqual(
      () => this.#vasuRowPublishedAt(vasuId).textContent,
      expectedPublishedAt
    )
  }
}
