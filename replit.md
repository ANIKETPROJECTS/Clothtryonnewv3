# V-TryOn - Virtual T-Shirt Try-On Application

## Overview

V-TryOn is a real-time augmented reality (AR) virtual try-on application that allows users to see how t-shirts look on them using their webcam. The app uses MediaPipe pose detection to track body landmarks and overlay t-shirt images in real-time. Users can switch between different shirt views (front, back, left, right), change colors, and save their favorite looks to a gallery.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React with TypeScript, using Vite as the build tool
- **Routing**: Wouter for lightweight client-side routing
- **State Management**: TanStack React Query for server state management
- **UI Components**: Shadcn/ui component library with Radix UI primitives
- **Styling**: Tailwind CSS with custom dark theme configuration
- **Design System**: Custom CSS variables for theming with Space Grotesk (display) and Inter (body) fonts

### AR/Pose Detection
- **MediaPipe Pose**: For real-time body landmark detection from webcam feed
- **MediaPipe Camera Utils**: For handling webcam input
- **MediaPipe Drawing Utils**: For visualizing pose landmarks (debugging)
- **react-webcam**: React component for webcam access
- **Canvas API**: HTML5 Canvas for t-shirt overlay and image manipulation

### Backend Architecture
- **Runtime**: Node.js with Express
- **Language**: TypeScript with ESM modules
- **API Pattern**: REST API with typed routes defined in shared schema
- **Build**: esbuild for server bundling, Vite for client

### Data Storage
- **Database**: PostgreSQL via Drizzle ORM
- **Schema Location**: `shared/schema.ts` - shared between client and server
- **Migrations**: Managed via Drizzle Kit (`drizzle-kit push`)

### Project Structure
```
├── client/           # React frontend application
│   └── src/
│       ├── components/   # UI components including Shadcn
│       ├── hooks/        # Custom React hooks
│       ├── lib/          # Utility functions
│       └── pages/        # Route pages (LandingPage, Home, not-found)
├── server/           # Express backend
│   ├── db.ts         # Database connection
│   ├── routes.ts     # API route handlers
│   ├── storage.ts    # Data access layer
│   └── static.ts     # Static file serving
├── shared/           # Shared code between client/server
│   ├── schema.ts     # Drizzle database schema
│   └── routes.ts     # API route definitions with Zod validation
└── migrations/       # Database migrations
```

### API Design
Routes are defined in `shared/routes.ts` with Zod schemas for input validation:
- `GET /api/looks` - List all saved looks
- `POST /api/looks` - Create a new saved look
- `DELETE /api/looks/:id` - Delete a saved look

### Key Design Decisions
1. **Shared Schema**: Database schema and API types are shared between frontend and backend for type safety
2. **MediaPipe CDN Loading**: Pose detection models load from CDN at runtime (large files)
3. **Canvas-based Rendering**: T-shirt overlay uses HTML5 Canvas for real-time image manipulation
4. **Storage Abstraction**: `IStorage` interface allows swapping storage implementations

## External Dependencies

### Database
- **PostgreSQL**: Primary database, connection via `DATABASE_URL` environment variable
- **Drizzle ORM**: Type-safe database queries with `drizzle-orm/node-postgres`

### Frontend Libraries
- **MediaPipe**: Google's ML framework for pose detection (loaded from CDN)
  - `@mediapipe/pose` - Body landmark detection
  - `@mediapipe/camera_utils` - Camera feed handling
  - `@mediapipe/drawing_utils` - Landmark visualization
- **Radix UI**: Headless UI components (via Shadcn)
- **TanStack Query**: Data fetching and caching

### Build Tools
- **Vite**: Frontend development server and bundler
- **esbuild**: Server-side bundling for production
- **Drizzle Kit**: Database schema migrations

### Runtime Requirements
- Camera permissions required for AR functionality
- Modern browser with WebRTC support
- PostgreSQL database instance

## Running on Replit

The project uses the existing **Start application** workflow (`npm run dev`), which serves the React client and Express API together on port 5000. Dependencies are installed from `package-lock.json`. The Replit development PostgreSQL database supplies `DATABASE_URL` automatically; do not add a connection string to the repository. After setting up a fresh development database, run `npm run db:push` once to create the tables before using the saved looks or products APIs.

Open the web preview to use the app. The live try-on page requires browser camera permission and a working webcam; its pose model loads from the MediaPipe CDN, so internet access is needed for that feature.

## VPS Deployment (PM2 + Nginx)

The production server listens on port `3021` by default. `ecosystem.config.cjs` starts the built app with PM2 on that port and binds it to `127.0.0.1`, so it is only reachable locally and should be exposed through Nginx. Set the VPS PostgreSQL connection string in `ecosystem.config.cjs`; both PM2 and `npm run db:push` read it from there. URL-encode special characters in the username or password. Protect this file after entering real credentials and do not commit or share the credential-bearing version. The current server does not use `SESSION_SECRET`.

Requirements: Node.js 20.19+ (or 22.12+), npm, PM2, PostgreSQL, and Nginx. From the project directory on the VPS:

1. Edit `ecosystem.config.cjs` and replace the marked PostgreSQL connection string with the VPS database URL.
2. Run `npm install`.
3. Create the database tables once with `npm run db:push`. It reads the same connection string as PM2. Review the schema before applying changes to a database containing important data.
4. Run `npm run build`.
5. Start the process with `pm2 start ecosystem.config.cjs`, then configure PM2's startup service with `pm2 startup` and run the command it prints. Finish with `pm2 save`.
6. Install `deploy/nginx/arvr.airavatatechnologies.com.conf` under `/etc/nginx/sites-available/`, enable it in `/etc/nginx/sites-enabled/`, run `sudo nginx -t`, and reload Nginx.
7. Point the domain's DNS A record (and any AAAA record, if used) to the VPS. Allow inbound ports 80 and 443 in the VPS firewall. Once DNS resolves, run `sudo certbot --nginx -d arvr.airavatatechnologies.com` to issue and install HTTPS.

Verification on the VPS: `pm2 status` should show `v-tryon` online; `curl -I http://127.0.0.1:3021/` should return HTTP 200; after DNS and Certbot, `curl -I https://arvr.airavatatechnologies.com/` should return HTTP 200. Do not expose port 3021 publicly.