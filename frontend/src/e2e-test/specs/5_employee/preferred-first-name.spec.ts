// SPDX-FileCopyrightText: 2017-2022 City of Espoo
//
// SPDX-License-Identifier: LGPL-2.1-or-later

import config from '../../config'
import { resetDatabase } from '../../dev-api'
import { Fixture } from '../../dev-api/fixtures'
import { EmployeeDetail } from '../../dev-api/types'
import EmployeeNav from '../../pages/employee/employee-nav'
import { EmployeePreferredFirstNamePage } from '../../pages/employee/employee-preferred-first-name'
import { waitUntilEqual } from '../../utils'
import { Page } from '../../utils/page'
import { employeeLogin } from '../../utils/user'

let admin: EmployeeDetail
let page: Page
let nav: EmployeeNav
let employeePreferredFirstNamePage: EmployeePreferredFirstNamePage
const firstName = 'Matti-Teppo Seppo'

beforeEach(async () => {
  await resetDatabase()
  admin = (
    await Fixture.employeeAdmin()
      .with({
        firstName
      })
      .save()
  ).data

  page = await Page.open()
  await employeeLogin(page, admin)
  await page.goto(config.employeeUrl)
  nav = new EmployeeNav(page)
  employeePreferredFirstNamePage = new EmployeePreferredFirstNamePage(page)
  await nav.openAndClickDropdownMenuItem('preferred-first-name')
})

describe('Employee preferred first name', () => {
  test('preferred first name can be set', async () => {
    await employeePreferredFirstNamePage.assertSelectedPreferredFirstName(
      'Matti-Teppo'
    )
    await employeePreferredFirstNamePage.assertPreferredFirstNameOptions([
      'Matti-Teppo',
      'Matti',
      'Teppo',
      'Seppo'
    ])

    await employeePreferredFirstNamePage.preferredFirstName('Teppo')
    await employeePreferredFirstNamePage.confirm()
    await waitUntilEqual(
      () => page.findByDataQa('username').textContent,
      'Teppo Sorsa'
    )

    await employeePreferredFirstNamePage.assertSelectedPreferredFirstName(
      'Teppo'
    )
  })
})