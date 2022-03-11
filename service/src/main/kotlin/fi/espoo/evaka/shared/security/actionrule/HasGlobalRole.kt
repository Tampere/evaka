// SPDX-FileCopyrightText: 2017-2022 City of Espoo
//
// SPDX-License-Identifier: LGPL-2.1-or-later

package fi.espoo.evaka.shared.security.actionrule

import fi.espoo.evaka.shared.AttachmentId
import fi.espoo.evaka.shared.PersonId
import fi.espoo.evaka.shared.auth.AuthenticatedUser
import fi.espoo.evaka.shared.auth.UserRole
import fi.espoo.evaka.shared.db.Database
import fi.espoo.evaka.shared.security.AccessControlDecision
import fi.espoo.evaka.shared.utils.toEnumSet
import org.jdbi.v3.core.kotlin.mapTo
import java.util.EnumSet

private typealias Filter<T> = (tx: Database.Read, user: AuthenticatedUser.Employee, targets: Set<T>) -> Iterable<T>

data class HasGlobalRole(val oneOf: EnumSet<UserRole>) : StaticActionRule, ActionRuleParams<HasGlobalRole> {
    init {
        oneOf.forEach { check(it.isGlobalRole()) { "Expected a global role, got $it" } }
    }
    constructor(vararg oneOf: UserRole) : this(oneOf.toEnumSet())

    override fun isPermitted(user: AuthenticatedUser): Boolean =
        user is AuthenticatedUser.Employee && user.globalRoles.any { this.oneOf.contains(it) }

    override fun merge(other: HasGlobalRole): HasGlobalRole = HasGlobalRole(
        (this.oneOf.asSequence() + other.oneOf.asSequence()).toEnumSet()
    )

    private class Query<T>(private val filter: Filter<T>) : DatabaseActionRule.Query<T, HasGlobalRole> {
        override fun execute(
            tx: Database.Read,
            user: AuthenticatedUser,
            targets: Set<T>
        ): Map<T, DatabaseActionRule.Deferred<HasGlobalRole>> = when (user) {
            is AuthenticatedUser.Employee -> filter(tx, user, targets).associateWith { Deferred(user.globalRoles) }
            else -> emptyMap()
        }
    }
    private class Deferred(private val globalRoles: Set<UserRole>) : DatabaseActionRule.Deferred<HasGlobalRole> {
        override fun evaluate(params: HasGlobalRole): AccessControlDecision = if (globalRoles.any { params.oneOf.contains(it) }) {
            AccessControlDecision.Permitted(params)
        } else {
            AccessControlDecision.None
        }
    }

    fun andAttachmentWasUploadedByAnyEmployee() = DatabaseActionRule(
        this,
        Query<AttachmentId> { tx, _, ids ->
            tx.createQuery(
                """
SELECT attachment.id
FROM attachment
JOIN evaka_user ON uploaded_by = evaka_user.id
WHERE attachment.id = ANY(:ids)
AND evaka_user.type = 'EMPLOYEE'
                """.trimIndent()
            )
                .bind("ids", ids.toTypedArray())
                .mapTo()
        }
    )

    fun andPersonHasSsnAddingEnabled() = DatabaseActionRule(
        this,
        Query<PersonId> { tx, _, ids ->
            tx.createQuery("SELECT id FROM person WHERE id = ANY(:ids) AND ssn_adding_disabled IS FALSE")
                .bind("ids", ids.toTypedArray())
                .mapTo()
        }
    )
}