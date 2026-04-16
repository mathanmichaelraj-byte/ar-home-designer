# InteriorAR — AI-Powered AR Interior Designer

> Design rooms in 2D, visualise them in 3D, and see furniture placed in your real space via Augmented Reality — all in the browser.

[![Deploy](https://img.shields.io/badge/deploy-vercel-black?logo=vercel)](https://vercel.com)
[![Node](https://img.shields.io/badge/node-%3E%3D18-brightgreen)](https://nodejs.org)
[![License](https://img.shields.io/badge/license-MIT-blue)](LICENSE)

---

## ✨ Features

| Feature | Description |
|---|---|
| **2D Floor Plan** | Smooth canvas-based room layout editor. Drag, resize and snap rooms to grid with no lag. |
| **Per-Floor Design** | Switch to Floor Plan view to design Ground Floor, 1st Floor etc. individually — with wall indicators, door arcs and area totals. |
| **3D House View** | React Three Fiber 3D model of the entire house. All floors stacked with interactive room boxes — click, orbit and zoom. |
| **3D Room Editor** | Furniture placement in a realistic 3D room (warm wood floor, cream walls). Move / Rotate / Scale with gizmos via W / E / R keys. One-click delete on any selected model. |
| **AR Preview** | WebXR-based Augmented Reality — point your phone camera and see furniture anchored to real surfaces. |
| **Furniture Library** | 70+ GLB 3D models (sofas, beds, lights, plants…) with PNG thumbnails, category filters and live search. |
| **AI Room Suggestions** | AI-generated furniture layouts based on room type and dimensions. |
| **Auto-Save** | Debounced background saving — no lost work. |
| **Multi-Floor Houses** | Create houses with rooms on Ground / 1st / 2nd / 3rd floor. |
| **JWT Auth** | Secure registration, login and protected routes. |

---

## 🏗️ Architecture

```
ar_home_designer/
├── client/                  # React frontend
│   ├── public/
│   │   ├── models/          # 70+ GLB furniture models
│   │   └── thumbnails/      # PNG thumbnails for sidebar
│   └── src/
│       ├── components/
│       │   ├── FloorPlan.jsx       # 2D all-floors overview (smooth drag via RAF)
│       │   ├── FloorDesign2D.jsx   # Per-floor detailed design canvas
│       │   ├── FloorPlan3D.jsx     # 3D multi-floor house view (R3F)
│       │   ├── FurniturePanel.jsx  # Furniture catalog sidebar
│       │   ├── Navbar.jsx
│       │   └── ProjectCard.jsx
│       ├── context/
│       │   ├── AuthContext.jsx
│       │   ├── ProjectContext.jsx
│       │   └── HouseContext.jsx
│       ├── hooks/
│       │   ├── useAutoSave.js
│       │   └── useFurniture.js
│       ├── pages/
│       │   ├── HomePage.jsx
│       │   ├── LoginPage.jsx
│       │   ├── RegisterPage.jsx
│       │   ├── DashboardPage.jsx
│       │   ├── HouseDashboardPage.jsx
│       │   ├── HouseDesignerPage.jsx   # 4-mode designer: overview/floor/3d-house/3d-room
│       │   ├── DesignerPage.jsx
│       │   ├── ARViewerPage.jsx
│       │   └── ProfilePage.jsx
│       ├── three/
│       │   └── SceneViewer.jsx     # R3F 3D scene + TransformControls + delete button
│       └── utils/
│           ├── api.js
│           ├── constants.js
│           └── helpers.js
│
├── server/                  # Node.js / Express backend
│   ├── models/
│   │   ├── User.js
│   │   ├── Project.js
│   │   ├── House.js
│   │   └── Furniture.js
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── projectController.js
│   │   ├── houseController.js
│   │   └── furnitureController.js
│   ├── routes/
│   │   ├── auth.js
│   │   ├── projects.js
│   │   ├── houses.js
│   │   └── furniture.js
│   ├── middleware/
│   │   ├── auth.js          # JWT verification
│   │   └── errorHandler.js
│   ├── services/
│   │   ├── jwtService.js
│   │   ├── aiService.js
│   │   └── seedData.js
│   └── server.js
│
├── docker-compose.yml
├── nginx.conf
└── README.md
```

---

## 🖥️ House Designer — View Modes

The House Designer has **4 view modes** switchable from the toolbar:

### 1. Overview (2D)
Top-down 2D canvas showing **all rooms across all floors**. Each room is colour-coded by type and has a floor badge (`F1`, `F2`, etc.). Use the floor filter tabs to isolate a single floor.

**Smooth drag fix:** room dragging now uses `useRef` + `requestAnimationFrame` so the canvas redraws at 60fps without any React re-renders. The server API call fires only on `mouseup` — not on every pixel of movement.

### 2. Floor Plan (per-floor)
Dedicated 2D design canvas for **one floor at a time**. Select floors via `F1 / F2 / F3 / F4` tabs in the toolbar. Features:
- Wall thickness indicator (inner border on each room)
- Door arc indicator on the bottom edge of each room
- Proximity connector lines between adjacent rooms
- Floor area total in bottom-right
- Grid toggle
- "+ Room" shortcut button pre-set to the active floor

### 3. 3D House
React Three Fiber 3D view of the **entire house** — all floors stacked at 3.5m intervals. Each room is an interactive coloured box. Click to select, double-click to jump to 3D Room editor. Full orbit / zoom / pan.

### 4. Edit Room (3D)
Full 3D room editor for the **selected room**:
- Realistic warm colours (cream walls, oak floor, off-white ceiling)
- `Environment preset="apartment"` for reflections
- Furniture gizmos: **W** = Move, **E** = Rotate, **R** = Scale
- **Click any furniture → red Delete button appears** above the model
- **Del / Backspace** keyboard shortcut to delete selected model
- Delete also available in the toolbar

---

## 🚀 Getting Started

### Prerequisites
- Node.js ≥ 18
- MongoDB (local or Atlas)
- npm ≥ 9

### 1. Clone
```bash
git clone https://github.com/mathanmichaelraj-byte/ar-home-designer.git
cd ar-home-designer
```

### 2. Server setup
```bash
cd server
cp .env.example .env
# Edit .env — set MONGO_URI, JWT_SECRET
npm install
npm run dev
```

### 3. Client setup
```bash
cd client
cp .env.example .env
# Edit .env — set REACT_APP_API_URL
npm install
npm start
```

### 4. Seed furniture data
```bash
cd server
npm run seed
```

---

## 🐳 Docker (Production)

```bash
# Build and start all services
docker compose up --build -d

# Client served by Nginx on port 80
# API on port 5000
# MongoDB on port 27017
```

---

## 🔐 Environment Variables

### Server (`server/.env`)
```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/ar_home_designer
JWT_SECRET=your_secret_key_min_32_chars
JWT_EXPIRES_IN=7d
NODE_ENV=production
CLIENT_URL=https://yourdomain.com
OPENAI_API_KEY=sk-...        # For AI room suggestions
```

### Client (`client/.env`)
```env
REACT_APP_API_URL=http://localhost:5000/api
REACT_APP_ENV=development
```

---

## 📡 API Reference

### Auth
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/auth/register` | Create account |
| POST | `/api/auth/login` | Login, returns JWT |
| GET | `/api/auth/me` | Get current user |
| PUT | `/api/auth/me` | Update profile |

### Projects (rooms)
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/projects` | List user's projects |
| POST | `/api/projects` | Create project |
| GET | `/api/projects/:id` | Get project |
| PUT | `/api/projects/:id` | Update project |
| DELETE | `/api/projects/:id` | Delete project |
| POST | `/api/projects/:id/suggest` | AI layout suggestion |

### Houses
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/houses` | List user's houses |
| POST | `/api/houses` | Create house |
| GET | `/api/houses/:id` | Get house with rooms |
| PUT | `/api/houses/:id` | Update house |
| DELETE | `/api/houses/:id` | Delete house |
| POST | `/api/houses/:id/rooms` | Add room to house |
| PUT | `/api/houses/:id/rooms/:roomId` | Update room |
| DELETE | `/api/houses/:id/rooms/:roomId` | Delete room |

### Furniture
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/furniture` | List furniture (supports `?type=` `&search=`) |
| GET | `/api/furniture/:id` | Get single item |

---

## 🛠️ Tech Stack

### Frontend
- **React 18** — UI framework
- **React Three Fiber** — 3D rendering (Three.js wrapper)
- **@react-three/drei** — OrbitControls, TransformControls, Html, Environment
- **Tailwind CSS** — Styling
- **React Router v6** — Client-side routing
- **Axios** — HTTP client

### Backend
- **Node.js + Express** — REST API
- **MongoDB + Mongoose** — Database
- **JWT** — Authentication
- **bcryptjs** — Password hashing
- **OpenAI API** — AI room suggestions

### DevOps
- **Docker + Docker Compose** — Containerisation
- **Nginx** — Static file serving + SPA routing
- **Vercel** — Frontend hosting

---

## 🎨 Design System

The UI uses a **black-and-white base** with a **warm gold accent** (`#e8d5b7`):

| Token | Value | Usage |
|---|---|---|
| `gray-950` | `#0d0d0d` | Main background |
| `gray-900` | `#141414` | Cards, sidebars |
| `gray-800` | `#222` | Borders |
| `accent` | `#e8d5b7` | Selection, highlights |
| `white` | `#fff` | Primary buttons, active states |

Typography: **Inter** (UI) · **Playfair Display** (headings) · **JetBrains Mono** (code/labels)

---

## 🔧 Performance Notes

- **Smooth drag**: `FloorPlan.jsx` and `FloorDesign2D.jsx` use `useRef` for drag state + `requestAnimationFrame` for canvas redraws. Zero React re-renders occur during a drag. `onUpdateRoom` (API call) fires once on `mouseup`.
- **GLB models**: Loaded with `useGLTF` (cached) and `scene.clone()` per instance.
- **Auto-save**: Debounced 1.5s — only fires when data actually changes.
- **Canvas size**: Tracked with `ResizeObserver` (not `window.resize`) for accurate pixel dimensions.

---

## 📱 AR Requirements

- HTTPS required (WebXR spec)
- Android Chrome 81+ or iOS Safari 15+ with WebXR viewer
- Hit-testing API support for surface detection

---

## 🤝 Contributing

1. Fork the repo
2. Create a feature branch (`git checkout -b feature/xyz`)
3. Commit (`git commit -m 'Add xyz'`)
4. Push (`git push origin feature/xyz`)
5. Open a Pull Request

---

## 📄 License

MIT © 2025 InteriorAR
