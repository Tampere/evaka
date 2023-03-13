// SPDX-FileCopyrightText: 2017-2020 City of Espoo
//
// SPDX-License-Identifier: LGPL-2.1-or-later

import expressHttpProxy from 'express-http-proxy'
import type express from 'express'
import { evakaServiceUrl } from './config'
import { createServiceRequestHeaders } from './service-client'

interface ProxyOptions {
  path?: string | ((req: express.Request) => string)
  multipart?: boolean
  url?: string
}

export function createProxy({
  path,
  multipart = false,
  url = evakaServiceUrl
}: ProxyOptions = {}) {
  return expressHttpProxy(url, {
    limit: '10mb',
    parseReqBody: !multipart,
    proxyReqPathResolver: typeof path === 'string' ? () => path : path,
    proxyReqOptDecorator: (proxyReqOpts, srcReq) => {
      const headers = createServiceRequestHeaders(srcReq)
      proxyReqOpts.headers = {
        ...proxyReqOpts.headers,
        ...headers
      }
      return proxyReqOpts
    }
  })
}
