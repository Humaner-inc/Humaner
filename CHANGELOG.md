# Changelog

All notable changes to Humaner Self-Host are documented here. The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and the project follows [Semantic Versioning](https://semver.org).

## [0.1.1] - Unreleased

First public release of the Self-Host mailbox kit. (`0.1.0` was tagged in the private repository while the release pipeline was being finished and was never published.)

### Added

- IMAP / SMTP inbox with aliases and attachments, kept live by the IMAP IDLE worker.
- Tasks and in-app calendar beside the mailbox.
- Resources: URLs, PDFs and text for your own agent.
- Organization-scoped API keys and an MCP server (`/api/mcp`) plus REST (`/api/v1/mail`, `/api/v1/tasks`, `/api/v1/calendar`).
- Extra workspaces, member roles, MFA (TOTP) and an audit log with export.
- Email and Google sign-in.
- Docker Compose setup (dashboard, IMAP IDLE worker, PostgreSQL with pgvector).
- Message, trash and audit-log retention job (`/api/cron/purge-messages`, protected by `CRON_SECRET`).

### Security

- Cron endpoint fails closed when `CRON_SECRET` is unset.
- IMAP credentials, OAuth tokens and TOTP secrets encrypted at rest (AES-256-GCM), with `AUTH_SECRET_PREVIOUS` for key rotation.
- Rate limits on the API-key surface (MCP and REST) and on sign-in.
- Self-Host deployment mode is fixed: no environment variable can switch the build into the managed Cloud mode.

### Known limitations

- Login rate limiting is kept in process memory. Run a single dashboard instance or rate limit at your reverse proxy.
- Gmail OAuth, external calendar providers, billing, and the in-app Companion are part of the managed product and are not included.
