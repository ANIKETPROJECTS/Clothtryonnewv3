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
- **Persistence**: Local JSON file at `data/app-data.json`; created automatically on first API access.
- **Scope**: Saved looks and product records are stored on the same filesystem as the app. No database service or database URL is required.
- **Writes**: Updates are serialized and written through a temporary file before atomic rename. Run one PM2 app instance and back up this file.

### Project Structure
```
├── client/           # React frontend application
│   └── src/
│       ├── components/   # UI components including Shadcn
│       ├── hooks/        # Custom React hooks
│       ├── lib/          # Utility functions
│       └── pages/        # Route pages (LandingPage, Home, not-found)
├── server/           # Express backend
│   ├── routes.ts     # API route handlers
│   ├── storage.ts    # JSON-file data access layer
│   └── static.ts     # Static file serving
├── shared/           # Shared code between client/server
│   ├── schema.ts     # Shared data types and request validation
│   └── routes.ts     # API route definitions with Zod validation
```

### API Design
Routes are defined in `shared/routes.ts` with Zod schemas for input validation:
- `GET /api/looks` - List all saved looks
- `POST /api/looks` - Create a new saved look
- `DELETE /api/looks/:id` - Delete a saved look

### Key Design Decisions
1. **Project-local persistence**: Runtime records are stored in `data/app-data.json` with no external database dependency.
2. **MediaPipe CDN Loading**: Pose detection models load from CDN at runtime (large files)
3. **Canvas-based Rendering**: T-shirt overlay uses HTML5 Canvas for real-time image manipulation
4. **Storage Abstraction**: `IStorage` interface allows swapping storage implementations

## External Dependencies

### Persistence
- The application creates `data/app-data.json` when the API first reads or writes data.
- Keep this file on persistent VPS storage and include it in backups. Do not run multiple PM2 instances against this JSON store.

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

### Runtime Requirements
- Camera permissions required for AR functionality
- Modern browser with WebRTC support

## Running on Replit

The project uses the existing **Start application** workflow (`npm run dev`), which serves the React client and Express API together on port 5000. Dependencies are installed from `package-lock.json`. The first request to a data API creates `data/app-data.json`; no database setup or connection URL is needed. This runtime data file is excluded from Git to avoid checking saved images into source control.

Open the web preview to use the app. The live try-on page requires browser camera permission and a working webcam; its pose model loads from the MediaPipe CDN, so internet access is needed for that feature.

## VPS Deployment (PM2 + Nginx)

The production server listens on port `3021` by default. `ecosystem.config.cjs` starts the built app with PM2 on that port and binds it to `127.0.0.1`, so it is only reachable locally and should be exposed through Nginx. There are no database credentials or connection URL to configure. App records are stored in `data/app-data.json`; keep that file on persistent VPS storage and back it up. Use one PM2 instance.

Requirements: Node.js 20.19+ (or 22.12+), npm, PM2, and Nginx. From the project directory on the VPS:

1. Run `npm install` and `npm run build`.
2. Start the process with `pm2 start ecosystem.config.cjs`, then configure PM2's startup service with `pm2 startup` and run the command it prints. Finish with `pm2 save`.
3. Install `deploy/nginx/arvr.airavatatechnologies.com.conf` under `/etc/nginx/sites-available/`, enable it in `/etc/nginx/sites-enabled/`, run `sudo nginx -t`, and reload Nginx.
4. Point the domain's DNS A record (and any AAAA record, if used) to the VPS. Allow inbound ports 80 and 443 in the VPS firewall. Once DNS resolves, run `sudo certbot --nginx -d arvr.airavatatechnologies.com` to issue and install HTTPS.

Verification on the VPS: `pm2 status` should show `v-tryon` online; `curl -I http://127.0.0.1:3021/` should return HTTP 200; after DNS and Certbot, `curl -I https://arvr.airavatatechnologies.com/` should return HTTP 200. Do not expose port 3021 publicly.