# LocalNotes (Offline-First Notes)

Offline-first Notes application:

- Frontend: React + Vite + MUI + RxDB (IndexedDB)
- Backend: NestJS + TypeORM + MySQL
- Sync: idempotent `POST /notes/sync` with last-write-wins (`updatedAt`)

## Quick start (dev)

### 1) Start MySQL (XAMPP)

Ensure XAMPP is running with MySQL enabled. If you prefer Docker instead:

- `docker compose up -d` (MySQL runs on `localhost:3306`)

### 2) Create the database

Via phpMyAdmin or MySQL CLI:

```sql
CREATE DATABASE IF NOT EXISTS localnotes;
```

Then apply the schema (optional; TypeORM auto-syncs):

```bash
mysql -u root localnotes < backend/sql/schema.sql
```

### 3) Backend

- Copy `backend/.env.example` to `backend/.env` (adjust `DB_USER`/`DB_PASSWORD` if needed)
- `cd backend`
- `npm run start:dev`

Backend listens on `http://localhost:3000`.

### 4) Frontend

- Copy `frontend/.env.example` to `frontend/.env` (optional)
- `cd frontend`
- `npm run dev`

Frontend runs on `http://localhost:5173`.

## Offline-first architecture (how it works)

### Source of truth

- The UI **always** reads from RxDB (IndexedDB) via reactive queries.
- The backend is **never** used as a read source for UI rendering.

### Writes

All user actions (create/edit/delete) follow this pattern:

1. Write to RxDB `notes` collection
2. Mark the note `syncStatus = pending`
3. Add an operation to RxDB `syncQueue` (FIFO)
4. UI updates immediately from local RxDB

### Sync processing

- When offline: the app does **not** call the API.
- When online: the sync processor drains `syncQueue` FIFO.
- On success: remove queue item; if no more queued ops exist for that note, set `syncStatus = synced`.
- On failure: stop processing; mark the note `syncStatus = failed`.

## Conflict handling

The backend implements **last write wins**:

- Each incoming payload contains `updatedAt` (ISO timestamp)
- If the server note does not exist: create it (including delete tombstones)
- If it exists: update only when `incoming.updatedAt` is newer than `stored.updatedAt`
- Deletes are soft deletes (`deleted = true`) and also participate in LWW

This makes the sync endpoint idempotent and safe to retry.

## API

### `POST /notes/sync`

Payload:

```json
{
  "entity": "note",
  "action": "CREATE | UPDATE | DELETE",
  "payload": {
    "id": "uuid",
    "title": "",
    "content": "",
    "tags": [],
    "updatedAt": "",
    "deleted": false
  }
}
```

## Future improvements

- Add a pull endpoint or replication to support onboarding a new device.
- Persist per-user data and add authentication.
- Add background sync with exponential backoff and better error UX.
- Add proper migrations (TypeORM) for production deployments.
