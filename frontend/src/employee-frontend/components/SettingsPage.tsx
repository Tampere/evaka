// SPDX-FileCopyrightText: 2017-2021 City of Espoo
//
// SPDX-License-Identifier: LGPL-2.1-or-later

import { useTranslation } from 'employee-frontend/state/i18n'
import { Failure, Loading, Result, Success } from 'lib-common/api'
import {
  settings as options,
  SettingType
} from 'lib-common/generated/api-types/setting'
import { JsonOf } from 'lib-common/json'
import { useRestApi } from 'lib-common/utils/useRestApi'
import AsyncButton from 'lib-components/atoms/buttons/AsyncButton'
import InputField from 'lib-components/atoms/form/InputField'
import { Container, ContentArea } from 'lib-components/layout/Container'
import { Table, Tbody, Td, Th, Thead, Tr } from 'lib-components/layout/Table'
import ExpandingInfo from 'lib-components/molecules/ExpandingInfo'
import { H1 } from 'lib-components/typography'
import { defaultMargins } from 'lib-components/white-space'
import React, { useEffect, useState } from 'react'
import { client } from '../api/client'
import { renderResult } from './async-rendering'

type Settings = Record<SettingType, string>

const defaultValues = options.reduce(
  (prev, curr) => ({ ...prev, [curr]: '' }),
  {}
)

async function getSettings(): Promise<Result<Settings>> {
  return client
    .get<JsonOf<Settings>>('/settings')
    .then((res) => Success.of({ ...defaultValues, ...res.data }))
    .catch((e) => Failure.fromError(e))
}

async function putSettings(settings: Partial<Settings>): Promise<Result<void>> {
  return client
    .put<JsonOf<Settings>>(`/settings`, settings)
    .then(() => Success.of())
    .catch((e) => Failure.fromError(e))
}

export default React.memo(function SettingsPage() {
  const { i18n } = useTranslation()

  const [settings, setSettings] = useState<Result<Settings>>(Loading.of())
  const loadSettings = useRestApi(getSettings, setSettings)
  useEffect(loadSettings, [loadSettings])

  const submit = async () => {
    if (!settings.isSuccess) return

    return await putSettings(
      Object.fromEntries(
        Object.entries(settings.value)
          .map(([key, value]) => [key, value.trim()])
          .filter(([_, value]) => value !== '')
      )
    )
  }

  return (
    <Container verticalMargin={defaultMargins.L}>
      <ContentArea opaque>
        <H1>{i18n.settings.title}</H1>
        {renderResult(settings, (settings) => (
          <Table>
            <Thead>
              <Tr>
                <Th>{i18n.settings.key}</Th>
                <Th>{i18n.settings.value}</Th>
              </Tr>
            </Thead>
            <Tbody>
              {options.map((option) => (
                <Tr key={option}>
                  <Td>
                    <ExpandingInfo
                      info={i18n.settings.options[option].description}
                      ariaLabel={i18n.common.openExpandingInfo}
                      fullWidth={true}
                    >
                      {i18n.settings.options[option].title}
                    </ExpandingInfo>
                  </Td>
                  <Td>
                    <InputField
                      value={settings[option]}
                      onChange={(value) =>
                        setSettings((prevState) =>
                          prevState.map((prevSettings) => ({
                            ...prevSettings,
                            [option]: value
                          }))
                        )
                      }
                    />
                  </Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        ))}
        <AsyncButton
          primary
          text={i18n.common.save}
          onClick={submit}
          // eslint-disable-next-line @typescript-eslint/no-empty-function
          onSuccess={() => {}}
        />
      </ContentArea>
    </Container>
  )
})