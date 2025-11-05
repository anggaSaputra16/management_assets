# Using an external PostgreSQL for management_assets

This document shows how to run the backend/fronted so they use a PostgreSQL instance that is external to the project (for example, a DB server or a dedicated DB container on a different host).

Goals:
- Keep the database hosted/managed separately from the application code.
- Allow GUI clients (DBeaver, HeidiSQL, pgAdmin) to connect to that DB.
- Provide repeatable scripts to test connection and run Prisma migrations.

Quick checklist
- Ensure database is reachable from the machine where you'll run the backend (ping/tcp check).
- Have these connection details: HOST, PORT, DB_NAME (management_assets), USER (postgres), PASSWORD (postgres123 or whatever you set).
- Update `backend/.env` or create a copy from `backend/.env.example` with the real values.

Environment variables (recommended)

Set these in `backend/.env` (example in `backend/.env.example`):

- DATABASE_URL="postgresql://<user>:<password>@<host>:<port>/<db_name>?schema=public"
- DATABASE_HOST=<host>
- DATABASE_PORT=<port>
- DATABASE_USER=<user>
- DATABASE_PASSWORD=<password>
- DATABASE_NAME=<db_name>

Example (connecting to local ma-db-copy container mapped to host port 5433):

DATABASE_URL="postgresql://postgres:postgres123@localhost:5433/management_assets?schema=public"

Running Prisma migrations against the external DB

From the `backend` folder, with `DATABASE_URL` set (via `.env` or environment):

- Install dependencies (if not already):
  - `npm install`
- Generate Prisma client (if you changed schema):
  - `npx prisma generate`
- Apply migrations in non-interactive (deploy) mode:
  - `npx prisma migrate deploy`

If you prefer development flow that creates migrations from local schema edits, use `npx prisma migrate dev` but be cautious when running on a shared remote DB.

Connecting with a GUI (DBeaver / HeidiSQL / pgAdmin)

- Host: <host> (e.g., localhost or server IP)
- Port: <port> (e.g., 5433 or 5432)
- Database: management_assets
- Username: postgres
- Password: your password
- SSL: disabled (unless your server requires it)

Example connection used by this project (local dev):
- Host: localhost
- Port: 5433
- Database: management_assets
- User: postgres
- Password: postgres123

Notes and best-practices
- Do NOT commit real credentials to source control. Keep `.env` out of Git (it is already in `.gitignore`).
- For CI/CD and production, prefer storing DB credentials in secure secrets stores and passing them to containers at deploy time.
- If your database server has a firewall, whitelist the application host(s) or use an SSH tunnel.
- When using a remote DB, be careful with `prisma migrate dev` (it may prompt and write migration files). Prefer `prisma migrate deploy` in automated environments.

Troubleshooting
- If the backend cannot connect, run a TCP test on the host and port (PowerShell example):
  - `Test-NetConnection -ComputerName <host> -Port <port>`
- Check logs of the application for Prisma connection errors.
- Ensure Postgres listens on the interface accessible from your host (for containerized DB use host port mapping or host.docker.internal from inside containers).

If you want, I can:
- Create a PowerShell script to validate connectivity and run `prisma migrate deploy` automatically.
- Provide a `docker-compose.external-db.yml` example that starts backend and frontend but not Postgres (so it's clear the DB is external).