// SPDX-FileCopyrightText: 2017-2022 City of Espoo
//
// SPDX-License-Identifier: LGPL-2.1-or-later

import { useCallback, useEffect, useState } from 'react'

import { Message } from 'lib-common/generated/api-types/messaging'
import { UUID } from 'lib-common/types'

import { SelectableAccount } from '../molecules/MessageReplyEditor'

function getInitialRecipients(
  messages: Message[],
  accountId: UUID
): SelectableAccount[] {
  const firstMessage = messages[0]
  const lastMessage = messages.slice(-1)[0]
  const lastRecipients = lastMessage.recipients.map(({ id }) => id)
  return [
    ...(firstMessage.sender.id !== accountId
      ? [
          {
            ...firstMessage.sender,
            toggleable: false,
            selected: true
          }
        ]
      : []),
    ...firstMessage.recipients
      .filter((r) => r.id !== accountId)
      .map((acc) => ({
        ...acc,
        toggleable: true,
        selected:
          lastMessage.sender.id === acc.id || lastRecipients.includes(acc.id)
      }))
  ]
}

export function useRecipients(messages: Message[], accountId: UUID) {
  const [recipients, setRecipients] = useState<SelectableAccount[]>([])

  useEffect(() => {
    setRecipients(getInitialRecipients(messages, accountId))
  }, [messages, accountId])

  const onToggleRecipient = useCallback((id: UUID, selected: boolean) => {
    setRecipients((prev) =>
      prev.map((acc) =>
        acc.id === id && acc.toggleable ? { ...acc, selected } : acc
      )
    )
  }, [])
  return { recipients, onToggleRecipient }
}
