// SPDX-FileCopyrightText: 2017-2022 City of Espoo
//
// SPDX-License-Identifier: LGPL-2.1-or-later

import { PlacementType } from 'lib-common/generated/api-types/placement'
import LocalDate from 'lib-common/local-date'

import { insertDefaultServiceNeedOptions, resetDatabase } from '../../dev-api'
import {
  AreaAndPersonFixtures,
  initializeAreaAndPersonData
} from '../../dev-api/data-init'
import {
  careAreaFixture,
  daycare2Fixture,
  daycareFixture,
  daycareGroupFixture,
  EmployeeBuilder,
  enduserChildFixtureJari,
  enduserChildFixtureKaarina,
  enduserChildFixturePorriHatterRestricted,
  Fixture,
  uuidv4
} from '../../dev-api/fixtures'
import { DaycarePlacement } from '../../dev-api/types'
import ChildAttendancePage from '../../pages/mobile/child-attendance-page'
import MobileChildPage from '../../pages/mobile/child-page'
import MobileListPage from '../../pages/mobile/list-page'
import MobileNotePage from '../../pages/mobile/note-page'
import { waitUntilEqual } from '../../utils'
import { pairMobileDevice } from '../../utils/mobile'
import { Page } from '../../utils/page'

let fixtures: AreaAndPersonFixtures
let page: Page
let listPage: MobileListPage
let childPage: MobileChildPage
let childAttendancePage: ChildAttendancePage
let employee: EmployeeBuilder

const group2 = {
  id: uuidv4(),
  name: '#2',
  daycareId: daycareFixture.id,
  startDate: LocalDate.of(2021, 1, 1)
}

beforeEach(async () => {
  await resetDatabase()
  fixtures = await initializeAreaAndPersonData()
  await insertDefaultServiceNeedOptions()

  await Fixture.daycareGroup().with(daycareGroupFixture).save()

  await Fixture.daycareGroup().with(group2).save()

  employee = await Fixture.employee()
    .with({ roles: ['ADMIN'] })
    .save()

  page = await Page.open({ mockedTime: new Date('2022-05-17T13:00Z') })

  listPage = new MobileListPage(page)
  childPage = new MobileChildPage(page)
  childAttendancePage = new ChildAttendancePage(page)
})

async function createPlacements(
  childId: string,
  groupId: string = daycareGroupFixture.id,
  placementType: PlacementType = 'DAYCARE'
) {
  const daycarePlacementFixture = await Fixture.placement()
    .with({
      childId,
      unitId: fixtures.daycareFixture.id,
      type: placementType,
      startDate: LocalDate.of(2021, 5, 1),
      endDate: LocalDate.of(2022, 8, 31)
    })
    .save()
  await Fixture.groupPlacement()
    .with({
      daycarePlacementId: daycarePlacementFixture.data.id,
      daycareGroupId: groupId,
      startDate: daycarePlacementFixture.data.startDate,
      endDate: daycarePlacementFixture.data.endDate
    })
    .save()
  return daycarePlacementFixture.data
}

const createPlacementAndReload = async (
  placementType: PlacementType
): Promise<DaycarePlacement> => {
  const daycarePlacementFixture = await createPlacements(
    fixtures.familyWithTwoGuardians.children[0].id,
    daycareGroupFixture.id,
    placementType
  )

  const mobileSignupUrl = await pairMobileDevice(fixtures.daycareFixture.id)
  await page.goto(mobileSignupUrl)

  return daycarePlacementFixture
}

const checkAbsenceTypeSelectionButtonsExistence = async (
  absenceTypeButtonsExpectedToBeShown: boolean,
  arrivalTime = '08:15',
  departureTime = '16:00'
) => {
  await listPage.selectChild(fixtures.familyWithTwoGuardians.children[0].id)
  await childPage.selectMarkPresentView()
  await childAttendancePage.setTime(arrivalTime)
  await childAttendancePage.selectMarkPresent()
  await childAttendancePage.selectPresentTab()
  await childAttendancePage.selectChildLink(0)
  await childAttendancePage.selectMarkDepartedLink()

  await childAttendancePage.setTime(departureTime)

  if (absenceTypeButtonsExpectedToBeShown) {
    await childAttendancePage.assertMarkAbsenceTypeButtonsAreShown(
      'OTHER_ABSENCE'
    )
    await childAttendancePage.selectMarkAbsentByType('OTHER_ABSENCE')
    await childAttendancePage.selectMarkDepartedWithAbsenceButton()
    await childAttendancePage.assertChildStatusLabelIsShown('Lähtenyt')
  } else {
    await childAttendancePage.assertMarkAbsenceTypeButtonsNotShown()
    await childAttendancePage.selectMarkDepartedButton()
    await childAttendancePage.assertNoChildrenPresentIndicatorIsShown()
  }
}

