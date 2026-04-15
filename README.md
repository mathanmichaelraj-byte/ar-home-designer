# InteriorAR

> Design rooms and full houses in 3D. Place furniture. Preview everything in Augmented Reality — before you buy a single piece.

A full-stack web platform that takes you from a blank canvas to a furnished, AR-ready room in four steps. No specialist software, no design experience required.

---

## Table of Contents

1. [Overview](#overview)
2. [Live Demo](#live-demo)
3. [Features](#features)
4. [Tech Stack](#tech-stack)
5. [Project Structure](#project-structure)
6. [Getting Started](#getting-started)
7. [Environment Variables](#environment-variables)
8. [Assets Setup](#assets-setup)
9. [Shared Utilities](#shared-utilities)
10. [API Reference](#api-reference)
11. [3D Scene](#3d-scene)
12. [UI Theme](#ui-theme)
13. [AR Compatibility](#ar-compatibility)
14. [AI Layout System](#ai-layout-system)
15. [Known Limitations](#known-limitations)
16. [License](#license)

---

## Overview

InteriorAR solves a common problem in interior design: you cannot visualise how furniture will look and fit in a real space before purchasing it. The platform provides a complete design workflow:

```
Draw room  →  Place 3D furniture  →  Preview in 3D  →  View in AR
```

Everything runs in the browser. No app install, no plugins.

---

## Live Demo

The frontend is deployed on **Vercel** and the backend on **Render**.

> Add your deployment URLs here once live.

---

## Features

### Room Designer
- Set exact room dimensions (width, length, height in metres)
- Choose wall colour with a live colour picker
- Place, move, rotate, and scale 70+ 3D furniture models
- Keyboard shortcuts: **W** Move · **E** Rotate · **R** Scale · **Del** Delete · **Esc** Deselect
- Transform toolbar appears only when a model is selected — clean viewport otherwise
- Object name tag and Remove button float above the selected item in 3D space
- Object count badge in the top-right corner
- Empty room hint guides new users to add furniture
- AI layout suggestions for 6 room styles (living, bedroom, office, dining, kitchen, bathroom)
- Save, rename, and manage multiple projects
- Share any design via a public link

### House Designer
- Create a multi-room, multi-floor house
- **2D Floor Plan** — canvas-based drag-to-move and corner-resize per room, snapped to grid
- **3D House View** — stacked multi-floor 3D visualisation, click to select, double-click to edit
- Import an existing Room Designer project as a room inside a house
- Per-room 3D editing with the full furniture panel and properties panel

### 3D Viewport (SceneViewer)
- Warm, realistic interior scene: oak hardwood floor, plaster walls, bright ceiling
- Skirting boards and ceiling cornice for architectural detail
- Natural daylight lighting rig: sun from the right, soft fill from the left, warm ceiling and floor bounce
- Contact shadows for a grounded, realistic feel
- `apartment` environment map for accurate reflections on furniture
- Vivid blue wireframe selection highlight
- Orbit, zoom, and pan with OrbitControls

### Augmented Reality
- WebXR `immersive-ar` + `hit-test` — place furniture on real surfaces via camera
- Compatibility check on page load with a clear message on unsupported devices

### General
- JWT authentication (register, login, profile)
- Auto-save — changes are persisted continuously, no manual save required
- Fully responsive — works on desktop and mobile browsers

---

## Tech Stack

| Layer      | Technology                                      |
|------------|-------------------------------------------------|
| Frontend   | React 18, Tailwind CSS                          |
| 3D Engine  | Three.js, @react-three/fiber, @react-three/drei |
| AR         | WebXR (immersive-ar + hit-test)                 |
| Backend    | Node.js, Express.js                             |
| Database   | MongoDB, Mongoose                               |
| Auth       | JWT (HS256, 7-day expiry)                       |
| 3D Assets  | Kenney Furniture Kit (GLB format)               |
| Deployment | Vercel (frontend), Render (backend)             |

---

## Project Structure

```
ar-interior-designer/
├── client/                          # React application
│   ├── public/
│   │   ├── models/                  # GLB furniture models  (not tracked in git)
│   │   └── thumbnails/              # PNG preview images    (not tracked in git)
│   └── src/
│       ├── ar/
│       │   ├── ARManager.js         # WebXR session bootstrap
│       │   └── ARScene.js           # Three.js AR scene integration
│       ├── components/
│       │   ├── FloorPlan.jsx        # 2D canvas floor plan (drag, resize, grid snap)
│       │   ├── FloorPlan3D.jsx      # 3D stacked house view
│       │   ├── FurniturePanel.jsx   # Searchable furniture grid with category filters
│       │   ├── FurnitureSidebar.jsx # Alternative sidebar furniture browser
│       │   ├── Navbar.jsx           # Top navigation with Projects dropdown
│       │   ├── ProjectCard.jsx      # Dashboard project card with hover actions
│       │   └── ProtectedRoute.jsx   # JWT-gated route wrapper
│       ├── context/
│       │   ├── AuthContext.jsx      # User auth state + login/register/logout
│       │   ├── HouseContext.jsx     # House CRUD + room management
│       │   └── ProjectContext.jsx   # Room project CRUD + object management
│       ├── hooks/
│       │   ├── useAutoSave.js       # Debounced auto-save hook
│       │   └── useFurniture.js      # Furniture fetch with search + category filter
│       ├── pages/
│       │   ├── ARViewerPage.jsx     # WebXR AR session launcher
│       │   ├── DashboardPage.jsx    # Room projects grid
│       │   ├── DesignerPage.jsx     # Full room designer (sidebar + 3D viewport)
│       │   ├── HomePage.jsx         # Marketing landing page
│       │   ├── HouseDashboardPage.jsx  # House projects grid
│       │   ├── HouseDesignerPage.jsx   # House designer (2D plan + 3D house + room editor)
│       │   ├── LoginPage.jsx        # Sign-in form
│       │   ├── ProfilePage.jsx      # Account settings + danger zone
│       │   └── RegisterPage.jsx     # Sign-up form with password strength indicator
│       ├── three/
│       │   ├── SceneViewer.jsx      # Main 3D room viewport (lighting, furniture, controls)
│       │   └── ThreeScene.js        # Standalone Three.js scene helper
│       └── utils/
│           ├── api.js               # Axios instance + all API endpoint wrappers
│           ├── constants.js         # Single source of truth for all static data
│           └── helpers.js           # Pure utility functions (no side effects)
│
├── server/                          # Express API
│   ├── controllers/
│   │   ├── authController.js        # Register, login, get/update profile
│   │   ├── furnitureController.js   # Furniture CRUD
│   │   ├── houseController.js       # House + room CRUD
│   │   └── projectController.js     # Project CRUD + share + AI suggest
│   ├── middleware/
│   │   ├── auth.js                  # JWT verification middleware
│   │   └── errorHandler.js          # Global error handler
│   ├── models/
│   │   ├── Furniture.js             # Furniture schema
│   │   ├── House.js                 # House + embedded rooms schema
│   │   ├── Project.js               # Room project + embedded objects schema
│   │   └── User.js                  # User schema
│   ├── routes/
│   │   ├── auth.js
│   │   ├── furniture.js
│   │   ├── houses.js
│   │   └── projects.js
│   └── services/
│       ├── aiService.js             # Rule-based layout suggestion engine
│       ├── jwtHelper.js             # Token sign/verify helpers
│       └── seedData.js              # Furniture seed script
│
└── docs/
    └── ARCHITECTURE.md
```

---

## Getting Started

### Prerequisites

- Node.js >= 18
- MongoDB (local or Atlas)
- Kenney Furniture Kit assets (see [Assets Setup](#assets-setup))

### Installation

```bash
# Clone the repository
git clone https://github.com/mathanmichaelraj-byte/ar-home-designer.git
cd ar-interior-designer

# Install server dependencies
cd server
npm install
cp .env.example .env   # then edit .env with your values

# Install client dependencies
cd ../client
npm install --legacy-peer-deps
```

### Running the Application

```bash
# Terminal 1 — backend
cd server
npm run dev        # starts on http://localhost:5000

# Terminal 2 — frontend
cd client
npm start          # starts on http://localhost:3000
```

### Seed the Database

```bash
cd server
node services/seedData.js
```

Populates the furniture collection with 70+ items across all categories.

---

## Environment Variables

Create `server/.env` from the example:

```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/ar-interior-designer
JWT_SECRET=your_secret_key_here
JWT_EXPIRE=7d
NODE_ENV=development
CLIENT_URL=http://localhost:3000
```

For the client, create `client/.env`:

```env
REACT_APP_API_URL=http://localhost:5000/api
```

---

## Assets Setup

3D models and thumbnails are not included in the repository due to file size.

1. Download the **Kenney Furniture Kit** from [kenney.nl/assets/furniture-kit](https://kenney.nl/assets/furniture-kit)
2. Place GLB model files → `client/public/models/`
3. Place PNG thumbnail files (NE isometric variant) → `client/public/thumbnails/`

The seed script (`server/services/seedData.js`) references these filenames automatically.

---

## Shared Utilities

All constants and helpers used across multiple files live in `client/src/utils/`. **Never redefine these locally — always import from here.**

### `constants.js`

| Export | Description |
|---|---|
| `SCENE` | 3D scene colours and config (floor, wall, ceiling, selection, grid) |
| `ROOM_TYPES` | `[{ value, label, emoji }]` — all room types |
| `ROOM_EMOJI` | `{ type → emoji }` map |
| `ROOM_PAL_2D` | Colour palette per room type for the 2D floor plan canvas |
| `ROOM_PAL_3D` | Colour palette per room type for the 3D house view |
| `ROOM_BADGE_CLS` | Tailwind badge classes per room type (house dashboard) |
| `FLOOR_OPTIONS` | `[{ v, l }]` — floor level options |
| `FLOOR_BADGE_COLORS` | Hex colour per floor index for 2D plan badges |
| `FURNITURE_CATEGORIES` | `[{ id, label }]` — furniture filter categories |
| `CEILING_KEYWORDS` | Keywords that identify ceiling-mounted items |
| `AI_STYLES` | `[{ style, emoji, label }]` — AI room style picker options |
| `ERRORS` | Standard error message strings |
| `GRID_SIZE`, `MIN_ROOM_SIZE`, `G2M` | Canvas and geometry constants |

### `helpers.js`

| Function | Signature | Description |
|---|---|---|
| `snapToGrid` | `(v, grid?)` | Snap a pixel value to the nearest grid cell |
| `buildNewObject` | `(item)` | Build a scene object from a furniture catalogue item (handles ceiling detection) |
| `formatAgo` | `(date)` | Relative time — "5m ago", "2d ago", "Just now" |
| `passwordStrength` | `(password)` | Returns `{ label, color, textColor, w }` for a password string |
| `floorLabel` | `(n)` | Floor number → display string ("Ground", "1st Fl.", …) |
| `getFloorOption` | `(n)` | Floor number → `FLOOR_OPTIONS` entry |
| `getRoomType` | `(value)` | Type string → `ROOM_TYPES` entry |
| `clamp` | `(val, min, max)` | Clamp a number between min and max |
| `round` | `(val, decimals?)` | Round to N decimal places (default 3) |

---

## API Reference

All private endpoints require `Authorization: Bearer <token>` header.

### Authentication

| Method | Endpoint           | Access  | Description      |
|--------|--------------------|---------|------------------|
| POST   | /api/auth/register | Public  | Register a user  |
| POST   | /api/auth/login    | Public  | Login            |
| GET    | /api/auth/me       | Private | Get current user |
| PUT    | /api/auth/me       | Private | Update profile   |

### Projects (Room Designer)

| Method | Endpoint                    | Access  | Description              |
|--------|-----------------------------|---------|--------------------------|
| GET    | /api/projects               | Private | List user projects       |
| POST   | /api/projects               | Private | Create project           |
| GET    | /api/projects/:id           | Private | Get project              |
| PUT    | /api/projects/:id           | Private | Update project           |
| DELETE | /api/projects/:id           | Private | Delete project           |
| POST   | /api/projects/:id/share     | Private | Generate share link      |
| GET    | /api/projects/shared/:token | Public  | View shared project      |
| GET    | /api/projects/:id/suggest   | Private | Get AI layout suggestion |

### Houses (House Designer)

| Method | Endpoint                      | Access  | Description       |
|--------|-------------------------------|---------|-------------------|
| GET    | /api/houses                   | Private | List user houses  |
| POST   | /api/houses                   | Private | Create house      |
| GET    | /api/houses/:id               | Private | Get house         |
| PUT    | /api/houses/:id               | Private | Update house      |
| DELETE | /api/houses/:id               | Private | Delete house      |
| POST   | /api/houses/:id/rooms         | Private | Add room          |
| PUT    | /api/houses/:id/rooms/:roomId | Private | Update room       |
| DELETE | /api/houses/:id/rooms/:roomId | Private | Delete room       |

### Furniture

| Method | Endpoint           | Access | Description               |
|--------|--------------------|--------|---------------------------|
| GET    | /api/furniture     | Public | List furniture (filtered) |
| GET    | /api/furniture/:id | Public | Get single item           |
| POST   | /api/furniture     | Admin  | Add furniture item        |
| PUT    | /api/furniture/:id | Admin  | Update furniture item     |
| DELETE | /api/furniture/:id | Admin  | Deactivate item           |

---

## 3D Scene

The `SceneViewer` component renders a realistic interior room using Three.js via `@react-three/fiber`.

### Room geometry
- **Floor** — oak hardwood (`#c8a96e`), low roughness for a polished look
- **Walls** — warm off-white plaster (`#f5f0e8`), overridable per project via wall colour picker
- **Ceiling** — bright white (`#faf7f2`) with `side={2}` so it renders from inside
- **Skirting boards** — warm tan (`#d4b896`) boxes along all three visible walls
- **Ceiling cornice** — thin strip along the top of each wall for architectural detail
- **Front wall** — 8% opacity so the camera can see inside from any angle

### Lighting rig
| Light | Position | Purpose |
|---|---|---|
| Ambient | scene-wide | 0.7 intensity warm white base fill |
| Directional (sun) | right side, high | 2.2 intensity warm daylight, casts shadows |
| Directional (fill) | left side | 0.5 intensity cool blue-white fill |
| Point (ceiling) | centre ceiling | 0.8 intensity warm bounce |
| Point (floor) | centre floor | 0.3 intensity warm floor bounce |

### Selection
Selected furniture gets a **vivid blue** (`#2563eb`) wireframe bounding box, a floating name tag, and a Remove button — all rendered as HTML overlays via `@react-three/drei`'s `Html` component.

### Contact shadows
`ContactShadows` from Drei adds soft, blurred shadows beneath all furniture for a grounded, realistic feel without expensive per-object shadow maps.

---

## UI Theme

The interface uses a strict black and white design system with red for destructive actions only.

| Element | Value |
|---|---|
| Page background | `#080808` — `#0d0d0d` |
| Surface | `#141414` — `#222222` |
| Primary button | White background, black text |
| Destructive (delete) | Red `#ef4444` |
| Accent / highlight | Pure white |
| 3D scene background | Warm `#d4c5b0` ambient sky |

---

## AR Compatibility

WebXR `immersive-ar` with `hit-test` requires:

| Platform | Requirement |
|---|---|
| Android | Chrome 81+ on an ARCore-compatible device |
| iOS | Safari 15+ with WebXR viewer or compatible third-party browser |
| Desktop | Not supported — compatibility message shown |

The AR viewer page checks `navigator.xr.isSessionSupported('immersive-ar')` on load and shows a clear warning if the device is unsupported.

---

## AI Layout System

The AI suggestion engine (`server/services/aiService.js`) is **rule-based**, not a trained model.

- Predefined zone configurations for 6 room styles: living, bedroom, office, dining, kitchen, bathroom
- Furniture is positioned relative to actual room dimensions and wall boundaries
- Rotation is set to face inward toward the room centre
- Duplicate models within the same layout are avoided
- Returns a cost estimate, a layout tip, and a size tip alongside the suggested objects
- The user is shown a confirmation dialog before the layout is applied

---

## Known Limitations

- GLB model files must be sourced and placed manually (not included in the repo)
- AR hit-test accuracy depends on device sensor quality and ambient lighting
- The AI layout engine is deterministic and rule-based — it does not learn or adapt
- No real-time multi-user collaboration or sync
- Password reset flow is not yet implemented

---

## License

MIT
