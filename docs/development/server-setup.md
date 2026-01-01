# Server Setup Guide

This guide explains how to set up the Solaris Command Server for local development.

## Prerequisites

1.  **Node.js**: LTS version (v20+ recommended).
2.  **MongoDB**: You must have MongoDB installed and running locally.
    *   **Important**: The server uses MongoDB Transactions, which requires the database to be running as a **Replica Set**.
    *   **Setup**:
        1.  Edit your `mongod.conf` to include:
            ```yaml
            replication:
              replSetName: "rs0"
            ```
        2.  Restart the MongoDB service.
        3.  Enter the MongoDB shell (`mongosh`) and run:
            ```javascript
            rs.initiate()
            ```
    *   **Docker Setup**:
        1.  If you want to set up mongo in docker you can by adding the following to the end of your docker command `--replSetName rs0` here is a full example of what that would look like
            ```
            docker run --name mongo-replica -d -p 27017:27017 mongo --replSetName rs0
            ```
        2. Enter the MongoDB shell (`mongosh`) and run:
            ```javascript
            rs.initiate()
            cfg = rs.conf()
            cfg.members[0].host = '127.0.0.1:27017'
            rs.reconfig(cfg)
            ```

## Installation

Run the following command from the root of the repository to install dependencies for all workspaces:

```bash
npm install
```

## Configuration

1.  Navigate to the `server/` directory:
    ```bash
    cd server
    ```
2.  Copy the example environment file:
    ```bash
    cp .env.example .env
    ```
3.  Edit `.env` if necessary. Key variables for development:
    *   `ENABLE_DEV_AUTH=true`: **Crucial** for local development. It enables a bypass endpoint to create user accounts without Google OAuth.
    *   `MONGO_URI`: Defaults to `mongodb://localhost:27017/solaris-command`.
    *   `PORT`: Defaults to `3000`.

## Running the Server

From the repository root, run:

```bash
npm run dev:server
```

*   This starts the server in watch mode using `tsx`.
*   The server will be accessible at `http://localhost:3000`.

## Debugging

A VS Code launch configuration is included in `.vscode/launch.json`.
1.  Open the "Run and Debug" tab in VS Code.
2.  Select **"Launch Server"**.
3.  This allows you to set breakpoints in the server code (and `core` logic) and step through execution.

## Authentication & Creating Users

Since Google OAuth is difficult to set up locally without a real domain, use the Dev Auth bypass.

### Create a Test User
Send a `POST` request to `/api/v1/auth/dev`:

**Endpoint**: `POST http://localhost:3000/api/v1/auth/dev`
**Body**:
```json
{
  "email": "commander_shepard@dev.local",
  "username": "commander_shepard"
}
```

**Response**:
```json
{
  "user": {
    "_id": "...",
    "email": "commander_shepard@dev.local",
    "username": "commander_shepard",
    ...
  },
  "token": "eyJhbGciOiJIUzI1NiIs..."
}
```

*   **Token**: The response includes a JWT `token`. You must include this token in the `Authorization` header for subsequent requests.
    *   Header: `Authorization: Bearer <your_token>`

## API Overview

The API is RESTful and versioned.
*   **Base URL**: `/api/v1`
*   **Key Endpoints**:
    *   `GET /api/v1/games`: List active games.
    *   `GET /api/v1/games/:id`: Get game galaxy state.

**Note**: Use the `client-prototype` to visualize and interact with the API during development, or use tools like Postman/Insomnia.
