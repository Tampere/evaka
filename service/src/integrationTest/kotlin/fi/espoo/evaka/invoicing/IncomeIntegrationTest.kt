// SPDX-FileCopyrightText: 2017-2020 City of Espoo
//
// SPDX-License-Identifier: LGPL-2.1-or-later

package fi.espoo.evaka.invoicing

import com.fasterxml.jackson.databind.ObjectMapper
import com.fasterxml.jackson.module.kotlin.readValue
import com.github.kittinunf.fuel.core.extensions.jsonBody
import fi.espoo.evaka.FullApplicationTest
import fi.espoo.evaka.insertApplication
import fi.espoo.evaka.insertGeneralTestFixtures
import fi.espoo.evaka.invoicing.controller.Wrapper
import fi.espoo.evaka.invoicing.data.getIncomesForPerson
import fi.espoo.evaka.invoicing.data.upsertIncome
import fi.espoo.evaka.invoicing.domain.Income
import fi.espoo.evaka.invoicing.domain.IncomeCoefficient
import fi.espoo.evaka.invoicing.domain.IncomeEffect
import fi.espoo.evaka.invoicing.domain.IncomeValue
import fi.espoo.evaka.invoicing.service.IncomeTypesProvider
import fi.espoo.evaka.shared.IncomeId
import fi.espoo.evaka.shared.auth.AuthenticatedUser
import fi.espoo.evaka.shared.auth.UserRole
import fi.espoo.evaka.shared.auth.asUser
import fi.espoo.evaka.shared.dev.resetDatabase
import fi.espoo.evaka.testAdult_1
import fi.espoo.evaka.testDecisionMaker_1
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import org.springframework.beans.factory.annotation.Autowired
import java.time.LocalDate
import java.util.UUID
import kotlin.test.assertEquals
import kotlin.test.assertNotNull
import kotlin.test.assertNull

class IncomeIntegrationTest : FullApplicationTest() {
    @Autowired
    lateinit var mapper: ObjectMapper

    @Autowired
    lateinit var incomeTypesProvider: IncomeTypesProvider

    private fun assertEqualEnough(expected: List<Income>, actual: List<Income>) {
        val nullId = IncomeId(UUID.fromString("00000000-0000-0000-0000-000000000000"))
        assertEquals(
            expected.map { it.copy(id = nullId, updatedAt = null) }.toSet(),
            actual.map { it.copy(id = nullId, updatedAt = null) }.toSet()
        )
    }

    private fun deserializeResult(json: String) = objectMapper.readValue<Wrapper<List<Income>>>(json)

    @BeforeEach
    fun beforeEach() {
        db.transaction { tx ->
            tx.resetDatabase()
            tx.insertGeneralTestFixtures()
        }
    }

    private fun testIncome() = Income(
        id = IncomeId(UUID.randomUUID()),
        personId = testAdult_1.id,
        effect = IncomeEffect.INCOME,
        data = mapOf("MAIN_INCOME" to IncomeValue(500000, IncomeCoefficient.MONTHLY_NO_HOLIDAY_BONUS, 1)),
        validFrom = LocalDate.of(2019, 1, 1),
        validTo = LocalDate.of(2019, 1, 31),
        notes = ""
    )

    private val financeUser = AuthenticatedUser.Employee(id = testDecisionMaker_1.id, roles = setOf(UserRole.FINANCE_ADMIN))

    @Test
    fun `getIncome works with no data in DB`() {
        val (_, response, result) = http.get("/incomes?personId=${testAdult_1.id}")
            .asUser(financeUser)
            .responseString()
        assertEquals(200, response.statusCode)

        assertEqualEnough(listOf(), deserializeResult(result.get()).data)
    }

    @Test
    fun `getIncome works with single income in DB`() {
        val testIncome = testIncome()
        db.transaction { tx -> tx.upsertIncome(mapper, testIncome, financeUser.id) }

        val (_, response, result) = http.get("/incomes?personId=${testAdult_1.id}")
            .asUser(financeUser)
            .responseString()
        assertEquals(200, response.statusCode)

        assertEqualEnough(
            listOf(testIncome.copy(updatedBy = "${testDecisionMaker_1.firstName} ${testDecisionMaker_1.lastName}")),
            deserializeResult(result.get()).data
        )
    }

