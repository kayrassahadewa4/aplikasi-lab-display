# Laboratory Room Schedule Display System

> **Sistem Display Jadwal Penggunaan Laboratorium**

A full-stack web application for managing and displaying laboratory room usage schedules in real time. Built as a Final Year Thesis project.

---

## Technology Stack

| Layer    | Technology                                              |
| -------- | ------------------------------------------------------- |
| Frontend | Vue 3, TypeScript, Vite, Tailwind CSS v4, Vue Router, Pinia, Axios, VueUse, Lucide Vue Next |
| Backend  | NestJS 11, REST API                                     |
| Database | PostgreSQL 17, Prisma ORM                               |

---

## Folder Structure

```
display-jadwal-penggunaan-lab/
├── backend/                    # NestJS REST API
│   ├── prisma/                 # Prisma schema & migrations
│   ├── src/
│   │   ├── common/             # Shared infrastructure
│   │   │   ├── constants/      # Application constants
│   │   │   ├── decorators/     # Custom decorators
│   │   │   ├── dto/            # Shared DTOs
│   │   │   ├── enums/          # Shared enums
│   │   │   ├── exceptions/     # Custom exceptions
│   │   │   ├── filters/        # Exception filters
│   │   │   ├── guards/         # Auth & role guards
│   │   │   ├── interceptors/   # Response interceptors
│   │   │   ├── interfaces/     # Shared interfaces
│   │   │   ├── pipes/          # Validation pipes
│   │   │   └── utils/          # Helper utilities
│   │   ├── config/             # Environment & app config
│   │   ├── modules/            # Feature modules
│   │   │   ├── auth/
│   │   │   ├── bookings/
│   │   │   ├── display/
│   │   │   ├── evaluation/
│   │   │   ├── laboratory/
│   │   │   ├── rooms/
│   │   │   ├── schedules/
│   │   │   └── users/
│   │   └── prisma/             # Prisma module & service
│   └── ...
├── frontend/                   # Vue 3 SPA
│   ├── src/
│   │   ├── assets/             # Static assets
│   │   ├── components/         # Vue components
│   │   │   ├── common/         # Reusable UI (LoadingSpinner, EmptyState, etc.)
│   │   │   ├── layout/         # Layout components
│   │   │   └── ui/             # General UI components
│   │   ├── composables/        # Vue composables (hooks)
│   │   ├── config/             # App configuration
│   │   ├── icons/              # Centralized Lucide icon exports
│   │   ├── layouts/            # Route layout wrappers
│   │   ├── plugins/            # Vue plugins
│   │   ├── router/             # Vue Router config & routes
│   │   ├── services/           # API client & HTTP service
│   │   ├── stores/             # Pinia stores
│   │   ├── styles/             # Global CSS & theme
│   │   ├── types/              # TypeScript type definitions
│   │   ├── utils/              # Utility functions
│   │   └── views/              # Page-level components
│   │       ├── auth/
│   │       ├── bookings/
│   │       ├── dashboard/
│   │       ├── display/
│   │       ├── evaluation/
│   │       ├── laboratory/
│   │       ├── rooms/
│   │       └── schedules/
│   └── ...
└── README.md                   # This file
```

---

## Prerequisites

- **Node.js** 22+
- **PostgreSQL** 17
- **npm**

---

## Installation

### Backend

```bash
cd backend
cp .env.example .env       # Edit with your database credentials
npm install
npx prisma generate
```

### Frontend

```bash
cd frontend
cp .env.example .env       # Edit if needed
npm install
```

---

## Development Commands

### Backend

| Command               | Description                     |
| --------------------- | ------------------------------- |
| `npm run start:dev`   | Start in watch mode             |
| `npm run build`       | Compile for production          |
| `npm run start:prod`  | Run compiled production build   |
| `npm run lint`        | Lint & auto-fix                 |
| `npm run test`        | Run unit tests                  |
| `npm run test:e2e`    | Run end-to-end tests            |

### Frontend

| Command            | Description                        |
| ------------------ | ---------------------------------- |
| `npm run dev`      | Start Vite dev server              |
| `npm run build`    | Type-check & build for production  |
| `npm run preview`  | Preview production build locally   |
| `npm run lint`     | Lint & auto-fix                    |

---

## Environment Variables

### Backend (`backend/.env`)

| Variable         | Description                          | Default                          |
| ---------------- | ------------------------------------ | -------------------------------- |
| `PORT`           | Server port                          | `3000`                           |
| `NODE_ENV`       | Environment (`development` / `production` / `test`) | `development`   |
| `CORS_ORIGIN`    | Allowed CORS origin                  | `http://localhost:5173`          |
| `DATABASE_URL`   | PostgreSQL connection string         | —                                |
| `JWT_SECRET`     | Secret key for JWT signing           | —                                |
| `JWT_EXPIRATION` | JWT token expiry duration            | `1d`                             |

### Frontend (`frontend/.env`)

| Variable              | Description                  | Default                       |
| --------------------- | ---------------------------- | ----------------------------- |
| `VITE_API_BASE_URL`   | Backend API base URL         | `http://localhost:3000/api`   |

---

## API

- **Base URL**: `http://localhost:3000/api`
- **Swagger Docs**: `http://localhost:3000/docs`
- **CORS**: configured for `http://localhost:5173` by default

---

## Author

Herlambang Sahadewa

---

## License

UNLICENSED — Final Year Thesis Project
