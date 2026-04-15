# InteriorAR

A full-stack web platform for designing rooms and full houses in 3D, and previewing furniture placement in real space using Augmented Reality.

---

## Overview

InteriorAR solves a common problem in interior design: the inability to visualize how furniture will look and fit in a real space before purchasing. The platform provides a complete design workflow — from drawing a 2D floor plan to placing furniture in a live AR environment — without requiring any specialized software or professional design knowledge.

---

## Features

- **Room Designer** — configurable dimensions, wall color, and furniture placement in 3D
- **House Designer** — multi-room, multi-floor house layout with 2D floor plan and 3D house view
- **Furniture Library** — 70+ items across all room categories with search and category filters
- **3D Viewport** — real-time drag, rotate, and scale furniture using TransformControls (W/E/R shortcuts)
- **2D Floor Plan** — canvas-based room layout with drag-to-move and corner-resize per room
- **3D House View** — stacked multi-floor 3D visualization with per-room editing
- **Augmented Reality** — WebXR hit-test preview on supported mobile devices
- **AI Layout Suggestions** — rule-based layout engine for 6 room styles
- **Auto-save** — continuous project saving, no data loss
- **Share** — generate a public link for any design project

---

## Tech Stack

| Layer      | Technology                          |
|------------|--------------------------------------|
| Frontend   | React 18, Tailwind CSS               |
| 3D Engine  | Three.js, @react-three/fiber, Drei   |
| AR         | WebXR (immersive-ar + hit-test)      |
| Backend    | Node.js, Express.js                  |
| Database   | MongoDB, Mongoose                    |
| Auth       | JWT (HS256, 7-day expiry)            |
| 3D Assets  | Kenney Furniture Kit (GLB format)    |

---

## Project Structure

```
ar-interior-designer/
├── client/                        # React application
│   ├── public/
│   │   ├── models/                # GLB furniture models (not tracked in git)
│   │   └── thumbnails/            # PNG preview images (not tracked in git)
│   └── src/
│       ├── ar/                    # WebXR session manager
│       ├── components/            # Navbar, FurniturePanel, FloorPlan, FloorPlan3D, ProjectCard
│       ├── context/               # AuthContext, ProjectContext, HouseContext
│       ├── hooks/                 # useFurniture, useAutoSave
│       ├── pages/                 # Home, Dashboard, Designer, AR, Profile
│       │                          # HouseDashboard, HouseDesigner
│       ├── three/                 # SceneViewer (Three.js room + furniture)
│       └── utils/
│           ├── api.js             # Axios API client
│           ├── constants.js       # All shared static data (room types, palettes, scene config, etc.)
│           └── helpers.js         # Shared utility functions (formatAgo, buildNewObject, snapToGrid, etc.)
│
├── server/                        # Express API
│   ├── controllers/               # Auth, Project, House, Furniture logic
│   ├── middleware/                # JWT auth guard, error handler
│   ├── models/                    # User, Project, House, Furniture schemas
│   ├── routes/                    # API route definitions
│   └── services/                  # AI layout engine, JWT helper, seed script
│
└── docs/
    └── ARCHITECTURE.md
```

---

## Getting Started

### Prerequisites

- Node.js >= 18
- MongoDB (local or Atlas)
- Kenney Furniture Kit assets (see Assets Setup below)

### Installation

```bash
# Clone the repository
git clone https://github.com/mathanmichaelraj-byte/ar-home-designer.git
cd ar-interior-designer

# Install server dependencies
cd server
npm install
cp .env.example .env

# Install client dependencies
cd ../client
npm install --legacy-peer-deps
```

### Environment Variables

Edit `server/.env`:

```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/ar-interior-designer
JWT_SECRET=your_secret_key_here
JWT_EXPIRE=7d
NODE_ENV=development
CLIENT_URL=http://localhost:3000
```

### Running the Application

```bash
# Terminal 1 — Start the backend
cd server
npm run dev

# Terminal 2 — Start the frontend
cd client
npm start
```

The application will be available at `http://localhost:3000`.

### Seed the Database

```bash
cd server
node services/seedData.js
```

This populates the furniture collection with 70+ items.

---

## Assets Setup

