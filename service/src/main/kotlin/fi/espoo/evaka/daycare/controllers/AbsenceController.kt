// SPDX-FileCopyrightText: 2017-2021 City of Espoo
//
// SPDX-License-Identifier: LGPL-2.1-or-later

package fi.espoo.evaka.daycare.controllers

import fi.espoo.evaka.Audit
import fi.espoo.evaka.daycare.service.Absence
import fi.espoo.evaka.daycare.service.AbsenceUpsert
import fi.espoo.evaka.daycare.service.GroupMonthCalendar
import fi.espoo.evaka.daycare.service.HolidayReservationCreate
import fi.espoo.evaka.daycare.service.Presence
import fi.espoo.evaka.daycare.service.addMissingHolidayReservations
import fi.espoo.evaka.daycare.service.batchDeleteAbsences
import fi.espoo.evaka.daycare.service.deleteAbsencesFromHolidayPeriodDates
import fi.espoo.evaka.daycare.service.deleteChildAbsences
import fi.espoo.evaka.daycare.service.getAbsencesOfChildByMonth
import fi.espoo.evaka.daycare.service.getFutureAbsencesOfChild
import fi.espoo.evaka.daycare.service.getGroupMonthCalendar
import fi.espoo.evaka.daycare.service.upsertAbsences
import fi.espoo.evaka.reservations.deleteReservationsFromHolidayPeriodDates
import fi.espoo.evaka.shared.ChildId
import fi.espoo.evaka.shared.GroupId
import fi.espoo.evaka.shared.auth.AuthenticatedUser
import fi.espoo.evaka.shared.db.Database
import fi.espoo.evaka.shared.domain.EvakaClock
import fi.espoo.evaka.shared.security.AccessControl
import fi.espoo.evaka.shared.security.Action
import java.time.LocalDate
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RequestParam
import org.springframework.web.bind.annotation.RestController

@RestController
@RequestMapping("/absences")
class AbsenceController(private val accessControl: AccessControl) {
    @GetMapping("/{groupId}")
    fun groupMonthCalendar(
        db: Database,
        user: AuthenticatedUser,
        clock: EvakaClock,
        @RequestParam year: Int,
        @RequestParam month: Int,
        @PathVariable groupId: GroupId,
        @RequestParam(required = false, defaultValue = "false") includeNonOperationalDays: Boolean
    ): GroupMonthCalendar {
        return db.connect { dbc ->
                dbc.read {
                    accessControl.requirePermissionFor(
                        it,
                        user,
                        clock,
                        Action.Group.READ_ABSENCES,
                        groupId
                    )
                    getGroupMonthCalendar(it, groupId, year, month, includeNonOperationalDays)
                }
            }
            .also {
                Audit.AbsenceRead.log(
                    targetId = groupId,
                    meta = mapOf("year" to year, "month" to month)
                )
            }
    }

    @PostMapping("/{groupId}")
    fun upsertAbsences(
        db: Database,
        user: AuthenticatedUser,
        clock: EvakaClock,
        @RequestBody absences: List<AbsenceUpsert>,
        @PathVariable groupId: GroupId
    ) {
        val children = absences.map { it.childId }

        val upserted =
            db.connect { dbc ->
                dbc.transaction {
                    accessControl.requirePermissionFor(
                        it,
                        user,
                        clock,
                        Action.Group.CREATE_ABSENCES,
                        groupId
                    )
                    accessControl.requirePermissionFor(
                        it,
                        user,
                        clock,
                        Action.Child.CREATE_ABSENCE,
                        children
                    )
                    it.upsertAbsences(clock.now(), user.evakaUserId, absences)
                }
            }
        Audit.AbsenceUpsert.log(
            targetId = groupId,
            objectId = upserted,
            meta = mapOf("children" to children)
        )
    }

