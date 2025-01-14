// SPDX-FileCopyrightText: 2017-2022 City of Espoo
//
// SPDX-License-Identifier: LGPL-2.1-or-later

import { Lang } from 'lib-customizations/citizen'

import { waitUntilFalse } from '../../utils'
import { Page } from '../../utils/page'

export type EnvType = 'desktop' | 'mobile'

export default class CitizenHeader {
  constructor(
    private readonly page: Page,
    private readonly type: EnvType = 'desktop'
  ) {}

  #languageMenuToggle = this.page.find('[data-qa="button-select-language"]')
  #languageOptionList = this.page.find('[data-qa="select-lang"]')
  #childrenNav = this.page.findByDataQa(`nav-children-${this.type}`)
  #unreadChildrenCount = this.page.findByDataQa(
    `nav-children-${this.type}-notification-count`
  )
  #subNavMenu = this.page.findByDataQa(`sub-nav-menu-${this.type}`)

  #languageOption(lang: Lang) {
    return this.#languageOptionList.find(`[data-qa="lang-${lang}"]`)
  }

  async #toggleChildrenMenu() {
    return this.#childrenNav.click()
  }

  async selectTab(
    tab:
      | 'applications'
      | 'decisions'
      | 'income'
      | 'calendar'
      | 'messages'
      | 'personal-details'
  ) {
    const isContainedInSubnav = [
      'applications',
      'decisions',
      'income',
      'personal-details'
    ].includes(tab)
    if (isContainedInSubnav) {
      await this.#subNavMenu.click()
      await this.page.findByDataQa(`sub-nav-menu-${tab}`).click()
    } else {
      await this.page.findByDataQa(`nav-${tab}-${this.type}`).click()
    }
  }

  async assertNoTab(
    tab:
      | 'applications'
      | 'decisions'
      | 'income'
      | 'calendar'
      | 'messages'
      | 'personal-details'
  ) {
    const isContainedInSubnav = [
      'applications',
      'decisions',
      'income',
      'personal-details'
    ].includes(tab)
    if (isContainedInSubnav) {
      await this.#subNavMenu.click()
      await this.page.findByDataQa(`sub-nav-menu-${tab}`).waitUntilHidden()
    } else {
      await this.page.findByDataQa(`nav-${tab}-${this.type}`).waitUntilHidden()
    }
  }

  async openChildPage(childId: string) {
    await this.#childrenNav.waitUntilVisible()
    if (await this.#childrenNav.findByDataQa('drop-down-icon').visible) {
      await this.#toggleChildrenMenu()
      await this.page.findByDataQa(`children-menu-${childId}`).click()
    } else {
      await this.#childrenNav.click()
    }
  }

  async selectLanguage(lang: 'fi' | 'sv' | 'en') {
    await this.#languageMenuToggle.click()
    await this.#languageOption(lang).click()
  }

  async listLanguages(): Promise<Record<Lang, boolean>> {
    const isVisible = (lang: Lang) => this.#languageOption(lang).visible
    await this.#languageMenuToggle.click()
    const languages = {
      fi: await isVisible('fi'),
      sv: await isVisible('sv'),
      en: await isVisible('en')
    }
    await this.#languageMenuToggle.click()
    return languages
  }

  async assertDOMLangAttrib(lang: 'fi' | 'sv' | 'en') {
    await this.page.find(`html[lang=${lang}]`).waitUntilVisible()
  }

  async assertSubNavMenuHasText(text: string) {
    await this.page
      .findByDataQa(`sub-nav-menu-${this.type}`)
      .findText(text)
      .waitUntilVisible()
  }

  async checkPersonalDetailsAttentionIndicatorsAreShown() {
    await this.page
      .findByDataQa(`attention-indicator-sub-menu-${this.type}`)
      .waitUntilVisible()
    await this.#subNavMenu.click()
    await this.page
      .findByDataQa('personal-details-notification')
      .waitUntilVisible()
    await this.#subNavMenu.click()
  }

  async assertUnreadChildrenCount(expectedCount: number) {
    await this.#childrenNav.waitUntilVisible()
    expectedCount != 0
      ? await this.#unreadChildrenCount.assertTextEquals(
          expectedCount.toString()
        )
      : await waitUntilFalse(() => this.#unreadChildrenCount.visible)
  }

  async assertChildUnreadCount(childId: string, expectedCount: number) {
    await this.#childrenNav.waitUntilVisible()
    if (await this.#childrenNav.findByDataQa('drop-down-icon').visible) {
      await this.#toggleChildrenMenu()
      const notification = this.page.findByDataQa(
        `children-menu-${childId}-notification-count`
      )
      expectedCount != 0
        ? await notification.assertText(
            (text) => text === expectedCount.toString()
          )
        : await notification.waitUntilHidden()
      await this.#toggleChildrenMenu()
    } else {
      await this.assertUnreadChildrenCount(expectedCount)
    }
  }

  async assertNoChildrenTab() {
    await this.#childrenNav.waitUntilHidden()
  }

  async logout() {
    await this.#subNavMenu.click()
    await this.page.findByDataQa(`sub-nav-menu-logout`).click()
  }
}