    @Test
    fun `getIncome works with multiple incomes in DB`() {
        val testIncome = testIncome()
        val incomes = listOf(
            testIncome.copy(
                id = IncomeId(UUID.randomUUID()),
                validFrom = testIncome.validFrom.plusYears(1),
                validTo = testIncome.validTo!!.plusYears(1)
            ),
            testIncome
        )
        db.transaction { tx -> incomes.forEach { tx.upsertIncome(mapper, it, financeUser.id) } }

        val (_, response, result) = http.get("/incomes?personId=${testAdult_1.id}")
            .asUser(financeUser)
            .responseString()
        assertEquals(200, response.statusCode)

        assertEqualEnough(
            incomes.map { it.copy(updatedBy = "${testDecisionMaker_1.firstName} ${testDecisionMaker_1.lastName}") },
            deserializeResult(result.get()).data
        )
    }

    @Test
    fun `createIncome works with valid income`() {
        val testIncome = testIncome()
        val (_, postResponse, _) = http.post("/incomes?personId=${testAdult_1.id}")
            .asUser(financeUser)
            .jsonBody(objectMapper.writeValueAsString(testIncome))
            .responseString()
        assertEquals(200, postResponse.statusCode)

        val (_, response, result) = http.get("/incomes?personId=${testAdult_1.id}")
            .asUser(financeUser)
            .responseString()
        assertEquals(200, response.statusCode)

        assertEqualEnough(
            listOf(testIncome.copy(updatedBy = "${testDecisionMaker_1.firstName} ${testDecisionMaker_1.lastName}")),
            deserializeResult(result.get()).data
        )
    }

    @Test
    fun `createIncome throws with invalid date range`() {
        val income = testIncome.copy(validTo = testIncome.validFrom.minusDays(1))
        val (_, postResponse, _) = http.post("/incomes?personId=${testAdult_1.id}")
            .asUser(financeUser)
            .jsonBody(objectMapper.writeValueAsString(income))
            .responseString()
        assertEquals(400, postResponse.statusCode)
    }

    @Test
    fun `createIncome splits earlier indefinite income`() {
        val firstIncome = testIncome().copy(validTo = null)
        db.transaction { tx -> tx.upsertIncome(mapper, firstIncome, financeUser.id) }

        val secondIncome = firstIncome.copy(validFrom = firstIncome.validFrom.plusMonths(1))
        val (_, postResponse, _) = http.post("/incomes?personId=${testAdult_1.id}")
            .asUser(financeUser)
            .jsonBody(objectMapper.writeValueAsString(secondIncome))
            .responseString()
        assertEquals(200, postResponse.statusCode)

        val result = db.transaction { tx -> tx.getIncomesForPerson(mapper, incomeTypesProvider, testAdult_1.id) }

        assertEquals(2, result.size)

        val firstIncomeResult = result.find { it.id == firstIncome.id }!!
        assertEquals(firstIncome.validFrom, firstIncomeResult.validFrom)
        assertEquals(secondIncome.validFrom.minusDays(1), firstIncomeResult.validTo)

        val secondIncomeResult = result.find { it.id != firstIncome.id }!!
        assertEquals(secondIncome.validFrom, secondIncomeResult.validFrom)
        assertEquals(secondIncome.validTo, secondIncomeResult.validTo)
    }

    @Test
    fun `createIncome throws with partly overlapping date range`() {
        val testIncome = testIncome()
        db.transaction { tx -> tx.upsertIncome(mapper, testIncome, financeUser.id) }

        val overlappingIncome =
            testIncome.let { it.copy(validFrom = it.validFrom.plusDays(10), validTo = null) }

        val (_, postResponse, _) = http.post("/incomes?personId=${testAdult_1.id}")
            .asUser(financeUser)
            .jsonBody(objectMapper.writeValueAsString(overlappingIncome))
            .responseString()
        assertEquals(409, postResponse.statusCode)
    }

