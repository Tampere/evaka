// SPDX-FileCopyrightText: 2017-2022 City of Espoo
//
// SPDX-License-Identifier: LGPL-2.1-or-later

import LocalDate from 'lib-common/local-date'

import config from '../../config'
import { resetDatabase } from '../../dev-api'
import { Fixture } from '../../dev-api/fixtures'
import PersonSearchPage from '../../pages/employee/person-search'
import { Page } from '../../utils/page'
import { employeeLogin } from '../../utils/user'

let adminPage: Page
let adminPersonSearchPage: PersonSearchPage
let serviceWorkerPage: Page
let serviceWorkerPersonSearchPage: PersonSearchPage

beforeEach(async () => {
  await resetDatabase()

  const admin = await Fixture.employeeAdmin().save()
  const serviceWorker = await Fixture.employeeServiceWorker().save()

  adminPage = await Page.open()
  await employeeLogin(adminPage, admin.data)
  await adminPage.goto(`${config.employeeUrl}/search`)
  adminPersonSearchPage = new PersonSearchPage(adminPage)

  serviceWorkerPage = await Page.open()
  await employeeLogin(serviceWorkerPage, serviceWorker.data)
  await serviceWorkerPage.goto(`${config.employeeUrl}/search`)
  serviceWorkerPersonSearchPage = new PersonSearchPage(serviceWorkerPage)
})

describe('SSN disabling', () => {
  test('SSN adding can be disabled for a newly created person', async () => {
    const person = {
      firstName: 'Etunimi',
      lastName: 'Sukunimi',
      dateOfBirth: LocalDate.todayInSystemTz().subDays(30),
      streetAddress: 'Osoite 1',
      postalCode: '02100',
      postOffice: 'Espoo'
    }
    await adminPersonSearchPage.createPerson(person)
    await adminPersonSearchPage.findPerson(person.firstName)
    await adminPersonSearchPage.disableSsnAdding(true)

    await serviceWorkerPersonSearchPage.findPerson(person.firstName)
    await serviceWorkerPersonSearchPage.checkAddSsnButtonVisibility(false)

    await adminPage.reload()
    await adminPersonSearchPage.checkAddSsnButtonVisibility(true)
    await adminPersonSearchPage.disableSsnAdding(false)

    await serviceWorkerPage.reload()
    await serviceWorkerPersonSearchPage.checkAddSsnButtonVisibility(true)
  })
})
