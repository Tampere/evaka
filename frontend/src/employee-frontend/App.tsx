// SPDX-FileCopyrightText: 2017-2022 City of Espoo
//
// SPDX-License-Identifier: LGPL-2.1-or-later

import { ErrorBoundary } from '@sentry/react'
import React, { useCallback, useContext, useEffect, useState } from 'react'
import {
  BrowserRouter as Router,
  Navigate,
  Route,
  Routes
} from 'react-router-dom'
import { ThemeProvider } from 'styled-components'

import { AuthStatus, User } from 'lib-common/api-types/employee-auth'
import { idleTracker } from 'lib-common/utils/idleTracker'
import { Notifications } from 'lib-components/Notifications'
import ErrorPage from 'lib-components/molecules/ErrorPage'
import { LoginErrorModal } from 'lib-components/molecules/modals/LoginErrorModal'
import { theme } from 'lib-customizations/common'

import { getAuthStatus } from './api/auth'
import { client } from './api/client'
import ApplicationPage from './components/ApplicationPage'
import ChildInformation from './components/ChildInformation'
import EmployeeRoute from './components/EmployeeRoute'
import FinancePage from './components/FinancePage'
import { Footer } from './components/Footer'
import GroupCaretakers from './components/GroupCaretakers'
import Header from './components/Header'
import IncomeStatementPage from './components/IncomeStatementPage'
import LoginPage from './components/LoginPage'
import MobilePairingModal from './components/MobilePairingModal'
import PersonProfile from './components/PersonProfile'
import PersonalMobileDevicesPage from './components/PersonalMobileDevicesPage'
import Reports from './components/Reports'
import Search from './components/Search'
import SettingsPage from './components/SettingsPage'
import UnitFeaturesPage from './components/UnitFeaturesPage'
import UnitPage from './components/UnitPage'
import Units from './components/Units'
import WelcomePage from './components/WelcomePage'
import ApplicationsPage from './components/applications/ApplicationsPage'
import ChildDocumentEditor from './components/child-documents/ChildDocumentEditor'
import AssistanceNeedDecisionEditPage from './components/child-information/assistance-need/decision/AssistanceNeedDecisionEditPage'
import AssistanceNeedDecisionPage from './components/child-information/assistance-need/decision/AssistanceNeedDecisionPage'
import AssistanceNeedPreschoolDecisionEditPage from './components/child-information/assistance-need/decision/AssistanceNeedPreschoolDecisionEditPage'
import AssistanceNeedPreschoolDecisionReadPage from './components/child-information/assistance-need/decision/AssistanceNeedPreschoolDecisionReadPage'
import ErrorMessage from './components/common/ErrorMessage'
import DecisionPage from './components/decision-draft/DecisionDraft'
import DocumentTemplatesPage from './components/document-templates/template-editor/DocumentTemplatesPage'
import TemplateEditorPage from './components/document-templates/template-editor/TemplateEditorPage'
import EmployeePinCodePage from './components/employee/EmployeePinCodePage'
import EmployeePreferredFirstNamePage from './components/employee/EmployeePreferredFirstNamePage'
import EmployeePage from './components/employees/EmployeePage'
import EmployeesPage from './components/employees/EmployeesPage'
import FeeDecisionDetailsPage from './components/fee-decision-details/FeeDecisionDetailsPage'
import FinanceBasicsPage from './components/finance-basics/FinanceBasicsPage'
import HolidayPeriodEditor from './components/holiday-periods/HolidayPeriodEditor'
import HolidayPeriodsPage from './components/holiday-periods/HolidayPeriodsPage'
import QuestionnaireEditor from './components/holiday-periods/QuestionnaireEditor'
import InvoicePage from './components/invoice/InvoicePage'
import MessagesPage from './components/messages/MessagesPage'
import PlacementDraftPage from './components/placement-draft/PlacementDraft'
import ReportApplications from './components/reports/Applications'
import AssistanceNeedDecisionsReport from './components/reports/AssistanceNeedDecisionsReport'
import AssistanceNeedDecisionsReportDecision from './components/reports/AssistanceNeedDecisionsReportDecision'
import AssistanceNeedDecisionsReportPreschoolDecision from './components/reports/AssistanceNeedDecisionsReportPreschoolDecision'
import ReportAssistanceNeedsAndActions from './components/reports/AssistanceNeedsAndActions'
import AttendanceReservation from './components/reports/AttendanceReservation'
import AttendanceReservationByChild from './components/reports/AttendanceReservationByChild'
import ReportChildAgeLanguage from './components/reports/ChildAgeLanguage'
import ReportChildrenInDifferentAddress from './components/reports/ChildrenInDifferentAddress'
import ReportDecisions from './components/reports/Decisions'
import ReportDuplicatePeople from './components/reports/DuplicatePeople'
import ReportEndedPlacements from './components/reports/EndedPlacements'
import ReportFamilyConflicts from './components/reports/FamilyConflicts'
import ReportFamilyContacts from './components/reports/FamilyContacts'
import FamilyDaycareMealCount from './components/reports/FamilyDaycareMealCount'
import ReportInvoices from './components/reports/Invoices'
import ManualDuplicationReport from './components/reports/ManualDuplicationReport'
import ReportMissingHeadOfFamily from './components/reports/MissingHeadOfFamily'
import ReportMissingServiceNeed from './components/reports/MissingServiceNeed'
import ReportOccupancies from './components/reports/Occupancies'
import ReportPartnersInDifferentAddress from './components/reports/PartnersInDifferentAddress'
import PlacementCount from './components/reports/PlacementCount'
import PlacementSketching from './components/reports/PlacementSketching'
import ReportPresences from './components/reports/PresenceReport'
import ReportRaw from './components/reports/Raw'
import ReportServiceNeeds from './components/reports/ServiceNeeds'
import ReportSextet from './components/reports/Sextet'
import ReportStartingPlacements from './components/reports/StartingPlacements'
import VardaErrors from './components/reports/VardaErrors'
import VoucherServiceProviderUnit from './components/reports/VoucherServiceProviderUnit'
import VoucherServiceProviders from './components/reports/VoucherServiceProviders'
import CreateUnitPage from './components/unit/unit-details/CreateUnitPage'
import UnitDetailsPage from './components/unit/unit-details/UnitDetailsPage'
import VasuEditPage from './components/vasu/VasuEditPage'
import VasuPage from './components/vasu/VasuPage'
import VasuTemplateEditor from './components/vasu/templates/VasuTemplateEditor'
import VasuTemplatesPage from './components/vasu/templates/VasuTemplatesPage'
import VoucherValueDecisionPage from './components/voucher-value-decision/VoucherValueDecisionPage'
import { QueryClientProvider, queryClient } from './query'
import StateProvider from './state/StateProvider'
import { I18nContextProvider, useTranslation } from './state/i18n'
import { UIContext } from './state/ui'
import { UserContext, UserContextProvider } from './state/user'
import { hasRole } from './utils/roles'

