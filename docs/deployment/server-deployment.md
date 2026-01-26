# Server Deployment Guide (VPS)

This guide describes how to deploy the Solaris Command Server (API) to a VPS.

## Prerequisites

- **Server**: A VPS (e.g., DigitalOcean Droplet) running Ubuntu (LTS recommended).
- **Domain**: `command-api.solaris.games` pointing to the VPS IP.
- **Node.js**: Node.js LTS (v20+ recommended).
- **PM2**: Process manager (`npm install -g pm2`).
- **Nginx**: Web server for reverse proxying.
- **MongoDB**: Access to a MongoDB cluster (Replication Set enabled).

## Environment Variables

Create a `.env` file in the deployment directory.

| Variable | Description | Example |
|----------|-------------|---------|
| `PORT` | Server port | `3000` |
| `MONGO_URI` | MongoDB connection string | `mongodb://user:pass@host:27017/solaris-command` |
| `GOOGLE_CLIENT_ID` | Google OAuth Client ID | `...` |
| `JWT_SECRET` | Secret key for sessions | `...` |
| `ENABLE_DEV_AUTH` | **Set to false** for production | `false` |
| `GAME_LOOP_SCHEDULE` | Tick schedule | `*/10 * * * * *` |
| `CREATE_GAME_SCHEDULE` | Game creation schedule | `* * * * *` |

## Build & Install

The recommended approach is to clone and build on the server to ensure architecture compatibility.

1.  **Clone Repository**:
    ```bash
    git clone <repo-url> /var/www/solaris-command-repo
    cd /var/www/solaris-command-repo
    ```

2.  **Build Server**:
    ```bash
    npm install
    npm run build --workspace=server
    ```

3.  **Deploy Artifacts**:
    ```bash
    mkdir -p /var/www/solaris-command-server
    cp server/dist/index.mjs /var/www/solaris-command-server/
    cp server/package.json /var/www/solaris-command-server/
    ```

4.  **Install Production Dependencies**:
    ```bash
    cd /var/www/solaris-command-server
    npm install --omit=dev
    ```

5.  **Start Application**:
    ```bash
    pm2 start index.mjs --name "solaris-command-api"
    pm2 save
    pm2 startup
    ```

## Nginx Configuration

Configure Nginx to proxy requests to the API.

File: `/etc/nginx/sites-available/solaris-command-api`

```nginx
server {
    server_name command-api.solaris.games;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;

        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```

Enable site:
```bash
ln -s /etc/nginx/sites-available/solaris-command-api /etc/nginx/sites-enabled/
nginx -t
systemctl reload nginx
```

## SSL Setup

Secure the API with Certbot:

```bash
certbot --nginx -d command-api.solaris.games
```
