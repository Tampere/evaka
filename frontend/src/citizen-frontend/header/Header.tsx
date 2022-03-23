// SPDX-FileCopyrightText: 2017-2022 City of Espoo
//
// SPDX-License-Identifier: LGPL-2.1-or-later

import React, { useContext, useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import styled from 'styled-components'

import { desktopMin } from 'lib-components/breakpoints'
import colors from 'lib-customizations/common'

import { useUser } from '../auth/state'
import { MessageContext, MessagePageState } from '../messages/state'
import {
  PedagogicalDocumentsContext,
  PedagogicalDocumentsState
} from '../pedagogical-documents/state'

import CityLogo from './CityLogo'
import DesktopNav from './DesktopNav'
import EvakaLogo from './EvakaLogo'
import MobileNav from './MobileNav'
import { headerHeightDesktop, headerHeightMobile } from './const'

export default React.memo(function Header(props: { ariaHidden: boolean }) {
  const [showMenu, setShowMenu] = useState(false)
  const user = useUser()

  const { unreadMessagesCount, refreshUnreadMessagesCount } =
    useContext<MessagePageState>(MessageContext)

  useEffect(() => {
    if (user) refreshUnreadMessagesCount()
  }, [refreshUnreadMessagesCount, user])

  const {
    unreadPedagogicalDocumentsCount,
    refreshUnreadPedagogicalDocumentsCount
  } = useContext<PedagogicalDocumentsState>(PedagogicalDocumentsContext)

  useEffect(() => {
    if (user) refreshUnreadPedagogicalDocumentsCount()
  }, [refreshUnreadPedagogicalDocumentsCount, user])

  const location = useLocation()
  const hideLoginButton = location.pathname === '/login'

  return (
    <HeaderContainer showMenu={showMenu} aria-hidden={props.ariaHidden}>
      <CityLogo />
      <EvakaLogo />
      <DesktopNav
        unreadMessagesCount={unreadMessagesCount ?? 0}
        unreadPedagogicalDocuments={unreadPedagogicalDocumentsCount ?? 0}
        hideLoginButton={hideLoginButton}
      />
      <MobileNav
        showMenu={showMenu}
        setShowMenu={setShowMenu}
        unreadMessagesCount={unreadMessagesCount ?? 0}
        unreadPedagogicalDocumentsCount={unreadPedagogicalDocumentsCount ?? 0}
        hideLoginButton={hideLoginButton}
      />
    </HeaderContainer>
  )
})

const HeaderContainer = styled.header<{ showMenu: boolean }>`
  z-index: 9;
  color: ${colors.grayscale.g0};
  background-color: ${colors.main.m2};
  display: grid;
  grid: minmax(60px, min-content) / repeat(3, minmax(100px, 1fr));
  height: ${headerHeightMobile}px;
  width: 100%;

  @media (min-width: ${desktopMin}) {
    grid: minmax(${headerHeightDesktop}px, min-content) / max-content max-content auto;
    height: ${headerHeightDesktop}px;
  }
`
