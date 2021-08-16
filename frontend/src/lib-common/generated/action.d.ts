// SPDX-FileCopyrightText: 2017-2021 City of Espoo
//
// SPDX-License-Identifier: LGPL-2.1-or-later

// GENERATED FILE: no manual modifications
/* eslint-disable prettier/prettier */

export namespace Action {

export type Global =
  | 'CREATE_PAPER_APPLICATION'
  | 'CREATE_VASU_TEMPLATE'
  | 'READ_PERSON_APPLICATION'
  | 'READ_VASU_TEMPLATE'
  | 'SEARCH_APPLICATION_WITHOUT_ASSISTANCE_NEED'
  | 'SEARCH_APPLICATION_WITH_ASSISTANCE_NEED'

export type Application =
  | 'ACCEPT_DECISION'
  | 'CANCEL'
  | 'CANCEL_PLACEMENT_PLAN'
  | 'CONFIRM_DECISIONS_MAILED'
  | 'CREATE_PLACEMENT_PLAN'
  | 'MOVE_TO_WAITING_PLACEMENT'
  | 'READ_DECISION_DRAFT'
  | 'READ_PLACEMENT_PLAN_DRAFT'
  | 'READ_WITHHOUT_ASSISTANCE_NEED'
  | 'READ_WITH_ASSISTANCE_NEED'
  | 'REJECT_DECISION'
  | 'RESPOND_TO_PLACEMENT_PROPOSAL'
  | 'RETURN_TO_SENT'
  | 'SEND'
  | 'SEND_DECISIONS_WITHOUT_PROPOSAL'
  | 'SEND_PLACEMENT_PROPOSAL'
  | 'UPDATE'
  | 'UPDATE_DECISION_DRAFT'
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
  | 'CREATE_ASSISTANCE_ACTION'
  | 'CREATE_ASSISTANCE_NEED'
  | 'CREATE_BACKUP_CARE'
  | 'CREATE_BACKUP_PICKUP'
  | 'CREATE_VASU_DOCUMENT'
  | 'DELETE_DAILY_SERVICE_TIMES'
  | 'READ_APPLICATION'
  | 'READ_ASSISTANCE_ACTION'
  | 'READ_ASSISTANCE_NEED'
  | 'READ_BACKUP_CARE'
  | 'READ_BACKUP_PICKUP'
  | 'READ_DAILY_SERVICE_TIMES'
  | 'READ_PLACEMENT'
  | 'READ_VASU_DOCUMENT'
  | 'UPDATE_DAILY_SERVICE_TIMES'

export type DailyNote = never

export type Decision = never

export type Group =
  | 'CREATE_CARETAKERS'
  | 'DELETE'
  | 'DELETE_CARETAKERS'
  | 'READ_ABSENCES'
  | 'READ_CARETAKERS'
  | 'READ_DAYCARE_DAILY_NOTES'
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
  | 'READ_APPLICATION_WITHOUT_ASSISTANCE_NEED'
  | 'READ_APPLICATION_WITH_ASSISTANCE_NEED'
  | 'READ_ATTENDANCE_RESERVATIONS'
  | 'READ_BACKUP_CARE'
  | 'READ_BASIC'
  | 'READ_DETAILED'
  | 'READ_PLACEMENT'
  | 'READ_PLACEMENT_PLAN'
  | 'UPDATE'
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
