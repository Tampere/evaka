// SPDX-FileCopyrightText: 2017-2020 City of Espoo
//
// SPDX-License-Identifier: LGPL-2.1-or-later

package fi.espoo.evaka.invoicing.domain

import fi.espoo.evaka.placement.PlacementType
import fi.espoo.evaka.shared.domain.DateRange
import java.math.BigDecimal

data class FeeThresholds(
    val validDuring: DateRange,
    val minIncomeThreshold2: Int,
    val minIncomeThreshold3: Int,
    val minIncomeThreshold4: Int,
    val minIncomeThreshold5: Int,
    val minIncomeThreshold6: Int,
    val incomeMultiplier2: BigDecimal,
    val incomeMultiplier3: BigDecimal,
    val incomeMultiplier4: BigDecimal,
    val incomeMultiplier5: BigDecimal,
    val incomeMultiplier6: BigDecimal,
    val maxIncomeThreshold2: Int,
    val maxIncomeThreshold3: Int,
    val maxIncomeThreshold4: Int,
    val maxIncomeThreshold5: Int,
    val maxIncomeThreshold6: Int,
    val incomeThresholdIncrease6Plus: Int,
    val siblingDiscount2: BigDecimal,
    val siblingDiscount2Plus: BigDecimal,
    val maxFee: Int,
    val minFee: Int,
    val temporaryFee: Int,
    val temporaryFeePartDay: Int,
    val temporaryFeeSibling: Int,
    val temporaryFeeSiblingPartDay: Int,
    val preschoolClubFee: Int?,
    val preschoolClubSiblingDiscount: BigDecimal?
) {
    fun incomeMultiplier(familySize: Int): BigDecimal =
        if (familySize <= 1) {
            error("Family size must be greater than 1 (was $familySize)")
        } else {
            when (familySize) {
                2 -> incomeMultiplier2
                3 -> incomeMultiplier3
                4 -> incomeMultiplier4
                5 -> incomeMultiplier5
                6 -> incomeMultiplier6
                else -> incomeMultiplier6
            }
        }

    fun minIncomeThreshold(familySize: Int): Int =
        if (familySize <= 1) {
            error("Family size must be greater than 1 (was $familySize)")
        } else {
            when (familySize) {
                2 -> minIncomeThreshold2
                3 -> minIncomeThreshold3
                4 -> minIncomeThreshold4
                5 -> minIncomeThreshold5
                6 -> minIncomeThreshold6
                else -> minIncomeThreshold6 + ((familySize - 6) * incomeThresholdIncrease6Plus)
            }
        }

    fun maxIncomeThreshold(familySize: Int): Int =
        if (familySize <= 1) {
            error("Family size must be greater than 1 (was $familySize)")
        } else {
            when (familySize) {
                2 -> maxIncomeThreshold2
                3 -> maxIncomeThreshold3
                4 -> maxIncomeThreshold4
                5 -> maxIncomeThreshold5
                6 -> maxIncomeThreshold6
                else -> maxIncomeThreshold6 + ((familySize - 6) * incomeThresholdIncrease6Plus)
            }
        }

    fun siblingDiscountMultiplier(siblingOrdinal: Int, placementType: PlacementType): BigDecimal {
        check(siblingOrdinal > 0) { "Sibling ordinal must be > 0 (was $siblingOrdinal)" }
        if (siblingOrdinal == 1) {
            return BigDecimal(1)
        }
        siblingDiscountMultiplierByPlacementType(placementType)?.let {
            return BigDecimal(1) - it
        }
        return when (siblingOrdinal) {
            2 -> BigDecimal(1) - siblingDiscount2
            else -> BigDecimal(1) - siblingDiscount2Plus
        }
    }

    fun siblingDiscountPercent(siblingOrdinal: Int, placementType: PlacementType): Int =
        ((BigDecimal(1) - siblingDiscountMultiplier(siblingOrdinal, placementType)) *
                BigDecimal(100))
            .toInt()

    fun getFeeDecisionThresholds(familySize: Int): FeeDecisionThresholds =
        if (familySize > 1) {
            FeeDecisionThresholds(
                minIncomeThreshold = this.minIncomeThreshold(familySize),
                maxIncomeThreshold = this.maxIncomeThreshold(familySize),
                incomeMultiplier = this.incomeMultiplier(familySize),
                maxFee = this.maxFee,
                minFee = this.minFee
            )
        } else {
            FeeDecisionThresholds(
                minIncomeThreshold = 0,
                maxIncomeThreshold = 0,
                incomeMultiplier = BigDecimal(0),
                maxFee = this.maxFee,
                minFee = this.minFee
            )
        }

    fun calculatePriceForTemporary(partDay: Boolean, siblingOrdinal: Int): Int {
        return when (siblingOrdinal) {
            1 -> if (partDay) temporaryFeePartDay else temporaryFee
            else -> if (partDay) temporaryFeeSiblingPartDay else temporaryFeeSibling
        }
    }

    fun getBaseFeeByPlacementType(placementType: PlacementType): Int? =
        when (placementType) {
            PlacementType.PRESCHOOL_CLUB -> preschoolClubFee ?: error("Missing preschool club fee")
            else -> null
        }

    private fun siblingDiscountMultiplierByPlacementType(
        placementType: PlacementType
    ): BigDecimal? =
        when (placementType) {
            PlacementType.PRESCHOOL_CLUB -> preschoolClubSiblingDiscount
                    ?: error("Missing preschool club sibling discount")
            else -> null
        }
}

data class FeeDecisionThresholds(
    val minIncomeThreshold: Int,
    val maxIncomeThreshold: Int,
    val incomeMultiplier: BigDecimal,
    val maxFee: Int,
    val minFee: Int
)
