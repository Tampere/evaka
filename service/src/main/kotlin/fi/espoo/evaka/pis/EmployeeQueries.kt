// SPDX-FileCopyrightText: 2017-2020 City of Espoo
//
// SPDX-License-Identifier: LGPL-2.1-or-later

package fi.espoo.evaka.pis

import fi.espoo.evaka.ForceCodeGenType
import fi.espoo.evaka.identity.ExternalId
import fi.espoo.evaka.pis.controllers.PinCode
import fi.espoo.evaka.shared.DaycareId
import fi.espoo.evaka.shared.EmployeeId
import fi.espoo.evaka.shared.Paged
import fi.espoo.evaka.shared.auth.UserRole
import fi.espoo.evaka.shared.db.Database
import fi.espoo.evaka.shared.db.freeTextSearchQueryForColumns
import fi.espoo.evaka.shared.domain.HelsinkiDateTime
import fi.espoo.evaka.shared.domain.NotFound
import fi.espoo.evaka.shared.mapToPaged
import org.jdbi.v3.core.kotlin.bindKotlin
import org.jdbi.v3.core.kotlin.mapTo
import org.jdbi.v3.json.Json
import java.time.OffsetDateTime

data class NewEmployee(
    val firstName: String,
    val lastName: String,
    val email: String?,
    val externalId: ExternalId?,
    val employeeNumber: String?,
    val roles: Set<UserRole> = setOf()
)

data class EmployeeUser(
    val id: EmployeeId,
    val firstName: String,
    val lastName: String,
    val globalRoles: Set<UserRole> = setOf(),
    val allScopedRoles: Set<UserRole> = setOf()
)

data class EmployeeRoles(
    val globalRoles: Set<UserRole> = setOf(),
    val allScopedRoles: Set<UserRole> = setOf()
)

data class DaycareRole(
    val daycareId: DaycareId,
    val daycareName: String,
    val role: UserRole
)

data class EmployeeWithDaycareRoles(
    val id: EmployeeId,
    @ForceCodeGenType(OffsetDateTime::class)
    val created: HelsinkiDateTime,
    @ForceCodeGenType(OffsetDateTime::class)
    val updated: HelsinkiDateTime?,
    val firstName: String,
    val lastName: String,
    val email: String?,
    val globalRoles: List<UserRole> = listOf(),
    @Json
    val daycareRoles: List<DaycareRole> = listOf()
)

data class EmployeeIdWithName(
    val id: EmployeeId,
    val name: String
)

fun Database.Transaction.createEmployee(employee: NewEmployee): Employee = createUpdate(
    // language=SQL
    """
INSERT INTO employee (first_name, last_name, email, external_id, employee_number, roles)
VALUES (:employee.firstName, :employee.lastName, :employee.email, :employee.externalId, :employee.employeeNumber, :employee.roles::user_role[])
RETURNING id, first_name, last_name, email, external_id, created, updated, roles
    """.trimIndent()
).bindKotlin("employee", employee)
    .executeAndReturnGeneratedKeys()
    .mapTo<Employee>()
    .asSequence().first()

fun Database.Transaction.loginEmployee(employee: NewEmployee): Employee = createUpdate(
    // language=SQL
    """
INSERT INTO employee (first_name, last_name, email, external_id, employee_number, roles)
VALUES (:employee.firstName, :employee.lastName, :employee.email, :employee.externalId, :employee.employeeNumber, :employee.roles::user_role[])
ON CONFLICT (external_id) DO UPDATE
SET last_login = now(), first_name = EXCLUDED.first_name, last_name = EXCLUDED.last_name, email = EXCLUDED.email, employee_number = EXCLUDED.employee_number
RETURNING id, first_name, last_name, email, external_id, created, updated, roles
    """.trimIndent()
).bindKotlin("employee", employee)
    .executeAndReturnGeneratedKeys()
    .mapTo<Employee>()
    .first()

fun Database.Read.getEmployeeRoles(id: EmployeeId): EmployeeRoles = createQuery(
    """
SELECT employee.roles AS global_roles, (
    SELECT array_agg(DISTINCT role ORDER BY role)
    FROM daycare_acl
    WHERE employee_id = employee.id
) AS all_scoped_roles
FROM employee
WHERE id = :id
    """.trimIndent()
).bind("id", id).mapTo<EmployeeRoles>().first()

fun Database.Read.getEmployeeNumber(id: EmployeeId): String? = createQuery(
    """
SELECT employee_number
FROM employee
WHERE id = :id
    """.trimIndent()
).bind("id", id).mapTo<String>().firstOrNull()

