// SPDX-FileCopyrightText: 2017-2020 City of Espoo
//
// SPDX-License-Identifier: LGPL-2.1-or-later

package fi.espoo.evaka.attendance

import fi.espoo.evaka.application.utils.exhaust
import fi.espoo.evaka.daycare.service.CareType
import fi.espoo.evaka.pis.dao.mapPSQLException
import fi.espoo.evaka.placement.PlacementType
import fi.espoo.evaka.shared.auth.AccessControlList
import fi.espoo.evaka.shared.auth.AuthenticatedUser
import fi.espoo.evaka.shared.auth.UserRole
import fi.espoo.evaka.shared.db.transaction
import fi.espoo.evaka.shared.domain.BadRequest
import fi.espoo.evaka.shared.domain.Conflict
import org.jdbi.v3.core.Handle
import org.jdbi.v3.core.Jdbi
import org.jdbi.v3.core.kotlin.mapTo
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RequestParam
import org.springframework.web.bind.annotation.RestController
import java.time.Instant
import java.util.UUID

@RestController
@RequestMapping("/attendances")
class ChildAttendanceController(
    private val jdbi: Jdbi,
    private val acl: AccessControlList
) {
    val authorizedRoles = arrayOf(
        UserRole.ADMIN,
        UserRole.SERVICE_WORKER,
        UserRole.UNIT_SUPERVISOR,
        UserRole.STAFF
    )

    @GetMapping("/units/{unitId}")
    fun getAttendances(
        user: AuthenticatedUser,
        @PathVariable unitId: UUID
    ): ResponseEntity<AttendanceResponse> {
        acl.getRolesForUnit(user, unitId).requireOneOfRoles(*authorizedRoles)

        return jdbi.transaction { h ->
            getAttendancesResponse(h, unitId)
        }.let { ResponseEntity.ok(it) }
    }

    data class ArrivalInfoResponse(
        val absentFromPreschool: Boolean
    )
    @GetMapping("/units/{unitId}/children/{childId}/arrival")
    fun getChildArrival(
        user: AuthenticatedUser,
        @PathVariable unitId: UUID,
        @PathVariable childId: UUID,
        @RequestParam time: Instant
    ): ResponseEntity<ArrivalInfoResponse> {
        acl.getRolesForUnit(user, unitId).requireOneOfRoles(*authorizedRoles)

        return jdbi.transaction { h ->
            assertChildPlacement(h, childId, unitId, Instant.now())

            val attendance = h.getChildCurrentDayAttendance(childId, unitId)
            if (attendance != null)
                throw Conflict("Cannot arrive, already arrived today")

            ArrivalInfoResponse(
                absentFromPreschool = false // todo
            )
        }.let { ResponseEntity.ok(it) }
    }

    data class ArrivalRequest(
        val arrived: Instant
    )
    @PostMapping("/units/{unitId}/children/{childId}/arrival")
    fun postArrival(
        user: AuthenticatedUser,
        @PathVariable unitId: UUID,
        @PathVariable childId: UUID,
        @RequestBody body: ArrivalRequest
    ): ResponseEntity<AttendanceResponse> {
        acl.getRolesForUnit(user, unitId).requireOneOfRoles(*authorizedRoles)

        return jdbi.transaction { h ->
            assertChildPlacement(h, childId, unitId, body.arrived)

            val attendance = h.getChildCurrentDayAttendance(childId, unitId)
            if (attendance != null)
                throw Conflict("Cannot arrive, already arrived today")

            try {
                h.insertAttendance(
                    childId = childId,
                    unitId = unitId,
                    arrived = body.arrived,
                    departed = null
                )
                // todo: handle absence clearing? (EVAKA-4004)
            } catch (e: Exception) {
                throw mapPSQLException(e)
            }

            getAttendancesResponse(h, unitId)
        }.let { ResponseEntity.ok(it) }
    }

    @PostMapping("/units/{unitId}/children/{childId}/return-to-coming")
    fun returnToComing(
        user: AuthenticatedUser,
        @PathVariable unitId: UUID,
        @PathVariable childId: UUID
    ): ResponseEntity<AttendanceResponse> {
        acl.getRolesForUnit(user, unitId).requireOneOfRoles(*authorizedRoles)

        return jdbi.transaction { h ->
            assertChildPlacement(h, childId, unitId, Instant.now())

            val attendance = h.getChildCurrentDayAttendance(childId, unitId)

            if (attendance == null) {
                h.deleteCurrentDayAbsences(childId)
            } else {
                if (attendance.departed == null) {
                    try {
                        h.deleteAttendance(attendance.id)
                    } catch (e: Exception) {
                        throw mapPSQLException(e)
                    }
                } else {
                    throw Conflict("Already departed, did you mean return-to-present?")
                }
            }

            getAttendancesResponse(h, unitId)
        }.let { ResponseEntity.ok(it) }
    }

    data class DepartureInfoResponse(
        val absentFrom: Set<CareType>
    )
    @GetMapping("/units/{unitId}/children/{childId}/departure")
    fun getChildDeparture(
        user: AuthenticatedUser,
        @PathVariable unitId: UUID,
        @PathVariable childId: UUID,
        @RequestParam time: Instant
    ): ResponseEntity<DepartureInfoResponse> {
        acl.getRolesForUnit(user, unitId).requireOneOfRoles(*authorizedRoles)

        return jdbi.transaction { h ->
            assertChildPlacement(h, childId, unitId, Instant.now())

            val attendance = h.getChildCurrentDayAttendance(childId, unitId)
            if (attendance == null) {
                throw Conflict("Cannot depart, has not yet arrived")
            } else if (attendance.departed != null) {
                throw Conflict("Cannot depart, already departed")
            }

            DepartureInfoResponse(
                absentFrom = emptySet() // todo
            )
        }.let { ResponseEntity.ok(it) }
    }

    data class DepartureRequest(
        val departed: Instant
    )
    @PostMapping("/units/{unitId}/children/{childId}/departure")
    fun postDeparture(
        user: AuthenticatedUser,
        @PathVariable unitId: UUID,
        @PathVariable childId: UUID,
        @RequestBody body: DepartureRequest
    ): ResponseEntity<AttendanceResponse> {
        acl.getRolesForUnit(user, unitId).requireOneOfRoles(*authorizedRoles)

        return jdbi.transaction { h ->
            assertChildPlacement(h, childId, unitId, body.departed)

            val attendance = h.getChildCurrentDayAttendance(childId, unitId)
            if (attendance == null) {
                throw Conflict("Cannot depart, has not yet arrived")
            } else if (attendance.departed != null) {
                throw Conflict("Cannot depart, already departed")
            }

            try {
                h.updateAttendanceEnd(
                    attendanceId = attendance.id,
                    departed = body.departed
                )
                // todo: handle absence clearing? (EVAKA-4004)
            } catch (e: Exception) {
                throw mapPSQLException(e)
            }

            getAttendancesResponse(h, unitId)
        }.let { ResponseEntity.ok(it) }
    }

    @PostMapping("/units/{unitId}/children/{childId}/return-to-present")
    fun returnToPresent(
        user: AuthenticatedUser,
        @PathVariable unitId: UUID,
        @PathVariable childId: UUID
    ): ResponseEntity<AttendanceResponse> {
        acl.getRolesForUnit(user, unitId).requireOneOfRoles(*authorizedRoles)

        return jdbi.transaction { h ->
            assertChildPlacement(h, childId, unitId, Instant.now())

            val attendance = h.getChildCurrentDayAttendance(childId, unitId)

            if (attendance?.departed == null) {
                throw Conflict("Can not return to present since not yet departed")
            } else {
                try {
                    h.updateAttendance(attendance.id, attendance.arrived, null)
                } catch (e: Exception) {
                    throw mapPSQLException(e)
                }
            }

            getAttendancesResponse(h, unitId)
        }.let { ResponseEntity.ok(it) }
    }
}

