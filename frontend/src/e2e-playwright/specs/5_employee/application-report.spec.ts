// SPDX-FileCopyrightText: 2017-2021 City of Espoo
//
// SPDX-License-Identifier: LGPL-2.1-or-later

import { resetDatabase } from 'e2e-test-common/dev-api'
import {
  AreaAndPersonFixtures,
  initializeAreaAndPersonData
} from 'e2e-test-common/dev-api/data-init'
import { Fixture } from 'e2e-test-common/dev-api/fixtures'
import ReportsPage, { ApplicationsReport } from '../../pages/employee/reports'
import { employeeLogin } from '../../utils/user'
import { Page } from '../../utils/page'
import config from '../../../e2e-test-common/config'
import LocalDate from 'lib-common/local-date'
import EmployeeNav from '../../pages/employee/employee-nav'

let fixtures: AreaAndPersonFixtures
let page: Page
let report: ApplicationsReport

beforeEach(async () => {
  await resetDatabase()
  fixtures = await initializeAreaAndPersonData()

  const careArea = await Fixture.careArea().with({ name: 'Toinen alue' }).save()

  await Fixture.daycare()
    .with({
      name: 'Palvelusetelikoti',
      providerType: 'PRIVATE_SERVICE_VOUCHER'
    })
    .careArea(careArea)
    .save()

  const admin = await Fixture.employeeAdmin().save()

  page = await Page.open()
  await employeeLogin(page, admin.data)

  await page.goto(config.employeeUrl)
  await new EmployeeNav(page).openTab('reports')
  report = await new ReportsPage(page).openApplicationsReport()
})

describe('Reporting - applications', () => {
  test('application report is generated correctly, respecting care area filter', async () => {
    await report.assertContainsArea(fixtures.careAreaFixture.name)
    await report.assertContainsArea('Toinen alue')
    await report.assertContainsServiceProviders([
      'Kunnallinen',
      'Palveluseteli'
    ])

    await report.selectArea('Toinen alue')
    await report.selectDateRangePickerDates(
      LocalDate.today(),
      LocalDate.today()
    )
    await report.assertContainsArea('Toinen alue')
    await report.assertDoesntContainArea(fixtures.careAreaFixture.name)
  })
})