private fun Database.Read.searchEmployees(id: EmployeeId? = null, externalId: ExternalId? = null) = createQuery(
    // language=SQL
    """
SELECT e.id, first_name, last_name, email, external_id, e.created, e.updated, roles
FROM employee e
WHERE (:id::uuid IS NULL OR e.id = :id) AND (:externalId::text IS NULL OR e.external_id = :externalId)
    """.trimIndent()
).bind("id", id).bind("externalId", externalId)
    .mapTo<Employee>()
    .asSequence()

private fun Database.Read.searchFinanceDecisionHandlers(id: EmployeeId? = null) = createQuery(
    // language=SQL
    """
SELECT DISTINCT e.id, e.first_name, e.last_name, e.email, e.external_id, e.created, e.updated, e.roles
FROM employee e
JOIN daycare ON daycare.finance_decision_handler = e.id
WHERE (:id::uuid IS NULL OR e.id = :id)
    """.trimIndent()
).bind("id", id)
    .mapTo<Employee>()
    .asSequence()

fun Database.Read.getEmployees(): List<Employee> = searchEmployees().toList()
fun Database.Read.getFinanceDecisionHandlers(): List<Employee> = searchFinanceDecisionHandlers().toList()
fun Database.Read.getEmployee(id: EmployeeId): Employee? = searchEmployees(id = id).firstOrNull()
fun Database.Read.getEmployeeByExternalId(externalId: ExternalId): Employee? = searchEmployees(externalId = externalId).firstOrNull()

private fun Database.Read.createEmployeeUserQuery(where: String) = createQuery(
    """
SELECT id, first_name, last_name, email, employee.roles AS global_roles, (
    SELECT array_agg(DISTINCT role ORDER BY role)
    FROM daycare_acl
    WHERE employee_id = employee.id
) AS all_scoped_roles
FROM employee
$where
"""
)

fun Database.Transaction.markEmployeeLastLogin(id: EmployeeId) = createUpdate(
    """
UPDATE employee 
SET last_login = now()
WHERE id = :id
    """.trimIndent()
).bind("id", id)
    .execute()

fun Database.Read.getEmployeeUser(id: EmployeeId): EmployeeUser? = createEmployeeUserQuery("WHERE id = :id")
    .bind("id", id)
    .mapTo<EmployeeUser>()
    .singleOrNull()

fun Database.Read.getEmployeeUserByExternalId(externalId: ExternalId): EmployeeUser? = createEmployeeUserQuery("WHERE external_id = :externalId")
    .bind("externalId", externalId)
    .mapTo<EmployeeUser>()
    .singleOrNull()

fun Database.Read.getEmployeeWithRoles(id: EmployeeId): EmployeeWithDaycareRoles? {
    // language=SQL
    val sql = """
SELECT
    id,
    created,
    updated,
    first_name,
    last_name,
    email,
    employee.roles AS global_roles,
    (
        SELECT jsonb_agg(json_build_object('daycareId', acl.daycare_id, 'daycareName', d.name, 'role', acl.role))
        FROM daycare_acl acl
        JOIN daycare d ON acl.daycare_id = d.id
        WHERE acl.employee_id = employee.id
    ) AS daycare_roles
FROM employee
WHERE id = :id
    """.trimIndent()

    return createQuery(sql)
        .bind("id", id)
        .mapTo<EmployeeWithDaycareRoles>()
        .firstOrNull()
}

fun Database.Transaction.updateEmployee(
    id: EmployeeId,
    globalRoles: List<UserRole>
) {
    // language=SQL
    val sql = """
UPDATE employee
SET roles = :roles::user_role[]
WHERE id = :id
    """.trimIndent()

    val updated = createUpdate(sql)
        .bind("id", id)
        .bind("roles", globalRoles.toTypedArray())
        .execute()

    if (updated != 1) throw NotFound("employee $id not found")
}

fun getEmployeesPaged(
    tx: Database.Read,
    page: Int,
    pageSize: Int,
    searchTerm: String = ""
): Paged<EmployeeWithDaycareRoles> {

    val (freeTextQuery, freeTextParams) = freeTextSearchQueryForColumns(listOf("employee"), listOf("first_name", "last_name"), searchTerm)

    val params = mapOf(
        "offset" to (page - 1) * pageSize,
        "pageSize" to pageSize
    )

    val conditions = listOfNotNull(
        if (searchTerm.isNotBlank()) freeTextQuery else null,
    )

    val whereClause = conditions.takeIf { it.isNotEmpty() }?.joinToString(" AND ") ?: "TRUE"

    // language=SQL
    val sql = """
SELECT
    id,
    created,
    updated,
    first_name,
    last_name,
    email,
    employee.roles AS global_roles,
    (
        SELECT jsonb_agg(json_build_object('daycareId', acl.daycare_id, 'daycareName', d.name, 'role', acl.role))
        FROM daycare_acl acl
        JOIN daycare d ON acl.daycare_id = d.id
        WHERE acl.employee_id = employee.id
    ) AS daycare_roles,
    count(*) OVER () AS count
FROM employee
WHERE $whereClause
ORDER BY last_name, first_name DESC
LIMIT :pageSize OFFSET :offset
    """.trimIndent()
    return tx.createQuery(sql)
        .bindMap(params + freeTextParams)
        .mapToPaged(pageSize)
}

