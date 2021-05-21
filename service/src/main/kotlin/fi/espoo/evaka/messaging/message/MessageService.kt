// SPDX-FileCopyrightText: 2017-2021 City of Espoo
//
// SPDX-License-Identifier: LGPL-2.1-or-later

package fi.espoo.evaka.messaging.message

import fi.espoo.evaka.shared.db.Database
import fi.espoo.evaka.shared.domain.Forbidden
import fi.espoo.evaka.shared.domain.HelsinkiDateTime
import fi.espoo.evaka.shared.domain.NotFound
import java.util.UUID

class MessageService(
    private val notificationEmailService: MessageNotificationEmailService
) {
    fun createMessageThreadsForRecipientGroups(
        tx: Database.Transaction,
        title: String,
        content: String,
        type: MessageType,
        sender: MessageAccount,
        recipientGroups: Set<Set<UUID>>,
    ): List<UUID> {
        // for each recipient group, create a thread, message and message_recipients while re-using content
        val contentId = tx.insertMessageContent(content, sender)
        val sentAt = HelsinkiDateTime.now()
        return recipientGroups.map {
            val threadId = tx.insertThread(type, title)
            val messageId =
                tx.insertMessage(contentId = contentId, threadId = threadId, sender = sender, sentAt = sentAt)
            tx.insertRecipients(it, messageId)
            notificationEmailService.scheduleSendingMessageNotifications(tx, messageId)
            threadId
        }
    }

    fun replyToThread(
        db: Database.Connection,
        replyToMessageId: UUID,
        senderAccount: MessageAccount,
        recipientAccountIds: Set<UUID>,
        content: String,
    ): UUID {
        val (threadId, type, sender, recipients) = db.read { it.getThreadByMessageId(replyToMessageId) }
            ?: throw NotFound("Message not found")

        if (type == MessageType.BULLETIN && sender != senderAccount.id) throw Forbidden("Only the author can reply to bulletin")

        val previousParticipants = recipients + sender
        if (!previousParticipants.contains(senderAccount.id)) throw Forbidden("Not authorized to post to message")
        if (!previousParticipants.containsAll(recipientAccountIds)) throw Forbidden("Not authorized to widen the audience")

        return db.transaction { tx ->
            val contentId = tx.insertMessageContent(content, senderAccount)
            val messageId = tx.insertMessage(contentId, threadId, senderAccount, repliesToMessageId = replyToMessageId)
            tx.insertRecipients(recipientAccountIds, messageId)
            notificationEmailService.scheduleSendingMessageNotifications(tx, messageId)
            messageId
        }
    }
}
