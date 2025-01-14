// SPDX-FileCopyrightText: 2017-2021 City of Espoo
//
// SPDX-License-Identifier: LGPL-2.1-or-later

package fi.espoo.evaka.vasu

import fi.espoo.evaka.Audit
import fi.espoo.evaka.application.utils.exhaust
import fi.espoo.evaka.daycare.createChild
import fi.espoo.evaka.daycare.getChild
import fi.espoo.evaka.pis.getEmployeeNamesByIds
import fi.espoo.evaka.pis.listPersonByDuplicateOf
import fi.espoo.evaka.shared.ChildId
import fi.espoo.evaka.shared.EmployeeId
import fi.espoo.evaka.shared.VasuDocumentId
import fi.espoo.evaka.shared.VasuTemplateId
import fi.espoo.evaka.shared.auth.AuthenticatedUser
import fi.espoo.evaka.shared.db.Database
import fi.espoo.evaka.shared.domain.BadRequest
import fi.espoo.evaka.shared.domain.Conflict
import fi.espoo.evaka.shared.domain.EvakaClock
import fi.espoo.evaka.shared.domain.Forbidden
import fi.espoo.evaka.shared.domain.HelsinkiDateTime
import fi.espoo.evaka.shared.domain.NotFound
import fi.espoo.evaka.shared.security.AccessControl
import fi.espoo.evaka.shared.security.Action
import fi.espoo.evaka.vasu.VasuDocumentEventType.MOVED_TO_CLOSED
import fi.espoo.evaka.vasu.VasuDocumentEventType.MOVED_TO_READY
import fi.espoo.evaka.vasu.VasuDocumentEventType.MOVED_TO_REVIEWED
import fi.espoo.evaka.vasu.VasuDocumentEventType.PUBLISHED
import fi.espoo.evaka.vasu.VasuDocumentEventType.RETURNED_TO_READY
import fi.espoo.evaka.vasu.VasuDocumentEventType.RETURNED_TO_REVIEWED
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.PutMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RestController

