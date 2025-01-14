// SPDX-FileCopyrightText: 2017-2022 City of Espoo
//
// SPDX-License-Identifier: LGPL-2.1-or-later

import React, { useContext, useMemo, useRef } from 'react'
import styled from 'styled-components'

import { ChildState, ChildContext } from 'employee-frontend/state/child'
import { combine, Result } from 'lib-common/api'
import { AssistanceNeedResponse } from 'lib-common/generated/api-types/assistanceneed'
import { UUID } from 'lib-common/types'
import { scrollToRef } from 'lib-common/utils/scrolling'
import { useApiState } from 'lib-common/utils/useRestApi'
import Title from 'lib-components/atoms/Title'
import AddButton from 'lib-components/atoms/buttons/AddButton'

import { getAssistanceBasisOptions } from '../../api/child/assistance-needs'
import AssistanceNeedForm from '../../components/child-information/assistance-need/AssistanceNeedForm'
import { useTranslation } from '../../state/i18n'
import { UIContext } from '../../state/ui'
import { renderResult } from '../async-rendering'

import AssistanceNeedRow from './assistance-need/AssistanceNeedRow'

const TitleRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin: 30px 0;

  .title {
    margin: 0;
  }
`

export interface Props {
  id: UUID
  assistanceNeeds: Result<AssistanceNeedResponse[]>
}

export default React.memo(function AssistanceNeed({
  id,
  assistanceNeeds
}: Props) {
  const { i18n } = useTranslation()
  const { permittedActions } = useContext<ChildState>(ChildContext)
  const [assistanceBasisOptions] = useApiState(getAssistanceBasisOptions, [])
  const { uiMode, toggleUiMode } = useContext(UIContext)
  const refSectionTop = useRef(null)

  const duplicate = useMemo(
    () =>
      !!uiMode && uiMode.startsWith('duplicate-assistance-need')
        ? assistanceNeeds
            .map((needs) =>
              needs.find((an) => an.need.id == uiMode.split('_').pop())
            )
            .getOrElse(undefined)
        : undefined,
    [assistanceNeeds, uiMode]
  )

  return renderResult(
    combine(assistanceNeeds, assistanceBasisOptions),
    ([assistanceNeeds, assistanceBasisOptions]) => (
      <div ref={refSectionTop}>
        <TitleRow>
          <Title size={4}>{i18n.childInformation.assistanceNeed.title}</Title>
          {permittedActions.has('CREATE_ASSISTANCE_NEED') && (
            <AddButton
              flipped
              text={i18n.childInformation.assistanceNeed.create}
              onClick={() => {
                toggleUiMode('create-new-assistance-need')
                scrollToRef(refSectionTop)
              }}
              disabled={uiMode === 'create-new-assistance-need'}
              data-qa="assistance-need-create-btn"
            />
          )}
        </TitleRow>
        {uiMode === 'create-new-assistance-need' && (
          <>
            <AssistanceNeedForm
              childId={id}
              assistanceNeeds={assistanceNeeds}
              assistanceBasisOptions={assistanceBasisOptions}
            />
            <div className="separator" />
          </>
        )}
        {duplicate && (
          <>
            <AssistanceNeedForm
              childId={id}
              assistanceNeed={duplicate.need}
              assistanceNeeds={assistanceNeeds}
              assistanceBasisOptions={assistanceBasisOptions}
            />
            <div className="separator" />
          </>
        )}
        {assistanceNeeds.map((assistanceNeed) => (
          <AssistanceNeedRow
            key={assistanceNeed.need.id}
            assistanceNeed={assistanceNeed.need}
            permittedActions={assistanceNeed.permittedActions}
            assistanceNeeds={assistanceNeeds}
            assistanceBasisOptions={assistanceBasisOptions}
            refSectionTop={refSectionTop}
          />
        ))}
      </div>
    )
  )
})
