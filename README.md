[![CI](https://github.com/OWNER/REPO/actions/workflows/ci.yml/badge.svg)](https://github.com/herobryyant/Wedding-QR-Organizer/actions/workflows/ci.yml)

# Ever After — Wedding Seat Finder

A full stack wedding seating chart MVP. Guests scan a QR code, search for their own name, and see their assigned table. Organizers sign in to manage the guest list, import or export a CSV, and print the event QR code.

## Features

- Mobile friendly guest lookup with name matching and a 20 result cap
- Guest results only; there is no public full guest directory
- Organizer sign in with a 12 hour in-memory session token
- Add, edit, remove, and filter guests
- CSV import with `name` and `table` columns, CSV export, and downloadable template
- Guest/table totals and a printable event QR code
- PostgreSQL storage with Flyway schema migration
- Docker Compose setup for the web app, API, and database

## Run it with Docker

Requirements: Docker Desktop or Docker Engine with the Compose plugin.

1. From this folder, copy `.env.example` to `.env` and change the organizer and database passwords.
2. Set `VITE_COUPLE_NAMES` and `VITE_WEDDING_DATE` in `.env` for the event.
3. Start the app:

   ```sh
   docker compose up --build
   ```

4. Open [http://localhost:8088](http://localhost:8088). Organizer tools are at [http://localhost:8088/organizer](http://localhost:8088/organizer).

The starter organizer password is `change-me-now` only if you have not created a `.env` file. Change it before using or deploying this app. The database volume is named `wedding-data` and persists across restarts. `docker compose down -v` deletes the database volume and all guest data.

## Run locally without Docker

Requirements: Java 21, Maven, Node.js 20+, and PostgreSQL 16+.

1. Create a database named `wedding` with user/password `wedding`, or set `DATABASE_URL`, `DATABASE_USERNAME`, and `DATABASE_PASSWORD`.
2. Start the API from `backend`:

   ```sh
   mvn spring-boot:run
   ```

   API: `http://localhost:8080`. Set `ADMIN_PASSWORD` before starting it.
3. In another terminal, start the frontend from `frontend`:

   ```sh
   npm install
   npm run dev
   ```

   Vite opens at `http://localhost:5173` and proxies `/api` to the backend.

The web title can be personalized with `VITE_COUPLE_NAMES` and `VITE_WEDDING_DATE` at frontend build time. Docker Compose reads them from `.env`.

## CSV format

The first row must contain `name` and `table` columns. Example:

```csv
name,table
Taylor Morgan,Table 1
Jordan Lee,Table 2
```

The importer also recognizes `full name` and `table assignment`. Imports append rows; they do not replace existing guests.

## API overview

| Method | Endpoint | Access | Purpose |
|---|---|---|---|
| `GET` | `/api/public/lookup?name=Taylor` | Public | Search for matching guests |
| `POST` | `/api/admin/login` | Public | Create organizer session |
| `POST` | `/api/admin/logout` | Organizer | End organizer session |
| `GET` | `/api/admin/guests` | Organizer | List guests |
| `GET` | `/api/admin/stats` | Organizer | Guest/table totals |
| `POST` | `/api/admin/guests` | Organizer | Add guest |
| `PATCH` | `/api/admin/guests/{id}` | Organizer | Update guest |
| `DELETE` | `/api/admin/guests/{id}` | Organizer | Remove guest |
| `POST` | `/api/admin/guests/import` | Organizer | Bulk import guest rows |

Admin requests use `Authorization: Bearer <token>`.

## Suggested resume entry

**Ever After — Wedding Seat Finder** · React, TypeScript, Spring Boot, PostgreSQL, Docker

- Built a responsive wedding seating app where guests scan an event QR code and search their name to find a table assignment without exposing the full guest list.
- Developed organizer APIs for guest management and CSV bulk import, with PostgreSQL persistence and password-protected admin sessions.
- Containerized the frontend, API, and database with Docker Compose and added Flyway-managed schema migrations.

## MVP scope and next steps

This MVP supports one event per deployment. Organizer sessions are kept in API memory, so signing out or restarting the API invalidates sessions; use a durable identity provider and persistent session/JWT strategy before multi user production use. Other natural extensions are multiple events, guest groups/plus ones, RSVP tracking, and event specific access codes.
