// SPDX-FileCopyrightText: 2017-2022 City of Espoo
//
// SPDX-License-Identifier: LGPL-2.1-or-later

package fi.espoo.evaka.reports

import fi.espoo.evaka.shared.auth.AuthenticatedUser
import fi.espoo.evaka.shared.db.Database
import fi.espoo.evaka.shared.domain.EvakaClock
import fi.espoo.evaka.shared.security.AccessControl
import fi.espoo.evaka.shared.security.Action
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.RestController

enum class Report {
    APPLICATIONS,
    ASSISTANCE_NEED_DECISIONS,
    ASSISTANCE_NEEDS_AND_ACTIONS,
    ATTENDANCE_RESERVATION,
    CHILD_AGE_LANGUAGE,
    CHILDREN_IN_DIFFERENT_ADDRESS,
    DECISIONS,
    DUPLICATE_PEOPLE,
    ENDED_PLACEMENTS,
    FAMILY_CONFLICT,
    INVOICE,
    MISSING_HEAD_OF_FAMILY,
    MISSING_SERVICE_NEED,
    OCCUPANCY,
    PARTNERS_IN_DIFFERENT_ADDRESS,
    PLACEMENT_COUNT,
    PLACEMENT_SKETCHING,
    PRESENCE,
    RAW,
    SERVICE_NEED,
    SERVICE_VOUCHER_VALUE,
    SEXTET,
    STARTING_PLACEMENTS,
    VARDA_ERRORS
}

@RestController
class ReportPermissions(private val accessControl: AccessControl) {
    @GetMapping("/reports")
    fun getPermittedReports(
        db: Database,
        user: AuthenticatedUser.Employee,
        clock: EvakaClock
    ): Set<Report> =
        db.connect { dbc ->
            dbc.read { tx ->
                val permittedGlobalActions =
                    accessControl.getPermittedActions<Action.Global>(tx, user, clock)
                val permittedActionsForSomeUnit =
                    accessControl.getPermittedActionsForSomeTarget<Action.Unit>(tx, user, clock)
                setOfNotNull(
                    Report.APPLICATIONS.takeIf {
                        permittedActionsForSomeUnit.contains(Action.Unit.READ_APPLICATIONS_REPORT)
                    },
                    Report.ASSISTANCE_NEED_DECISIONS.takeIf {
                        accessControl.isPermittedForSomeTarget(
                            tx,
                            user,
                            clock,
                            Action.AssistanceNeedDecision.READ_IN_REPORT
                        )
                    },
                    Report.ASSISTANCE_NEEDS_AND_ACTIONS.takeIf {
                        permittedActionsForSomeUnit.contains(
                            Action.Unit.READ_ASSISTANCE_NEEDS_AND_ACTIONS_REPORT
                        )
                    },
                    Report.ATTENDANCE_RESERVATION.takeIf {
                        permittedActionsForSomeUnit.contains(
                            Action.Unit.READ_ATTENDANCE_RESERVATION_REPORT
                        )
                    },
                    Report.CHILD_AGE_LANGUAGE.takeIf {
                        permittedActionsForSomeUnit.contains(
                            Action.Unit.READ_CHILD_AGE_AND_LANGUAGE_REPORT
                        )
                    },
                    Report.CHILDREN_IN_DIFFERENT_ADDRESS.takeIf {
                        permittedActionsForSomeUnit.contains(
                            Action.Unit.READ_CHILD_IN_DIFFERENT_ADDRESS_REPORT
                        )
                    },
                    Report.DECISIONS.takeIf {
                        permittedGlobalActions.contains(Action.Global.READ_DECISIONS_REPORT)
                    },
                    Report.DUPLICATE_PEOPLE.takeIf {
                        permittedGlobalActions.contains(Action.Global.READ_DUPLICATE_PEOPLE_REPORT)
                    },
                    Report.ENDED_PLACEMENTS.takeIf {
                        permittedGlobalActions.contains(Action.Global.READ_ENDED_PLACEMENTS_REPORT)
                    },
                    Report.FAMILY_CONFLICT.takeIf {
                        permittedActionsForSomeUnit.contains(
                            Action.Unit.READ_FAMILY_CONFLICT_REPORT
                        )
                    },
                    Report.INVOICE.takeIf {
                        permittedGlobalActions.contains(Action.Global.READ_INVOICE_REPORT)
                    },
                    Report.MISSING_HEAD_OF_FAMILY.takeIf {
                        permittedActionsForSomeUnit.contains(
                            Action.Unit.READ_MISSING_HEAD_OF_FAMILY_REPORT
                        )
                    },
                    Report.MISSING_SERVICE_NEED.takeIf {
                        permittedActionsForSomeUnit.contains(
                            Action.Unit.READ_MISSING_SERVICE_NEED_REPORT
                        )
                    },
                    Report.OCCUPANCY.takeIf {
                        permittedActionsForSomeUnit.contains(Action.Unit.READ_OCCUPANCY_REPORT)
                    },
                    Report.PARTNERS_IN_DIFFERENT_ADDRESS.takeIf {
                        permittedActionsForSomeUnit.contains(
                            Action.Unit.READ_PARTNERS_IN_DIFFERENT_ADDRESS_REPORT
                        )
                    },
                    Report.PLACEMENT_COUNT.takeIf {
                        permittedGlobalActions.contains(Action.Global.READ_PLACEMENT_COUNT_REPORT)
                    },
                    Report.PLACEMENT_SKETCHING.takeIf {
                        permittedGlobalActions.contains(
                            Action.Global.READ_PLACEMENT_SKETCHING_REPORT
                        )
                    },
                    Report.PRESENCE.takeIf {
                        permittedGlobalActions.contains(Action.Global.READ_PRESENCE_REPORT)
                    },
                    Report.RAW.takeIf {
                        permittedGlobalActions.contains(Action.Global.READ_RAW_REPORT)
                    },
                    Report.SERVICE_NEED.takeIf {
                        permittedActionsForSomeUnit.contains(Action.Unit.READ_SERVICE_NEED_REPORT)
                    },
                    Report.SERVICE_VOUCHER_VALUE.takeIf {
                        permittedActionsForSomeUnit.contains(
                            Action.Unit.READ_SERVICE_VOUCHER_REPORT
                        )
                    },
                    Report.SEXTET.takeIf {
                        permittedGlobalActions.contains(Action.Global.READ_SEXTET_REPORT)
                    },
                    Report.STARTING_PLACEMENTS.takeIf {
                        permittedGlobalActions.contains(
                            Action.Global.READ_STARTING_PLACEMENTS_REPORT
                        )
                    },
                    Report.VARDA_ERRORS.takeIf {
                        permittedGlobalActions.contains(Action.Global.READ_VARDA_REPORT)
                    }
                )
            }
        }
}
