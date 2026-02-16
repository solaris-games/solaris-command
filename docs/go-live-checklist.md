# Go Live Checklist

This document outlines the steps required to deploy Solaris Command to production.
The architecture consists of:
- **Server (API)**: Hosted on a DigitalOcean VPS (`command-api.solaris.games`).
- **Client (Frontend)**: Hosted on DigitalOcean Apps (`command.solaris.games`).
- **Database**: DigitalOcean MongoDB Cluster.

## Phase 1: Pre-Deployment Configuration

### 1. DNS Configuration
Configure the following DNS records in your domain registrar (e.g., Namecheap, Cloudflare, or DO Networking).

| Type | Name | Content | Notes |
|------|------|---------|-------|
| A | `command-api` | `<VPS_IP_ADDRESS>` | Points to the Server VPS |
| CNAME | `command` | *<app-name>.ondigitalocean.app* | Points to Client App |
| CNAME | `www` | `command.solaris.games` | (Optional) Alias |

### 2. Database Verification
- Ensure the MongoDB connection string includes the correct credentials.
- Verify the cluster is configured as a **Replica Set** (required for transactions).
  - Connection string usually contains `replicaSet=rs0` or similar.

### 3. Secrets Preparation
Ensure you have the following secrets ready:
- `GOOGLE_CLIENT_ID`: From Google Cloud Console.
- `DISCORD_CLIENT_ID`: From Discord Developer Console.
- `DISCORD_CLIENT_SECRET`: From Discord Developer Console.
- `DISCORD_REDIRECT_URI`: From Discord Developer Console.
- `JWT_SECRET`: A strong random string.
- `MONGO_URI`: Full connection string.

## Phase 2: Server Deployment (VPS)

Follow the detailed guide at: `docs/deployment/server-deployment.md`.

**Critical Checklist:**
- [ ] VPS is provisioned and secured (SSH keys, Firewall).
- [ ] Node.js and PM2 are installed.
- [ ] Repo is cloned and dependencies installed.
- [ ] Environment Variables (`.env`) are set:
    - `ENABLE_DEV_AUTH=false` (CRITICAL)
    - `MONGO_URI` is correct.
- [ ] Application started with PM2.
- [ ] Nginx configured as Reverse Proxy.
- [ ] **SSL Enabled**: Run `certbot --nginx -d command-api.solaris.games`.

**Verification:**
- Visit `https://command-api.solaris.games/status`.
- Expect: `{"status": "Solaris: Command Server Online"}`.

## Phase 3: Client Deployment (DigitalOcean Apps)

Deploy the `client-prototype` workspace as a Static Site on DigitalOcean App Platform.

### 1. Create App
- **Source**: GitHub Repository (`solaris-command-monorepo`).
- **Branch**: `main` (or release branch).
- **Source Directory**: `/` (Root).

### 2. Configuration (Build Settings)
DigitalOcean Apps detects Node.js. Configure the **Build Phase** carefully for the monorepo.

- **Type**: Static Site
- **Build Command**:
  ```bash
  npm install && npm run build --workspace=client-prototype
  ```
- **Output Directory**:
  ```text
  client-prototype/dist
  ```

### 3. Environment Variables
Add the following App-level environment variables:

| Variable | Value | Description |
|----------|-------|-------------|
| `VITE_API_URL` | `https://command-api.solaris.games` | Points to the live API |

### 4. Custom Domain
- Add domain `command.solaris.games` in the App settings.
- Follow DigitalOcean instructions to update DNS (usually CNAME to the app's default subdomain, e.g., `solaris-123.ondigitalocean.app`).

## Phase 4: Final Verification

1.  **Frontend Load**: Open `https://command.solaris.games`.
    - Check browser console for errors.
2.  **Authentication**: Click "Login with Google".
    - Ensure pop-up opens and redirects correctly.
    - Check network tab for call to `/api/v1/auth/google`.
3.  **Real-time Connection**:
    - Ensure no WebSocket connection errors in console.
    - Verify "Connected" state in UI (if visible).
4.  **Gameplay**:
    - Enter a game and verify unit movement syncs.
