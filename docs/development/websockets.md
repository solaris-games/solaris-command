# WebSocket Documentation

## Overview

The Solaris Command server uses **Socket.IO** to provide real-time updates to clients. This allows players to receive game events (like other players joining, units moving, battles occurring) without needing to poll the API.

The WebSocket server runs on the same port as the HTTP API (default: 3000) and shares the same origin policy.

## Authentication

WebSocket connections are authenticated using the same **JWT (JSON Web Token)** as the REST API. You must pass the token during the connection handshake.

The token can be passed in two ways:
1. **Auth Object**: `{ auth: { token: "YOUR_JWT" } }` (Recommended)
2. **Query Param**: `?token=YOUR_JWT`

## Rooms & Channels

Socket.IO uses "rooms" to broadcast messages to specific subsets of clients.

| Room Name | Description | Subscription |
| :--- | :--- | :--- |
| `user:{userId}` | Private channel for a specific user. | Joined automatically upon connection based on JWT. |
| `game:{gameId}` | Channel for a specific game instance. | Client must explicitly emit `JOIN_GAME` event. |

## Client Integration Guide

### 1. Install Client Library

You need the `socket.io-client` library.

```bash
npm install socket.io-client
```

### 2. Connect & Authenticate

Initialize the socket connection with your JWT.

```javascript
import { io } from "socket.io-client";

const socket = io("http://localhost:3000", {
  auth: {
    token: "YOUR_ACCESS_TOKEN" // Obtained from login
  },
  // OR
  // query: { token: "YOUR_ACCESS_TOKEN" }
});

socket.on("connect", () => {
  console.log("Connected to WebSocket:", socket.id);
});

socket.on("connect_error", (err) => {
  console.error("Connection Error:", err.message);
});
```

### 3. Join a Game Room

To receive updates for a specific game, you must emit the `JOIN_GAME` event with the Game ID.

```javascript
const gameId = "65abcdef1234567890abcdef";

// Join the game room
socket.emit("JOIN_GAME", gameId);

// Listen for confirmation
socket.on("GAME_JOINED", (data) => {
  console.log(`Joined game room: ${data.gameId}`);
});
```

### 4. Listen for Events

The server publishes events using standard event names. Currently supported events include:

*   `PLAYER_JOINED`: When a new player joins the lobby.
*   `GAME_STARTING`: When the game lobby fills up and the countdown starts.

```javascript
// Example: Listening for a player join event
socket.on("PLAYER_JOINED", (eventData) => {
  console.log("A new player has joined!", eventData);
  // Update UI logic here...
});

socket.on("GAME_STARTING", (eventData) => {
  console.log("Game started!", eventData);
});
```

## Complete Example (HTML/JS)

Here is a standalone example you can run in a browser (served via a simple HTTP server) or verify via Node.js.

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Solaris WebSocket Test</title>
    <!-- Load Socket.IO Client from CDN -->
    <script src="https://cdn.socket.io/4.7.4/socket.io.min.js"></script>
    <style>
        body { font-family: sans-serif; padding: 20px; }
        .box { border: 1px solid #ccc; padding: 15px; margin-bottom: 20px; border-radius: 5px; }
        #logs { background: #f4f4f4; height: 300px; overflow-y: scroll; padding: 10px; border: 1px solid #999; }
        .log-entry { margin-bottom: 5px; border-bottom: 1px solid #ddd; padding-bottom: 2px; }
    </style>
</head>
<body>
    <h1>Solaris WebSocket Test Client</h1>

    <div class="box">
        <h3>1. Authentication</h3>
        <label>JWT Token:</label>
        <input type="text" id="tokenInput" placeholder="Paste your JWT here" style="width: 100%;">
        <button onclick="connectSocket()">Connect</button>
    </div>

    <div class="box">
        <h3>2. Game Room</h3>
        <label>Game ID:</label>
        <input type="text" id="gameIdInput" placeholder="Game ID">
        <button onclick="joinGame()">Join Game Room</button>
        <button onclick="leaveGame()">Leave Game Room</button>
    </div>

    <div class="box">
        <h3>Logs</h3>
        <div id="logs"></div>
    </div>

    <script>
        let socket;

        function log(message, data = null) {
            const logsDiv = document.getElementById('logs');
            const entry = document.createElement('div');
            entry.className = 'log-entry';

            let text = `[${new Date().toLocaleTimeString()}] ${message}`;
            if (data) {
                text += ` <pre>${JSON.stringify(data, null, 2)}</pre>`;
            }

            entry.innerHTML = text;
            logsDiv.appendChild(entry);
            logsDiv.scrollTop = logsDiv.scrollHeight;
            console.log(message, data);
        }

        function connectSocket() {
            const token = document.getElementById('tokenInput').value;
            if (!token) return alert("Please enter a token");

            if (socket) {
                socket.disconnect();
            }

            // Connect to localhost:3000
            socket = io("http://localhost:3000", {
                auth: { token: token }
            });

            socket.on("connect", () => {
                log("Connected! Socket ID: " + socket.id);
            });

            socket.on("connect_error", (err) => {
                log("Connection Error: " + err.message);
            });

            socket.on("GAME_JOINED", (data) => {
                log("Joined Game Room:", data);
            });

            // Listen for specific game events
            socket.on("PLAYER_JOINED", (data) => {
                log("EVENT: PLAYER_JOINED", data);
            });

            socket.on("GAME_STARTING", (data) => {
                log("EVENT: GAME_STARTING", data);
            });
        }

        function joinGame() {
            if (!socket || !socket.connected) return alert("Connect first!");
            const gameId = document.getElementById('gameIdInput').value;
            if (!gameId) return alert("Enter Game ID");

            log("Requesting to join game: " + gameId);
            socket.emit("JOIN_GAME", gameId);
        }

        function leaveGame() {
            if (!socket || !socket.connected) return alert("Connect first!");
            const gameId = document.getElementById('gameIdInput').value;
             if (!gameId) return alert("Enter Game ID");

             log("Requesting to leave game: " + gameId);
             socket.emit("LEAVE_GAME", gameId);
        }
    </script>
</body>
</html>
```
