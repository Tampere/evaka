// SPDX-FileCopyrightText: 2017-2020 City of Espoo
//
// SPDX-License-Identifier: LGPL-2.1-or-later

import React from 'react'
import { Gap } from '@evaka/lib-components/src/white-space'
import { ContentArea } from '@evaka/lib-components/src/layout/Container'
import { H1, H2, P } from '@evaka/lib-components/src/typography'
import { useTranslation } from '~localization'
import { AlertBox } from '@evaka/lib-components/src/molecules/MessageBoxes'
import {
  ApplicationFormDataErrors,
  applicationHasErrors
} from '~applications/editor/validations'
import { getErrorCount } from '~form-validation'
import { FixedSpaceColumn } from '@evaka/lib-components/src/layout/flex-helpers'
import { ApplicationType } from '@evaka/lib-common/src/api-types/application/enums'

type HeadingProps = {
  type: ApplicationType
  firstName: string
  lastName: string
  errors?: ApplicationFormDataErrors
}
export default React.memo(function Heading({
  type,
  firstName,
  lastName,
  errors
}: HeadingProps) {
  const t = useTranslation()
  const infoParagraphs = t.applications.editor.heading.info[type]

  return (
    <ContentArea opaque paddingVertical="L">
      <H1 noMargin data-qa="application-type-title">
        {t.applications.editor.heading.title[type]}
      </H1>

      <H2 data-qa="application-child-name-title">
        {firstName} {lastName}
      </H2>

      {infoParagraphs.map((paragraph, index) => (
        <P
          dangerouslySetInnerHTML={{ __html: paragraph }}
          key={index}
          fitted={index === infoParagraphs.length - 1}
        />
      ))}
      {errors && applicationHasErrors(errors) && (
        <>
          <Gap size="s" />
          <AlertBox
            message={
              <div>
                <span data-qa="application-has-errors-title">
                  {t.applications.editor.heading.hasErrors}
                </span>
                <Gap size="s" />
                <FixedSpaceColumn spacing="xxs">
                  {errors &&
                    Object.keys(errors)
                      .filter((section) => getErrorCount(errors[section]) > 0)
                      .map((section) => (
                        <React.Fragment key={section}>
                          <div>
                            <strong>
                              {/*eslint-disable-next-line @typescript-eslint/no-unsafe-member-access*/}
                              {t.applications.editor[section].title}:{' '}
                            </strong>
                            {t.applications.editor.heading.errors(
                              getErrorCount(errors[section])
                            )}
                          </div>
                        </React.Fragment>
                      ))}
                </FixedSpaceColumn>
              </div>
            }
          />
        </>
      )}
    </ContentArea>
  )
})