fun Database.Transaction.deleteEmployee(employeeId: EmployeeId) = createUpdate(
    // language=SQL
    """
DELETE FROM employee
WHERE id = :employeeId
    """.trimIndent()
).bind("employeeId", employeeId)
    .execute()

fun Database.Transaction.upsertPinCode(
    userId: EmployeeId,
    pinCode: PinCode
) {
    // Note: according to spec, setting a pin resets the failure and opens a locked pin
    // language=sql
    val sql = """
INSERT INTO employee_pin(user_id, pin)
VALUES(:userId, :pin)
ON CONFLICT (user_id) DO UPDATE SET
        user_id = :userId,
        pin = :pin,
        locked = false,
        failure_count = 0
    """.trimIndent()
    val updated = this.createUpdate(sql)
        .bind("userId", userId)
        .bind("pin", pinCode.pin)
        .execute()

    if (updated == 0) throw NotFound("Could not update pin code for $userId. User not found")
}

fun Database.Read.employeePinIsCorrect(employeeId: EmployeeId, pin: String): Boolean = createQuery(
"""
SELECT EXISTS (
    SELECT 1
    FROM employee_pin
    WHERE user_id = :employeeId
    AND pin = :pin
    AND locked = false
)
""".trimIndent()
).bind("employeeId", employeeId)
    .bind("pin", pin)
    .mapTo<Boolean>()
    .first()

fun Database.Transaction.resetEmployeePinFailureCount(employeeId: EmployeeId) = createUpdate(
    """
UPDATE employee_pin
SET failure_count = 0
WHERE user_id = :employeeId
    """.trimIndent()
).bind("employeeId", employeeId)
    .execute()

fun Database.Transaction.updateEmployeePinFailureCountAndCheckIfLocked(employeeId: EmployeeId): Boolean = createQuery(
"""
UPDATE employee_pin
SET 
    failure_count = failure_count + 1,
    locked = 
        CASE 
            WHEN failure_count < (4 + 1) THEN false
            ELSE true
        end    
WHERE 
    user_id = :employeeId
RETURNING locked
""".trimIndent()
).bind("employeeId", employeeId)
    .mapTo<Boolean>()
    .firstOrNull() ?: false

fun Database.Read.isPinLocked(employeeId: EmployeeId): Boolean =
    createQuery("SELECT locked FROM employee_pin WHERE user_id = :id")
        .bind("id", employeeId)
        .mapTo<Boolean>()
        .firstOrNull() ?: false

fun Database.Transaction.clearRolesForInactiveEmployees(now: HelsinkiDateTime): List<EmployeeId> {
    return createQuery(
        """
WITH employees_to_reset AS (
    SELECT e.id
    FROM employee e
    LEFT JOIN daycare_acl d ON d.employee_id = e.id
    LEFT JOIN daycare_group_acl dg ON dg.employee_id = e.id
    WHERE (e.roles != '{}' OR d.employee_id IS NOT NULL OR dg.employee_id IS NOT NULL) AND (e.last_login IS NULL OR (
        SELECT max(ts)
        FROM unnest(ARRAY[e.last_login, d.updated, dg.updated]) ts
    ) < :now - interval '3 months')
), delete_daycare_acl AS (
    DELETE FROM daycare_acl WHERE employee_id = ANY(SELECT id FROM employees_to_reset)
), delete_daycare_group_acl AS (
    DELETE FROM daycare_group_acl WHERE employee_id = ANY(SELECT id FROM employees_to_reset)
)
UPDATE employee SET roles = '{}' WHERE id = ANY (SELECT id FROM employees_to_reset)
RETURNING id
"""
    )
        .bind("now", now)
        .mapTo<EmployeeId>()
        .toList()
}

fun Database.Read.getEmployeeNamesByIds(employeeIds: List<EmployeeId>) =
    createQuery(
        """
SELECT id, concat(first_name, ' ', last_name) name
FROM employee
WHERE id = ANY(:ids)
        """.trimIndent()
    )
        .bind("ids", employeeIds.toTypedArray())
        .mapTo<EmployeeIdWithName>()
        .toList()
        .map { it.id to it.name }
        .toMap()
