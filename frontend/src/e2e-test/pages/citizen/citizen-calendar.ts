// SPDX-FileCopyrightText: 2017-2021 City of Espoo
//
// SPDX-License-Identifier: LGPL-2.1-or-later

import FiniteDateRange from 'lib-common/finite-date-range'
import LocalDate from 'lib-common/local-date'
import { UUID } from 'lib-common/types'
import { waitUntilEqual } from '../../utils'
import { Checkbox, Element, Page, Select, TextInput } from '../../utils/page'

export default class CitizenCalendarPage {
  constructor(
    private readonly page: Page,
    private readonly type: 'desktop' | 'mobile'
  ) {}

  #openCalendarActionsModal = this.page.find(
    '[data-qa="open-calendar-actions-modal"]'
  )
  #dayCell = (date: LocalDate) =>
    this.page.find(`[data-qa="${this.type}-calendar-day-${date.formatIso()}"]`)

  async openReservationsModal() {
    if (this.type === 'mobile') {
      await this.#openCalendarActionsModal.click()
      await this.page.find('[data-qa="calendar-action-reservations"]').click()
    } else {
      await this.page.find('[data-qa="open-reservations-modal"]').click()
    }
    return new ReservationsModal(this.page)
  }

  async openAbsencesModal() {
    if (this.type === 'mobile') {
      await this.#openCalendarActionsModal.click()
      await this.page.find('[data-qa="calendar-action-absences"]').click()
    } else {
      await this.page.find('[data-qa="open-absences-modal"]').click()
    }
    return new AbsencesModal(this.page)
  }

  async openDayView(date: LocalDate) {
    await this.#dayCell(date).click()
    return new DayView(this.page)
  }

  async assertReservations(
    date: LocalDate,
    absence: boolean,
    reservations: { startTime: string; endTime: string }[]
  ) {
    await waitUntilEqual(
      () => this.#dayCell(date).find('[data-qa="reservations"]').innerText,
      [
        ...(absence ? ['Poissa'] : []),
        ...reservations.map(
          ({ startTime, endTime }) => `${startTime} – ${endTime}`
        )
      ].join(', ')
    )
  }
}

class ReservationsModal {
  constructor(private readonly page: Page) {}

  #startDateInput = new TextInput(this.page.find('[data-qa="start-date"]'))
  #endDateInput = new TextInput(this.page.find('[data-qa="end-date"]'))
  #repetitionSelect = new Select(this.page.find('[data-qa="repetition"]'))
  #dailyStartTimeInput = new TextInput(
    this.page.find('[data-qa="daily-start-time-0"]')
  )
  #dailyEndTimeInput = new TextInput(
    this.page.find('[data-qa="daily-end-time-0"]')
  )
  #weeklyStartTimeInputs = [0, 1, 2, 3, 4, 5, 6].map(
    (index) =>
      new TextInput(this.page.find(`[data-qa="weekly-${index}-start-time-0"]`))
  )
  #weeklyEndTimeInputs = [0, 1, 2, 3, 4, 5, 6].map(
    (index) =>
      new TextInput(this.page.find(`[data-qa="weekly-${index}-end-time-0"]`))
  )
  #modalSendButton = this.page.find('[data-qa="modal-okBtn"]')

  async createRepeatingDailyReservation(
    dateRange: FiniteDateRange,
    startTime: string,
    endTime: string
  ) {
    await this.#startDateInput.fill(dateRange.start.format())
    await this.#endDateInput.fill(dateRange.end.format())
    await this.#dailyStartTimeInput.fill(startTime)
    await this.#dailyEndTimeInput.fill(endTime)

    await this.#modalSendButton.click()
  }

  async createRepeatingWeeklyReservation(
    dateRange: FiniteDateRange,
    weeklyTimes: { startTime: string; endTime: string }[]
  ) {
    await this.#startDateInput.fill(dateRange.start.format())
    await this.#endDateInput.fill(dateRange.end.format())
    await this.#repetitionSelect.selectOption({ value: 'WEEKLY' })
    await weeklyTimes.reduce(async (promise, { startTime, endTime }, index) => {
      await promise
      await this.#weeklyStartTimeInputs[index].fill(startTime)
      await this.#weeklyEndTimeInputs[index].fill(endTime)
    }, Promise.resolve())

    await this.#modalSendButton.click()
  }
}

class AbsencesModal {
  constructor(private readonly page: Page) {}

  #childCheckbox = (childId: string) =>
    new Checkbox(this.page.find(`[data-qa="child-${childId}"]`))

  #startDateInput = new TextInput(this.page.find('[data-qa="start-date"]'))
  #endDateInput = new TextInput(this.page.find('[data-qa="end-date"]'))
  #absenceChip = (type: string) =>
    new Checkbox(this.page.find(`[data-qa="absence-${type}"]`))
  #modalSendButton = this.page.find('[data-qa="modal-okBtn"]')

  async markAbsence(
    child: { id: string },
    totalChildren: number,
    dateRange: FiniteDateRange,
    absenceType: 'SICKLEAVE' | 'OTHER_ABSENCE' | 'PLANNED_ABSENCE'
  ) {
    await this.deselectChildren(3)
    await this.#childCheckbox(child.id).click()
    await this.#startDateInput.fill(dateRange.start.format())
    await this.#endDateInput.fill(dateRange.end.format())
    await this.#absenceChip(absenceType).click()

    await this.#modalSendButton.click()
  }

  async deselectChildren(n: number) {
    for (let i = 0; i < n; i++) {
      await this.page.findAll('div[data-qa*="child"]').nth(i).click()
    }
  }

  async assertStartDate(text: string) {
    await waitUntilEqual(() => this.#startDateInput.inputValue, text)
  }

  async assertEndDate(text: string) {
    await waitUntilEqual(() => this.#endDateInput.inputValue, text)
  }
}

class DayView {
  constructor(private readonly page: Page) {}

  #root = this.page.find('[data-qa="calendar-dayview"]')
  #editButton = this.#root.find('[data-qa="edit"]')
  #createAbsenceButton = this.#root.find('[data-qa="create-absence"]')

  #reservationsOfChild(childId: UUID) {
    return this.#root.find(`[data-qa="reservations-of-${childId}"]`)
  }

  async assertNoReservation(childId: UUID) {
    await this.#reservationsOfChild(childId)
      .find(`[data-qa="no-reservations"]`)
      .waitUntilVisible()
  }

  async assertReservations(childId: UUID, value: string) {
    const reservations = this.#reservationsOfChild(childId).find(
      `[data-qa="reservations"]`
    )
    await waitUntilEqual(() => reservations.textContent, value)
  }

  async edit() {
    await this.#editButton.click()
    return new DayViewEditor(this.#root)
  }

  async createAbsence() {
    await this.#createAbsenceButton.click()
    return new AbsencesModal(this.page)
  }
}

class DayViewEditor {
  constructor(private readonly root: Element) {}

  #saveButton = this.root.find('[data-qa="save"]')

  #reservationsOfChild(childId: UUID) {
    return this.root.find(`[data-qa="reservations-of-${childId}"]`)
  }

  async fillReservationTimes(
    childId: UUID,
    startTime: string,
    endTime: string
  ) {
    const child = this.#reservationsOfChild(childId)
    await new TextInput(child.find('[data-qa="first-reservation-start"]')).fill(
      startTime
    )
    await new TextInput(child.find('[data-qa="first-reservation-end"]')).fill(
      endTime
    )
  }

  async save() {
    await this.#saveButton.click()
  }
}