@RestController
class VasuController(
    private val accessControl: AccessControl,
    private val vasuNotificationService: VasuNotificationService
) {

    data class CreateDocumentRequest(val templateId: VasuTemplateId)

    @PostMapping("/children/{childId}/vasu")
    fun createDocument(
        db: Database,
        user: AuthenticatedUser,
        clock: EvakaClock,
        @PathVariable childId: ChildId,
        @RequestBody body: CreateDocumentRequest
    ): VasuDocumentId {
        return db.connect { dbc ->
                dbc.transaction { tx ->
                    accessControl.requirePermissionFor(
                        tx,
                        user,
                        clock,
                        Action.Child.CREATE_VASU_DOCUMENT,
                        childId
                    )
                    if (
                        tx.getVasuDocumentSummaries(childId).any {
                            it.documentState != VasuDocumentState.CLOSED
                        }
                    ) {
                        throw Conflict(
                            "Cannot open a new vasu document while another is still active"
                        )
                    }

                    val template =
                        tx.getVasuTemplate(body.templateId)
                            ?: throw NotFound("template ${body.templateId} not found")

                    if (!template.valid.includes(HelsinkiDateTime.now().toLocalDate())) {
                        throw BadRequest("Template is not currently valid")
                    }

                    tx.insertVasuDocument(clock, childId, template)
                }
            }
            .also { documentId ->
                Audit.VasuDocumentCreate.log(targetId = childId, objectId = documentId)
            }
    }

    @GetMapping("/children/{childId}/vasu-summaries")
    fun getVasuSummariesByChild(
        db: Database,
        user: AuthenticatedUser,
        clock: EvakaClock,
        @PathVariable childId: ChildId
    ): List<VasuDocumentSummaryWithPermittedActions> {
        return db.connect { dbc ->
                dbc.read { tx ->
                    accessControl.requirePermissionFor(
                        tx,
                        user,
                        clock,
                        Action.Child.READ_VASU_DOCUMENT,
                        childId
                    )
                    val summaries = tx.getVasuDocumentSummaries(childId)
                    val permittedActions =
                        accessControl.getPermittedActions<VasuDocumentId, Action.VasuDocument>(
                            tx,
                            user,
                            clock,
                            summaries.map { it.id }
                        )
                    summaries.map {
                        VasuDocumentSummaryWithPermittedActions(
                            it,
                            permittedActions[it.id] ?: emptySet()
                        )
                    }
                }
            }
            .also {
                Audit.ChildVasuDocumentsRead.log(
                    targetId = childId,
                    meta = mapOf("count" to it.size)
                )
            }
    }

    data class VasuDocumentSummaryWithPermittedActions(
        val data: VasuDocumentSummary,
        val permittedActions: Set<Action.VasuDocument>
    )

    data class ChangeDocumentStateRequest(val eventType: VasuDocumentEventType)

    @GetMapping("/vasu/{id}")
    fun getDocument(
        db: Database,
        user: AuthenticatedUser,
        clock: EvakaClock,
        @PathVariable id: VasuDocumentId
    ): VasuDocumentWithPermittedActions {
        return db.connect { dbc ->
                dbc.read { tx ->
                    accessControl.requirePermissionFor(
                        tx,
                        user,
                        clock,
                        Action.VasuDocument.READ,
                        id
                    )
                    val doc =
                        tx.getVasuDocumentMaster(clock.today(), id)
                            ?: throw NotFound("template $id not found")

                    val employeeIds =
                        doc.content.sections.flatMap { section ->
                            section.questions.flatMap { question ->
                                if (question.type === VasuQuestionType.FOLLOWUP) {
                                    val followup = question as VasuQuestion.Followup
                                    followup.value.flatMap {
                                        setOfNotNull(it.authorId, it.edited?.editorId)
                                    }
                                } else {
                                    emptySet()
                                }
                            }
                        }

                    val employeeNames =
                        if (employeeIds.isEmpty()) emptyMap()
                        else tx.getEmployeeNamesByIds(employeeIds)

                    VasuDocumentWithPermittedActions(
                        data =
                            doc.copy(
                                content =
                                    doc.content.mapQuestions { question, _, _ ->
                                        if (question.type === VasuQuestionType.FOLLOWUP) {
                                            (question as VasuQuestion.Followup).withEmployeeNames(
                                                employeeNames
                                            )
                                        } else {
                                            question
                                        }
                                    }
                            ),
                        permittedActions =
                            accessControl.getPermittedActions(tx, user, clock, doc.id)
                    )
                }
            }
            .also { Audit.VasuDocumentRead.log(targetId = id) }
    }

    data class VasuDocumentWithPermittedActions(
        val data: VasuDocument,
        val permittedActions: Set<Action.VasuDocument>
    )

    data class UpdateDocumentRequest(val content: VasuContent, val childLanguage: ChildLanguage?)

    @PutMapping("/vasu/{id}")
    fun putDocument(
        db: Database,
        user: AuthenticatedUser,
        clock: EvakaClock,
        @PathVariable id: VasuDocumentId,
        @RequestBody body: UpdateDocumentRequest
    ) {
        db.connect { dbc ->
            dbc.transaction { tx ->
                accessControl.requirePermissionFor(tx, user, clock, Action.VasuDocument.UPDATE, id)
                val vasu =
                    tx.getVasuDocumentMaster(clock.today(), id)
                        ?: throw NotFound("vasu $id not found")
                validateVasuDocumentUpdate(vasu, body)

                val transformedFollowupsVasu =
                    body.copy(
                        content =
                            body.content.mapQuestions { question, sectionIndex, questionIndex ->
                                if (question.type === VasuQuestionType.FOLLOWUP) {
                                    val followup = question as VasuQuestion.Followup
                                    val storedFollowup =
                                        vasu.content.sections[sectionIndex].questions[questionIndex]
                                            as VasuQuestion.Followup

                                    followup.copy(
                                        value =
                                            followup.value.mapIndexed { entryIndex, entry ->
                                                val storedEntry =
                                                    storedFollowup.value.getOrNull(entryIndex)
                                                        ?: return@mapIndexed entry.copy(
                                                            authorId = EmployeeId(user.rawId()),
                                                            edited = null,
                                                            createdDate = HelsinkiDateTime.now(),
                                                            authorName = null
                                                        )

                                                val authorEditingInGracePeriod =
                                                    storedEntry.authorId ==
                                                        EmployeeId(user.rawId()) &&
                                                        storedEntry.createdDate?.let {
                                                            HelsinkiDateTime.now()
                                                                .durationSince(it)
                                                                .toMinutes() < 15
                                                        } == true

                                                val identicalContent =
                                                    entry.text == storedEntry.text &&
                                                        entry.date.isEqual(storedEntry.date)

                                                entry.copy(
                                                    authorId = storedEntry.authorId,
                                                    edited =
                                                        if (
                                                            authorEditingInGracePeriod ||
                                                                identicalContent
                                                        ) {
                                                            storedEntry.edited
                                                        } else {
                                                            FollowupEntryEditDetails(
                                                                editedAt = clock.today(),
                                                                editorId = EmployeeId(user.rawId()),
                                                                editorName = null
                                                            )
                                                        },
                                                    createdDate = storedEntry.createdDate,
                                                    authorName = null
                                                )
                                            }
                                    )
                                } else {
                                    question
                                }
                            }
                    )

                tx.updateVasuDocumentMaster(
                    clock,
                    id,
                    transformedFollowupsVasu.content,
                    body.childLanguage
                )
                tx.revokeVasuGuardianHasGivenPermissionToShare(id)
            }
        }
        Audit.VasuDocumentUpdate.log(targetId = id)
    }

    private fun validateVasuDocumentUpdate(vasu: VasuDocument, body: UpdateDocumentRequest) {
        if (vasu.documentState == VasuDocumentState.CLOSED) {
            throw BadRequest("Closed vasu document cannot be edited", "CANNOT_EDIT_CLOSED_DOCUMENT")
        }

        if (!vasu.content.matchesStructurally(body.content)) {
            throw BadRequest(
                "Vasu document structure does not match template",
                "DOCUMENT_DOES_NOT_MATCH_TEMPLATE"
            )
        }

        if (vasu.content.followupEntriesMissing(body.content)) {
            throw Forbidden(
                "Follow-up entries may not be removed",
                "CANNOT_REMOVE_FOLLOWUP_COMMENTS"
            )
        }
    }

    @PostMapping("/vasu/{id}/update-state")
    fun updateDocumentState(
        db: Database,
        user: AuthenticatedUser.Employee,
        clock: EvakaClock,
        @PathVariable id: VasuDocumentId,
        @RequestBody body: ChangeDocumentStateRequest
    ) {
        val events =
            if (body.eventType in listOf(MOVED_TO_READY, MOVED_TO_REVIEWED)) {
                listOf(PUBLISHED, body.eventType)
            } else {
                listOf(body.eventType)
            }

        db.connect { dbc ->
            dbc.transaction { tx ->
                events.forEach { eventType ->
                    when (eventType) {
                        PUBLISHED ->
                            accessControl.requirePermissionFor(
                                tx,
                                user,
                                clock,
                                Action.VasuDocument.EVENT_PUBLISHED,
                                id
                            )
                        MOVED_TO_READY ->
                            accessControl.requirePermissionFor(
                                tx,
                                user,
                                clock,
                                Action.VasuDocument.EVENT_MOVED_TO_READY,
                                id
                            )
                        RETURNED_TO_READY ->
                            accessControl.requirePermissionFor(
                                tx,
                                user,
                                clock,
                                Action.VasuDocument.EVENT_RETURNED_TO_READY,
                                id
                            )
                        MOVED_TO_REVIEWED ->
                            accessControl.requirePermissionFor(
                                tx,
                                user,
                                clock,
                                Action.VasuDocument.EVENT_MOVED_TO_REVIEWED,
                                id
                            )
                        RETURNED_TO_REVIEWED ->
                            accessControl.requirePermissionFor(
                                tx,
                                user,
                                clock,
                                Action.VasuDocument.EVENT_RETURNED_TO_REVIEWED,
                                id
                            )
                        MOVED_TO_CLOSED ->
                            accessControl.requirePermissionFor(
                                tx,
                                user,
                                clock,
                                Action.VasuDocument.EVENT_MOVED_TO_CLOSED,
                                id
                            )
                    }.exhaust()
                }

                val document =
                    tx.getVasuDocumentMaster(clock.today(), id)
                        ?: throw NotFound("Vasu was not found")
                validateStateTransition(
                    eventType = body.eventType,
                    currentState = document.documentState
                )

                if (events.contains(PUBLISHED)) {
                    tx.publishVasuDocument(clock, id)
                    vasuNotificationService.scheduleEmailNotification(tx, id)
                }

                if (events.contains(MOVED_TO_CLOSED)) {
                    tx.freezeVasuPlacements(clock.today(), id)
                }

                val addedEvents =
                    events.map { eventType ->
                        tx.insertVasuDocumentEvent(
                            documentId = id,
                            eventType = eventType,
                            employeeId = user.id
                        )
                    }

                if (events.contains(MOVED_TO_CLOSED)) {
                    val duplicates = tx.listPersonByDuplicateOf(document.basics.child.id)
                    if (duplicates.isNotEmpty()) {
                        val child = tx.getChild(document.basics.child.id)!!
                        val template = tx.getVasuTemplate(document.templateId)!!
                        val allEvents = document.events + addedEvents
                        duplicates.forEach { duplicate ->
                            val duplicateChild =
                                tx.getChild(duplicate.id)
                                    ?: tx.createChild(child.copy(id = duplicate.id))
                            val duplicateDocumentId =
                                tx.insertVasuDocument(
                                    clock = clock,
                                    childId = duplicateChild.id,
                                    template = template
                                )
                            tx.updateVasuDocumentMaster(
                                clock = clock,
                                id = duplicateDocumentId,
                                content = document.content,
                                childLanguage = document.basics.childLanguage
                            )
                            allEvents.forEach { event ->
                                tx.insertVasuDocumentEvent(
                                    documentId = duplicateDocumentId,
                                    eventType = event.eventType,
                                    employeeId = event.employeeId
                                )
                            }
                        }
                    }
                }
            }
        }
        Audit.VasuDocumentEventCreate.log(targetId = id)
    }

    private fun validateStateTransition(
        eventType: VasuDocumentEventType,
        currentState: VasuDocumentState
    ) {
        when (eventType) {
                PUBLISHED -> currentState !== VasuDocumentState.CLOSED
                MOVED_TO_READY -> currentState === VasuDocumentState.DRAFT
                RETURNED_TO_READY -> currentState === VasuDocumentState.REVIEWED
                MOVED_TO_REVIEWED -> currentState === VasuDocumentState.READY
                RETURNED_TO_REVIEWED -> currentState === VasuDocumentState.CLOSED
                MOVED_TO_CLOSED -> true
            }
            .exhaust()
            .let { valid -> if (!valid) throw Conflict("Invalid state transition") }
    }
}