    @Test
    fun `createIncome throws with identical date range`() {
        val testIncome = testIncome()
        db.transaction { tx -> tx.upsertIncome(mapper, testIncome, financeUser.id) }

        val (_, postResponse, _) = http.post("/incomes?personId=${testAdult_1.id}")
            .asUser(financeUser)
            .jsonBody(objectMapper.writeValueAsString(testIncome))
            .responseString()
        assertEquals(409, postResponse.statusCode)
    }

    @Test
    fun `createIncome throws with covering date range`() {
        val testIncome = testIncome()
        db.transaction { tx -> tx.upsertIncome(mapper, testIncome, financeUser.id) }

        val overlappingIncome =
            testIncome.let { it.copy(validFrom = it.validTo!!.minusMonths(1), validTo = it.validTo!!.plusYears(1)) }
        val (_, postResponse, _) = http.post("/incomes?personId=${testAdult_1.id}")
            .asUser(financeUser)
            .jsonBody(objectMapper.writeValueAsString(overlappingIncome))
            .responseString()
        assertEquals(409, postResponse.statusCode)
    }

    @Test
    fun `createIncome removes data if effect is not INCOME`() {
        val income = with(testIncome()) { this.copy(effect = IncomeEffect.MAX_FEE_ACCEPTED) }

        val (_, postResponse, _) = http.post("/incomes?personId=${testAdult_1.id}")
            .asUser(financeUser)
            .jsonBody(objectMapper.writeValueAsString(income))
            .responseString()
        assertEquals(200, postResponse.statusCode)

        val (_, response, result) = http.get("/incomes?personId=${testAdult_1.id}")
            .asUser(financeUser)
            .responseString()
        assertEquals(200, response.statusCode)

        assertEqualEnough(
            listOf(income.copy(data = emptyMap(), updatedBy = "${testDecisionMaker_1.firstName} ${testDecisionMaker_1.lastName}")),
            deserializeResult(result.get()).data
        )
    }

    @Test
    fun `updateIncome works with valid income`() {
        val testIncome = testIncome()
        db.transaction { tx -> tx.upsertIncome(mapper, testIncome, financeUser.id) }

        val updated = testIncome.copy(
            data = mapOf(
                "MAIN_INCOME" to IncomeValue(
                    1000,
                    IncomeCoefficient.MONTHLY_NO_HOLIDAY_BONUS,
                    1
                )
            )
        )
        val (_, putResponse, _) = http.put("/incomes/${updated.id}?personId=${testAdult_1.id}")
            .asUser(financeUser)
            .jsonBody(objectMapper.writeValueAsString(updated))
            .responseString()
        assertEquals(204, putResponse.statusCode)

        val (_, response, result) = http.get("/incomes?personId=${testAdult_1.id}")
            .asUser(financeUser)
            .responseString()
        assertEquals(200, response.statusCode)

        assertEqualEnough(
            listOf(updated.copy(updatedBy = "${testDecisionMaker_1.firstName} ${testDecisionMaker_1.lastName}")),
            deserializeResult(result.get()).data
        )
    }

    @Test
    fun `updateIncome throws with invalid date rage`() {
        val testIncome = testIncome()
        db.transaction { tx -> tx.upsertIncome(mapper, testIncome, financeUser.id) }

        val updated = testIncome.copy(validTo = testIncome.validFrom.minusDays(1))
        val (_, putResponse, _) = http.put("/incomes/${updated.id}?personId=${testAdult_1.id}")
            .asUser(financeUser)
            .jsonBody(objectMapper.writeValueAsString(updated))
            .responseString()
        assertEquals(400, putResponse.statusCode)
    }

