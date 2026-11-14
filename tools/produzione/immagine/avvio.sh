#!/bin/sh
# The image's start (T367, ADR-0203): the universes' volume belongs to `node`, and the server never runs as root. Docker's named volumes take
# their owner from the image; Fly's and Railway's are root's when new, so the first start gives the folder to `node`, then drops to it.
set -e
if [ "$(id -u)" = "0" ]; then
  dir="${QUINE_UNIVERSI:-/app/universes}"
  mkdir -p "$dir"
  [ "$(stat -c %U "$dir")" = "node" ] || chown -R node:node "$dir"
  exec setpriv --reuid=node --regid=node --init-groups "$@"
fi
exec "$@"
