// SPDX-FileCopyrightText: 2017-2021 City of Espoo
//
// SPDX-License-Identifier: LGPL-2.1-or-later

package fi.espoo.evaka.messaging

import fi.espoo.evaka.attachment.MessageAttachment
import fi.espoo.evaka.shared.DaycareId
import fi.espoo.evaka.shared.GroupId
import fi.espoo.evaka.shared.MessageAccountId
import fi.espoo.evaka.shared.MessageContentId
import fi.espoo.evaka.shared.MessageId
import fi.espoo.evaka.shared.MessageThreadId
import fi.espoo.evaka.shared.domain.HelsinkiDateTime
import org.jdbi.v3.core.mapper.Nested
import org.jdbi.v3.core.mapper.PropagateNull
import org.jdbi.v3.json.Json
import java.time.LocalDate
import java.util.UUID

data class Message(
    val id: MessageId,
    val sender: MessageAccount,
    val recipients: Set<MessageAccount>,
    val sentAt: HelsinkiDateTime,
    val content: String,
    val readAt: HelsinkiDateTime? = null,
    val attachments: List<MessageAttachment>
)

data class MessageThread(
    val id: MessageThreadId,
    val type: MessageType,
    val title: String,
    @Json
    val messages: List<Message>,
)

data class SentMessage(
    val contentId: MessageContentId,
    val content: String,
    val sentAt: HelsinkiDateTime,
    val threadTitle: String,
    val type: MessageType,
    @Json
    val recipients: Set<MessageAccount>,
    val recipientNames: List<String>,
    @Json
    val attachments: List<MessageAttachment>,
)

enum class MessageType {
    MESSAGE,
    BULLETIN
}

data class MessageReceiversResponse(
    val groupId: GroupId,
    val groupName: String,
    val receivers: List<MessageReceiver>
)

data class MessageReceiver(
    val childId: UUID,
    val childFirstName: String,
    val childLastName: String,
    val childDateOfBirth: LocalDate,
    val receiverPersons: List<MessageReceiverPerson>
)

enum class AccountType {
    PERSONAL,
    GROUP,
    CITIZEN
}

data class MessageAccount(
    val id: MessageAccountId,
    val name: String,
    val type: AccountType
)

data class Group(
    @PropagateNull
    val id: UUID,
    val name: String,
    val unitId: DaycareId,
    val unitName: String,
)

data class NestedMessageAccount(
    @Nested("account_")
    val account: MessageAccount,
    @Nested("group_")
    val daycareGroup: Group?
)

data class MessageReceiverPerson(
    val accountId: MessageAccountId,
    val receiverFirstName: String,
    val receiverLastName: String
)