3D models and thumbnail images are not included in the repository due to file size. Download the Kenney Furniture Kit from [kenney.nl/assets/furniture-kit](https://kenney.nl/assets/furniture-kit) and place the files as follows:

- GLB model files → `client/public/models/`
- PNG thumbnail files (NE variant only) → `client/public/thumbnails/`

---

## Shared Utilities

All constants and helper functions used across multiple components are centralised in `client/src/utils/`:

### `constants.js`
Single source of truth for all static data. Import from here instead of redefining locally.

| Export | Description |
|---|---|
| `SCENE` | 3D scene colours (bg, floor, wall, ceiling, grid, selection) |
| `ROOM_TYPES` | Array of `{ value, label, emoji }` for all room types |
| `ROOM_EMOJI` | Map of room type → emoji |
| `ROOM_PAL_2D` | 2D floor plan colour palette per room type |
| `ROOM_PAL_3D` | 3D house view colour palette per room type |
| `ROOM_BADGE_CLS` | Tailwind badge classes per room type |
| `FLOOR_OPTIONS` | Array of `{ v, l }` floor level options |
| `FLOOR_BADGE_COLORS` | Colour per floor index for 2D plan badges |
| `FURNITURE_CATEGORIES` | Array of `{ id, label }` furniture filter categories |
| `CEILING_KEYWORDS` | Keywords identifying ceiling-mounted items |
| `AI_STYLES` | Array of `{ style, emoji, label }` for AI room picker |
| `ERRORS` | Standard error message strings |
| `GRID_SIZE`, `MIN_ROOM_SIZE`, `G2M` | Canvas and geometry constants |

### `helpers.js`
Pure utility functions with no side effects.

| Function | Description |
|---|---|
| `snapToGrid(v, grid)` | Snap a pixel value to the nearest grid cell |
| `buildNewObject(item)` | Build a scene object from a furniture catalogue item |
| `formatAgo(date)` | Relative time string — "5m ago", "2d ago" |
| `passwordStrength(password)` | Returns `{ label, color, textColor, w }` for a password |
| `floorLabel(n)` | Floor number → display string ("Ground", "1st Fl.", …) |
| `getFloorOption(n)` | Floor number → `FLOOR_OPTIONS` entry |
| `getRoomType(value)` | Type string → `ROOM_TYPES` entry |
| `clamp(val, min, max)` | Clamp a number between min and max |
| `round(val, decimals)` | Round to N decimal places (default 3) |

---

## API Reference

### Authentication

| Method | Endpoint              | Access  | Description        |
|--------|-----------------------|---------|--------------------|
| POST   | /api/auth/register    | Public  | Register a user    |
| POST   | /api/auth/login       | Public  | Login              |
| GET    | /api/auth/me          | Private | Get current user   |
| PUT    | /api/auth/me          | Private | Update profile     |

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

| Method | Endpoint                          | Access  | Description           |
|--------|-----------------------------------|---------|-----------------------|
| GET    | /api/houses                       | Private | List user houses      |
| POST   | /api/houses                       | Private | Create house          |
| GET    | /api/houses/:id                   | Private | Get house             |
| PUT    | /api/houses/:id                   | Private | Update house          |
| DELETE | /api/houses/:id                   | Private | Delete house          |
| POST   | /api/houses/:id/rooms             | Private | Add room to house     |
| PUT    | /api/houses/:id/rooms/:roomId     | Private | Update room           |
| DELETE | /api/houses/:id/rooms/:roomId     | Private | Delete room           |

### Furniture

| Method | Endpoint           | Access | Description              |
|--------|--------------------|--------|--------------------------|
| GET    | /api/furniture     | Public | List furniture (filtered)|
| GET    | /api/furniture/:id | Public | Get single item          |
| POST   | /api/furniture     | Admin  | Add furniture item       |
| PUT    | /api/furniture/:id | Admin  | Update furniture item    |
| DELETE | /api/furniture/:id | Admin  | Deactivate item          |

---

## UI Theme

The interface uses a strict black and white design system:

- Background: `#080808` — `#0d0d0d`
- Surfaces: `#141414` — `#222222`
- Primary action: white background, black text
- Destructive action (delete): red (`#ef4444`)
- All accent/gold colours have been removed in favour of pure white highlights
- 3D scene: dark concrete floor, near-black walls, white selection wireframe

---

## AR Compatibility

WebXR immersive-ar requires:

- Android: Chrome 81+ on an ARCore-compatible device
- iOS: Safari 15+ with WebXR viewer or a compatible third-party browser

AR is not available on desktop browsers. The AR viewer page will display a compatibility message on unsupported devices.

---

## AI Layout System

The AI suggestion engine (`server/services/aiService.js`) is rule-based, not a trained model. It uses zone-based placement logic with predefined configurations for six room styles: living, bedroom, office, dining, kitchen, and bathroom. Furniture is positioned relative to actual room dimensions and wall boundaries, with rotation set to face inward. The system avoids suggesting duplicate models within the same layout.

---

## Known Limitations

- GLB model files must be sourced and placed manually (not included in repo)
- AR hit-test accuracy depends on device sensor quality and lighting conditions
- The AI layout engine is deterministic and rule-based, not generative
- No multi-user collaboration or real-time sync

---

## License

MIT