export default function App() {
  const { i18n } = useTranslation()
  const { authStatus, refreshAuthStatus } = useAuthStatus()

  if (authStatus === undefined) {
    return null
  }

  return (
    <QueryClientProvider client={queryClient}>
      <I18nContextProvider>
        <ThemeProvider theme={theme}>
          <ErrorBoundary
            fallback={() => (
              <ErrorPage basePath="/employee" labels={i18n.errorPage} />
            )}
          >
            <Router basename="/employee">
              <UserContextProvider
                user={authStatus.user}
                roles={authStatus.roles}
              >
                <StateProvider>
                  <Header />
                  <Notifications apiVersion={authStatus.apiVersion} />
                  <Routes>
                    <Route
                      path="/login"
                      element={
                        <EmployeeRoute
                          requireAuth={false}
                          title={i18n.titles.login}
                        >
                          <LoginPage />
                        </EmployeeRoute>
                      }
                    />
                    <Route
                      path="/settings"
                      element={
                        <EmployeeRoute title={i18n.settings.title}>
                          <SettingsPage />
                        </EmployeeRoute>
                      }
                    />
                    <Route
                      path="/unit-features"
                      element={
                        <EmployeeRoute title={i18n.unitFeatures.title}>
                          <UnitFeaturesPage />
                        </EmployeeRoute>
                      }
                    />
                    <Route
                      path="/units"
                      element={
                        <EmployeeRoute title={i18n.titles.units}>
                          <Units />
                        </EmployeeRoute>
                      }
                    />
                    <Route
                      path="/units/new"
                      element={
                        <EmployeeRoute title={i18n.titles.createUnit}>
                          <CreateUnitPage />
                        </EmployeeRoute>
                      }
                    />
                    <Route
                      path="/units/:id/details"
                      element={
                        <EmployeeRoute>
                          <UnitDetailsPage />
                        </EmployeeRoute>
                      }
                    />
                    <Route
                      path="/units/:unitId/family-contacts"
                      element={
                        <EmployeeRoute>
                          <ReportFamilyContacts />
                        </EmployeeRoute>
                      }
                    />
                    <Route
                      path="/units/:unitId/groups/:groupId/caretakers"
                      element={
                        <EmployeeRoute title={i18n.groupCaretakers.title}>
                          <GroupCaretakers />
                        </EmployeeRoute>
                      }
                    />
                    <Route
                      path="/units/:id/*"
                      element={
                        <EmployeeRoute>
                          <UnitPage />
                        </EmployeeRoute>
                      }
                    />
                    <Route
                      path="/search"
                      element={
                        <EmployeeRoute title={i18n.titles.customers}>
                          <Search />
                        </EmployeeRoute>
                      }
                    />
                    <Route
                      path="/profile/:id"
                      element={
                        <EmployeeRoute title={i18n.personProfile.title}>
                          <PersonProfile />
                        </EmployeeRoute>
                      }
                    />
                    <Route
                      path="/profile/:personId/income-statement/:incomeStatementId"
                      element={
                        <EmployeeRoute title={i18n.incomeStatement.title}>
                          <IncomeStatementPage />
                        </EmployeeRoute>
                      }
                    />
                    <Route
                      path="/child-information/:id"
                      element={
                        <EmployeeRoute title={i18n.childInformation.title}>
                          <ChildInformation />
                        </EmployeeRoute>
                      }
                    />
                    <Route
                      path="/child-information/:childId/assistance-need-decision/:id"
                      element={
                        <EmployeeRoute
                          title={i18n.titles.assistanceNeedDecision}
                        >
                          <AssistanceNeedDecisionPage />
                        </EmployeeRoute>
                      }
                    />
                    <Route
                      path="/child-information/:childId/assistance-need-decision/:id/edit"
                      element={
                        <EmployeeRoute
                          title={i18n.titles.assistanceNeedDecision}
                        >
                          <AssistanceNeedDecisionEditPage />
                        </EmployeeRoute>
                      }
                    />
                    <Route
                      path="/child-information/:childId/assistance-need-preschool-decisions/:decisionId"
                      element={
                        <EmployeeRoute
                          title={i18n.titles.assistanceNeedDecision}
                        >
                          <AssistanceNeedPreschoolDecisionReadPage />
                        </EmployeeRoute>
                      }
                    />
                    <Route
                      path="/child-information/:childId/assistance-need-preschool-decisions/:decisionId/edit"
                      element={
                        <EmployeeRoute
                          title={i18n.titles.assistanceNeedDecision}
                        >
                          <AssistanceNeedPreschoolDecisionEditPage />
                        </EmployeeRoute>
                      }
                    />
                    <Route
                      path="/applications"
                      element={
                        <EmployeeRoute title={i18n.titles.applications}>
                          <ApplicationsPage />
                        </EmployeeRoute>
                      }
                    />
                    <Route
                      path="/applications/:id"
                      element={
                        <EmployeeRoute title={i18n.titles.applications}>
                          <ApplicationPage />
                        </EmployeeRoute>
                      }
                    />
                    <Route
                      path="/applications/:id/placement"
                      element={
                        <EmployeeRoute title={i18n.titles.placementDraft}>
                          <PlacementDraftPage />
                        </EmployeeRoute>
                      }
                    />
                    <Route
                      path="/applications/:id/decisions"
                      element={
                        <EmployeeRoute title={i18n.titles.decision}>
                          <DecisionPage />
                        </EmployeeRoute>
                      }
                    />
                    <Route
                      path="/finance/basics"
                      element={
                        <EmployeeRoute title={i18n.financeBasics.title}>
                          <FinanceBasicsPage />
                        </EmployeeRoute>
                      }
                    />
                    <Route
                      path="/finance/fee-decisions/:id"
                      element={
                        <EmployeeRoute>
                          <FeeDecisionDetailsPage />
                        </EmployeeRoute>
                      }
                    />
                    <Route
                      path="/finance/value-decisions/:id"
                      element={
                        <EmployeeRoute>
                          <VoucherValueDecisionPage />
                        </EmployeeRoute>
                      }
                    />
                    <Route
                      path="/finance/invoices/:id"
                      element={
                        <EmployeeRoute>
                          <InvoicePage />
                        </EmployeeRoute>
                      }
                    />
                    <Route
                      path="/finance/*"
                      element={
                        <EmployeeRoute>
                          <FinancePage />
                        </EmployeeRoute>
                      }
                    />
                    <Route
                      path="/reports"
                      element={
                        <EmployeeRoute title={i18n.titles.reports}>
                          <Reports />
                        </EmployeeRoute>
                      }
                    />
                    <Route
                      path="/reports/family-conflicts"
                      element={
                        <EmployeeRoute title={i18n.titles.reports}>
                          <ReportFamilyConflicts />
                        </EmployeeRoute>
                      }
                    />
                    <Route
                      path="/reports/missing-head-of-family"
                      element={
                        <EmployeeRoute title={i18n.titles.reports}>
                          <ReportMissingHeadOfFamily />
                        </EmployeeRoute>
                      }
                    />
                    <Route
                      path="/reports/missing-service-need"
                      element={
                        <EmployeeRoute title={i18n.titles.reports}>
                          <ReportMissingServiceNeed />
                        </EmployeeRoute>
                      }
                    />
                    <Route
                      path="/reports/applications"
                      element={
                        <EmployeeRoute title={i18n.titles.reports}>
                          <ReportApplications />
                        </EmployeeRoute>
                      }
                    />
                    <Route
                      path="/reports/decisions"
                      element={
                        <EmployeeRoute title={i18n.titles.reports}>
                          <ReportDecisions />
                        </EmployeeRoute>
                      }
                    />
                    <Route
                      path="/reports/partners-in-different-address"
                      element={
                        <EmployeeRoute title={i18n.titles.reports}>
                          <ReportPartnersInDifferentAddress />
                        </EmployeeRoute>
                      }
                    />
                    <Route
                      path="/reports/children-in-different-address"
                      element={
                        <EmployeeRoute title={i18n.titles.reports}>
                          <ReportChildrenInDifferentAddress />
                        </EmployeeRoute>
                      }
                    />
                    <Route
                      path="/reports/child-age-language"
                      element={
                        <EmployeeRoute title={i18n.titles.reports}>
                          <ReportChildAgeLanguage />
                        </EmployeeRoute>
                      }
                    />
                    <Route
                      path="/reports/assistance-needs-and-actions"
                      element={
                        <EmployeeRoute title={i18n.titles.reports}>
                          <ReportAssistanceNeedsAndActions />
                        </EmployeeRoute>
                      }
                    />
                    <Route
                      path="/reports/occupancies"
                      element={
                        <EmployeeRoute title={i18n.titles.reports}>
                          <ReportOccupancies />
                        </EmployeeRoute>
                      }
                    />
                    <Route
                      path="/reports/invoices"
                      element={
                        <EmployeeRoute title={i18n.titles.reports}>
                          <ReportInvoices />
                        </EmployeeRoute>
                      }
                    />
                    <Route
                      path="/reports/starting-placements"
                      element={
                        <EmployeeRoute title={i18n.titles.reports}>
                          <ReportStartingPlacements />
                        </EmployeeRoute>
                      }
                    />
                    <Route
                      path="/reports/ended-placements"
                      element={
                        <EmployeeRoute title={i18n.titles.reports}>
                          <ReportEndedPlacements />
                        </EmployeeRoute>
                      }
                    />
                    <Route
                      path="/reports/duplicate-people"
                      element={
                        <EmployeeRoute title={i18n.titles.reports}>
                          <ReportDuplicatePeople />
                        </EmployeeRoute>
                      }
                    />
                    <Route
                      path="/reports/presences"
                      element={
                        <EmployeeRoute title={i18n.titles.reports}>
                          <ReportPresences />
                        </EmployeeRoute>
                      }
                    />
                    <Route
                      path="/reports/service-needs"
                      element={
                        <EmployeeRoute title={i18n.titles.reports}>
                          <ReportServiceNeeds />
                        </EmployeeRoute>
                      }
                    />
                    <Route
                      path="/reports/sextet"
                      element={
                        <EmployeeRoute title={i18n.titles.reports}>
                          <ReportSextet />
                        </EmployeeRoute>
                      }
                    />
                    <Route
                      path="/reports/voucher-service-providers"
                      element={
                        <EmployeeRoute title={i18n.titles.reports}>
                          <VoucherServiceProviders />
                        </EmployeeRoute>
                      }
                    />
                    <Route
                      path="/reports/voucher-service-providers/:unitId"
                      element={
                        <EmployeeRoute title={i18n.titles.reports}>
                          <VoucherServiceProviderUnit />
                        </EmployeeRoute>
                      }
                    />
                    <Route
                      path="/reports/attendance-reservation"
                      element={
                        <EmployeeRoute title={i18n.titles.reports}>
                          <AttendanceReservation />
                        </EmployeeRoute>
                      }
                    />
                    <Route
                      path="/reports/attendance-reservation-by-child"
                      element={
                        <EmployeeRoute title={i18n.titles.reports}>
                          <AttendanceReservationByChild />
                        </EmployeeRoute>
                      }
                    />
                    <Route
                      path="/reports/varda-errors"
                      element={
                        <EmployeeRoute title={i18n.titles.reports}>
                          <VardaErrors />
                        </EmployeeRoute>
                      }
                    />
                    <Route
                      path="/reports/placement-count"
                      element={
                        <EmployeeRoute title={i18n.titles.reports}>
                          <PlacementCount />
                        </EmployeeRoute>
                      }
                    />
                    <Route
                      path="/reports/placement-sketching"
                      element={
                        <EmployeeRoute title={i18n.titles.reports}>
                          <PlacementSketching />
                        </EmployeeRoute>
                      }
                    />
                    <Route
                      path="/reports/raw"
                      element={
                        <EmployeeRoute title={i18n.titles.reports}>
                          <ReportRaw />
                        </EmployeeRoute>
                      }
                    />
                    <Route
                      path="/reports/assistance-need-decisions/:id"
                      element={
                        <EmployeeRoute title={i18n.titles.reports}>
                          <AssistanceNeedDecisionsReportDecision />
                        </EmployeeRoute>
                      }
                    />
                    <Route
                      path="/reports/assistance-need-preschool-decisions/:decisionId"
                      element={
                        <EmployeeRoute title={i18n.titles.reports}>
                          <AssistanceNeedDecisionsReportPreschoolDecision />
                        </EmployeeRoute>
                      }
                    />
                    <Route
                      path="/reports/assistance-need-decisions"
                      element={
                        <EmployeeRoute title={i18n.titles.reports}>
                          <AssistanceNeedDecisionsReport />
                        </EmployeeRoute>
                      }
                    />
                    <Route
                      path="/reports/manual-duplication"
                      element={
                        <EmployeeRoute title={i18n.titles.reports}>
                          <ManualDuplicationReport />
                        </EmployeeRoute>
                      }
                    />
                    <Route
                      path="/reports/family-daycare-meal-count"
                      element={
                        <EmployeeRoute title={i18n.titles.reports}>
                          <FamilyDaycareMealCount />
                        </EmployeeRoute>
                      }
                    />
                    <Route
                      path="/messages"
                      element={
                        <EmployeeRoute title={i18n.titles.messages}>
                          <MessagesPage />
                        </EmployeeRoute>
                      }
                    />
                    <Route
                      path="/messages/send"
                      element={
                        <EmployeeRoute title={i18n.titles.messages}>
                          <MessagesPage showEditor />
                        </EmployeeRoute>
                      }
                    />
                    <Route
                      path="/personal-mobile-devices"
                      element={
                        <EmployeeRoute
                          title={i18n.titles.personalMobileDevices}
                        >
                          <PersonalMobileDevicesPage />
                        </EmployeeRoute>
                      }
                    />
                    <Route
                      path="/pin-code"
                      element={
                        <EmployeeRoute title={i18n.titles.employeePinCode}>
                          <EmployeePinCodePage />
                        </EmployeeRoute>
                      }
                    />
                    <Route
                      path="/preferred-first-name"
                      element={
                        <EmployeeRoute title={i18n.titles.preferredFirstName}>
                          <EmployeePreferredFirstNamePage
                            refreshAuthStatus={refreshAuthStatus}
                          />
                        </EmployeeRoute>
                      }
                    />
                    <Route
                      path="/employees"
                      element={
                        <EmployeeRoute title={i18n.employees.title}>
                          <EmployeesPage />
                        </EmployeeRoute>
                      }
                    />
                    <Route
                      path="/employees/:id"
                      element={
                        <EmployeeRoute title={i18n.employees.title}>
                          <EmployeePage />
                        </EmployeeRoute>
                      }
                    />
                    <Route
                      path="/welcome"
                      element={
                        <EmployeeRoute title={i18n.titles.welcomePage}>
                          <WelcomePage />
                        </EmployeeRoute>
                      }
                    />
                    <Route
                      path="/vasu/:id"
                      element={
                        <EmployeeRoute title={i18n.titles.vasuPage}>
                          <VasuPage />
                        </EmployeeRoute>
                      }
                    />
                    <Route
                      path="/vasu/:id/edit"
                      element={
                        <EmployeeRoute title={i18n.titles.vasuPage}>
                          <VasuEditPage />
                        </EmployeeRoute>
                      }
                    />
                    <Route
                      path="/vasu-templates"
                      element={
                        <EmployeeRoute title={i18n.titles.vasuTemplates}>
                          <VasuTemplatesPage />
                        </EmployeeRoute>
                      }
                    />
                    <Route
                      path="/vasu-templates/:id"
                      element={
                        <EmployeeRoute title={i18n.titles.vasuTemplates}>
                          <VasuTemplateEditor />
                        </EmployeeRoute>
                      }
                    />
                    <Route
                      path="/document-templates"
                      element={
                        <EmployeeRoute title={i18n.titles.documentTemplates}>
                          <DocumentTemplatesPage />
                        </EmployeeRoute>
                      }
                    />
                    <Route
                      path="/document-templates/:templateId"
                      element={
                        <EmployeeRoute title={i18n.titles.documentTemplates}>
                          <TemplateEditorPage />
                        </EmployeeRoute>
                      }
                    />
                    <Route
                      path="/child-documents/:documentId"
                      element={
                        <EmployeeRoute title={i18n.titles.childDocument}>
                          <ChildDocumentEditor />
                        </EmployeeRoute>
                      }
                    />
                    <Route
                      path="/holiday-periods"
                      element={
                        <EmployeeRoute title={i18n.titles.holidayPeriods}>
                          <HolidayPeriodsPage />
                        </EmployeeRoute>
                      }
                    />
                    <Route
                      path="/holiday-periods/:id"
                      element={
                        <EmployeeRoute title={i18n.titles.holidayPeriods}>
                          <HolidayPeriodEditor />
                        </EmployeeRoute>
                      }
                    />
                    <Route
                      path="/holiday-periods/questionnaire/:id"
                      element={
                        <EmployeeRoute title={i18n.titles.holidayQuestionnaire}>
                          <QuestionnaireEditor />
                        </EmployeeRoute>
                      }
                    />
                    <Route
                      index
                      element={
                        <EmployeeRoute requireAuth={false}>
                          <RedirectToMainPage />
                        </EmployeeRoute>
                      }
                    />
                  </Routes>
                  <Footer />
                  <ErrorMessage />
                  <LoginErrorModal />
                  <PairingModal />
                </StateProvider>
              </UserContextProvider>
            </Router>
          </ErrorBoundary>
        </ThemeProvider>
      </I18nContextProvider>
    </QueryClientProvider>
  )
}

