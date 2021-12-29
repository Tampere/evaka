// SPDX-FileCopyrightText: 2017-2020 City of Espoo
//
// SPDX-License-Identifier: LGPL-2.1-or-later

import config from 'e2e-test-common/config'
import { ApplicationWorkbenchPage } from '../../pages/admin/application-workbench-page'
import {
  AreaAndPersonFixtures,
  initializeAreaAndPersonData
} from 'e2e-test-common/dev-api/data-init'
import { applicationFixture, Fixture } from 'e2e-test-common/dev-api/fixtures'
import {
  cleanUpMessages,
  createPlacementPlan,
  execSimpleApplicationAction,
  getMessages,
  insertApplications,
  resetDatabase,
  runPendingAsyncJobs
} from 'e2e-test-common/dev-api'
import { Application } from 'e2e-test-common/dev-api/types'
import { Page } from '../../utils/page'
import ApplicationDetailsPage from '../../pages/admin/application-details-page'
import ApplicationReadView from '../../pages/employee/applications/application-read-view'
import { employeeLogin } from '../../utils/user'

let page: Page
let applicationWorkbench: ApplicationWorkbenchPage
let applicationDetailsPage: ApplicationDetailsPage
let applicationReadView: ApplicationReadView

let fixtures: AreaAndPersonFixtures

let singleParentApplication: Application
let familyWithTwoGuardiansApplication: Application
let separatedFamilyApplication: Application
let restrictedDetailsGuardianApplication: Application

beforeEach(async () => {
  await resetDatabase()
  fixtures = await initializeAreaAndPersonData()
  singleParentApplication = applicationFixture(
    fixtures.enduserChildFixtureKaarina,
    fixtures.enduserGuardianFixture
  )
  familyWithTwoGuardiansApplication = {
    ...applicationFixture(
      fixtures.familyWithTwoGuardians.children[0],
      fixtures.familyWithTwoGuardians.guardian,
      fixtures.familyWithTwoGuardians.otherGuardian
    ),
    id: '8634e2b9-200b-4a68-b956-66c5126f86a0'
  }
  separatedFamilyApplication = {
    ...applicationFixture(
      fixtures.familyWithSeparatedGuardians.children[0],
      fixtures.familyWithSeparatedGuardians.guardian,
      fixtures.familyWithSeparatedGuardians.otherGuardian,
      'DAYCARE',
      'NOT_AGREED'
    ),
    id: '0c8b9ad3-d283-460d-a5d4-77bdcbc69374'
  }
  restrictedDetailsGuardianApplication = {
    ...applicationFixture(
      fixtures.familyWithRestrictedDetailsGuardian.children[0],
      fixtures.familyWithRestrictedDetailsGuardian.guardian,
      fixtures.familyWithRestrictedDetailsGuardian.otherGuardian,
      'DAYCARE',
      'NOT_AGREED'
    ),
    id: '6a9b1b1e-3fdf-11eb-b378-0242ac130002'
  }
  await Fixture.employee()
    .with({
      externalId: `espoo-ad:${config.unitSupervisorAad}`,
      email: 'esa.esimies@evaka.test',
      firstName: 'Esa',
      lastName: 'Esimies',
      roles: []
    })
    .withDaycareAcl(fixtures.preschoolFixture.id, 'UNIT_SUPERVISOR')
    .save()
  await cleanUpMessages()

  await insertApplications([
    singleParentApplication,
    familyWithTwoGuardiansApplication,
    separatedFamilyApplication,
    restrictedDetailsGuardianApplication
  ])

  page = await Page.open()
  applicationWorkbench = new ApplicationWorkbenchPage(page)
  applicationDetailsPage = new ApplicationDetailsPage(page)
  applicationReadView = new ApplicationReadView(page)
})

