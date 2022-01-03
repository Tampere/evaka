<!--
SPDX-FileCopyrightText: 2017-2022 City of Espoo

SPDX-License-Identifier: LGPL-2.1-or-later
-->

# Evaka Keycloak

This project has Evaka [KeyCloak](https://www.keycloak.org/). Theme is based to [Helsinki KeyCloak Theme](https://github.com/City-of-Helsinki/helsinki-keycloak-theme).

## docker-compose

### Usage

```bash
./compose-keycloak up
```

#### Usage with Evaka docker-compose

Evaka has Keycloak service in docker-compose and port is the same. To use this instead it

```bash
cd ../compose
docker-compose up

cd ../keycloak
./compose-keycloak up
```

### Local testing

KeyCloak admin is at <http://localhost:8080/auth/admin> with credentials `admin:admin`

You can test the login and signup flows in the following URLs:

- <http://localhost:8080/auth/realms/evaka/account/> (`evaka` realm, for palveluntuottaja)
- <http://localhost:8080/auth/realms/evaka-customer/account/> (`evaka-customer` realm, for citizens)

Received emails can be accessed at <http://localhost:8025/>, but it must be configured for realms.

### Configure

Mock KeyCloak Evaka realm is imported from `compose-resources/configuration/evaka.json`.