    @Test
    fun `updateIncome throws with overlapping date rage`() {
        val testIncome = testIncome()
        db.transaction { tx -> tx.upsertIncome(mapper, testIncome, financeUser.id) }

        val anotherIncome = with(testIncome) {
            this.copy(
                id = IncomeId(UUID.randomUUID()),
                validFrom = validFrom.plusYears(1),
                validTo = validTo!!.plusYears(1)
            )
        }
        db.transaction { tx -> tx.upsertIncome(mapper, anotherIncome, financeUser.id) }

        val updated = testIncome.copy(validTo = anotherIncome.validTo)
        val (_, putResponse, _) = http.put("/incomes/${updated.id}?personId=${testAdult_1.id}")
            .asUser(financeUser)
            .jsonBody(objectMapper.writeValueAsString(updated))
            .responseString()
        assertEquals(409, putResponse.statusCode)
    }

    @Test
    fun `updateIncome removes data if effect is not INCOME`() {
        val testIncome = testIncome()
        db.transaction { tx -> tx.upsertIncome(mapper, testIncome, financeUser.id) }

        val updated = with(testIncome) { this.copy(effect = IncomeEffect.MAX_FEE_ACCEPTED) }
        val (_, putResponse, _) = http.put("/incomes/${updated.id}?personId=${testAdult_1.id}")
            .asUser(financeUser)
            .jsonBody(objectMapper.writeValueAsString(updated))
            .responseString()
        assertEquals(204, putResponse.statusCode)

        val (_, response, result) = http.get("/incomes?personId=${testAdult_1.id}")
            .asUser(financeUser)
            .responseString()
        assertEquals(200, response.statusCode)

        assertEqualEnough(
            listOf(updated.copy(data = emptyMap(), updatedBy = "${testDecisionMaker_1.firstName} ${testDecisionMaker_1.lastName}")),
            deserializeResult(result.get()).data
        )
    }

    @Test
    fun `updateIncome nullify application_id`() {
        val testIncome = testIncome()
        db.transaction { tx ->
            val application = tx.insertApplication()
            tx.upsertIncome(mapper, testIncome.copy(applicationId = application.id), financeUser.id)
        }

        val (_, responseBeforeUpdate, resultBeforeUpdate) = http.get("/incomes?personId=${testAdult_1.id}")
            .asUser(financeUser)
            .responseString()
        assertEquals(200, responseBeforeUpdate.statusCode)

        val beforeUpdate = deserializeResult(resultBeforeUpdate.get()).data.first()
        assertNotNull(beforeUpdate.applicationId)

        val updated = with(testIncome) { this.copy(effect = IncomeEffect.MAX_FEE_ACCEPTED) }
        val (_, putResponse, _) = http.put("/incomes/${updated.id}?personId=${testAdult_1.id}")
            .asUser(financeUser)
            .jsonBody(objectMapper.writeValueAsString(updated))
            .responseString()
        assertEquals(204, putResponse.statusCode)

        val (_, responseAfterUpdate, resultAfterUpdate) = http.get("/incomes?personId=${testAdult_1.id}")
            .asUser(financeUser)
            .responseString()
        assertEquals(200, responseAfterUpdate.statusCode)

        val afterUpdate = deserializeResult(resultAfterUpdate.get()).data.first()
        assertNull(afterUpdate.applicationId)
    }

    @Test
    fun `deleteIncome works with multiple incomes in DB`() {
        val testIncome = testIncome()
        val anotherIncome = with(testIncome) {
            this.copy(
                id = IncomeId(UUID.randomUUID()),
                validFrom = validFrom.plusYears(1),
                validTo = validTo!!.plusYears(1)
            )
        }
        db.transaction { tx ->
            tx.upsertIncome(mapper, testIncome, financeUser.id)
            tx.upsertIncome(mapper, anotherIncome, financeUser.id)
        }

        val resultBeforeDelete = db.transaction { tx -> tx.getIncomesForPerson(mapper, incomeTypesProvider, testIncome.personId) }

        assertEquals(2, resultBeforeDelete.size)

        val (_, deleteResponse, _) = http.delete("/incomes/${testIncome.id}")
            .asUser(financeUser)
            .responseString()

        assertEquals(204, deleteResponse.statusCode)

        val resultAfterDelete = db.transaction { tx -> tx.getIncomesForPerson(mapper, incomeTypesProvider, testIncome.personId) }

        assertEquals(1, resultAfterDelete.size)
    }
}
