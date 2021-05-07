// SPDX-FileCopyrightText: 2017-2021 City of Espoo
//
// SPDX-License-Identifier: LGPL-2.1-or-later

package fi.espoo.evaka.messaging.message

import fi.espoo.evaka.shared.Paged
import fi.espoo.evaka.shared.db.Database
import fi.espoo.evaka.shared.mapToPaged
import fi.espoo.evaka.shared.withCountMapper
import org.jdbi.v3.core.kotlin.mapTo
import java.util.UUID

fun Database.Read.getUnreadMessagesCount(
    accountIds: Set<UUID>
): Int {
    // language=SQL
    val sql = """
        SELECT COUNT(DISTINCT m.id) AS count
        FROM message_recipients m
        WHERE m.recipient_id = ANY(:accountIds) AND m.read_at IS NULL
    """.trimIndent()

    return this.createQuery(sql)
        .bind("accountIds", accountIds)
        .mapTo<Int>()
        .one()
}

fun Database.Transaction.insertMessage(
    contentId: UUID?,
    threadId: UUID,
    sender: MessageAccount,
): UUID {
    // language=SQL
    val insertMessageSql = """
        INSERT INTO message (content_id, thread_id, sender_id, sender_name)
        VALUES (:contentId, :threadId, :senderId, :senderName)        
        RETURNING id
    """.trimIndent()
    val messageId = this.createQuery(insertMessageSql)
        .bind("contentId", contentId)
        .bind("threadId", threadId)
        .bind("senderId", sender.id)
        .bind("senderName", sender.name)
        .mapTo<UUID>()
        .one()
    return messageId
}

fun Database.Transaction.insertMessageContent(
    content: String,
    sender: MessageAccount,
): UUID? {
    // language=SQL
    val messageContentSql = "INSERT INTO message_content (content, author_id) VALUES (:content, :authorId) RETURNING id"
    val contentId = this.createQuery(messageContentSql)
        .bind("content", content)
        .bind("authorId", sender.id)
        .mapTo<UUID>()
        .one()
    return contentId
}

fun Database.Transaction.insertRecipients(
    recipientAccountIds: Set<UUID>,
    messageId: UUID,
) {
    // language=SQL
    val insertRecipientsSql =
        "INSERT INTO message_recipients (message_id, recipient_id) VALUES (:messageId, :accountId)"

    val batch = this.prepareBatch(insertRecipientsSql)
    recipientAccountIds.forEach { batch.bind("messageId", messageId).bind("accountId", it).add() }
    batch.execute()
}

fun Database.Transaction.insertThread(
    type: MessageType,
    title: String,
): UUID {
    // language=SQL
    val insertThreadSql = "INSERT INTO message_thread (message_type, title) VALUES (:messageType, :title) RETURNING id"
    return createQuery(insertThreadSql)
        .bind("messageType", type)
        .bind("title", title)
        .mapTo<UUID>()
        .one()
}

fun Database.Read.getMessagesReceivedByAccount(accountId: UUID, pageSize: Int, page: Int): Paged<MessageThread> {
    val params = mapOf(
        "accountId" to accountId,
        "offset" to (page - 1) * pageSize,
        "pageSize" to pageSize
    )

    // language=SQL
    val sql = """
WITH
threads AS (
    SELECT id, created, message_type AS type, title, COUNT(*) OVER () AS count
    FROM message_thread t
    WHERE EXISTS(
            SELECT 1
            FROM message_recipients rec
            JOIN message m ON rec.message_id = m.id
            WHERE rec.recipient_id = :accountId AND m.thread_id = t.id)
    ORDER BY created DESC
    LIMIT :pageSize OFFSET :offset
),
messages AS (
    SELECT
        m.thread_id,
        m.id,
        c.content,
        m.sent_at,
        m.sender_id,
        m.sender_name
    FROM threads t
    JOIN message m ON m.thread_id = t.id
    JOIN message_content c ON m.content_id = c.id
    ORDER BY m.sent_at
)

SELECT
    t.count,
    t.id,
    t.created,
    t.title,
    t.type,
    (SELECT jsonb_agg(json_build_object(
        'id', msg.id,
        'sentAt', msg.sent_at,
        'content', msg.content,
        'senderName', msg.sender_name,
        'senderId', msg.sender_id
    ))) AS messages
    FROM threads t
          JOIN messages msg ON msg.thread_id = t.id
    GROUP BY t.count, t.id, t.type, t.title, t.created
    ORDER BY t.created DESC
    """.trimIndent()

    return this.createQuery(sql)
        .bindMap(params)
        .map(withCountMapper<MessageThread>())
        .let(mapToPaged(pageSize))
}