describe('Child mobile attendances', () => {
  test('Child a full day in daycare placement is not required to mark absence types', async () => {
    await createPlacementAndReload('DAYCARE')
    await checkAbsenceTypeSelectionButtonsExistence(false, '08:00', '16:00')
  })

  test('Child a part day in daycare placement is not required to mark absence types', async () => {
    await createPlacementAndReload('DAYCARE')
    await checkAbsenceTypeSelectionButtonsExistence(false, '08:00', '11:00')
  })

  test('Child a full day in preschool placement is not required to mark absence types', async () => {
    await createPlacementAndReload('PRESCHOOL')
    await checkAbsenceTypeSelectionButtonsExistence(false, '08:00', '16:00')
  })

  test('Child a part day in preschool placement is not required to mark absence types', async () => {
    await createPlacementAndReload('PRESCHOOL')
    await checkAbsenceTypeSelectionButtonsExistence(false, '08:00', '11:00')
  })

  test('Child a full day in preschool daycare placement is not required to mark absence types', async () => {
    await createPlacementAndReload('PRESCHOOL_DAYCARE')
    await checkAbsenceTypeSelectionButtonsExistence(false, '08:00', '16:00')
  })

  test('Child a part day in preschool daycare placement is not required to mark absence types', async () => {
    await createPlacementAndReload('PRESCHOOL_DAYCARE')
    await checkAbsenceTypeSelectionButtonsExistence(false, '08:00', '11:00')
  })

  test('Child a part day in 5yo daycare placement is not required to mark absence types if there is no paid service need set', async () => {
    await createPlacementAndReload('DAYCARE_PART_TIME_FIVE_YEAR_OLDS')
    await checkAbsenceTypeSelectionButtonsExistence(false, '08:00', '11:00')
  })

  test('Child a part day in 5yo daycare placement is required to mark absence types if there is paid service need set', async () => {
    const placement = await createPlacementAndReload(
      'DAYCARE_PART_TIME_FIVE_YEAR_OLDS'
    )
    const sno = await Fixture.serviceNeedOption()
      .with({
        validPlacementType: 'DAYCARE_PART_TIME_FIVE_YEAR_OLDS',
        feeCoefficient: 25.0,
        daycareHoursPerWeek: 40
      })
      .save()

    await Fixture.serviceNeed()
      .with({
        optionId: sno.data.id,
        placementId: placement.id,
        startDate: placement.startDate,
        endDate: placement.endDate,
        confirmedBy: employee.data.id! // eslint-disable-line
      })
      .save()

    await checkAbsenceTypeSelectionButtonsExistence(true, '08:00', '11:00')
  })
})

const assertAttendanceCounts = async (
  coming: number,
  present: number,
  departed: number,
  absent: number,
  total: number
) =>
  await waitUntilEqual(() => listPage.getAttendanceCounts(), {
    coming,
    present,
    departed,
    absent,
    total
  })