    @PostMapping("/{groupId}/present")
    fun addPresences(
        db: Database,
        user: AuthenticatedUser,
        clock: EvakaClock,
        @PathVariable groupId: GroupId,
        @RequestBody deletions: List<Presence>,
    ) {
        val children = deletions.map { it.childId }.distinct()
        db.connect { dbc ->
                dbc.transaction { tx ->
                    accessControl.requirePermissionFor(
                        tx,
                        user,
                        clock,
                        Action.Group.DELETE_ABSENCES,
                        groupId
                    )
                    accessControl.requirePermissionFor(
                        tx,
                        user,
                        clock,
                        Action.Child.DELETE_ABSENCE,
                        children
                    )
                    val deletedAbsences = tx.batchDeleteAbsences(deletions)
                    val addedReservations =
                        tx.addMissingHolidayReservations(
                            user.evakaUserId,
                            deletions.map { HolidayReservationCreate(it.childId, it.date) }
                        )
                    Pair(deletedAbsences, addedReservations)
                }
            }
            .also { (deleted, reservations) ->
                Audit.AbsenceDelete.log(
                    targetId = groupId,
                    objectId = deleted,
                    meta =
                        mapOf(
                            "children" to children,
                            "createdHolidayReservations" to reservations,
                        )
                )
            }
    }

    data class HolidayReservationsDelete(
        val childId: ChildId,
        val date: LocalDate,
    )

    @PostMapping("/{groupId}/delete-holiday-reservations")
    fun deleteHolidayReservations(
        db: Database,
        user: AuthenticatedUser,
        clock: EvakaClock,
        @PathVariable groupId: GroupId,
        @RequestBody body: List<HolidayReservationsDelete>
    ) {
        if (body.isEmpty()) return

        val children = body.map { it.childId }.distinct()
        db.connect { dbc ->
                dbc.transaction { tx ->
                    accessControl.requirePermissionFor(
                        tx,
                        user,
                        clock,
                        Action.Child.DELETE_HOLIDAY_RESERVATIONS,
                        children,
                    )
                    val pairs = body.map { Pair(it.childId, it.date) }
                    val deletedReservations = tx.deleteReservationsFromHolidayPeriodDates(pairs)
                    val deletedAbsences = tx.deleteAbsencesFromHolidayPeriodDates(pairs)
                    Pair(deletedReservations, deletedAbsences)
                }
            }
            .also { (deletedReservations, deletedAbsences) ->
                Audit.AttendanceReservationDelete.log(
                    targetId = groupId,
                    meta =
                        mapOf(
                            "children" to children,
                            "deletedReservations" to deletedReservations,
                            "deletedAbsences" to deletedAbsences
                        )
                )
            }
    }

    data class DeleteChildAbsenceBody(val date: LocalDate)

    @PostMapping("/by-child/{childId}/delete")
    fun deleteAbsence(
        db: Database,
        user: AuthenticatedUser,
        clock: EvakaClock,
        @PathVariable childId: ChildId,
        @RequestBody body: DeleteChildAbsenceBody
    ) {
        val deleted =
            db.connect { dbc ->
                dbc.transaction {
                    accessControl.requirePermissionFor(
                        it,
                        user,
                        clock,
                        Action.Child.DELETE_ABSENCE,
                        childId
                    )
                    it.deleteChildAbsences(childId, body.date)
                }
            }
        Audit.AbsenceDelete.log(
            targetId = childId,
            objectId = deleted,
            meta = mapOf("date" to body.date)
        )
    }

    @GetMapping("/by-child/{childId}")
    fun absencesOfChild(
        db: Database,
        user: AuthenticatedUser,
        clock: EvakaClock,
        @PathVariable childId: ChildId,
        @RequestParam year: Int,
        @RequestParam month: Int
    ): List<Absence> {
        return db.connect { dbc ->
                dbc.read {
                    accessControl.requirePermissionFor(
                        it,
                        user,
                        clock,
                        Action.Child.READ_ABSENCES,
                        childId
                    )
                    getAbsencesOfChildByMonth(it, childId, year, month)
                }
            }
            .also {
                Audit.AbsenceRead.log(
                    targetId = childId,
                    meta = mapOf("year" to year, "month" to month)
                )
            }
    }

    @GetMapping("/by-child/{childId}/future")
    fun futureAbsencesOfChild(
        db: Database,
        user: AuthenticatedUser,
        clock: EvakaClock,
        @PathVariable childId: ChildId
    ): List<Absence> {
        return db.connect { dbc ->
                dbc.read {
                    accessControl.requirePermissionFor(
                        it,
                        user,
                        clock,
                        Action.Child.READ_FUTURE_ABSENCES,
                        childId
                    )
                    getFutureAbsencesOfChild(it, clock, childId)
                }
            }
            .also { Audit.AbsenceRead.log(targetId = childId) }
    }
}
