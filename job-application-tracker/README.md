# Job Tracker

A full-stack job application tracker built to help users organise opportunities, follow application progress and keep recruitment details together.

## Technology

| Layer | Technology |
|---|---|
| Frontend | React 19, TypeScript, Vite |
| Backend | Java 21, Spring Boot 3.5.5 |
| Security | Spring Security, BCrypt password hashing, JWT |
| Database | PostgreSQL 16, Spring Data JPA |
| API documentation | Springdoc OpenAPI / Swagger |
| Containers | Docker, Docker Compose |

## Current features

- Account registration and sign-in
- JWT-protected application API
- Create, view, edit and delete job applications
- Track saved, applied, screening, interview, offer, accepted, rejected and withdrawn statuses
- Search by company, role, location or source
- Filter by application status
- Dashboard totals and status counts
- Store job links, location, salary range, application dates, closing dates and descriptions
- Responsive layout for desktop and mobile

Each application has a details panel for adding and reviewing notes, scheduling interviews, and setting reminders. Interviews and reminders can be marked complete or deleted; notes can be deleted.

## Run with Docker Compose

### Requirements

- Docker Desktop with the Linux container engine running
- Docker Compose v2

Open a terminal in the `job-application-tracker` folder.

1. Copy the example environment file:

   **Windows PowerShell**
   ```powershell
   Copy-Item .env.example .env
   ```

   **macOS / Linux**
   ```bash
   cp .env.example .env
   ```

2. Open `.env` and replace the example JWT secret with a private random value of at least 32 characters.

3. Build and start the application:

   ```bash
   docker compose up --build
   ```

4. Open the frontend at [http://localhost:5173](http://localhost:5173).

The API runs at [http://localhost:8080](http://localhost:8080), and Swagger UI is available at [http://localhost:8080/swagger-ui/index.html](http://localhost:8080/swagger-ui/index.html).

To stop the containers:

```bash
docker compose down
```

To also delete the local PostgreSQL data volume (this permanently deletes locally stored application data):

```bash
docker compose down -v
```

### Environment variables

| Variable | Purpose |
|---|---|
| `JWT_SECRET` | Secret used to sign access tokens; use a private value outside local development |
| `POSTGRES_PASSWORD` | Local PostgreSQL password |
| `CORS_ALLOWED_ORIGINS` | Comma-separated frontend origins allowed to call the API |
| `VITE_API_BASE_URL` | API base URL embedded in the frontend build |

The Compose defaults are intended for local development only. Do not deploy the example database credentials or development JWT secret to a public server.

## Run services separately

If you prefer to run the Java and React processes outside Docker, start PostgreSQL first:

```bash
docker compose up -d postgres
```

Start the backend in a terminal:

```bash
cd backend
mvn spring-boot:run
```

Start the frontend in another terminal:

```bash
cd frontend
npm install
npm run dev
```

The frontend development server runs at [http://localhost:5173](http://localhost:5173). Set `VITE_API_BASE_URL` in `frontend/.env.local` if the API is hosted somewhere else.

## Main API routes

| Method | Route | Purpose |
|---|---|---|
| POST | `/api/auth/register` | Register an account |
| POST | `/api/auth/login` | Sign in |
| GET | `/api/applications` | List applications; optional `status` filter |
| POST | `/api/applications` | Create an application |
| GET | `/api/applications/{id}` | Get one application |
| PUT | `/api/applications/{id}` | Update an application |
| DELETE | `/api/applications/{id}` | Delete an application |
| GET | `/api/applications/dashboard/counts` | Get status counts |
| GET / POST | `/api/applications/{id}/interviews` | List or add interviews |
| PATCH / DELETE | `/api/applications/{id}/interviews/{interviewId}` | Update completion or delete an interview |
| GET / POST | `/api/applications/{id}/notes` | List or add notes |
| DELETE | `/api/applications/{id}/notes/{noteId}` | Delete a note |
| GET / POST | `/api/applications/{id}/reminders` | List or add reminders |
| PATCH / DELETE | `/api/applications/{id}/reminders/{reminderId}` | Update completion or delete a reminder |
| GET | `/api/applications/reminders` | List all reminders for the signed-in user |

Protected routes require an `Authorization: Bearer <token>` header.

## Build checks

Run these locally before treating a change as verified:

**Backend**
```bash
cd backend
mvn test
mvn package
```

**Frontend**
```bash
cd frontend
npm install
npm run build
```

Automated integration tests and deployment to a public hosting provider remain future work.
