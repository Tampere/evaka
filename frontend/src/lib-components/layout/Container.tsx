// SPDX-FileCopyrightText: 2017-2022 City of Espoo
//
// SPDX-License-Identifier: LGPL-2.1-or-later

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import classNames from 'classnames'
import React, { ReactNode } from 'react'
import styled from 'styled-components'

import { faChevronDown, faChevronUp } from 'lib-icons'

import { desktopMin } from '../breakpoints'
import { defaultMargins, isSpacingSize, SpacingSize } from '../white-space'

export const Container = styled.div<{ verticalMargin?: string }>`
  margin: ${({ verticalMargin }) => (verticalMargin ? verticalMargin : '0')}
    auto;
  position: relative;

  @media screen and (min-width: 1024px) {
    max-width: 960px;
    width: 960px;
  }
  @media screen and (max-width: 1215px) {
    max-width: 1152px;
    width: auto;
  }
  @media screen and (max-width: 1407px) {
    max-width: 1344px;
    width: auto;
  }
  @media screen and (min-width: 1216px) {
    max-width: 1152px;
    width: 1152px;
  }
  @media screen and (min-width: 1408px) {
    max-width: 1344px;
    width: 1344px;
  }
`

const spacing = (
  spacing?: SpacingSize | string,
  defaultValue = defaultMargins.s
) =>
  spacing
    ? isSpacingSize(spacing)
      ? defaultMargins[spacing]
      : spacing
    : defaultValue

type ContentAreaProps = {
  classname?: string
  'data-qa'?: string
  opaque: boolean
  fullHeight?: boolean
  paddingVertical?: SpacingSize | string
  paddingHorizontal?: SpacingSize | string
  blue?: boolean
  shadow?: boolean
}

export const ContentArea = styled.section<ContentAreaProps>`
  padding: ${(p) =>
    `${spacing(p.paddingVertical)} ${spacing(p.paddingHorizontal)}`};

  // wider default horizontal paddings on desktop
  @media screen and (min-width: ${desktopMin}) {
    padding-right: ${(p) => spacing(p.paddingHorizontal, defaultMargins.L)};
    padding-left: ${(p) => spacing(p.paddingHorizontal, defaultMargins.L)};
  }
  background-color: ${(p) =>
    p.opaque ? 'white' : p.blue ? p.theme.colors.main.m4 : 'transparent'};
  position: relative;
  ${(p) => (p.fullHeight ? `min-height: 100vh` : '')}
  ${(p) =>
    p.shadow
      ? `box-shadow: 0px 4px 4px 0px ${p.theme.colors.grayscale.g15}`
      : ''}
`

type CollapsibleContentAreaProps = ContentAreaProps & {
  open: boolean
  toggleOpen: () => void
  title: ReactNode
  children: ReactNode
}

export const CollapsibleContentArea = React.memo(
  function CollapsibleContentArea({
    open,
    toggleOpen,
    title,
    children,
    ...props
  }: CollapsibleContentAreaProps) {
    return (
      <ContentArea {...props} data-status={open ? 'open' : 'closed'}>
        <TitleContainer
          onClick={toggleOpen}
          data-qa={props['data-qa'] ? `${props['data-qa']}-header` : undefined}
          className={classNames({ open })}
          role="button"
        >
          {title}
          <TitleIcon
            icon={open ? faChevronUp : faChevronDown}
            data-qa="collapsible-trigger"
          />
        </TitleContainer>
        <Collapsible open={open}>{children}</Collapsible>
      </ContentArea>
    )
  }
)

const TitleContainer = styled.button`
  display: flex;
  flex-direction: row;
  flex-wrap: nowrap;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  padding: 16px 8px;
  margin: -16px -8px;
  overflow: visible;
  font: inherit;
  font-size: inherit;
  line-height: normal;
  color: inherit;
  background: transparent;
  outline: none;
  border: 2px solid transparent;
  border-radius: 2px;

  :focus {
    border-color: ${(p) => p.theme.colors.main.m2Focus};
  }
`

const TitleIcon = styled(FontAwesomeIcon)`
  cursor: pointer;
  color: ${(p) => p.theme.colors.main.m2};
  height: 24px !important;
  width: 24px !important;
`

const Collapsible = styled.div<{ open: boolean }>`
  display: ${(props) => (props.open ? 'block' : 'none')};
`

export default Container
