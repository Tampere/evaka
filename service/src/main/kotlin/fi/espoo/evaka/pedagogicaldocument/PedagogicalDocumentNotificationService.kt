// SPDX-FileCopyrightText: 2017-2021 City of Espoo
//
// SPDX-License-Identifier: LGPL-2.1-or-later

package fi.espoo.evaka.pedagogicaldocument

import fi.espoo.evaka.EmailEnv
import fi.espoo.evaka.daycare.domain.Language
import fi.espoo.evaka.emailclient.IEmailClient
import fi.espoo.evaka.emailclient.IEmailMessageProvider
import fi.espoo.evaka.shared.PedagogicalDocumentId
import fi.espoo.evaka.shared.async.AsyncJob
import fi.espoo.evaka.shared.async.AsyncJobRunner
import fi.espoo.evaka.shared.db.Database
import fi.espoo.evaka.shared.db.mapColumn
import fi.espoo.evaka.shared.domain.EvakaClock
import fi.espoo.evaka.shared.domain.HelsinkiDateTime
import mu.KotlinLogging
import org.springframework.stereotype.Service

private val logger = KotlinLogging.logger {}

@Service
class PedagogicalDocumentNotificationService(
    private val asyncJobRunner: AsyncJobRunner<AsyncJob>,
    private val emailClient: IEmailClient,
    private val emailMessageProvider: IEmailMessageProvider,
    private val emailEnv: EmailEnv
) {
    init {
        asyncJobRunner.registerHandler(::sendNotification)
    }

    fun getPedagogicalDocumentationNotifications(
        tx: Database.Transaction,
        id: PedagogicalDocumentId
    ): List<AsyncJob.SendPedagogicalDocumentNotificationEmail> {
        // language=sql
        val sql =
            """
        SELECT DISTINCT
            p.email as recipient_email,
            coalesce(lower(p.language), 'fi') as language
        FROM pedagogical_document doc 
        JOIN guardian g ON doc.child_id = g.child_id
        JOIN person p on g.guardian_id = p.id
        WHERE doc.id = :id
          AND NOT EXISTS(SELECT 1 FROM messaging_blocklist bl WHERE bl.child_id = doc.child_id AND bl.blocked_recipient = p.id)
          AND p.email IS NOT NULL
        """
                .trimIndent()

        return tx.createQuery(sql)
            .bind("id", id)
            .bind("date", HelsinkiDateTime.now().toLocalDate())
            .map { row ->
                AsyncJob.SendPedagogicalDocumentNotificationEmail(
                    pedagogicalDocumentId = id,
                    recipientEmail = row.mapColumn("recipient_email"),
                    language = getLanguage(row.mapColumn("language"))
                )
            }
            .list()
    }

    private fun Database.Transaction.updateDocumentEmailJobCreatedAt(
        id: PedagogicalDocumentId,
        date: HelsinkiDateTime
    ) {
        this.createUpdate(
                "UPDATE pedagogical_document SET email_job_created_at = :date WHERE id = :id"
            )
            .bind("id", id)
            .bind("date", date)
            .updateExactlyOne()
    }

    private fun Database.Read.shouldCreateNotificationJobForDocument(
        id: PedagogicalDocumentId
    ): Boolean {
        // notification job should be created only if description is set or an attachment is
        // uploaded
        return this.createQuery(
                """
SELECT EXISTS(
    SELECT 1
    FROM pedagogical_document doc
    LEFT JOIN attachment a ON doc.id = a.pedagogical_document_id
    WHERE
        doc.id = :id AND
        doc.email_job_created_at IS NULL AND 
        (LENGTH(doc.description) > 0 OR a.id IS NOT NULL)
)
            """
                    .trimIndent()
            )
            .bind("id", id)
            .mapTo<Boolean>()
            .one()
    }

    fun maybeScheduleEmailNotification(tx: Database.Transaction, id: PedagogicalDocumentId) {
        if (tx.shouldCreateNotificationJobForDocument(id)) {
            tx.updateDocumentEmailJobCreatedAt(id, HelsinkiDateTime.now())

            logger.info {
                "Scheduling sending of Pedagogical Documentation notification emails (id: $id)"
            }
            asyncJobRunner.plan(
                tx,
                payloads = getPedagogicalDocumentationNotifications(tx, id),
                runAt = HelsinkiDateTime.now(),
                retryCount = 10
            )
        }
    }

    private fun getLanguage(languageStr: String?): Language {
        return when (languageStr?.lowercase()) {
            "sv" -> Language.sv
            "en" -> Language.en
            else -> Language.fi
        }
    }

    fun sendNotification(
        db: Database.Connection,
        clock: EvakaClock,
        msg: AsyncJob.SendPedagogicalDocumentNotificationEmail
    ) {
        val (pedagogicalDocumentId, recipientEmail, language) = msg

        db.transaction { tx ->
            emailClient.sendEmail(
                traceId = pedagogicalDocumentId.toString(),
                toAddress = recipientEmail,
                fromAddress = emailEnv.sender(language),
                content = emailMessageProvider.pedagogicalDocumentNotification(language)
            )
            tx.markPedagogicalDocumentNotificationSent(pedagogicalDocumentId)
        }
    }
}

private fun Database.Transaction.markPedagogicalDocumentNotificationSent(
    id: PedagogicalDocumentId
) {
    this.createUpdate(
            """
            UPDATE pedagogical_document
            SET email_sent = TRUE 
            WHERE id = :id
        """
                .trimIndent()
        )
        .bind("id", id)
        .updateExactlyOne()
}
