# OpenAnalytics on Railway

Deploy [OpenAnalytics](https://github.com/OpenLabs-so/openanalytics) on [Railway](https://railway.com): tracker, ingest, worker, control plane, query gateway, realtime stream, and dashboard.

This is a **manual mapping**, not an official OpenAnalytics path. Their supported install is [Docker Compose on a Linux host](https://github.com/OpenLabs-so/openanalytics/blob/main/SELF-HOSTING.md). The closest platform install they have actually run is [Coolify](https://github.com/OpenLabs-so/openanalytics/blob/main/infra/selfhost/COOLIFY.md). Railway does not execute `docker-compose.yml`. Each Compose service becomes its own Railway service.

Pin a **release**, not `main`. Images, env templates, and migrations are one version. Floor is **v0.4.0** (collector serves `oa.js`). This guide uses **v0.4.2**, matching the Coolify compose file. Check the newest final tag (`v*` with no `-`) before you start.

---

## Why Compose import will not work

Do **not** drag-and-drop `docker-compose.yml` or `docker-compose.coolify.yml` onto the Railway canvas and expect a working stack.

| Compose primitive                                                               | Railway                                                              |
| ------------------------------------------------------------------------------- | -------------------------------------------------------------------- |
| Shared volumes (`keygen` writes keys, `api` / `gateway` / `realtime` read them) | A volume attaches to **one** service. The keygen pattern cannot run. |
| One-shot `migrate` / `keygen` / `geoip`                                         | Railway restarts a process that exits. There is no `depends_on`.     |
| Compose DNS (`valkey-queue`)                                                    | Private DNS is `<service>.railway.internal`.                         |
| Caddy / Traefik labels                                                          | Railway owns TLS and routing. Do not run Caddy.                      |
| `env_file: env/*.env`                                                           | Those files are git-ignored. The clone has only `.example` copies.   |

Generate signing keys on your machine and paste them as **multiline variables**. Railway’s variable editor accepts real newlines (`Ctrl+Enter` / `Cmd+Enter`). Docker env files cannot hold PEMs; Railway variables can.

---

## What you are running

| Service           | Job                                | Public? | Image                                                 | Listen |
| ----------------- | ---------------------------------- | ------- | ----------------------------------------------------- | ------ |
| `postgres`        | Control-plane store                | no      | `postgres:17-alpine`                                  | 5432   |
| `clickhouse`      | Events and rollups                 | no      | `ghcr.io/openlabs-so/openanalytics/clickhouse:v0.4.2` | 8123   |
| `valkey-queue`    | Durable ingest queue               | no      | `ghcr.io/openlabs-so/openanalytics/valkey:v0.4.2`     | 6379   |
| `valkey-realtime` | Cache, presence, rate limits       | no      | same Valkey image                                     | 6379   |
| `migrate`         | Schema once, then pause            | no      | `…/migrate:v0.4.2`                                    | —      |
| `gateway`         | Only process that reads ClickHouse | no      | `…/query-gateway:v0.4.2`                              | 8081   |
| `api`             | Auth, sites, keys, sharing         | **yes** | `…/api:v0.4.2`                                        | 8082   |
| `collector`       | Ingest + `oa.js`                   | **yes** | `…/collector:v0.4.2`                                  | 8083   |
| `realtime`        | Live dashboard SSE                 | **yes** | `…/realtime:v0.4.2`                                   | 8084   |
| `worker`          | Queue → ClickHouse, mail, deletes  | no      | `…/worker:v0.4.2`                                     | 8085   |
| `web`             | Dashboard                          | **yes** | `…/web:v0.4.2`                                        | 3000   |

Use **OpenAnalytics’ ClickHouse and Valkey images**, not `clickhouse/clickhouse-server` and not Railway’s managed Redis. The ClickHouse image creates `oa_ingest` / `oa_read` / `oa_maintenance` / `oa_migration` against a database that **must** be named `analytics`. The Valkey image bakes two opposite policies: durable AOF with no eviction (queue) vs allkeys-lru (realtime). A generic Redis will boot and then lose events or evict the wrong keys.

Railway managed **Postgres** is optional. This guide deploys `postgres:17-alpine` so the username, database, and URL match the tested compose file.

Images are **amd64**. Railway is amd64. Do not try this on an ARM-only host without building from source.

### Four public names

| DNS            | Railway service | Port |
| -------------- | --------------- | ---- |
| `app.<domain>` | `web`           | 3000 |
| `api.<domain>` | `api`           | 8082 |
| `c.<domain>`   | `collector`     | 8083 |
| `rt.<domain>`  | `realtime`      | 8084 |

Four hostnames, not four paths. `oa.js` is served by the collector so a site owner pastes one origin.

Point the records **before** you generate Railway custom domains. Railway issues certificates the same way Compose issues them with Caddy: issuance fails until DNS resolves.

---

## Resources

Budget **~8 GB RAM** across the project, **not** a single 4 GB box:

| Service                                                  | Suggested limit |
| -------------------------------------------------------- | --------------- |
| `clickhouse`                                             | 2 GB            |
| `valkey-queue`                                           | 1.5 GB          |
| `valkey-realtime`                                        | 768 MB          |
| `worker`                                                 | 768 MB          |
| `postgres`                                               | 512 MB          |
| each of `api`, `collector`, `realtime`, `gateway`, `web` | 512 MB          |

ClickHouse needs a **volume** at `/var/lib/clickhouse`. Start at 20 GB and grow; Railway volumes bill for used bytes. Postgres volume at `/var/lib/postgresql/data`. Queue volume at `/data`. Realtime Valkey is losable — still attach a small volume so a restart does not wipe presence.

A release is about **13 GB of images**. The first deploy pulls them. Hobby can run a tiny install; Pro is the realistic plan once ClickHouse and the queue have real data.

---

## 1. Create the project

Empty Railway project. Create **eleven** services with the **exact names** in the table above (`+ New` → **Docker Image**). Private DNS is `<name>.railway.internal`. Hyphens are fine. Renaming later means rewriting every URL.

Do not generate a public domain on postgres, clickhouse, either Valkey, migrate, gateway, or worker.

---

## 2. Generate secrets on your machine

Run this **once**, off Railway, and store the output somewhere that survives losing the project. Do not re-run it to “fix” a boot error — that rotates every secret.

```sh
# hex secrets (AUTH, identity, trial, credential journal, store passwords)
openssl rand -hex 32

# OA_CREDENTIAL_KEYRING — exactly 32 bytes, then base64.
# A 32-character random string is 24 bytes and the Account → Deployment
# tab will never appear (that is what shipped on Coolify through v0.4.0).
node -e "console.log(JSON.stringify({active:'k1',keys:{k1:require('node:crypto').randomBytes(32).toString('base64')}}))"

# Query signing pair (api holds private, gateway holds public)
openssl genpkey -algorithm ed25519 -out query.private.pem
openssl pkey -in query.private.pem -pubout -out query.public.pem

# Realtime token pair (api holds private, realtime holds public)
openssl genpkey -algorithm ed25519 -out realtime.private.pem
openssl pkey -in realtime.private.pem -pubout -out realtime.public.pem
```

Generate **six** independent hex strings (do not derive one from another):

- `AUTH_SECRET`
- `TRIAL_IDENTITY_SECRET`
- `CREDENTIAL_SOURCE_SECRET`
- `ANONYMOUS_IDENTITY_SECRET` — **byte-identical** on `collector` and `worker`
- Postgres password
- Four ClickHouse passwords (ingest, read, maintenance, migration)
- Two Valkey passwords (queue, realtime)

`OA_CREDENTIAL_KEYRING` must be **byte-identical** on `api` and `worker`.

Paste each PEM with real newlines. In the Railway variable field: `Ctrl+Enter` (Windows) / `Cmd+Enter` (macOS). In Raw Editor, a literal newline is correct. An escaped `\n` is not — `createPrivateKey` rejects it with `ERR_OSSL_UNSUPPORTED`.

---

## 3. Stores

### postgres

Image: `postgres:17-alpine`

```bash
POSTGRES_USER=openanalytics
POSTGRES_DB=openanalytics
POSTGRES_PASSWORD=<hex>
```

Volume mount: `/var/lib/postgresql/data`.

Healthcheck: TCP or `pg_isready` if you add a custom command. Wait until it is healthy before migrate.

### clickhouse

Image: `ghcr.io/openlabs-so/openanalytics/clickhouse:v0.4.2`

```bash
CLICKHOUSE_INGEST_PASSWORD=<hex>
CLICKHOUSE_READ_PASSWORD=<hex>
CLICKHOUSE_MAINTENANCE_PASSWORD=<hex>
CLICKHOUSE_MIGRATION_PASSWORD=<hex>
PORT=8123
```

Volume: `/var/lib/clickhouse`. Keep it **off** the public internet.

If other services time out on `http://clickhouse.railway.internal:8123`, the server is bound to localhost. Set `CLICKHOUSE_LISTEN_HOST=::` and redeploy ClickHouse. Logs should show HTTP on `[::]:8123`.

The database name is `analytics`. Do not change it. The entrypoint writes grants against `analytics.<table>` by name.

### valkey-queue

Image: `ghcr.io/openlabs-so/openanalytics/valkey:v0.4.2`

```bash
VALKEY_PASSWORD=<hex>
OA_VALKEY_CONF=/usr/local/etc/valkey/valkey-queue.conf
PORT=6379
```

Volume: `/data`.

### valkey-realtime

Same image.

```bash
VALKEY_PASSWORD=<hex>   # a different password from the queue
OA_VALKEY_CONF=/usr/local/etc/valkey/valkey-realtime.conf
PORT=6379
```

### Valkey URLs on Railway

OpenAnalytics refuses a plaintext `redis://` whose host looks public. It allows RFC1918, loopback, a **single-label** Compose name, and any hostname ending in **`.internal`** (written for Fly 6PN). Railway private DNS is `valkey-queue.railway.internal`, so it passes that check, and the client forces IPv6 for `.internal` hosts — which is what Railway’s private network needs.

Use AUTH. An empty password is a startup error.

```bash
# queue (collector + worker only)
EVENT_STREAM_REDIS_URL=redis://:${{valkey-queue.VALKEY_PASSWORD}}@valkey-queue.railway.internal:6379

# cache (api, gateway, collector, realtime, worker)
REALTIME_CACHE_REDIS_URL=redis://:${{valkey-realtime.VALKEY_PASSWORD}}@valkey-realtime.railway.internal:6379
```

Do **not** point these at Railway’s public Redis TCP proxy (`*.proxy.rlwy.net`). That is the public wire. `rediss://` would be required there, and you would pay egress for every event.

Do **not** put `EVENT_STREAM_REDIS_URL` on `api` or `gateway`. Each service validates its env at boot and **exits** if it is handed a secret it must not hold.

---

## 4. Migrate (run once, then stop)

Image: `ghcr.io/openlabs-so/openanalytics/migrate:v0.4.2`

The migrate tag is the worker image under another name. Without an override it boots as the worker and is refused (`CLICKHOUSE_MIGRATION_PASSWORD` is forbidden on worker). Set **Custom Start Command**:

```bash
node packages/postgres/dist/cli.js && node packages/clickhouse/dist/cli.js
```

Variables:

```bash
ENVIRONMENT=production
POSTGRES_MIGRATION_URL=postgres://openanalytics:${{postgres.POSTGRES_PASSWORD}}@postgres.railway.internal:5432/openanalytics
CLICKHOUSE_URL=http://clickhouse.railway.internal:8123
CLICKHOUSE_DATABASE=analytics
CLICKHOUSE_MIGRATION_USER=oa_migration
CLICKHOUSE_MIGRATION_PASSWORD=${{clickhouse.CLICKHOUSE_MIGRATION_PASSWORD}}
```

`CLICKHOUSE_DATABASE` (migrate) is not `CLICKHOUSE_DB` (worker / gateway). Both must be `analytics`.

**Restart policy: Never.** Deploy after both stores are up. Watch logs until both CLIs finish. Then **pause or remove** the service so Railway does not treat the exit as a crash. Re-runs are safe (ledger of applied migrations) and are the upgrade path — redeploy this service by hand after you bump `OA_IMAGE_TAG`.

Railway has no `depends_on`. If migrate starts first it will fail; fix the stores and redeploy migrate.

---

## 5. Application services

Set `NODE_ENV=production`, `ENVIRONMENT=production`, `LOG_LEVEL=info` on every Node service. `ENVIRONMENT` on `api` and `gateway` **must match** or every analytics read fails as a signature error that names neither variable.

Leave unused keys **absent**. `FOO=` is an empty string and the schema rejects it. Comment in compose becomes “do not create the variable” on Railway.

### gateway (private)

```bash
PORT=8081
CLICKHOUSE_URL=http://clickhouse.railway.internal:8123
CLICKHOUSE_DB=analytics
CLICKHOUSE_READ_USER=oa_read
CLICKHOUSE_READ_PASSWORD=${{clickhouse.CLICKHOUSE_READ_PASSWORD}}
REALTIME_CACHE_REDIS_URL=redis://:${{valkey-realtime.VALKEY_PASSWORD}}@valkey-realtime.railway.internal:6379
QUERY_SIGNING_KEY_ID=oa-selfhost-1
QUERY_SIGNING_PUBLIC_KEY=<paste query.public.pem>
```

Healthcheck path: `/health`. No public domain.

### api (public)

```bash
PORT=8082
DATABASE_URL=postgres://openanalytics:${{postgres.POSTGRES_PASSWORD}}@postgres.railway.internal:5432/openanalytics
REALTIME_CACHE_REDIS_URL=redis://:${{valkey-realtime.VALKEY_PASSWORD}}@valkey-realtime.railway.internal:6379
QUERY_GATEWAY_URL=http://gateway.railway.internal:8081
AUTH_BASE_URL=https://api.<domain>
APP_BASE_URL=https://app.<domain>
COLLECTOR_BASE_URL=https://c.<domain>
AUTH_TRUSTED_ORIGINS=https://app.<domain>
PRODUCT_NAME=Open Analytics
AUTH_SECRET=<hex>
TRIAL_IDENTITY_SECRET=<hex>
CREDENTIAL_SOURCE_SECRET=<hex>
OA_CREDENTIAL_KEYRING=<the JSON from node>
AUTH_PASSWORD_SIGNIN=enabled
QUERY_SIGNING_KEY_ID=oa-selfhost-1
QUERY_SIGNING_PRIVATE_KEY=<paste query.private.pem>
REALTIME_TOKEN_SIGNING_KEY=<paste realtime.private.pem>
```

Until custom DNS is live you can use Railway domains:

```bash
AUTH_BASE_URL=https://${{api.RAILWAY_PUBLIC_DOMAIN}}
APP_BASE_URL=https://${{web.RAILWAY_PUBLIC_DOMAIN}}
COLLECTOR_BASE_URL=https://${{collector.RAILWAY_PUBLIC_DOMAIN}}
AUTH_TRUSTED_ORIGINS=https://${{web.RAILWAY_PUBLIC_DOMAIN}}
```

`AUTH_TRUSTED_ORIGINS` must be the dashboard’s **exact** origin (scheme + host, no path, no trailing slash). Unset, the api emits no CORS header and every browser call is refused.

Do **not** set `CLICKHOUSE_*`, `EVENT_STREAM_REDIS_URL`, or `ANONYMOUS_IDENTITY_SECRET` here.

Healthcheck: `/health`. Generate a domain. Target port **8082** (set `PORT=8082` so Railway’s proxy and the process agree).

### collector (public)

```bash
PORT=8083
DATABASE_URL=postgres://openanalytics:${{postgres.POSTGRES_PASSWORD}}@postgres.railway.internal:5432/openanalytics
EVENT_STREAM_REDIS_URL=redis://:${{valkey-queue.VALKEY_PASSWORD}}@valkey-queue.railway.internal:6379
REALTIME_CACHE_REDIS_URL=redis://:${{valkey-realtime.VALKEY_PASSWORD}}@valkey-realtime.railway.internal:6379
ANONYMOUS_IDENTITY_SECRET=<hex>
ANONYMOUS_IDENTITY_KEY_VERSION=1
```

Do **not** set `GEOIP_DB_PATH` on the first deploy. Coolify’s geoip one-shot writes a shared volume the collector mounts. Railway cannot share that volume, so a path that names no file crash-loops the collector. Country/city are null until you add a database later (see [GeoIP](#geoip)).

Healthcheck: `/health`. Domain → port **8083**.

Since v0.4.0 the collector image **serves `oa.js`**. There is no `tracker-build` service on Railway.

### realtime (public)

```bash
PORT=8084
REALTIME_CACHE_REDIS_URL=redis://:${{valkey-realtime.VALKEY_PASSWORD}}@valkey-realtime.railway.internal:6379
REALTIME_TOKEN_VERIFY_KEY=<paste realtime.public.pem>
```

Healthcheck: `/health`. Domain → port **8084**.

### worker (private)

```bash
PORT=8085
DATABASE_URL=postgres://openanalytics:${{postgres.POSTGRES_PASSWORD}}@postgres.railway.internal:5432/openanalytics
EVENT_STREAM_REDIS_URL=redis://:${{valkey-queue.VALKEY_PASSWORD}}@valkey-queue.railway.internal:6379
REALTIME_CACHE_REDIS_URL=redis://:${{valkey-realtime.VALKEY_PASSWORD}}@valkey-realtime.railway.internal:6379
CLICKHOUSE_URL=http://clickhouse.railway.internal:8123
CLICKHOUSE_DB=analytics
CLICKHOUSE_INGEST_USER=oa_ingest
CLICKHOUSE_INGEST_PASSWORD=${{clickhouse.CLICKHOUSE_INGEST_PASSWORD}}
CLICKHOUSE_MAINTENANCE_USER=oa_maintenance
CLICKHOUSE_MAINTENANCE_PASSWORD=${{clickhouse.CLICKHOUSE_MAINTENANCE_PASSWORD}}
ANONYMOUS_IDENTITY_SECRET=<same hex as collector>
ANONYMOUS_IDENTITY_KEY_VERSION=1
OA_CREDENTIAL_KEYRING=<same JSON as api>
PRODUCT_NAME=Open Analytics
EMAIL_FROM=Open Analytics <analytics@your-domain>
```

`EMAIL_FROM` must be at least three characters or the worker refuses to boot. Mail is not sent until you configure a relay under **Account → Deployment**. Healthcheck: `/health`. No public domain.

### web (public)

```bash
PORT=3000
NEXT_PUBLIC_API_URL=https://api.<domain>
NEXT_PUBLIC_REALTIME_URL=https://rt.<domain>
NEXT_PUBLIC_COLLECTOR_URL=https://c.<domain>
```

The release image is built with placeholders. The **container substitutes** these three origins at start — a recreate is enough, not a rebuild. The first log line prints the three origins it started with. Read that before assuming the dashboard is “talking to the wrong host.”

Each origin is a bare origin: scheme, host, optional port, no path, no trailing slash. Wrong or missing, the container **exits** rather than serving a page that posts to the wrong place.

Healthcheck path: **`/login`**, not `/health`. Next does not serve `/health`; a `/health` probe stays failing in front of a dashboard that was ready in milliseconds.

Domain → port **3000**.

---

## 6. Deploy order

Railway will not wait. Bring it up in this order, and give each layer time to go healthy:

1. `postgres`, `clickhouse`, `valkey-queue`, `valkey-realtime`
2. `migrate` — wait for both CLIs, then pause it
3. `gateway`
4. `api`, `collector`, `realtime`, `worker`
5. `web` last

**Gateway before api.** The api sends a field on every gateway query that an older gateway rejects. Api-first breaks analytics reads for the length of the window; gateway-first has no window.

ClickHouse user/grant changes need a **redeploy**, not a restart that reuses the old environment. After migrate, if inserts fail on a new table while ordinary traffic still flows, redeploy `clickhouse` so the entrypoint sees the current passwords.

---

## 7. Claim it

Open `https://app.<domain>`. A deployment nobody has signed into offers to **create the first account**. Do that immediately. The offer is public for as long as your DNS is public, and it closes forever the moment one account exists.

Password sign-in stays on (`AUTH_PASSWORD_SIGNIN=enabled`). Configure mail and the assistant later under **Account → Deployment**. That screen is only visible to the oldest account, and it needs a valid `OA_CREDENTIAL_KEYRING`.

---

## 8. Smoke check

```sh
curl -s https://c.<domain>/oa.js -o /dev/null -w '%{http_code} %{size_download}\n'
curl -s https://api.<domain>/health | head -c 200
```

Create a site in the dashboard, paste the snippet, load a page. An event should reach ClickHouse within a couple of seconds. If the collector returns `202` and the dashboard stays empty, the worker is not draining — check worker logs and queue depth, usually a ClickHouse password or a grant that needs a ClickHouse redeploy.

---

## GeoIP

Without a City-schema `.mmdb`, every event carries null geo. That is a degradation, not a failed install.

Railway cannot run Coolify’s `geoip` one-shot: that job writes a volume the collector then mounts, and volumes are 1:1 with services.

To add DB-IP later (CC BY 4.0 — keep **IP Geolocation by DB-IP, https://db-ip.com** wherever you show the data):

1. Attach a volume to `collector` at `/geoip` if it does not have one.
2. Temporarily point that **same** service at `alpine:3.21`, custom start command = the fetch from [COOLIFY.md](https://github.com/OpenLabs-so/openanalytics/blob/main/infra/selfhost/COOLIFY.md) / `fetch-dbip.sh`, wait until `/geoip/dbip-city-lite.mmdb` exists, then switch the image back to `collector`.
3. Set `GEOIP_DB_PATH=/geoip/dbip-city-lite.mmdb` and redeploy collector.

A path that names a missing file is a crash loop. Omit the variable until the file is there. Refresh monthly: the collector opens the database once at boot.

---

## Client IP headers

On a host install, Caddy (or Coolify’s Traefik middleware) asserts `X-Real-IP` from the connection and **deletes** `CF-Connecting-IP`, `Fly-Client-IP`, `True-Client-IP`, and the country/city headers of the same family. Without that, a visitor can pick their own rate-limit bucket, anonymous id, and country.

Railway’s edge sets `X-Forwarded-For` / `X-Real-IP` from the connection. It does **not** strip spoofable `CF-*` headers. Two honest options:

- Put **Cloudflare** (or another CDN that overwrites those headers) in front of the four public domains, and do not re-assert the CDN’s address as the visitor.
- Accept that a client who sends `CF-Connecting-IP` can lie, until OpenAnalytics ships a Railway-specific strip or you terminate TLS on a proxy you control.

Do not run a second proxy that blindly copies client-supplied `X-Real-IP`.

---

## Upgrades

1. Pause traffic if you can — there is no tracker retry during collector downtime.
2. Point every OpenAnalytics image at the new tag (same tag on clickhouse, valkey, migrate, and all six app images).
3. Redeploy `migrate` (restart Never), wait for success, pause it again.
4. Redeploy `gateway`, then the rest. Recreate `web` so origin substitution re-runs.

There are **no down migrations**. Going back is a restore of volumes plus the env you backed up. Back up off Railway:

1. The variable set (especially PEMs, keyring, `ANONYMOUS_IDENTITY_SECRET`, store passwords). Without them the volumes are unreadable.
2. Postgres (`pg_dump`).
3. ClickHouse data volume (Railway volume backups, or `BACKUP DATABASE analytics TO S3(...)`).
4. Queue volume only if you cannot lose in-flight events (usually seconds).

---

## Troubleshooting

**A service exits immediately with a list of environment problems.** Read the whole list. Almost always: a variable left blank instead of omitted, or a secret on the wrong service (least-privilege by design).

**Dashboard loads, every API call fails in the browser.** `AUTH_TRUSTED_ORIGINS` is missing or is not the exact dashboard origin.

**Dashboard talks to the wrong host.** Recreate `web` after changing `NEXT_PUBLIC_*`. Read the first log line.

**`this hop crosses the public internet`.** The Valkey URL host is not private. Use `*.railway.internal`, not `*.proxy.rlwy.net` and not a dotted public hostname on `redis://`. AUTH is required.

**`ENOTFOUND` on `*.railway.internal`.** The OpenAnalytics client already sets `family: 6` for `.internal`. If DNS still fails, the target service is in another environment or was renamed.

**Collector `202`, dashboard empty.** Worker / ClickHouse. Check `CLICKHOUSE_INGEST_*` and that migrate finished against database `analytics`.

**No Account → Deployment.** `OA_CREDENTIAL_KEYRING` is missing or is 24 bytes of key material (32 base64 characters). Generate with `openssl rand -base64 32` inside the JSON as shown above. You are signed in as someone other than the oldest account.

**Signing errors on analytics reads.** Private/public halves from different pairs, or `QUERY_SIGNING_KEY_ID` / `ENVIRONMENT` mismatch between api and gateway. Rotate by replacing **both** halves and bumping the id on **both** services together.

**Site deletion never finishes.** Worker needs `CLICKHOUSE_MAINTENANCE_*`, and ClickHouse must have been recreated after those users were added.

---

## License and brand

OpenAnalytics is AGPL-3.0. A modified network service must offer its source to its users. The “OpenAnalytics” name and `getopen.so` identify the hosted product and are not a brand license. A Railway install runs the software, not the brand.

Upstream:

- [SELF-HOSTING.md](https://github.com/OpenLabs-so/openanalytics/blob/main/SELF-HOSTING.md)
- [infra/selfhost/COOLIFY.md](https://github.com/OpenLabs-so/openanalytics/blob/main/infra/selfhost/COOLIFY.md)
- [Railway: map Compose to services](https://docs.railway.com/guides/docker-compose)
- [Railway: ClickHouse](https://docs.railway.com/guides/clickhouse-analytics)
- [Railway: private networking](https://docs.railway.com/networking/private-networking)
