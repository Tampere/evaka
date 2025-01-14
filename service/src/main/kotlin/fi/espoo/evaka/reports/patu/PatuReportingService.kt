// SPDX-FileCopyrightText: 2017-2023 City of Espoo
//
// SPDX-License-Identifier: LGPL-2.1-or-later

package fi.espoo.evaka.reports.patu

import fi.espoo.evaka.EvakaEnv
import fi.espoo.evaka.reports.REPORT_STATEMENT_TIMEOUT
import fi.espoo.evaka.reports.getRawRows
import fi.espoo.evaka.shared.db.Database
import fi.espoo.evaka.shared.domain.DateRange

class PatuReportingService(
    env: EvakaEnv,
    private val patuIntegrationClient: PatuIntegrationClient
) {
    private val assistanceModel = env.assistanceModel

    fun sendPatuReport(dbc: Database.Connection, dateRange: DateRange) {
        val rows =
            dbc.read {
                it.setStatementTimeout(REPORT_STATEMENT_TIMEOUT)
                it.getRawRows(assistanceModel, dateRange.start, dateRange.end ?: dateRange.start)
            }
        patuIntegrationClient.send(rows)
    }
}
