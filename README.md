# InteriorAR

A full-stack web platform for designing rooms in 3D and previewing furniture placement in real space using Augmented Reality.

---

## Overview

InteriorAR solves a common problem in interior design: the inability to visualize how furniture will look and fit in a real space before purchasing. The platform provides a complete design workflow — from creating a room layout to placing furniture in a live AR environment — without requiring any specialized software or professional design knowledge.

---

## Features

- Room designer with configurable dimensions and wall color
- Furniture library with 70+ items across all room categories
- 3D viewport with drag-to-move furniture placement using TransformControls
- Augmented Reality preview via WebXR hit-test on supported devices
- AI-powered layout suggestions based on room style and dimensions
- Save, rename, and manage multiple design projects
- Share designs via public link

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
│       ├── components/            # Navbar, FurniturePanel, ProtectedRoute
│       ├── context/               # AuthContext, ProjectContext
│       ├── hooks/                 # useFurniture, useAutoSave
│       ├── pages/                 # Home, Dashboard, Designer, AR, Profile
│       ├── three/                 # SceneViewer (Three.js room + furniture)
│       └── utils/                 # Axios API client
│
├── server/                        # Express API
│   ├── controllers/               # Auth, Project, Furniture logic
│   ├── middleware/                # JWT auth guard, error handler
│   ├── models/                    # User, Project, Furniture schemas
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
git clone https://github.com/yourname/ar-interior-designer.git
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

## API Reference

### Authentication

| Method | Endpoint              | Access  | Description        |
|--------|-----------------------|---------|--------------------|
| POST   | /api/auth/register    | Public  | Register a user    |
| POST   | /api/auth/login       | Public  | Login              |
| GET    | /api/auth/me          | Private | Get current user   |
| PUT    | /api/auth/me          | Private | Update profile     |

### Projects

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

### Furniture

| Method | Endpoint           | Access | Description             |
|--------|--------------------|--------|-------------------------|
| GET    | /api/furniture     | Public | List furniture (filtered)|
| GET    | /api/furniture/:id | Public | Get single item         |
| POST   | /api/furniture     | Admin  | Add furniture item      |
| PUT    | /api/furniture/:id | Admin  | Update furniture item   |
| DELETE | /api/furniture/:id | Admin  | Deactivate item         |

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