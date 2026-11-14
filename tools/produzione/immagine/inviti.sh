#!/bin/sh
# `inviti padrone|elenco|revoca <id>` in the container (ADR-0194, ADR-0201): `docker compose exec quine inviti padrone`, `fly ssh console -C "inviti padrone"`.
# As the server's user, also when the shell is root's, so the book of the identities stays the server's to write.
cd /app
if [ "$(id -u)" = "0" ]; then exec setpriv --reuid=node --regid=node --init-groups node /app/dist-server/inviti.mjs "$@"; fi
exec node /app/dist-server/inviti.mjs "$@"
