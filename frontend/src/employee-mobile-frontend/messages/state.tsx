// SPDX-FileCopyrightText: 2017-2022 City of Espoo
//
// SPDX-License-Identifier: LGPL-2.1-or-later

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState
} from 'react'

import { Loading, Paged, Result } from 'lib-common/api'
import {
  Message,
  MessageThread,
  AuthorizedMessageAccount,
  ThreadReply
} from 'lib-common/generated/api-types/messaging'
import { UUID } from 'lib-common/types'
import useNonNullableParams from 'lib-common/useNonNullableParams'
import { useDebouncedCallback } from 'lib-common/utils/useDebouncedCallback'
import { useRestApi } from 'lib-common/utils/useRestApi'

import { UserContext } from '../auth/state'
import { UnitContext } from '../common/unit'

import {
  getMessagingAccounts,
  getReceivedMessages,
  markThreadRead,
  replyToThread,
  ReplyToThreadParams
} from './api'

const PAGE_SIZE = 20

const addMessageToThread = (message: Message, thread: MessageThread) => ({
  ...thread,
  messages: [...thread.messages, message]
})

const appendMessageAndMoveThreadToTopOfList =
  (threadId: UUID, message: Message) => (state: Result<MessageThread[]>) =>
    state.map((threads) => {
      const thread = threads.find((t) => t.id === threadId)
      if (!thread) return threads
      const otherThreads = threads.filter((t) => t.id !== threadId)
      return [addMessageToThread(message, thread), ...otherThreads]
    })

export interface MessagesState {
  accounts: Result<AuthorizedMessageAccount[]>
  loadAccounts: (unitId: UUID) => void
  page: number
  setPage: (page: number) => void
  pages: number | undefined
  setPages: (pages: number) => void
  groupAccounts: AuthorizedMessageAccount[]
  selectedAccount: AuthorizedMessageAccount | undefined
  receivedMessages: Result<MessageThread[]>
  selectedThread: MessageThread | undefined
  selectThread: (thread: MessageThread | undefined) => void
  sendReply: (params: ReplyToThreadParams) => void
  setReplyContent: (threadId: UUID, content: string) => void
  getReplyContent: (threadId: UUID) => string
}

const defaultState: MessagesState = {
  accounts: Loading.of(),
  loadAccounts: () => undefined,
  page: 1,
  setPage: () => undefined,
  pages: undefined,
  setPages: () => undefined,
  selectedAccount: undefined,
  groupAccounts: [],
  receivedMessages: Loading.of(),
  selectedThread: undefined,
  selectThread: () => undefined,
  sendReply: () => undefined,
  getReplyContent: () => '',
  setReplyContent: () => undefined
}

export const MessageContext = createContext<MessagesState>(defaultState)

export const MessageContextProvider = React.memo(
  function MessageContextProvider({ children }: { children: JSX.Element }) {
    const [page, setPage] = useState<number>(1)
    const [pages, setPages] = useState<number>()
    const { unitInfoResponse, reloadUnreadCounts } = useContext(UnitContext)
    const { user } = useContext(UserContext)
    const unitId = unitInfoResponse.map((res) => res.id).getOrElse(undefined)

    const [accounts, setAccounts] = useState<
      Result<AuthorizedMessageAccount[]>
    >(Loading.of())

    const getAccounts = useRestApi(getMessagingAccounts, setAccounts)

    const [loadAccounts] = useDebouncedCallback(getAccounts, 100)

    const { groupId } = useNonNullableParams<{
      groupId: UUID | 'all'
    }>()

    useEffect(() => {
      const hasPinLogin = user.map((u) => u?.pinLoginActive).getOrElse(false)
      if (unitId && hasPinLogin) loadAccounts(unitId)
    }, [loadAccounts, unitId, user])

    const groupAccounts: AuthorizedMessageAccount[] = useMemo(
      () =>
        accounts
          .map((acc) =>
            acc.filter(
              ({ account, daycareGroup }) =>
                account.type === 'GROUP' && daycareGroup?.unitId === unitId
            )
          )
          .getOrElse([]),
      [accounts, unitId]
    )

    const selectedAccount: AuthorizedMessageAccount = useMemo(
      () =>
        groupAccounts.find(
          ({ daycareGroup }) => daycareGroup?.id === groupId
        ) ?? groupAccounts[0],
      [groupAccounts, groupId]
    )

    const [receivedMessages, setReceivedMessages] = useState<
      Result<MessageThread[]>
    >(Loading.of())

    const setReceivedMessagesResult = useCallback(
      (result: Result<Paged<MessageThread>>) => {
        setReceivedMessages(result.map((r) => r.data))
        if (result.isSuccess) {
          setPages(result.value.pages)
        }
      },
      []
    )

    const loadReceivedMessages = useRestApi(
      getReceivedMessages,
      setReceivedMessagesResult
    )

    const [selectedThread, setSelectedThread] = useState<MessageThread>()

    useEffect(() => {
      if (selectedAccount && !selectedThread) {
        void loadReceivedMessages(selectedAccount.account.id, page, PAGE_SIZE)
        reloadUnreadCounts()
      }
    }, [
      loadReceivedMessages,
      reloadUnreadCounts,
      page,
      selectedAccount,
      selectedThread
    ])

    const selectThread = useCallback(
      (thread: MessageThread | undefined) => {
        setSelectedThread(thread)
        if (!thread) return
        if (!selectedAccount) throw new Error('Should never happen')
        const { id: accountId } = selectedAccount.account
        void markThreadRead(accountId, thread.id)
      },
      [selectedAccount]
    )

    const [replyContents, setReplyContents] = useState<Record<UUID, string>>({})

    const getReplyContent = useCallback(
      (threadId: UUID) => replyContents[threadId] ?? '',
      [replyContents]
    )
    const setReplyContent = useCallback((threadId: UUID, content: string) => {
      setReplyContents((state) => ({ ...state, [threadId]: content }))
    }, [])

    const setReplyResponse = useCallback((res: Result<ThreadReply>) => {
      if (res.isSuccess) {
        const {
          value: { message, threadId }
        } = res
        setReceivedMessages(
          appendMessageAndMoveThreadToTopOfList(threadId, message)
        )
        setSelectedThread((thread) =>
          thread?.id === threadId ? addMessageToThread(message, thread) : thread
        )
        setReplyContents((state) => ({ ...state, [threadId]: '' }))
      }
    }, [])
    const reply = useRestApi(replyToThread, setReplyResponse)
    const sendReply = useCallback(reply, [reply])

    const value = useMemo(
      () => ({
        accounts,
        loadAccounts,
        selectedAccount,
        groupAccounts,
        page,
        setPage,
        pages,
        setPages,
        receivedMessages,
        selectThread,
        selectedThread,
        getReplyContent,
        sendReply,
        setReplyContent
      }),
      [
        accounts,
        loadAccounts,
        groupAccounts,
        selectedAccount,
        page,
        pages,
        receivedMessages,
        selectedThread,
        selectThread,
        getReplyContent,
        sendReply,
        setReplyContent
      ]
    )

    return (
      <MessageContext.Provider value={value}>
        {children}
      </MessageContext.Provider>
    )
  }
)
