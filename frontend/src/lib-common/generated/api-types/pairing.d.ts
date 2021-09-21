// SPDX-FileCopyrightText: 2017-2021 City of Espoo
//
// SPDX-License-Identifier: LGPL-2.1-or-later

// GENERATED FILE: no manual modifications
/* eslint-disable prettier/prettier */

import { UUID } from '../../types'

/**
* Generated from fi.espoo.evaka.pairing.MobileDevice
*/
export interface MobileDevice {
  id: UUID
  name: string
  unitId: UUID
}

/**
* Generated from fi.espoo.evaka.pairing.MobileDeviceIdentity
*/
export interface MobileDeviceIdentity {
  id: UUID
  longTermToken: UUID
}

/**
* Generated from fi.espoo.evaka.pairing.Pairing
*/
export interface Pairing {
  challengeKey: string
  expires: Date
  id: UUID
  mobileDeviceId: UUID | null
  responseKey: string | null
  status: PairingStatus
  unitId: UUID
}

/**
* Generated from fi.espoo.evaka.pairing.PairingStatus
*/
export type PairingStatus = 
  | 'WAITING_CHALLENGE'
  | 'WAITING_RESPONSE'
  | 'READY'
  | 'PAIRED'

/**
* Generated from fi.espoo.evaka.pairing.PairingsController.PairingStatusRes
*/
export interface PairingStatusRes {
  status: PairingStatus
}

/**
* Generated from fi.espoo.evaka.pairing.PairingsController.PostPairingChallengeReq
*/
export interface PostPairingChallengeReq {
  challengeKey: string
}

/**
* Generated from fi.espoo.evaka.pairing.PairingsController.PostPairingReq
*/
export interface PostPairingReq {
  unitId: UUID
}

/**
* Generated from fi.espoo.evaka.pairing.PairingsController.PostPairingResponseReq
*/
export interface PostPairingResponseReq {
  challengeKey: string
  responseKey: string
}

/**
* Generated from fi.espoo.evaka.pairing.PairingsController.PostPairingValidationReq
*/
export interface PostPairingValidationReq {
  challengeKey: string
  responseKey: string
}

/**
* Generated from fi.espoo.evaka.pairing.MobileDevicesController.RenameRequest
*/
export interface RenameRequest {
  name: string
}