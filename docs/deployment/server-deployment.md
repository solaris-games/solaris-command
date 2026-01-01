# Deployment Guide

This guide describes how to deploy the Solaris Command Server to a VPS (Virtual Private Server).

## Prerequisites

- **Server**: A VPS (e.g., DigitalOcean Droplet) running Ubuntu (LTS recommended).
- **Domain**: `command.solaris.games` (client) and `command-api.solaris.games` (server) pointing to the VPS IP.
- **Node.js**: Node.js LTS (v20+ recommended) installed on the VPS.
- **PM2**: Process manager for Node.js (`npm install -g pm2`).
- **Nginx**: Web server for reverse proxying.
- **MongoDB**: Access to a MongoDB cluster (Replication Set enabled) with connection details.

## Environment Variables

The application requires the following environment variables. Create a `.env` file in the server root or configure them in your deployment pipeline.

| Variable | Description | Example |
|----------|-------------|---------|
| `PORT` | The port the server runs on | `3000` |
| `MONGO_URI` | Connection string for MongoDB | `mongodb://user:pass@host:27017/solaris-command` |
| `GOOGLE_CLIENT_ID` | Google OAuth Client ID | `your-client-id.apps.googleusercontent.com` |
| `JWT_SECRET` | Secret key for signing sessions | `secure-random-string` |
| `ENABLE_DEV_AUTH` | Enable bypass for dev (False for Prod) | `false` |
| `GAME_LOOP_SCHEDULE` | Cron schedule for game ticks | `*/10 * * * * *` |
| `CREATE_GAME_SCHEDULE` | Cron schedule for new games | `* * * * *` |

### Database Connection
The application connects to a MongoDB database named `solaris-command`.
If you are using an existing cluster, construct your URI as follows:
```
mongodb://<username>:<password>@<host>:<port>/solaris-command?authSource=admin
```
Ensure the user has read/write access to the `solaris-command` database.

## Build Instructions

Since the repository is a monorepo, the build process bundles the shared core logic into the server artifact.

### Option A: Build Locally and Upload
1.  **Install Dependencies**:
    ```bash
    npm install
    ```
2.  **Build Server**:
    ```bash
    npm run build --workspace=server
    ```
3.  **Upload**: Copy `server/dist/index.mjs` and `server/package.json` to your VPS (e.g., `/var/www/solaris-command`).

### Option B: Build on Server (Recommended)
1.  **Clone Repository**:
    ```bash
    git clone <repo-url> /var/www/solaris-command-repo
    cd /var/www/solaris-command-repo
    ```
2.  **Install & Build**:
    ```bash
    npm install
    npm run build --workspace=server
    ```
3.  **Prepare Deployment**:
    Create a deployment folder (e.g., `/var/www/solaris-command-server`) and copy the artifact.
    ```bash
    mkdir -p /var/www/solaris-command-server
    cp server/dist/index.mjs /var/www/solaris-command-server/
    cp server/package.json /var/www/solaris-command-server/
    ```

## Installation & Running

1.  **Navigate to Deployment Folder**:
    ```bash
    cd /var/www/solaris-command-server
    ```

2.  **Install Production Dependencies**:
    ```bash
    npm install --omit=dev
    ```

3.  **Configure Environment**:
    Create a `.env` file with your secrets.
    ```bash
    nano .env
    ```

4.  **Start with PM2**:
    ```bash
    pm2 start index.mjs --name "solaris-command-server"
    pm2 save
    pm2 startup
    ```

## Nginx Configuration

Configure Nginx to proxy requests to the API and serve the Client (placeholder).

Create a config file: `/etc/nginx/sites-available/solaris-command`

```nginx
# Server (API)
server {
    listen 80;
    server_name command-api.solaris.games;

    location / {
        proxy_pass http://localhost:3000; # Matches PORT env var
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;

        # Real IP headers
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}

# Client (Frontend Placeholder)
server {
    listen 80;
    server_name command.solaris.games;

    root /var/www/solaris-client/dist; # Adjust path to client build
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

Enable the site and restart Nginx:
```bash
ln -s /etc/nginx/sites-available/solaris-command /etc/nginx/sites-enabled/
nginx -t
systemctl restart nginx
```

**Note**: Use Certbot to enable HTTPS:
```bash
certbot --nginx -d command.solaris.games -d command-api.solaris.games
```
