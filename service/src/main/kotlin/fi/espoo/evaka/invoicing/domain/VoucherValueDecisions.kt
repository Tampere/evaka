// SPDX-FileCopyrightText: 2017-2020 City of Espoo
//
// SPDX-License-Identifier: LGPL-2.1-or-later

package fi.espoo.evaka.invoicing.domain

import fi.espoo.evaka.IncludeCodeGen
import fi.espoo.evaka.placement.PlacementType
import fi.espoo.evaka.shared.DaycareId
import fi.espoo.evaka.shared.EmployeeId
import fi.espoo.evaka.shared.PersonId
import fi.espoo.evaka.shared.VoucherValueDecisionId
import fi.espoo.evaka.shared.domain.DateRange
import fi.espoo.evaka.shared.domain.HelsinkiDateTime
import org.jdbi.v3.core.mapper.Nested
import org.jdbi.v3.json.Json
import java.math.BigDecimal
import java.time.LocalDate
import java.util.UUID

@IncludeCodeGen
data class VoucherValueDecision(
    override val id: VoucherValueDecisionId,
    override val validFrom: LocalDate,
    override val validTo: LocalDate?,
    override val headOfFamilyId: PersonId,
    val status: VoucherValueDecisionStatus,
    val decisionNumber: Long? = null,
    val decisionType: VoucherValueDecisionType,
    val partnerId: PersonId?,
    @Json
    val headOfFamilyIncome: DecisionIncome?,
    @Json
    val partnerIncome: DecisionIncome?,
    @Json
    val childIncome: DecisionIncome?,
    val familySize: Int,
    @Json
    val feeThresholds: FeeDecisionThresholds,
    @Nested("child")
    val child: ChildWithDateOfBirth,
    @Nested("placement")
    val placement: VoucherValueDecisionPlacement,
    @Nested("service_need")
    val serviceNeed: VoucherValueDecisionServiceNeed,
    val baseCoPayment: Int,
    val siblingDiscount: Int,
    val coPayment: Int,
    @Json
    val feeAlterations: List<FeeAlterationWithEffect>,
    val finalCoPayment: Int,
    val baseValue: Int,
    val capacityFactor: BigDecimal,
    val voucherValue: Int,
    val documentKey: String? = null,
    val approvedById: EmployeeId? = null,
    val approvedAt: HelsinkiDateTime? = null,
    val sentAt: HelsinkiDateTime? = null,
    val created: HelsinkiDateTime = HelsinkiDateTime.now(),
    val decisionHandler: UUID? = null
) : FinanceDecision<VoucherValueDecision> {
    override fun withRandomId() = this.copy(id = VoucherValueDecisionId(UUID.randomUUID()))
    override fun withValidity(period: DateRange) = this.copy(validFrom = period.start, validTo = period.end)
    override fun contentEquals(decision: VoucherValueDecision): Boolean {
        return this.headOfFamilyId == decision.headOfFamilyId &&
            this.partnerId == decision.partnerId &&
            this.headOfFamilyIncome == decision.headOfFamilyIncome &&
            this.partnerIncome == decision.partnerIncome &&
            this.familySize == decision.familySize &&
            this.child == decision.child &&
            this.placement == decision.placement &&
            this.serviceNeed == decision.serviceNeed &&
            this.baseCoPayment == decision.baseCoPayment &&
            this.siblingDiscount == decision.siblingDiscount &&
            this.coPayment == decision.coPayment &&
            this.feeAlterations == decision.feeAlterations &&
            this.finalCoPayment == decision.finalCoPayment &&
            this.baseValue == decision.baseValue &&
            this.voucherValue == decision.voucherValue &&
            this.childIncome == decision.childIncome
    }

    override fun overlapsWith(other: VoucherValueDecision): Boolean {
        return this.child.id == other.child.id && DateRange(
            this.validFrom,
            this.validTo
        ).overlaps(DateRange(other.validFrom, other.validTo))
    }

    override fun isAnnulled(): Boolean = this.status == VoucherValueDecisionStatus.ANNULLED
    override fun isEmpty(): Boolean = false
    override fun annul() = this.copy(status = VoucherValueDecisionStatus.ANNULLED)
}

enum class VoucherValueDecisionType {
    NORMAL,
    RELIEF_REJECTED,
    RELIEF_PARTLY_ACCEPTED,
    RELIEF_ACCEPTED
}

enum class VoucherValueDecisionStatus {
    DRAFT,
    WAITING_FOR_SENDING,
    WAITING_FOR_MANUAL_SENDING,
    SENT,
    ANNULLED;

    companion object {
        /**
         *  list of statuses that have an overlap exclusion constraint at the database level and that signal that a decision is in effect
         */
        val effective = arrayOf(SENT, WAITING_FOR_SENDING, WAITING_FOR_MANUAL_SENDING)
    }
}

