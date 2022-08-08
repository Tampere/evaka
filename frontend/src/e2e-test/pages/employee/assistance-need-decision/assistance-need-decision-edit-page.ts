// SPDX-FileCopyrightText: 2017-2022 City of Espoo
//
// SPDX-License-Identifier: LGPL-2.1-or-later

import { waitUntilEqual } from '../../../utils'
import { Page, TextInput, Combobox } from '../../../utils/page'

export default class AssistanceNeedDecisionEditPage {
  constructor(private readonly page: Page) {}

  readonly #decisionMakerSelect = this.page.findByDataQa(
    'decision-maker-select'
  )

  pedagogicalMotivationInput = new TextInput(
    this.page.findByDataQa('pedagogical-motivation-field')
  )
  guardiansHeardOnInput = new TextInput(
    this.page.findByDataQa('guardians-heard-on')
  )

  async assertDeciderSelectVisible() {
    await this.#decisionMakerSelect.waitUntilVisible()
  }

  async assertDecisionStatus(status: string) {
    await waitUntilEqual(
      () => this.page.findByDataQa('decision-status').innerText,
      status
    )
  }

  async assertDecisionNumber(decisionNumber: number | null) {
    await waitUntilEqual(
      () => this.page.findByDataQa('decision-number').innerText,
      `${decisionNumber ?? 'null'}`
    )
  }

  async waitUntilSaved(): Promise<void> {
    await waitUntilEqual(
      () =>
        this.page
          .findByDataQa('autosave-indicator')
          .getAttribute('data-status'),
      'clean'
    )
  }

  async clickPreviewButton(): Promise<void> {
    await this.page.findByDataQa('preview-button').click()
  }

  async clickLeavePageButton(): Promise<void> {
    await this.page.findByDataQa('leave-page-button').click()
  }

  async selectLanguage(lang: string): Promise<void> {
    await new Combobox(
      this.page.findByDataQa('language-select')
    ).fillAndSelectFirst(lang)
  }

  async assertPageTitle(title: string): Promise<void> {
    await waitUntilEqual(
      () => this.page.findByDataQa('page-title').innerText,
      title
    )
  }

  async selectUnit(unit: string): Promise<void> {
    await new Combobox(
      this.page.findByDataQa('unit-select')
    ).fillAndSelectFirst(unit)
  }

  async fillDecisionMaker(name: string, title: string): Promise<void> {
    await this.fillEmployee('decision-maker', name, title)
  }

  async fillPreparator(name: string, title: string): Promise<void> {
    await this.fillEmployee('prepared-by-1', name, title)
  }

  private async fillEmployee(
    selector: string,
    name: string,
    title: string
  ): Promise<void> {
    await new Combobox(
      this.page.findByDataQa(`${selector}-select`)
    ).fillAndSelectFirst(name)
    await new TextInput(this.page.findByDataQa(`${selector}-title`)).fill(title)
  }
}
