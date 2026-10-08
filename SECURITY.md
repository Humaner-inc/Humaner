# Security Policy

Humaner Self-Host handles mailbox credentials, email content, and API keys that act on behalf of your workspace. We welcome responsible, private disclosure.

## Supported versions

| Version | Supported |
| ------- | --------- |
| 0.1.x   | Yes       |

## Reporting a vulnerability

Please **do not open a public issue** for security problems. Report privately via:

- [GitHub Security Advisory](https://github.com/Humaner-inc/Humaner/security/advisories/new)
- **security@humaner.io**

Include:

- A clear summary of the issue and its impact
- Steps to reproduce (version or commit, deployment setup, environment variables involved)
- Proof-of-concept code if available

We acknowledge reports within a few business days and keep you updated while we investigate.

## In scope

Code in this repository, running as documented in [`SELFHOST.md`](./SELFHOST.md):

- Authentication and session handling (email OTP, Google login, MFA)
- Authorization and workspace/organization isolation, including cross-workspace data access
- API keys, scopes, and MCP / OAuth (`/api/mcp`, `/api/v1/*`, `/api/oauth/*`)
- IMAP/SMTP credential storage and handling
- Attachment, image, and file serving routes
- SSRF, injection, XSS, CSRF, and unsafe deserialization
- Secrets or personal data exposed in logs, exports, or API responses
- The IMAP idle worker and the retention cron (`/api/cron/purge-messages`)

## Out of scope

- Hosted services (`humaner.io`, `app.humaner.io`) and the managed Cloud product
- Misconfiguration of your own deployment (for example enabling `SELF_HOST_LOG_VERIFICATION` in production, or exposing the database)
- Automated scanning without prior permission, denial of service, social engineering, physical access
- Missing security headers, weak TLS cipher suites, or DNS configuration (informational only)
- Vulnerabilities in third-party dependencies without a demonstrated impact on Humaner
- Issues in third-party services (your mail provider, Neon, Vercel, Resend) — report to them directly

## Please be considerate while investigating

- Test only against your own deployment and data
- Do not access, modify, or exfiltrate data that is not yours
- Avoid actions that degrade availability for other users

## Hardening notes for operators

- Set a strong `AUTH_SECRET` and `CRON_SECRET`; the cron route rejects requests when `CRON_SECRET` is unset.
- Leave `SELF_HOST_LOG_VERIFICATION` unset in production. It prints sign-up OTPs to stdout.
- Keep `NEXT_PUBLIC_APP_URL` on HTTPS behind a TLS-terminating proxy.
