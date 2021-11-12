// SPDX-FileCopyrightText: 2017-2021 City of Espoo
//
// SPDX-License-Identifier: LGPL-2.1-or-later

import React from 'react'
import RoundIcon from '../atoms/RoundIcon'
import { IconDefinition } from '@fortawesome/fontawesome-svg-core'
import { FixedSpaceColumn, FixedSpaceRow } from '../layout/flex-helpers'
import styled from 'styled-components'
import { modalZIndex } from '../layout/z-helpers'
import IconButton from '../atoms/buttons/IconButton'
import { defaultMargins } from '../white-space'
import { faTimes } from 'lib-icons'

export interface Props {
  icon: IconDefinition
  iconColor: string
  onClose?: () => void
  children?: React.ReactNode
}

export default React.memo(function Toast({
  icon,
  iconColor,
  onClose,
  children
}: Props) {
  return (
    <ToastRoot>
      <FixedSpaceRow alignItems="center">
        <RoundIcon content={icon} color={iconColor} size="L" />
        <FixedSpaceColumn spacing="xs">{children}</FixedSpaceColumn>
      </FixedSpaceRow>
      {onClose ? <CloseButton icon={faTimes} onClick={onClose} /> : null}
    </ToastRoot>
  )
})

const ToastRoot = styled.div`
  position: fixed;
  top: 16px;
  right: 16px;
  width: 360px;
  padding: 16px;
  background: #ffffff;
  border-radius: 16px;
  box-shadow: 4px 4px 8px rgba(15, 15, 15, 0.15),
    -2px 0 4px rgba(15, 15, 15, 0.15);
  z-index: ${modalZIndex};
`

const CloseButton = styled(IconButton)`
  position: absolute;
  top: ${defaultMargins.s};
  right: ${defaultMargins.s};
  color: ${(p) => p.theme.colors.main.primary};
`