describe('Child mobile attendance list', () => {
  test('Child can be marked as present and as departed', async () => {
    const child1 = enduserChildFixtureKaarina.id
    await createPlacements(child1)
    await createPlacements(enduserChildFixturePorriHatterRestricted.id)
    await createPlacements(enduserChildFixtureJari.id, group2.id)

    const mobileSignupUrl = await pairMobileDevice(fixtures.daycareFixture.id)
    await page.goto(mobileSignupUrl)
    await assertAttendanceCounts(3, 0, 0, 0, 3)
    await listPage.selectComingChildren()
    await listPage.selectChild(child1)
    await childPage.selectMarkPresentView()
    await childAttendancePage.setTime('08:00')
    await childAttendancePage.selectMarkPresent()

    await assertAttendanceCounts(2, 1, 0, 0, 3)

    await listPage.selectPresentChildren()
    await listPage.selectChild(child1)
    await childPage.selectMarkDepartedView()
    await childAttendancePage.setTime('14:00')
    await childAttendancePage.selectMarkDepartedButton()

    await assertAttendanceCounts(2, 0, 1, 0, 3)

    await listPage.selectDepartedChildren()
    await listPage.assertChildExists(child1)
  })

  test('Child can be marked as absent for the whole day', async () => {
    const child = enduserChildFixtureKaarina.id
    await createPlacements(child)

    const mobileSignupUrl = await pairMobileDevice(fixtures.daycareFixture.id)
    await page.goto(mobileSignupUrl)

    await listPage.selectChild(child)
    await childPage.selectMarkAbsentView()
    await childAttendancePage.selectMarkAbsentByType('OTHER_ABSENCE')
    await childAttendancePage.selectMarkAbsentButton()
    await childPage.goBack()
    await listPage.selectAbsentChildren()
    await listPage.assertChildExists(child)
  })

  test('Child can be marked present and returned to coming', async () => {
    const child = enduserChildFixtureKaarina.id
    await createPlacements(child)

    const mobileSignupUrl = await pairMobileDevice(fixtures.daycareFixture.id)
    await page.goto(mobileSignupUrl)

    await listPage.selectChild(child)
    await childPage.selectMarkPresentView()
    await childAttendancePage.setTime('08:00')
    await childAttendancePage.selectMarkPresent()

    await listPage.selectPresentChildren()
    await listPage.selectChild(child)
    await childPage.returnToComing()

    await listPage.selectComingChildren()
    await listPage.assertChildExists(child)
  })

  test('User can undo the whole flow of marking present at 08:30 and leaving at 16:00', async () => {
    const child = enduserChildFixtureKaarina.id
    await createPlacements(child)

    const mobileSignupUrl = await pairMobileDevice(fixtures.daycareFixture.id)
    await page.goto(mobileSignupUrl)

    await listPage.selectChild(child)
    await childPage.selectMarkPresentView()
    await childAttendancePage.setTime('08:30')
    await childAttendancePage.selectMarkPresent()

    await listPage.selectPresentChildren()
    await listPage.selectChild(child)
    await childPage.selectMarkDepartedView()
    await childAttendancePage.setTime('16:00')
    await childAttendancePage.selectMarkDepartedButton()

    await listPage.selectDepartedChildren()
    await listPage.selectChild(child)
    await childPage.returnToPresent()
    await childPage.returnToPresent()

    await listPage.selectPresentChildren()
    await listPage.selectChild(child)
    await childPage.returnToComing()

    await listPage.selectComingChildren()
    await listPage.assertChildExists(child)
  })

  test('Child can have multiple attendances in one day', async () => {
    const child = enduserChildFixtureKaarina.id
    await createPlacements(child)

    const mobileSignupUrl = await pairMobileDevice(fixtures.daycareFixture.id)
    await page.goto(mobileSignupUrl)

    await listPage.selectChild(child)
    await childPage.selectMarkPresentView()
    await childAttendancePage.setTime('08:30')
    await childAttendancePage.selectMarkPresent()

    await listPage.selectPresentChildren()
    await listPage.selectChild(child)
    await childPage.selectMarkDepartedView()
    await childAttendancePage.setTime('15:00')
    await childAttendancePage.selectMarkDepartedButton()

    await listPage.selectDepartedChildren()
    await listPage.selectChild(child)
    await childPage.returnToPresent()

    // Cannot overlap previous departure
    await childAttendancePage.setTime('15:00')
    await childAttendancePage.assertMarkPresentButtonDisabled(true)

    await childAttendancePage.setTime('15:15')
    await childAttendancePage.selectMarkPresent()

    await listPage.selectPresentChildren()
    await listPage.selectChild(child)
    await childPage.assertArrivalTimeInfoIsShown(
      'Saapumisaika08:30,Saapumisaika15:15'
    )
    await childPage.assertDepartureTimeInfoIsShown('Lähtöaika15:00')
    await childPage.selectMarkDepartedView()

    await childAttendancePage.setTime('15:15')
    await childAttendancePage.setTimeInfo.assertTextEquals('Saapui 15:15')
    await childAttendancePage.setTime('15:20')
    await childAttendancePage.selectMarkDepartedButton()
  })

  test('Group selector works consistently', async () => {
    const child1 = enduserChildFixtureKaarina.id
    await createPlacements(child1)
    await createPlacements(enduserChildFixturePorriHatterRestricted.id)
    await createPlacements(enduserChildFixtureJari.id, group2.id)

    const mobileSignupUrl = await pairMobileDevice(fixtures.daycareFixture.id)
    await page.goto(mobileSignupUrl)

    await assertAttendanceCounts(3, 0, 0, 0, 3)

    await listPage.selectChild(child1)
    await childPage.selectMarkPresentView()
    await childAttendancePage.setTime('08:00')
    await childAttendancePage.selectMarkPresent()

    await assertAttendanceCounts(2, 1, 0, 0, 3)

    await listPage.selectGroup(group2.id)
    await assertAttendanceCounts(1, 0, 0, 0, 1)

    await listPage.selectGroup('all')
    await assertAttendanceCounts(2, 1, 0, 0, 3)
  })

  test('Group name is visible only when all-group selected', async () => {
    const childId = enduserChildFixtureKaarina.id
    await createPlacements(childId)
    await createPlacements(enduserChildFixturePorriHatterRestricted.id)
    await createPlacements(enduserChildFixtureJari.id, group2.id)

    const mobileSignupUrl = await pairMobileDevice(fixtures.daycareFixture.id)
    await page.goto(mobileSignupUrl)

    await listPage.selectGroup('all')
    await waitUntilEqual(
      () => listPage.readChildGroupName(childId),
      daycareGroupFixture.name.toUpperCase()
    )

    await listPage.selectGroup(daycareGroupFixture.id)
    await waitUntilEqual(() => listPage.readChildGroupName(childId), '')
  })

  test('Child will not be visible in two groups at the same time', async () => {
    const childId = enduserChildFixtureKaarina.id

    await Fixture.daycare()
      .with({ ...daycare2Fixture, areaId: careAreaFixture.id })
      .save()

    const daycareGroup2Fixture = (
      await Fixture.daycareGroup()
        .with({
          id: uuidv4(),
          name: 'testgroup',
          daycareId: daycare2Fixture.id,
          startDate: LocalDate.of(2022, 1, 1)
        })
        .save()
    ).data

    const placement1StartDate = LocalDate.of(2022, 1, 1)
    const placement1EndDate = LocalDate.of(2022, 4, 30)

    const placement2StartDate = LocalDate.of(2022, 5, 1)
    const placement2EndDate = LocalDate.of(2022, 6, 30)

    const daycarePlacementFixture = await Fixture.placement()
      .with({
        childId,
        unitId: fixtures.daycareFixture.id,
        startDate: placement1StartDate,
        endDate: placement1EndDate
      })
      .save()

    const daycarePlacement2Fixture = await Fixture.placement()
      .with({
        childId,
        unitId: daycare2Fixture.id,
        startDate: placement2StartDate,
        endDate: placement2EndDate
      })
      .save()

    await Fixture.groupPlacement()
      .with({
        daycarePlacementId: daycarePlacementFixture.data.id,
        daycareGroupId: daycareGroupFixture.id,
        startDate: placement1StartDate,
        endDate: placement2EndDate
      })
      .save()

    await Fixture.groupPlacement()
      .with({
        daycarePlacementId: daycarePlacement2Fixture.data.id,
        daycareGroupId: daycareGroup2Fixture.id,
        startDate: placement1StartDate,
        endDate: placement2EndDate
      })
      .save()

    await page.goto(await pairMobileDevice(daycareFixture.id))
    await assertAttendanceCounts(0, 0, 0, 0, 0)

    await page.goto(await pairMobileDevice(daycare2Fixture.id))
    await assertAttendanceCounts(1, 0, 0, 0, 1)
  })
})

