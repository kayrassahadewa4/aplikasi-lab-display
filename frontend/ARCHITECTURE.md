# Frontend Architecture

## Project Overview
Laboratory Schedule Display System - Multi-Portal Vue 3 Application

## Technology Stack
- **Framework**: Vue 3 (Composition API)
- **Language**: TypeScript
- **Build Tool**: Vite
- **Router**: Vue Router 5
- **State Management**: Pinia
- **HTTP Client**: Axios
- **Styling**: Tailwind CSS 4
- **Utilities**: VueUse
- **Icons**: Lucide Vue Next

## Architecture

### Four Independent Portals
1. **Administrator Portal** (`/admin`) - System administration
2. **Laboratory Staff Portal** (`/laboran`) - Lab operations & check-in/out
3. **Lecturer Portal** (`/lecturer`) - Schedule viewing & room requests
4. **Public Display Portal** (`/display`) - Full-screen public display

### Folder Structure

```
src/
├── assets/              # Static assets (images, fonts)
├── components/          # Reusable components
│   ├── common/         # Shared UI components
│   ├── layout/         # Layout-specific components
│   └── ui/             # UI elements
├── composables/        # Vue composables (composition functions)
│   ├── useApi.ts       # API request handler
│   └── usePagination.ts # Pagination logic
├── config/             # App configuration
│   ├── app.config.ts   # Application settings
│   └── index.ts        # Config barrel export
├── layouts/            # Portal layouts
│   ├── AdminLayout.vue      # Admin portal layout
│   ├── LaboranLayout.vue    # Laboran portal layout
│   ├── LecturerLayout.vue   # Lecturer portal layout
│   └── PublicLayout.vue     # Public display layout
├── modules/            # Feature modules by portal
│   ├── admin/          # Admin-specific features
│   ├── laboran/        # Laboran-specific features
│   ├── lecturer/       # Lecturer-specific features
│   └── public/         # Public display features
├── router/             # Vue Router configuration
│   ├── index.ts        # Router instance
│   └── routes.ts       # Route definitions
├── services/           # API services
│   ├── api.ts          # Axios instance
│   └── http.service.ts # HTTP utilities
├── stores/             # Pinia stores
│   ├── app.store.ts    # App state
│   ├── theme.store.ts  # Theme management
│   └── index.ts        # Store barrel export
├── styles/             # Global styles
│   └── main.css        # Tailwind imports & global CSS
├── types/              # TypeScript types
│   ├── api.types.ts    # API type definitions
│   ├── common.types.ts # Common types
│   └── index.ts        # Type barrel export
├── utils/              # Utility functions
│   ├── format.utils.ts # Formatting helpers
│   └── index.ts        # Utils barrel export
├── views/              # Page components
│   ├── admin/          # Admin pages
│   ├── laboran/        # Laboran pages
│   ├── lecturer/       # Lecturer pages
│   ├── public/         # Public display pages
│   └── NotFoundPage.vue # 404 page
├── App.vue             # Root component
└── main.ts             # Application entry point
```

## Routing Structure

### Admin Portal
- `/admin` - Dashboard

### Laboran Portal
- `/laboran` - Dashboard

### Lecturer Portal
- `/lecturer` - Dashboard

### Public Display
- `/display` - Full-screen display

## Shared Components

### Common Components
- `BaseButton.vue` - Reusable button component
- `BaseCard.vue` - Card container
- `BaseInput.vue` - Form input
- `LoadingSpinner.vue` - Loading indicator
- `EmptyState.vue` - Empty data state
- `PageHeader.vue` - Page title & actions

## Composables

### `useApi(url, config, options)`
Generic API request handler with loading & error states

### `usePagination(initialPage, initialLimit)`
Pagination logic with page navigation

## State Management

### App Store (`app.store.ts`)
- Global loading state
- Sidebar collapsed state

### Theme Store (`theme.store.ts`)
- Theme selection (light/dark)
- Persists to localStorage

## API Integration

### Configuration
- Base URL: `VITE_API_BASE_URL` from `.env`
- Timeout: 10 seconds
- Headers: JSON content-type

### Axios Instance
- Located in `src/services/api.ts`
- Request interceptor (auth token injection - TBD)
- Response interceptor (error handling)

## Environment Variables

```env
VITE_API_BASE_URL=http://localhost:3000/api
```

## Design System

### Tailwind CSS
- Default Tailwind configuration
- Custom theme extensions (TBD)
- Responsive utilities

### Color Palette
- Primary: Blue (default Tailwind)
- Gray shades for UI
- Semantic colors (success, danger, warning)

## Development Workflow

### Run Development Server
```bash
npm run dev
```

### Build for Production
```bash
npm run build
```

### Type Check
```bash
npm run type-check
```

### Lint & Format
```bash
npm run lint
npm run format
```

## Coding Standards

### Vue Components
- Use `<script setup>` syntax
- Composition API over Options API
- TypeScript for type safety
- Props interface definition

### File Naming
- Components: PascalCase (e.g., `BaseButton.vue`)
- Utilities: camelCase (e.g., `format.utils.ts`)
- Stores: kebab-case with `.store.ts` suffix
- Types: kebab-case with `.types.ts` suffix

### Import Aliases
- `@/` - points to `src/` directory

## Future Enhancements

### Phase 2 (TBD)
- Authentication (Keycloak integration)
- Authorization & role-based access
- Feature modules implementation
- CRUD operations
- Forms & validation
- Data tables
- Charts & visualizations
- Real-time updates (WebSocket)

## Notes

- **Current Status**: Foundation only - no business logic implemented
- **Next Steps**: Implement feature modules per portal
- **Backend**: NestJS API at `http://localhost:3000/api`
