// SPDX-FileCopyrightText: 2017-2021 City of Espoo
//
// SPDX-License-Identifier: LGPL-2.1-or-later

// GENERATED FILE: no manual modifications
/* eslint-disable prettier/prettier */

export namespace Action {

export type Global =
  | 'CREATE_FEE_THRESHOLDS'
  | 'CREATE_PAPER_APPLICATION'
  | 'CREATE_VASU_TEMPLATE'
  | 'FETCH_INCOME_STATEMENTS_AWAITING_HANDLER'
  | 'READ_FEE_THRESHOLDS'
  | 'READ_PERSON_APPLICATION'
  | 'READ_UNIT_FEATURES'
  | 'READ_VASU_TEMPLATE'
  | 'SEARCH_APPLICATION_WITHOUT_ASSISTANCE_NEED'
  | 'SEARCH_APPLICATION_WITH_ASSISTANCE_NEED'

export type Application =
  | 'ACCEPT_DECISION'
  | 'CANCEL'
  | 'CANCEL_PLACEMENT_PLAN'
  | 'CONFIRM_DECISIONS_MAILED'
  | 'CREATE_NOTE'
  | 'CREATE_PLACEMENT_PLAN'
  | 'MOVE_TO_WAITING_PLACEMENT'
  | 'READ_DECISION_DRAFT'
  | 'READ_NOTES'
  | 'READ_PLACEMENT_PLAN_DRAFT'
  | 'READ_WITHOUT_ASSISTANCE_NEED'
  | 'READ_WITH_ASSISTANCE_NEED'
  | 'REJECT_DECISION'
  | 'RESPOND_TO_PLACEMENT_PROPOSAL'
  | 'RETURN_TO_SENT'
  | 'SEND'
  | 'SEND_DECISIONS_WITHOUT_PROPOSAL'
  | 'SEND_PLACEMENT_PROPOSAL'
  | 'UPDATE'
  | 'UPDATE_DECISION_DRAFT'
  | 'UPLOAD_ATTACHMENT'
  | 'VERIFY'
  | 'WITHDRAW_PLACEMENT_PROPOSAL'

export type AssistanceAction =
  | 'DELETE'
  | 'UPDATE'

export type AssistanceNeed =
  | 'DELETE'
  | 'UPDATE'

export type BackupCare =
  | 'DELETE'
  | 'UPDATE'

export type BackupPickup =
  | 'DELETE'
  | 'UPDATE'

export type Child =
  | 'CREATE_ABSENCE'
  | 'CREATE_ASSISTANCE_ACTION'
  | 'CREATE_ASSISTANCE_NEED'
  | 'CREATE_ATTENDANCE_RESERVATION'
  | 'CREATE_BACKUP_CARE'
  | 'CREATE_BACKUP_PICKUP'
  | 'CREATE_DAILY_NOTE'
  | 'CREATE_PEDAGOGICAL_DOCUMENT'
  | 'CREATE_PEDAGOGICAL_DOCUMENT_ATTACHMENT'
  | 'CREATE_VASU_DOCUMENT'
  | 'DELETE_ABSENCE'
  | 'DELETE_DAILY_NOTES'
  | 'DELETE_DAILY_SERVICE_TIMES'
  | 'READ'
  | 'READ_ABSENCES'
  | 'READ_ADDITIONAL_INFO'
  | 'READ_APPLICATION'
  | 'READ_ASSISTANCE_ACTION'
  | 'READ_ASSISTANCE_NEED'
  | 'READ_BACKUP_CARE'
  | 'READ_BACKUP_PICKUP'
  | 'READ_CHILD_RECIPIENTS'
  | 'READ_DAILY_SERVICE_TIMES'
  | 'READ_FAMILY_CONTACTS'
  | 'READ_FEE_ALTERATIONS'
  | 'READ_FUTURE_ABSENCES'
  | 'READ_GUARDIANS'
  | 'READ_NOTES'
  | 'READ_PEDAGOGICAL_DOCUMENTS'
  | 'READ_PLACEMENT'
  | 'READ_VASU_DOCUMENT'
  | 'UPDATE_ADDITIONAL_INFO'
  | 'UPDATE_CHILD_RECIPIENT'
  | 'UPDATE_DAILY_SERVICE_TIMES'
  | 'UPDATE_FAMILY_CONTACT'

export type ChildDailyNote =
  | 'DELETE'
  | 'UPDATE'

export type Decision = never

export type Group =
  | 'CREATE_ABSENCES'
  | 'CREATE_CARETAKERS'
  | 'CREATE_NOTE'
  | 'DELETE'
  | 'DELETE_ABSENCES'
  | 'DELETE_CARETAKERS'
  | 'READ_ABSENCES'
  | 'READ_CARETAKERS'
  | 'READ_NOTES'
  | 'UPDATE'
  | 'UPDATE_CARETAKERS'

export type GroupPlacement =
  | 'DELETE'
  | 'UPDATE'

export type MobileDevice = never

export type Pairing = never

export type Placement =
  | 'CREATE_GROUP_PLACEMENT'
  | 'CREATE_SERVICE_NEED'
  | 'DELETE'
  | 'UPDATE'

export type ServiceNeed =
  | 'DELETE'
  | 'UPDATE'

export type Unit =
  | 'ACCEPT_PLACEMENT_PROPOSAL'
  | 'CREATE_GROUP'
  | 'CREATE_PLACEMENT'
  | 'DELETE_ACL_SPECIAL_EDUCATION_TEACHER'
  | 'DELETE_ACL_STAFF'
  | 'DELETE_ACL_UNIT_SUPERVISOR'
  | 'INSERT_ACL_SPECIAL_EDUCATION_TEACHER'
  | 'INSERT_ACL_STAFF'
  | 'INSERT_ACL_UNIT_SUPERVISOR'
  | 'READ_ACL'
  | 'READ_ATTENDANCE_RESERVATIONS'
  | 'READ_BACKUP_CARE'
  | 'READ_BASIC'
  | 'READ_DETAILED'
  | 'READ_PLACEMENT'
  | 'READ_PLACEMENT_PLAN'
  | 'UPDATE'
  | 'UPDATE_FEATURES'
  | 'UPDATE_STAFF_GROUP_ACL'

export type VasuDocument =
  | 'EVENT_MOVED_TO_CLOSED'
  | 'EVENT_MOVED_TO_READY'
  | 'EVENT_MOVED_TO_REVIEWED'
  | 'EVENT_PUBLISHED'
  | 'EVENT_RETURNED_TO_READY'
  | 'EVENT_RETURNED_TO_REVIEWED'
  | 'READ'
  | 'UPDATE'

export type VasuTemplate =
  | 'COPY'
  | 'DELETE'
  | 'READ'
  | 'UPDATE'

}
