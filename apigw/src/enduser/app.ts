// SPDX-FileCopyrightText: 2017-2020 City of Espoo
//
// SPDX-License-Identifier: LGPL-2.1-or-later

import cookieParser from 'cookie-parser'
import express, { Router } from 'express'
import helmet from 'helmet'
import passport from 'passport'
import { requireAuthentication } from '../shared/auth/index.js'
import { createSuomiFiStrategy } from './suomi-fi-saml.js'
import setupLoggingMiddleware from '../shared/logging.js'
import { csrf, csrfCookie } from '../shared/middleware/csrf.js'
import { errorHandler } from '../shared/middleware/error-handler.js'
import tracing from '../shared/middleware/tracing.js'
import { trustReverseProxy } from '../shared/reverse-proxy.js'
import createSamlRouter from '../shared/routes/saml.js'
import session, {
  refreshLogoutToken,
  touchSessionMaxAge
} from '../shared/session.js'
import publicRoutes from './publicRoutes.js'
import routes from './routes.js'
import mapRoutes from './mapRoutes.js'
import authStatus from './routes/auth-status.js'
import { cacheControl } from '../shared/middleware/cache-control.js'
import { Config } from '../shared/config.js'
import { createSamlConfig } from '../shared/saml/index.js'
import redisCacheProvider from '../shared/saml/passport-saml-cache-redis.js'
import { createDevSfiRouter } from './dev-sfi-auth.js'
import { createKeycloakCitizenSamlStrategy } from './keycloak-citizen-saml.js'
import { assertRedisConnection, RedisClient } from '../shared/redis-client.js'

export default function enduserGwApp(config: Config, redisClient: RedisClient) {
  const app = express()
  trustReverseProxy(app)
  app.set('etag', false)

  app.use(
    cacheControl((req) =>
      req.path.startsWith('/api/application/citizen/child-images/')
        ? 'allow-cache'
        : 'forbid-cache'
    )
  )

  app.use(
    helmet({
      // Content-Security-Policy is set by the nginx proxy
      contentSecurityPolicy: false
    })
  )
  app.get('/health', (_, res) => {
    assertRedisConnection(redisClient)
      .then(() => {
        res.status(200).json({ status: 'UP' })
      })
      .catch(() => {
        res.status(503).json({ status: 'DOWN' })
      })
  })
  app.use(tracing)
  app.use(cookieParser())
  app.use(session('enduser', redisClient))
  app.use(touchSessionMaxAge)
  app.use(passport.initialize())
  app.use(passport.session())
  passport.serializeUser<Express.User>((user, done) => done(null, user))
  passport.deserializeUser<Express.User>((user, done) => done(null, user))
  app.use(refreshLogoutToken())
  setupLoggingMiddleware(app)

  function apiRouter() {
    const router = Router()

    router.use(publicRoutes)
    router.use(mapRoutes)

    if (config.sfi.type === 'mock') {
      router.use('/auth/saml', createDevSfiRouter())
    } else if (config.sfi.type === 'saml') {
      const suomifiSamlConfig = createSamlConfig(
        config.sfi.saml,
        redisCacheProvider(redisClient, { keyPrefix: 'suomifi-saml-resp:' })
      )
      router.use(
        '/auth/saml',
        createSamlRouter({
          strategyName: 'suomifi',
          strategy: createSuomiFiStrategy(suomifiSamlConfig),
          sessionType: 'enduser'
        })
      )
    }

    if (!config.keycloakCitizen)
      throw new Error('Missing Keycloak SAML configuration (citizen)')
    const keycloakCitizenConfig = createSamlConfig(
      config.keycloakCitizen,
      redisCacheProvider(redisClient, { keyPrefix: 'customer-saml-resp:' })
    )
    router.use(
      '/auth/evaka-customer',
      createSamlRouter({
        strategyName: 'evaka-customer',
        strategy: createKeycloakCitizenSamlStrategy(keycloakCitizenConfig),
        sessionType: 'enduser'
      })
    )
    router.get('/auth/status', csrf, csrfCookie('enduser'), authStatus)
    router.use(requireAuthentication)
    router.use(csrf)
    router.use(routes)
    return router
  }

  app.use('/api/application', apiRouter())
  app.use(errorHandler(false))

  return app
}
