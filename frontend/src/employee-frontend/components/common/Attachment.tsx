// SPDX-FileCopyrightText: 2017-2020 City of Espoo
//
// SPDX-License-Identifier: LGPL-2.1-or-later

import React, { useContext } from 'react'
import styled from 'styled-components'
import {
  faFile,
  faFileImage,
  faFilePdf,
  faFileWord
} from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'

import { ApplicationAttachment } from 'lib-common/api-types/application/ApplicationDetails'
import { FixedSpaceRow } from 'lib-components/layout/flex-helpers'
import FileDownloadButton from 'lib-components/molecules/FileDownloadButton'
import { useTranslation } from '../../state/i18n'
import { UIContext } from '../../state/ui'
import { defaultMargins } from 'lib-components/white-space'
import { Dimmed } from 'lib-components/typography'
import LocalDate from 'lib-common/local-date'
import { getAttachmentBlob } from '../../api/attachments'

const AttachmentContainer = styled.div`
  display: flex;
  justify-content: flex-start;
`

const ReceivedAtText = styled(Dimmed)`
  font-style: italic;
  margin-left: ${defaultMargins.s};
`

interface Props {
  attachment: ApplicationAttachment
  'data-qa': string
  receivedAt: Date
}

const contentTypeIcon = (contentType: string) => {
  switch (contentType) {
    case 'image/jpeg':
    case 'image/png':
      return faFileImage
    case 'application/pdf':
      return faFilePdf
    case 'application/msword':
      return faFileWord
    default:
      return faFile
  }
}

function Attachment({ attachment, 'data-qa': dataQa, receivedAt }: Props) {
  const { i18n } = useTranslation()
  const { setErrorMessage } = useContext(UIContext)

  return (
    <AttachmentContainer className={`attachment`} data-qa={dataQa}>
      <FixedSpaceRow spacing={'xs'} alignItems={'center'}>
        <FontAwesomeIcon
          icon={contentTypeIcon(attachment.contentType)}
          className={'attachment-icon'}
          color={'Dodgerblue'}
        />
        <FileDownloadButton
          file={attachment}
          fileFetchFn={getAttachmentBlob}
          onFileUnavailable={() =>
            setErrorMessage({
              type: 'warning',
              title: i18n.common.fileDownloadError.modalHeader,
              text: i18n.common.fileDownloadError.modalMessage,
              resolveLabel: i18n.common.ok
            })
          }
          data-qa={'attachment-download'}
        />
        <ReceivedAtText data-qa={`attachment-received-at`}>
          {attachment.uploadedByEmployee
            ? i18n.application.attachments.receivedByPaperAt
            : i18n.application.attachments.receivedAt}{' '}
          {LocalDate.fromSystemTzDate(receivedAt).format()}
        </ReceivedAtText>
      </FixedSpaceRow>
    </AttachmentContainer>
  )
}

export default Attachment
