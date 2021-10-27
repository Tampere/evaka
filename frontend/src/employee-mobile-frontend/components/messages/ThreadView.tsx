// SPDX-FileCopyrightText: 2017-2021 City of Espoo
//
// SPDX-License-Identifier: LGPL-2.1-or-later

import styled from 'styled-components'
import colors from 'lib-customizations/common'
import { defaultMargins } from 'lib-components/white-space'
import { fontWeights } from 'lib-components/typography'
import {
  Message,
  MessageThread
} from 'lib-common/generated/api-types/messaging'
import { formatTime } from 'lib-common/date'
import React, { useCallback, useContext } from 'react'
import { MessageContext } from '../../state/messages'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faArrowLeft, faArrowRight } from 'lib-icons'
import InputField from 'lib-components/atoms/form/InputField'
import { ThreadContainer } from 'lib-components/molecules/ThreadListItem'
import { useTranslation } from '../../state/i18n'

interface ThreadViewProps {
  thread: MessageThread
  onBack: () => void
}

export const ThreadView = React.memo(function ThreadView({
  thread: { id: threadId, messages, title },
  onBack
}: ThreadViewProps) {
  const { i18n } = useTranslation()

  const { getReplyContent, sendReply, selectedAccount, setReplyContent } =
    useContext(MessageContext)

  const onUpdateContent = useCallback(
    (content) => setReplyContent(threadId, content),
    [setReplyContent, threadId]
  )

  const onSubmitReply = () => {
    replyContent.length > 0 &&
      selectedAccount?.id &&
      sendReply({
        content: replyContent,
        messageId: messages.slice(-1)[0].id,
        recipientAccountIds: messages
          .slice(-1)[0]
          .recipients.map((item) => item.id),
        accountId: selectedAccount.id
      })
  }

  const replyContent = getReplyContent(threadId)

  return (
    <ThreadViewMobile>
      <ThreadViewTopbar onClick={onBack}>
        <FontAwesomeIcon
          icon={faArrowLeft}
          color={colors.blues.dark}
          height={defaultMargins.s}
        />
        <ThreadViewTitle>{title}</ThreadViewTitle>
      </ThreadViewTopbar>
      {messages.map((message) => (
        <SingleMessage key={message.id} message={message} />
      ))}
      <ThreadViewReply>
        <InputField
          value={replyContent}
          onChange={onUpdateContent}
          className={'thread-view-input'}
          wrapperClassName={'thread-view-input-wrapper'}
          placeholder={i18n.messages.inputPlaceholder}
        />
        <RoundIconButton
          onClick={onSubmitReply}
          disabled={replyContent.length === 0}
        >
          <FontAwesomeIcon icon={faArrowRight} />
        </RoundIconButton>
      </ThreadViewReply>
    </ThreadViewMobile>
  )
})

function SingleMessage({ message }: { message: Message }) {
  return (
    <MessageContainer ours={false}>
      <TitleRow>
        <SenderName>{message.sender.name}</SenderName>
        <SentDate>{formatTime(message.sentAt)}</SentDate>
      </TitleRow>
      <MessageContent data-qa="thread-reader-content">
        {message.content}
      </MessageContent>
    </MessageContainer>
  )
}

const RoundIconButton = styled.button`
  width: ${defaultMargins.L};
  height: ${defaultMargins.L};
  min-width: ${defaultMargins.L};
  min-height: ${defaultMargins.L};
  max-width: ${defaultMargins.L};
  max-height: ${defaultMargins.L};
  background: ${colors.blues.primary};
  border: none;
  border-radius: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: white;
`

const MessageContainer = styled.div`
  border-radius: ${defaultMargins.s};
  ${(p: { ours: boolean }) =>
    p.ours
      ? `
      border-bottom-right-radius: 2px;
      align-self: flex-end;
      background-color: ${colors.blues.primary}
    `
      : `
      border-bottom-left-radius: 2px;
      align-self: flex-start;
      background-color: ${colors.blues.lighter};
    `}
  padding: ${defaultMargins.s};
  margin: ${defaultMargins.s};
  margin-bottom: 0;
`

const TitleRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;

  & + & {
    margin-top: ${defaultMargins.L};
  }
`

const SenderName = styled.div`
  font-weight: ${fontWeights.semibold};
  margin-right: ${defaultMargins.m};
`

const SentDate = styled.div`
  font-size: 14px;
  font-weight: ${fontWeights.semibold};
  color: ${colors.greyscale.dark};
`

const MessageContent = styled.div`
  padding-top: ${defaultMargins.s};
  white-space: pre-line;
`

const ThreadViewMobile = styled(ThreadContainer)`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  padding-bottom: ${defaultMargins.XXL};
`

const ThreadViewTopbar = styled.div`
  background: ${colors.greyscale.lightest};
  padding: ${defaultMargins.m};
  align-self: stretch;
  cursor: pointer;
`

const ThreadViewTitle = styled.span`
  margin-left: ${defaultMargins.s};
  color: ${colors.blues.dark};
  font-weight: ${fontWeights.semibold};
`

const ThreadViewReply = styled.div`
  position: fixed;
  align-items: center;
  bottom: ${defaultMargins.xs};
  left: ${defaultMargins.s};
  right: ${defaultMargins.s};
  display: flex;
  gap: ${defaultMargins.xs};
  .thread-view-input-wrapper {
    display: block;
    width: 100%;
  }
  .thread-view-input {
    background: ${colors.greyscale.lightest};
    border-radius: ${defaultMargins.m};
  }
  .thread-view-input:not(:focus) {
    border-bottom-color: transparent;
  }
`
