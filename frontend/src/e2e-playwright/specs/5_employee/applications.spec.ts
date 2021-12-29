// SPDX-FileCopyrightText: 2017-2021 City of Espoo
//
// SPDX-License-Identifier: LGPL-2.1-or-later

import config from 'e2e-test-common/config'
import {
  execSimpleApplicationActions,
  insertApplications,
  resetDatabase
} from 'e2e-test-common/dev-api'
import { initializeAreaAndPersonData } from 'e2e-test-common/dev-api/data-init'
import { applicationFixture, Fixture } from 'e2e-test-common/dev-api/fixtures'
import { Family } from 'e2e-test-common/dev-api/types'
import { employeeLogin } from 'e2e-playwright/utils/user'
import EmployeeNav from 'e2e-playwright/pages/employee/employee-nav'
import ApplicationsPage from 'e2e-playwright/pages/employee/applications'
import { Page } from '../../utils/page'

let page: Page
let applicationsPage: ApplicationsPage
let familyWithDeadGuardian: Family

beforeEach(async () => {
  await resetDatabase()
  familyWithDeadGuardian = (await initializeAreaAndPersonData())
    .familyWithDeadGuardian
  await Fixture.employee()
    .with({
      id: config.serviceWorkerAad,
      externalId: `espoo-ad:${config.serviceWorkerAad}`,
      roles: ['SERVICE_WORKER']
    })
    .save()

  page = await Page.open()
  applicationsPage = new ApplicationsPage(page)

  await employeeLogin(page, 'SERVICE_WORKER')
  await page.goto(config.employeeUrl)
  await new EmployeeNav(page).applicationsTab.click()
})

describe('Applications', () => {
  test('Application with a dead applicant has to be manually sent', async () => {
    const application = applicationFixture(
      familyWithDeadGuardian.children[0],
      familyWithDeadGuardian.guardian,
      familyWithDeadGuardian.otherGuardian,
      'DAYCARE'
    )
    await insertApplications([application])
    await execSimpleApplicationActions(application.id, [
      'move-to-waiting-placement',
      'create-default-placement-plan',
      'send-decisions-without-proposal'
    ])

    await applicationsPage.toggleApplicationStatusFilter('ALL')
    await applicationsPage
      .applicationRow(application.id)
      .assertStatus('Odottaa postitusta')
  })

  test('Application with a dead applicant has an indicator for the date of death', async () => {
    const application = applicationFixture(
      familyWithDeadGuardian.children[0],
      familyWithDeadGuardian.guardian,
      familyWithDeadGuardian.otherGuardian,
      'DAYCARE'
    )
    await insertApplications([application])

    await applicationsPage.toggleApplicationStatusFilter('ALL')
    const applicationDetails = await applicationsPage
      .applicationRow(application.id)
      .openApplication()
    await applicationDetails.assertApplicantIsDead()
  })
})
