# Job Tracker

A full-stack application for organising job applications and tracking recruitment progress. The project brings together a React/TypeScript frontend, a Java Spring Boot REST API and PostgreSQL persistence.

## Highlights

- Account registration and sign-in
- JWT-protected application endpoints
- Create, edit, view and delete job applications
- Track application statuses and view dashboard summaries
- Search, filter and paginate application records
- Keep notes, interview details and reminders with applications
- Run the local stack with Docker Compose

## Technology

- **Frontend:** React 19, TypeScript, Vite
- **Backend:** Java 21, Spring Boot 3.5.5, Spring Security
- **Authentication:** JWT and BCrypt password hashing
- **Database:** PostgreSQL 16, Spring Data JPA
- **API documentation:** Springdoc OpenAPI / Swagger
- **Local environment:** Docker Compose

## Repository layout

The application source is in [`job-application-tracker/`](./job-application-tracker/).

The detailed project README inside that directory contains:
- Prerequisites and Docker Compose setup
- Environment variable descriptions
- API route overview
- Separate frontend/backend commands
- Build and test commands

## Quick start

1. Install Docker Desktop and make sure its Linux container engine is running.
2. Open a terminal in `job-application-tracker/`.
3. Copy `.env.example` to `.env` and set a private JWT secret.
4. Start the application:

```bash
docker compose up --build
```

5. Open [http://localhost:5173](http://localhost:5173).

See the [detailed setup and API documentation](./job-application-tracker/README.md) before running the project or changing its configuration.

## Project status

The project has a documented local Docker workflow and automated build checks. It is not presented as a publicly hosted service. Run the documented checks against your current checkout before relying on a new change.

## Security note

Use private environment variables for secrets. Do not commit real JWT secrets, database passwords, personal application records or other private information. The included local configuration is for development, not a production deployment.
