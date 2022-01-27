// SPDX-FileCopyrightText: 2017-2021 City of Espoo
//
// SPDX-License-Identifier: LGPL-2.1-or-later

import { waitUntilEqual, waitUntilTrue } from '../../utils'
import { Page, TextInput } from '../../utils/page'

export default class CitizenMessagesPage {
  constructor(private readonly page: Page) {}

  replyButtonTag = 'message-reply-editor-btn'

  #messageReplyContent = new TextInput(
    this.page.find('[data-qa="message-reply-content"]')
  )
  #threadListItem = this.page.find('[data-qa="thread-list-item"]')
  #threadTitle = this.page.find('[data-qa="thread-reader-title"]')
  #inboxEmpty = this.page.find('[data-qa="inbox-empty"]')
  #threadContent = this.page.findAll('[data-qa="thread-reader-content"]')
  #openReplyEditorButton = this.page.find(`[data-qa="${this.replyButtonTag}"]`)
  #sendReplyButton = this.page.find('[data-qa="message-send-btn"]')
  #newMessageButton = this.page.find('[data-qa="new-message-btn"]')
  #sendMessageButton = this.page.find('[data-qa="send-message-btn"]')
  #receiverSelection = this.page.find('[data-qa="select-receiver"]')
  #inputTitle = new TextInput(this.page.find('[data-qa="input-title"]'))
  #inputContent = new TextInput(this.page.find('[data-qa="input-content"]'))

  discardMessageButton = this.page.find('[data-qa="message-discard-btn"]')

  async getMessageCount() {
    return this.#threadContent.count()
  }

  async assertInboxIsEmpty() {
    await this.#inboxEmpty.waitUntilVisible()
  }

  async assertThreadContent(title: string, content: string) {
    await this.#threadListItem.click()
    await waitUntilEqual(() => this.#threadTitle.innerText, title)
    await waitUntilEqual(() => this.#threadContent.elem().innerText, content)
  }

  getThreadAttachmentCount(): Promise<number> {
    return this.page.findAll('[data-qa="attachment"]').count()
  }

  async getThreadCount() {
    return this.page.findAll('[data-qa="thread-list-item"]').count()
  }

  async isEditorVisible() {
    return this.page.find('[data-qa="input-content"]').visible
  }

  async openFirstThreadReplyEditor() {
    await this.#threadListItem.click()
    await this.#openReplyEditorButton.click()
  }

  async discardReplyEditor() {
    await this.discardMessageButton.click()
  }

  async fillReplyContent(content: string) {
    await this.#messageReplyContent.fill(content)
  }

  async assertReplyContentIsEmpty() {
    return waitUntilEqual(() => this.#messageReplyContent.textContent, '')
  }

  async replyToFirstThread(content: string) {
    await this.#threadListItem.click()
    await this.#openReplyEditorButton.click()
    await this.#messageReplyContent.fill(content)
    await this.#sendReplyButton.click()
  }

  async sendNewMessage(title: string, content: string, receivers: string[]) {
    await this.#newMessageButton.click()
    await waitUntilTrue(() => this.isEditorVisible())
    await this.#inputTitle.fill(title)
    await this.#inputContent.fill(content)
    await this.#receiverSelection.click()
    for (const receiver of receivers) {
      await this.page.findTextExact(receiver).click()
    }
    await this.#sendMessageButton.click()
    await waitUntilTrue(() => this.getThreadCount().then((count) => count > 0))
  }
}