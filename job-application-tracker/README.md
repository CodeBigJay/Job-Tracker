# Job Application Tracker - Full Stack

## Stack
- React 19, Vite, TypeScript
- Java 21, Spring Boot 3.5.5
- PostgreSQL 16
- JWT authentication

## Run backend
```bash
docker compose up -d
cd backend
mvn spring-boot:run
```

## Run frontend
Open another terminal:
```bash
cd frontend
npm install
npm run dev
```
Open http://localhost:5173

## API
Swagger: http://localhost:8080/swagger-ui/index.html

The frontend supports registration, login, creating applications, filtering by status, refreshing the list, and deleting applications. The backend also includes interviews, notes, reminders, and dashboard counts endpoints.