data class VoucherValueDecisionDetailed(
    val id: VoucherValueDecisionId,
    val validFrom: LocalDate,
    val validTo: LocalDate?,
    val status: VoucherValueDecisionStatus,
    val decisionNumber: Long? = null,
    val decisionType: VoucherValueDecisionType,
    @Nested("head")
    val headOfFamily: PersonDetailed,
    @Nested("partner")
    val partner: PersonDetailed?,
    @Json
    val headOfFamilyIncome: DecisionIncome?,
    @Json
    val partnerIncome: DecisionIncome?,
    @Json
    val childIncome: DecisionIncome?,
    val familySize: Int,
    @Json
    val feeThresholds: FeeDecisionThresholds,
    @Nested("child")
    val child: PersonDetailed,
    @Nested("placement")
    val placement: VoucherValueDecisionPlacementDetailed,
    @Nested("service_need")
    val serviceNeed: VoucherValueDecisionServiceNeed,
    val baseCoPayment: Int,
    val siblingDiscount: Int,
    val coPayment: Int,
    @Json
    val feeAlterations: List<FeeAlterationWithEffect>,
    val finalCoPayment: Int,
    val baseValue: Int,
    val childAge: Int,
    val capacityFactor: BigDecimal,
    val voucherValue: Int,
    val documentKey: String? = null,
    @Nested("approved_by")
    val approvedBy: EmployeeWithName? = null,
    val approvedAt: HelsinkiDateTime? = null,
    val sentAt: HelsinkiDateTime? = null,
    val created: HelsinkiDateTime = HelsinkiDateTime.now(),
    val financeDecisionHandlerFirstName: String?,
    val financeDecisionHandlerLastName: String?,
    val isElementaryFamily: Boolean? = false
) {
    val incomeEffect
        get() = getTotalIncomeEffect(partner != null, headOfFamilyIncome?.effect, partnerIncome?.effect)

    val totalIncome
        get() = getTotalIncome(
            partner != null,
            headOfFamilyIncome?.effect,
            headOfFamilyIncome?.total,
            partnerIncome?.effect,
            partnerIncome?.total
        )

    val requiresManualSending
        get(): Boolean {
            if (decisionType !== VoucherValueDecisionType.NORMAL || headOfFamily.forceManualFeeDecisions) {
                return true
            }
            return this.headOfFamily.let {
                listOf(it.ssn, it.streetAddress, it.postalCode, it.postOffice).any { item -> item.isNullOrBlank() }
            }
        }

    val isRetroactive
        get() = isRetroactive(this.validFrom, sentAt?.toLocalDate() ?: LocalDate.now())
}

data class VoucherValueDecisionSummary(
    val id: VoucherValueDecisionId,
    val validFrom: LocalDate,
    val validTo: LocalDate?,
    val status: VoucherValueDecisionStatus,
    val decisionNumber: Long? = null,
    @Nested("head")
    val headOfFamily: PersonBasic,
    @Nested("child")
    val child: PersonBasic,
    val finalCoPayment: Int,
    val voucherValue: Int,
    val approvedAt: HelsinkiDateTime? = null,
    val sentAt: HelsinkiDateTime? = null,
    val created: HelsinkiDateTime = HelsinkiDateTime.now(),
)

data class VoucherValueDecisionPlacement(
    val unitId: DaycareId,
    val type: PlacementType
)

data class VoucherValueDecisionPlacementDetailed(
    @Nested("unit")
    val unit: UnitData,
    val type: PlacementType
)

data class VoucherValueDecisionServiceNeed(
    val feeCoefficient: BigDecimal,
    val voucherValueCoefficient: BigDecimal,
    val feeDescriptionFi: String,
    val feeDescriptionSv: String,
    val voucherValueDescriptionFi: String,
    val voucherValueDescriptionSv: String
)

fun firstOfMonthAfterThirdBirthday(dateOfBirth: LocalDate): LocalDate = when (dateOfBirth.dayOfMonth) {
    1 -> dateOfBirth.plusYears(3)
    else -> dateOfBirth.plusYears(3).plusMonths(1).withDayOfMonth(1)
}

fun getBaseValue(period: DateRange, dateOfBirth: LocalDate, voucherValues: VoucherValue): Int {
    val thirdBirthdayPeriodStart = firstOfMonthAfterThirdBirthday(dateOfBirth)
    val periodStartInMiddleOfTargetPeriod = period.includes(thirdBirthdayPeriodStart) && thirdBirthdayPeriodStart != period.start && thirdBirthdayPeriodStart != period.end

    check(!periodStartInMiddleOfTargetPeriod) {
        "Third birthday period start ($thirdBirthdayPeriodStart) is in the middle of the period ($period), cannot calculate an unambiguous age coefficient"
    }

    return when {
        period.start < thirdBirthdayPeriodStart -> voucherValues.baseValueAgeUnderThree
        else -> voucherValues.baseValue
    }
}

fun calculateVoucherValue(baseValue: Int, capacityFactor: BigDecimal, serviceCoefficient: BigDecimal): Int {
    return (BigDecimal(baseValue) * capacityFactor * serviceCoefficient).toInt()
}
