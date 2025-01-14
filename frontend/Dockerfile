# SPDX-FileCopyrightText: 2017-2022 City of Espoo
#
# SPDX-License-Identifier: LGPL-2.1-or-later

FROM node:18-buster-slim AS builder

USER root

WORKDIR /project

RUN apt-get update \
 && apt-get -y dist-upgrade \
 && apt-get -y install \
      ca-certificates \
 && rm -rf /var/lib/apt/lists/*

COPY ./.yarn ./.yarn
COPY ./package.json ./yarn.lock ./.yarnrc.yml ./
RUN yarn install --immutable

COPY . .

ARG ICONS=free
ARG SENTRY_PUBLISH_ENABLED="false"
ARG SENTRY_AUTH_TOKEN=""
ARG SENTRY_ORG="espoon-voltti"
ARG build=none
ARG commit=none

ENV ICONS="$ICONS"
ENV SENTRY_PUBLISH_ENABLED="$SENTRY_PUBLISH_ENABLED"
ENV SENTRY_ORG="$SENTRY_ORG"
ENV SENTRY_AUTH_TOKEN="$SENTRY_AUTH_TOKEN"
ENV SENTRY_NO_PROGRESS_BAR="1"
ENV APP_BUILD="$build"
ENV APP_COMMIT="$commit"

RUN if test -d espoo-customizations; then mv espoo-customizations ..; fi \
 && export NODE_OPTIONS="--max-old-space-size=4096" \
 && yarn build

FROM nginx:1.23.0-alpine

COPY --from=builder "/project/dist/bundle/employee-frontend" "/static/employee"
COPY --from=builder "/project/dist/bundle/employee-mobile-frontend" "/static/employee/mobile"
COPY --from=builder "/project/dist/bundle/citizen-frontend" "/static/citizen"
COPY --from=builder "/project/src/maintenance-page-frontend" "/static/maintenance-page"