fun assertChildPlacement(h: Handle, childId: UUID, unitId: UUID, time: Instant) {
    // language=sql
    val sql =
        """
        SELECT id FROM placement
        WHERE child_id = :childId AND unit_id = :unitId AND daterange(start_date, end_date, '[]') @> :time::date
        
        UNION ALL
        
        SELECT id FROM backup_care
        WHERE child_id = :childId AND unit_id = :unitId AND daterange(start_date, end_date, '[]') @> :time::date
        """.trimIndent()

    val placementMissing = h.createQuery(sql)
        .bind("childId", childId)
        .bind("unitId", unitId)
        .bind("time", time)
        .mapTo<UUID>()
        .list()
        .isEmpty()

    if (placementMissing) {
        throw BadRequest("Child $childId has no placement in unit $unitId on the given day")
    }
}

fun getAttendancesResponse(h: Handle, unitId: UUID): AttendanceResponse {
    val unitInfo = h.fetchUnitInfo(unitId)
    val childrenBasics = h.fetchChildrenBasics(unitId)
    val childrenAttendances = h.fetchChildrenAttendances(unitId)
    val childrenAbsences = h.fetchChildrenAbsences(unitId)

    val children = childrenBasics.map { child ->
        val attendance = childrenAttendances.firstOrNull { it.childId == child.id }
        val absences = childrenAbsences.filter { it.childId == child.id }
        val status = getChildStatus(child.placementType, attendance, absences)

        Child(
            id = child.id,
            firstName = child.firstName,
            lastName = child.lastName,
            placementType = child.placementType,
            groupId = child.groupId,
            status = status,
            attendance = attendance,
            absences = absences
        )
    }

    return AttendanceResponse(unitInfo, children)
}

fun getChildStatus(placementType: PlacementType, attendance: ChildAttendance?, absences: List<ChildAbsence>): AttendanceStatus {
    if (attendance != null) {
        return if (attendance.departed == null) AttendanceStatus.PRESENT else AttendanceStatus.DEPARTED
    }

    if (isAbsent(placementType, absences)) {
        return AttendanceStatus.ABSENT
    }

    return AttendanceStatus.COMING
}

fun isAbsent(placementType: PlacementType, absences: List<ChildAbsence>): Boolean {
    return when (placementType) {
        PlacementType.PRESCHOOL, PlacementType.PREPARATORY ->
            absences.any { it.careType == CareType.PRESCHOOL }
        PlacementType.PRESCHOOL_DAYCARE, PlacementType.PREPARATORY_DAYCARE ->
            absences.any { it.careType == CareType.PRESCHOOL } && absences.any { it.careType == CareType.PRESCHOOL_DAYCARE }
        PlacementType.DAYCARE, PlacementType.DAYCARE_PART_TIME ->
            absences.any { it.careType == CareType.DAYCARE }
        PlacementType.CLUB ->
            absences.any { it.careType == CareType.CLUB }
    }.exhaust()
}