describe('Application details', () => {
  test('Admin can view application details', async () => {
    await employeeLogin(page, 'ADMIN')
    await page.goto(config.adminUrl)

    const application = await applicationWorkbench.openApplicationById(
      singleParentApplication.id
    )
    await application.assertGuardianName(
      `${fixtures.enduserGuardianFixture.lastName} ${fixtures.enduserGuardianFixture.firstName}`
    )
  })

  test('Other VTJ guardian is shown as empty if there is no other guardian', async () => {
    await employeeLogin(page, 'ADMIN')
    await page.goto(config.adminUrl)

    const application = await applicationWorkbench.openApplicationById(
      singleParentApplication.id
    )
    await application.assertNoOtherVtjGuardian()
  })

  test('Other VTJ guardian in same address is shown', async () => {
    await employeeLogin(page, 'ADMIN')
    await page.goto(config.adminUrl)

    const application = await applicationWorkbench.openApplicationById(
      familyWithTwoGuardiansApplication.id
    )
    await application.assertVtjGuardianName(
      `${fixtures.familyWithTwoGuardians.otherGuardian.lastName} ${fixtures.familyWithTwoGuardians.otherGuardian.firstName}`
    )
    await application.assertOtherGuardianSameAddress(true)
  })

  test('Other VTJ guardian in different address is shown', async () => {
    await employeeLogin(page, 'ADMIN')
    await page.goto(config.adminUrl)

    const application = await applicationWorkbench.openApplicationById(
      separatedFamilyApplication.id
    )
    await application.assertVtjGuardianName(
      `${fixtures.familyWithSeparatedGuardians.otherGuardian.lastName} ${fixtures.familyWithSeparatedGuardians.otherGuardian.firstName}`
    )
    await application.assertOtherGuardianSameAddress(false)
    await application.assertOtherGuardianAgreementStatus(false)
  })

  test('Decision is not sent automatically to the other guardian if the first guardian has restricted details enabled', async () => {
    await execSimpleApplicationAction(
      restrictedDetailsGuardianApplication.id,
      'move-to-waiting-placement'
    )
    await createPlacementPlan(restrictedDetailsGuardianApplication.id, {
      unitId: fixtures.preschoolFixture.id,
      period: {
        start:
          restrictedDetailsGuardianApplication.form.preferences.preferredStartDate?.formatIso() ??
          '',
        end:
          restrictedDetailsGuardianApplication.form.preferences.preferredStartDate?.formatIso() ??
          ''
      }
    })
    await execSimpleApplicationAction(
      restrictedDetailsGuardianApplication.id,
      'send-decisions-without-proposal'
    )

    await employeeLogin(page, 'UNIT_SUPERVISOR')
    await applicationReadView.navigateToApplication(
      restrictedDetailsGuardianApplication.id
    )
    await applicationDetailsPage.assertApplicationStatus(
      'Vahvistettavana huoltajalla'
    )

    await runPendingAsyncJobs()
    const messages = await getMessages()
    expect(messages.length).toEqual(1)
    expect(messages[0].ssn).toEqual(
      fixtures.familyWithRestrictedDetailsGuardian.guardian.ssn
    )
  })

  test('Supervisor can read an accepted application although the supervisors unit is not a preferred unit before and after accepting the decision', async () => {
    await execSimpleApplicationAction(
      singleParentApplication.id,
      'move-to-waiting-placement'
    )
    await createPlacementPlan(singleParentApplication.id, {
      unitId: fixtures.preschoolFixture.id,
      period: {
        start:
          singleParentApplication.form.preferences.preferredStartDate?.formatIso() ??
          '',
        end:
          singleParentApplication.form.preferences.preferredStartDate?.formatIso() ??
          ''
      }
    })
    await execSimpleApplicationAction(
      singleParentApplication.id,
      'send-decisions-without-proposal'
    )

    await employeeLogin(page, 'UNIT_SUPERVISOR')
    await applicationReadView.navigateToApplication(singleParentApplication.id)
    await applicationDetailsPage.assertApplicationStatus(
      'Vahvistettavana huoltajalla'
    )
    await applicationReadView.acceptDecision('DAYCARE')
    await applicationDetailsPage.assertApplicationStatus('Paikka vastaanotettu')
  })
})