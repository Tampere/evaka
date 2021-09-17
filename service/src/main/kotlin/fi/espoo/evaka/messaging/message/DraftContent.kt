// SPDX-FileCopyrightText: 2017-2021 City of Espoo
//
// SPDX-License-Identifier: LGPL-2.1-or-later

package fi.espoo.evaka.messaging.message

import fi.espoo.evaka.shared.MessageAccountId
import fi.espoo.evaka.shared.MessageDraftId
import fi.espoo.evaka.shared.domain.HelsinkiDateTime

data class DraftContent(
    val id: MessageDraftId,
    val created: HelsinkiDateTime,
    val type: MessageType,
    val title: String,
    val content: String,
    val recipientIds: Set<MessageAccountId>,
    val recipientNames: List<String>,
)

data class UpsertableDraftContent(
    val type: MessageType,
    val title: String,
    val content: String,
    val recipientIds: Set<MessageAccountId>,
    val recipientNames: List<String>,
)
