// SPDX-FileCopyrightText: 2017-2022 City of Espoo
//
// SPDX-License-Identifier: LGPL-2.1-or-later

import React, { useCallback, useState } from 'react'
import styled from 'styled-components'

import { postFixedPeriodQuestionnaireAnswer } from 'citizen-frontend/holiday-periods/api'
import { useLang, useTranslation } from 'citizen-frontend/localization'
import FiniteDateRange from 'lib-common/finite-date-range'
import {
  FixedPeriodQuestionnaire,
  FixedPeriodsBody
} from 'lib-common/generated/api-types/holidayperiod'
import { ReservationChild } from 'lib-common/generated/api-types/reservations'
import { formatPreferredName } from 'lib-common/names'
import { UUID } from 'lib-common/types'
import ExternalLink from 'lib-components/atoms/ExternalLink'
import { FixedSpaceColumn } from 'lib-components/layout/flex-helpers'
import { AsyncFormModal } from 'lib-components/molecules/modals/FormModal'
import { H2 } from 'lib-components/typography'

import { PeriodSelector } from './PeriodSelector'

type FormState = FixedPeriodsBody['fixedPeriods']

const initializeForm = (children: ReservationChild[]): FormState =>
  children.reduce((acc, child) => ({ ...acc, [child.id]: null }), {})

interface Props {
  close: () => void
  reload: () => void
  questionnaire: FixedPeriodQuestionnaire
  availableChildren: ReservationChild[]
  eligibleChildren: UUID[]
}

export default React.memo(function FixedPeriodSelectionModal({
  close,
  reload,
  questionnaire,
  availableChildren,
  eligibleChildren
}: Props) {
  const i18n = useTranslation()
  const [lang] = useLang()

  const [fixedPeriods, setFixedPeriods] = useState<FormState>(() =>
    initializeForm(availableChildren)
  )

  const selectPeriod = useCallback(
    (childId: string) => (period: FiniteDateRange | null) =>
      setFixedPeriods((prev) => ({ ...prev, [childId]: period })),
    [setFixedPeriods]
  )

  const onSubmit = useCallback(
    () =>
      postFixedPeriodQuestionnaireAnswer(questionnaire.id, { fixedPeriods }),
    [fixedPeriods, questionnaire.id]
  )
  const closeAndReload = useCallback(() => {
    close()
    reload()
  }, [close, reload])

  return (
    <AsyncFormModal
      mobileFullScreen
      title={questionnaire.title[lang]}
      resolveAction={onSubmit}
      onSuccess={closeAndReload}
      resolveLabel={i18n.common.confirm}
      rejectAction={close}
      rejectLabel={i18n.common.cancel}
    >
      <FixedSpaceColumn>
        <HolidaySection>
          <div>{questionnaire.description[lang]}</div>
          <ExternalLink
            text={i18n.calendar.holidayModal.additionalInformation}
            href={questionnaire.descriptionLink[lang]}
            newTab
          />
        </HolidaySection>
        {availableChildren.map((child) => (
          <HolidaySection
            key={child.id}
            data-qa={`holiday-section-${child.id}`}
          >
            <H2>{formatPreferredName(child)}</H2>
            {eligibleChildren.includes(child.id) ? (
              <PeriodSelector
                label={questionnaire.periodOptionLabel[lang]}
                options={questionnaire.periodOptions}
                value={fixedPeriods[child.id]}
                onSelectPeriod={selectPeriod(child.id)}
              />
            ) : questionnaire.conditions.continuousPlacement ? (
              i18n.calendar.holidayModal.notEligible(
                questionnaire.conditions.continuousPlacement
              )
            ) : null}
          </HolidaySection>
        ))}
      </FixedSpaceColumn>
    </AsyncFormModal>
  )
})

const HolidaySection = styled.div`
  background: white;
`