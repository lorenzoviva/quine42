# The production server in an image (T367, ADR-0202): the same package as `npm run build`, `npm run build:server`, `npm run serve` (ADR-0112).
# Build it with `npm run immagine` (the tag is the kernel's version, never only `latest`), or with `docker compose build` and QUINE_KERNEL in `.env`.
# Railway and Fly read this file: give them KERNEL_VERSION as a build argument (the guide: docs/self-hosting.md).
#
# What the image never has: a `.env`, a key, a universe (.dockerignore, tests/sicurezza/pacchetto.test.ts). The secrets arrive from the environment
# when the container starts; the universes live in a volume on /app/universes.

# ---- 1. The build: client (dist/) and server (dist-server/), with every dependency ----
FROM node:22-bookworm-slim AS build
WORKDIR /src
# The kernel's version this image is built for: said, and the same as the code's, or the build stops (a universe of another contract opens read-only, ADR-0156).
ARG KERNEL_VERSION
COPY package.json package-lock.json ./
RUN test -n "$KERNEL_VERSION" || { echo "KERNEL_VERSION: dillo (--build-arg KERNEL_VERSION=X.Y.Z, la versione di package.json; npm run immagine lo fa da solo)"; exit 1; }; \
    v="$(node -p "require('./package.json').version")"; \
    test "$v" = "$KERNEL_VERSION" || { echo "KERNEL_VERSION=$KERNEL_VERSION, ma il codice è al kernel $v: leggi «Aggiornare» in docs/self-hosting.md prima di cambiare versione"; exit 1; }
RUN npm ci --no-audit --no-fund
COPY . .
RUN npm run build && npm run build:server

# ---- 2. The runtime dependencies: firebase-admin is the only module the server imports at run time (the world's program carries all it needs) ----
FROM node:22-bookworm-slim AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev --ignore-scripts --no-audit --no-fund

# ---- 3. What runs: Node, git (every universe is a repository), tini (signals and children), the two builds ----
FROM node:22-bookworm-slim
ARG KERNEL_VERSION
LABEL org.opencontainers.image.title="quine42" \
      org.opencontainers.image.description="Il server di produzione di QUINE42 (self-hosting, ADR-0202)" \
      org.opencontainers.image.version="$KERNEL_VERSION" \
      org.opencontainers.image.licenses="SEE LICENSE IN LICENSE.md" \
      quine42.kernel="$KERNEL_VERSION"
RUN apt-get update \
 && apt-get install -y --no-install-recommends git tini ca-certificates \
 && rm -rf /var/lib/apt/lists/*
WORKDIR /app
# Inside the container every address is the container's own: what reaches it from outside is decided where the port is published (compose: only
# this machine unless told). The port is QUINE_PORTA, or PORT (Railway says it), or 8080.
ENV NODE_ENV=production \
    QUINE_UNIVERSI=/app/universes \
    QUINE_HOST=0.0.0.0
COPY --from=deps /app/node_modules ./node_modules
COPY --from=build /src/package.json ./package.json
COPY --from=build /src/dist ./dist
COPY --from=build /src/dist-server ./dist-server
COPY --from=build /src/site/beta.json ./site/beta.json
COPY LICENSE.md NOTICE.md ./
COPY --chmod=755 tools/produzione/immagine/avvio.sh /usr/local/bin/quine-avvio
COPY --chmod=755 tools/produzione/immagine/inviti.sh /usr/local/bin/inviti
# The volume's mount point belongs to the user that runs the server: a new named volume takes its owner from here, and git wants to own its
# repositories. The server runs as `node`: quine-avvio starts as root only to give it a volume that is root's (Fly, Railway), then drops.
RUN mkdir -p /app/universes && chown node:node /app/universes
VOLUME ["/app/universes"]
EXPOSE 8080
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:'+(process.env.QUINE_PORTA||process.env.PORT||8080)+'/healthz').then(r=>process.exit(r.ok?0:1),()=>process.exit(1))"
ENTRYPOINT ["/usr/bin/tini", "--", "/usr/local/bin/quine-avvio"]
CMD ["node", "dist-server/server.mjs"]
