// SPDX-FileCopyrightText: 2017-2021 City of Espoo
//
// SPDX-License-Identifier: LGPL-2.1-or-later

import {
  createDaycareGroupPlacementFixture,
  createDaycarePlacementFixture,
  daycareGroupFixture,
  EmployeeBuilder,
  Fixture,
  uuidv4
} from 'e2e-test-common/dev-api/fixtures'
import { newBrowserContext } from '../../browser'
import { Page } from 'playwright'
import {
  AreaAndPersonFixtures,
  initializeAreaAndPersonData
} from 'e2e-test-common/dev-api/data-init'
import {
  insertDaycareGroupFixtures,
  insertDaycareGroupPlacementFixtures,
  insertDaycarePlacementFixtures,
  insertDefaultServiceNeedOptions,
  resetDatabase
} from 'e2e-test-common/dev-api'
import { pairMobileDevice } from 'e2e-playwright/utils/mobile'
import MobileListPage from 'e2e-playwright/pages/mobile/list-page'
import MobileChildPage from 'e2e-playwright/pages/mobile/child-page'
import ChildAttendancePage from '../../pages/mobile/child-attendance-page'
import { PlacementType } from 'lib-common/generated/api-types/placement'
import { DaycarePlacement } from '../../../e2e-test-common/dev-api/types'

let fixtures: AreaAndPersonFixtures
let page: Page
let listPage: MobileListPage
let childPage: MobileChildPage
let childAttendancePage: ChildAttendancePage
let employee: EmployeeBuilder

beforeEach(async () => {
  await resetDatabase()
  fixtures = await initializeAreaAndPersonData()
  await insertDefaultServiceNeedOptions()

  await insertDaycareGroupFixtures([daycareGroupFixture])
  employee = await Fixture.employee().save()

  page = await (await newBrowserContext()).newPage()
  listPage = new MobileListPage(page)
  childPage = new MobileChildPage(page)
  childAttendancePage = new ChildAttendancePage(page)

  const mobileSignupUrl = await pairMobileDevice(
    employee.data.id!, // eslint-disable-line
    fixtures.daycareFixture.id
  )
  await page.goto(mobileSignupUrl)
})
afterEach(async () => {
  await page.close()
})

const createPlacement = async (
  placementType: PlacementType
): Promise<DaycarePlacement> => {
  const daycarePlacementFixture = createDaycarePlacementFixture(
    uuidv4(),
    fixtures.familyWithTwoGuardians.children[0].id,
    fixtures.daycareFixture.id,
    '2021-05-01', // TODO use dynamic date
    '2022-08-31',
    placementType
  )
  await insertDaycarePlacementFixtures([daycarePlacementFixture])
  const groupPlacementFixture = createDaycareGroupPlacementFixture(
    daycarePlacementFixture.id,
    daycareGroupFixture.id
  )
  await insertDaycareGroupPlacementFixtures([groupPlacementFixture])

  return daycarePlacementFixture
}

const checkAbsentTypeSelectionExistance = async (expectedToExist: boolean) => {
  await listPage.selectChild(fixtures.familyWithTwoGuardians.children[0].id)
  await childPage.selectMarkPresentView()
  await childAttendancePage.selectMarkPresent()
  await childAttendancePage.selectPresentTab()
  await childAttendancePage.selectChildLink(0)
  await childAttendancePage.selectMarkDepartedLink()

  expectedToExist
    ? await childAttendancePage.assertMarkAbsentByTypeButtonExists(
        'OTHER_ABSENCE'
      )
    : await childAttendancePage.assertMarkAbsentByTypeButtonDoesNotExist(
        'OTHER_ABSENCE'
      )
}

describe('Child mobile attendances', () => {
  test('Child in daycare placement is not required to mark absence types if there is no paid service need set', async () => {
    await createPlacement('DAYCARE')
    await checkAbsentTypeSelectionExistance(false)
  })

  test('Child in daycare placement is required to mark absence types if there is paid service need set', async () => {
    const placement = await createPlacement('DAYCARE_PART_TIME_FIVE_YEAR_OLDS')
    const sno = await Fixture.serviceNeedOption()
      .with({
        validPlacementType: 'DAYCARE',
        feeCoefficient: 189.0,
        daycareHoursPerWeek: 40
      })
      .save()

    await Fixture.serviceNeed()
      .with({
        optionId: sno.data.id,
        placementId: placement.id,
        startDate: new Date(placement.startDate),
        endDate: new Date(placement.endDate),
      confirmedBy: employee.data.id!, // eslint-disable-line
      })
      .save()

    await checkAbsentTypeSelectionExistance(true)
  })
})