describe('Notes on child departure page', () => {
  test('All group notes are shown on the child departure page', async () => {
    const child1 = enduserChildFixtureKaarina.id
    await createPlacements(child1)
    await createPlacements(enduserChildFixturePorriHatterRestricted.id)
    await createPlacements(enduserChildFixtureJari.id, group2.id)

    const mobileSignupUrl = await pairMobileDevice(fixtures.daycareFixture.id)
    await page.goto(mobileSignupUrl)

    await listPage.selectChild(child1)
    childPage = new MobileChildPage(page)
    await childPage.openNotes()
    const notePage = new MobileNotePage(page)
    await notePage.selectTab('group')
    await notePage.typeAndSaveStickyNote('This is a group note')
    await notePage.initNewStickyNote()
    await notePage.typeAndSaveStickyNote('This is another group note')
    await notePage.assertStickyNote('This is another group note', 1)

    await page.goto(mobileSignupUrl)
    await listPage.selectComingChildren()
    await listPage.selectChild(child1)
    await childPage.selectMarkPresentView()
    await childAttendancePage.setTime('08:00')
    await childAttendancePage.selectMarkPresent()

    await listPage.selectPresentChildren()
    await listPage.selectChild(child1)
    await childPage.selectMarkDepartedView()
    await waitUntilEqual(() => childAttendancePage.groupNote.count(), 2)
  })
})
