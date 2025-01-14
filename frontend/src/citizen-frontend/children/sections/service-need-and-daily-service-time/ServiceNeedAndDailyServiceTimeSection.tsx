// SPDX-FileCopyrightText: 2017-2023 City of Espoo
//
// SPDX-License-Identifier: LGPL-2.1-or-later

import React, { useState } from 'react'

import ResponsiveWholePageCollapsible from 'citizen-frontend/children/ResponsiveWholePageCollapsible'
import { useTranslation } from 'citizen-frontend/localization'
import { UUID } from 'lib-common/types'
import { useApiState } from 'lib-common/utils/useRestApi'
import ErrorSegment from 'lib-components/atoms/state/ErrorSegment'
import Spinner from 'lib-components/atoms/state/Spinner'
import { H3 } from 'lib-components/typography'

import DailyServiceTimeTable from './DailyServiceTimeTable'
import ServiceNeedTable from './ServiceNeedTable'
import { getDailyServiceTimes, getServiceNeeds } from './api'

interface ServiceNeedProps {
  childId: UUID
}

export default React.memo(function ServiceNeedAndDailyServiceTimeSection({
  childId
}: ServiceNeedProps) {
  const t = useTranslation()
  const [open, setOpen] = useState(false)
  const [serviceNeedsResponse] = useApiState(
    () => getServiceNeeds(childId),
    [childId]
  )
  const [dailyServiceTimesResponse] = useApiState(
    () => getDailyServiceTimes(childId),
    [childId]
  )

  return (
    <ResponsiveWholePageCollapsible
      title={t.children.serviceNeedAndDailyServiceTime.title}
      open={open}
      toggleOpen={() => setOpen(!open)}
      opaque
      data-qa="collapsible-service-need-and-daily-service-time"
    >
      <H3>{t.children.serviceNeed.title}</H3>
      {serviceNeedsResponse.mapAll({
        failure: () => <ErrorSegment title={t.common.errors.genericGetError} />,
        loading: () => <Spinner />,
        success: (serviceNeeds) => (
          <ServiceNeedTable serviceNeeds={serviceNeeds} />
        )
      })}
      <H3>{t.children.dailyServiceTime.title}</H3>
      {dailyServiceTimesResponse.mapAll({
        failure: () => <ErrorSegment title={t.common.errors.genericGetError} />,
        loading: () => <Spinner />,
        success: (dailyServiceTimes) => (
          <DailyServiceTimeTable dailyServiceTimes={dailyServiceTimes} />
        )
      })}
    </ResponsiveWholePageCollapsible>
  )
})