function RedirectToMainPage() {
  const { loggedIn, roles } = useContext(UserContext)

  if (!loggedIn) {
    return <Navigate replace to="/login" />
  }

  if (
    hasRole(roles, 'SERVICE_WORKER') ||
    hasRole(roles, 'SPECIAL_EDUCATION_TEACHER')
  ) {
    return <Navigate replace to="/applications" />
  } else if (hasRole(roles, 'UNIT_SUPERVISOR') || hasRole(roles, 'STAFF')) {
    return <Navigate replace to="/units" />
  } else if (hasRole(roles, 'DIRECTOR') || hasRole(roles, 'REPORT_VIEWER')) {
    return <Navigate replace to="/reports" />
  } else if (hasRole(roles, 'MESSAGING')) {
    return <Navigate replace to="/messages" />
  } else if (roles.length === 0) {
    return <Navigate replace to="/welcome" />
  } else {
    return <Navigate replace to="/search" />
  }
}

interface AuthStatusWithRefresh {
  authStatus: AuthStatus<User> | undefined
  refreshAuthStatus: () => void
}

function useAuthStatus(): AuthStatusWithRefresh {
  const [authStatus, setAuthStatus] = useState<AuthStatus<User>>()

  const refreshAuthStatus = useCallback(
    () => getAuthStatus().then(setAuthStatus),
    []
  )

  useEffect(() => {
    void refreshAuthStatus()
  }, [refreshAuthStatus])

  useEffect(
    () =>
      idleTracker(
        client,
        () => {
          void refreshAuthStatus()
        },
        { thresholdInMinutes: 20 }
      ),
    [refreshAuthStatus]
  )

  return {
    authStatus,
    refreshAuthStatus
  }
}

const PairingModal = React.memo(function GlobalModals() {
  const { uiMode, pairingState, closePairingModal } = useContext(UIContext)

  if (uiMode !== 'pair-mobile-device' || !pairingState) {
    return null
  }

  return (
    <MobilePairingModal closeModal={closePairingModal} {...pairingState.id} />
  )
})
