# Deployment Guide

This document covers deploying InteriorAR to production using Render (recommended for simplicity) and also outlines a manual VPS approach.

---

## Important Notes Before Deploying

- WebXR Augmented Reality requires HTTPS. AR will not work on plain HTTP.
- GLB model files and PNG thumbnails must be hosted separately or included in the deployment, as they are not tracked in the repository.
- Set all environment variables on your hosting platform before the first deploy.

---

## Option 1 — Render (Recommended)

Render offers free tiers for both web services and MongoDB-compatible databases and handles HTTPS automatically.

### Step 1 — Database

Create a free MongoDB Atlas cluster at [mongodb.com/atlas](https://www.mongodb.com/atlas) and copy the connection string. It will look like:

```
mongodb+srv://username:password@cluster.mongodb.net/ar-interior-designer
```

### Step 2 — Deploy the Backend

1. Push your project to a GitHub repository.
2. Go to [render.com](https://render.com) and create a new Web Service.
3. Connect your GitHub repository.
4. Set the following:
   - Root directory: `server`
   - Build command: `npm install`
   - Start command: `node server.js`
5. Add environment variables:

```
PORT=5000
MONGO_URI=your_mongodb_atlas_connection_string
JWT_SECRET=a_long_random_secret_string
JWT_EXPIRE=7d
NODE_ENV=production
CLIENT_URL=https://your-client-url.onrender.com
```

6. Deploy. Render will provide a URL like `https://ar-interior-designer-api.onrender.com`.

### Step 3 — Deploy the Frontend

1. In Render, create a new Static Site.
2. Connect the same repository.
3. Set the following:
   - Root directory: `client`
   - Build command: `npm install --legacy-peer-deps && npm run build`
   - Publish directory: `build`
4. Add environment variable:

```
REACT_APP_API_URL=https://ar-interior-designer-api.onrender.com
```

5. Update `client/src/utils/api.js` to use the environment variable as the base URL:

```js
const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || '/api',
});
```

6. Deploy.

### Step 4 — Upload Assets

Since GLB and PNG files are not in the repository, you have two options:

**Option A — Serve from the backend:**
Upload the `models/` and `thumbnails/` folders to your Render server using the Render shell, or include them in the repository using Git LFS.

**Option B — Use a CDN (recommended for production):**
Upload assets to Cloudflare R2, AWS S3, or any static file host. Update the `modelUrl` and `thumbnailUrl` fields in your seed data to use the full CDN URL:

```js
modelUrl: 'https://your-cdn.com/models/loungeSofa.glb',
thumbnailUrl: 'https://your-cdn.com/thumbnails/loungeSofa_NE.png',
```

Then re-run the seed script against your production database.

### Step 5 — Seed Production Database

Update your `server/.env` to point to the production MongoDB URI temporarily, then run:

```bash
node services/seedData.js
```

Restore your local `.env` afterward.

---

## Option 2 — VPS (Ubuntu)

Use this if you want full control over the server.

### Prerequisites

- Ubuntu 22.04 VPS (DigitalOcean, Hetzner, Linode, etc.)
- Domain name pointed to your server IP
- Node.js 18+, MongoDB, Nginx, Certbot installed

### Install Dependencies

```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs nginx certbot python3-certbot-nginx

# Install MongoDB
wget -qO - https://www.mongodb.org/static/pgp/server-7.0.asc | sudo apt-key add -
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/7.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-7.0.list
sudo apt-get update && sudo apt-get install -y mongodb-org
sudo systemctl start mongod && sudo systemctl enable mongod
```

### Clone and Configure

```bash
git clone https://github.com/yourname/ar-interior-designer.git /var/www/ar-interior-designer
cd /var/www/ar-interior-designer/server
npm install
cp .env.example .env
nano .env  # fill in your values
```

### Run with PM2

```bash
sudo npm install -g pm2
cd /var/www/ar-interior-designer/server
pm2 start server.js --name ar-interior-api
pm2 save
pm2 startup
```

### Build the Frontend

```bash
cd /var/www/ar-interior-designer/client
npm install --legacy-peer-deps
npm run build
```

### Configure Nginx

Create `/etc/nginx/sites-available/ar-interior-designer`:

```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;

    # Serve React frontend
    location / {
        root /var/www/ar-interior-designer/client/build;
        index index.html;
        try_files $uri $uri/ /index.html;
    }

    # Proxy API to Express
    location /api/ {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # Serve 3D models and thumbnails
    location /models/ {
        alias /var/www/ar-interior-designer/client/public/models/;
    }

    location /thumbnails/ {
        alias /var/www/ar-interior-designer/client/public/thumbnails/;
    }
}
```

```bash
sudo ln -s /etc/nginx/sites-available/ar-interior-designer /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### Enable HTTPS (required for WebXR)

```bash
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

Certbot will automatically configure HTTPS and set up auto-renewal.

---

## Environment Variables Reference

| Variable     | Description                          | Example                              |
|--------------|--------------------------------------|--------------------------------------|
| PORT         | Express server port                  | 5000                                 |
| MONGO_URI    | MongoDB connection string            | mongodb://localhost:27017/ar-interior|
| JWT_SECRET   | Secret key for signing JWT tokens    | a_long_random_string_here            |
| JWT_EXPIRE   | JWT token expiry duration            | 7d                                   |
| NODE_ENV     | Environment mode                     | production                           |
| CLIENT_URL   | Frontend URL for CORS                | https://yourdomain.com               |

---

## Post-Deployment Checklist

- HTTPS is active and AR works on a mobile device
- Seed script has been run against the production database
- All environment variables are set correctly
- 3D model and thumbnail assets are accessible via their URLs
- `/api/health` returns `{ "status": "OK" }`
