// SPDX-FileCopyrightText: 2017-2021 City of Espoo
//
// SPDX-License-Identifier: LGPL-2.1-or-later

import config from 'e2e-test-common/config'
import {
  clearBulletins,
  deleteEmployeeFixture,
  insertDaycareGroupFixtures,
  insertDaycareGroupPlacementFixtures,
  insertDaycarePlacementFixtures,
  insertEmployeeFixture,
  setAclForDaycares
} from 'e2e-test-common/dev-api'
import {
  AreaAndPersonFixtures,
  initializeAreaAndPersonData
} from 'e2e-test-common/dev-api/data-init'
import {
  createDaycareGroupPlacementFixture,
  createDaycarePlacementFixture,
  daycareGroupFixture,
  uuidv4
} from 'e2e-test-common/dev-api/fixtures'
import {
  DaycareGroupPlacement,
  DaycarePlacement
} from 'e2e-test-common/dev-api/types'
import { enduserRole } from '../../config/users'
import ChildInformationPage from '../../pages/employee/child-information/child-information-page'
import EmployeeHome from '../../pages/employee/home'
import { logConsoleMessages } from '../../utils/fixture'

const home = new EmployeeHome()

let fixtures: AreaAndPersonFixtures
let cleanUp: () => Promise<void>
let daycarePlacementFixture: DaycarePlacement
let daycareGroupPlacementFixture: DaycareGroupPlacement

fixture('Sending and receiving bulletins')
  .meta({ type: 'regression', subType: 'bulletins' })
  .before(async () => {
    ;[fixtures, cleanUp] = await initializeAreaAndPersonData()
    await insertEmployeeFixture({
      externalId: config.supervisorExternalId,
      firstName: 'Seppo',
      lastName: 'Sorsa',
      email: 'seppo.sorsa@espoo.fi',
      roles: []
    })
    await setAclForDaycares(
      config.supervisorExternalId,
      fixtures.daycareFixture.id
    )
    await insertDaycareGroupFixtures([daycareGroupFixture])

    daycarePlacementFixture = createDaycarePlacementFixture(
      uuidv4(),
      fixtures.enduserChildFixtureJari.id,
      fixtures.daycareFixture.id
    )
    await insertDaycarePlacementFixtures([daycarePlacementFixture])

    daycareGroupPlacementFixture = createDaycareGroupPlacementFixture(
      daycarePlacementFixture.id,
      daycareGroupFixture.id
    )
    await insertDaycareGroupPlacementFixtures([daycareGroupPlacementFixture])
  })
  .afterEach(async (t) => {
    await logConsoleMessages(t)
    await clearBulletins()
  })
  .after(async () => {
    await deleteEmployeeFixture(config.supervisorExternalId)
    await cleanUp()
  })

test('Supervisor sends a bulletin and guardian reads it', async (t) => {
  // login as a citizen first to init data in guardian table
  await t.useRole(enduserRole)

  await t.navigateTo(config.adminUrl)
  await home.login({
    aad: config.supervisorAad,
    roles: []
  })
  await home.navigateToMessages()

  // TODO test implementation
})

const employeeHome = new EmployeeHome()
const childInformationPage = new ChildInformationPage()

test('Admin sends a bulletin and blocked guardian does not get it', async (t) => {
  // login as a citizen first to init data in guardian table
  await t.useRole(enduserRole)

  await t.navigateTo(config.adminUrl)
  await home.login({
    aad: config.supervisorAad,
    roles: ['ADMIN']
  })
  await home.navigateToMessages()

  await employeeHome.navigateToChildInformation(
    fixtures.enduserChildFixtureJari.id
  )

  await childInformationPage.openChildMessageBlocklistCollapsible()
  await childInformationPage.clickBlockListForParent(
    fixtures.enduserGuardianFixture.id
  )

  await t.navigateTo(config.adminUrl)
  await home.navigateToMessages()

  // TODO test implementation
})
