# Project Overview

The Solaris Command repository is a Monorepo managed by NPM Workspaces. It contains the following packages:

## Workspaces

### Core (`@solaris-command/core`)
*   **Location**: `core/`
*   **Purpose**: Shared logic, TypeScript interfaces, and constants used by both the server and clients.
*   **Details**: This package includes game mechanics (like Fog of War logic), Zod schemas for validation, and data definitions (Units, Stations). It ensures that the frontend and backend share the exact same rules and types.
*   **Note**: This package is built and bundled into the consuming workspaces.

### Server (`@solaris-command/server`)
*   **Location**: `server/`
*   **Purpose**: The backend API and Game State manager.
*   **Tech Stack**: Node.js, Express, Socket.IO, MongoDB (Mongoose).
*   **Details**: Handles authentication, game loop processing, database persistence, and real-time updates via WebSockets.

### Client Prototype (`client-prototype`)
*   **Location**: `client-prototype/`
*   **Purpose**: A developer-focused frontend for testing game mechanics and API interactions.
*   **Tech Stack**: Vue 3, Vite, Konva.js.
*   **Details**: This is currently the primary tool for visualizing the game state and verifying backend changes.

### Client Map Generator (`client-map-generator`)
*   **Location**: `client-map-generator/`
*   **Purpose**: A specialized tool for creating and editing game maps.
*   **Tech Stack**: Vue 3, Vite, Konva.js.

### Client (`client`)
*   **Location**: `client/`
*   **Purpose**: The future production-grade frontend application.
*   **Status**: Currently empty / In early development.

## Directory Structure

```
/
├── core/                   # Shared library
├── server/                 # Backend application
├── client-prototype/       # Dev/Test frontend
├── client-map-generator/   # Map editor
├── client/                 # Production frontend (Planned)
├── docs/                   # Documentation
│   ├── development/        # Developer guides
│   ├── deployment/         # DevOps/Deployment guides
│   └── game-design/        # Game concepts & design docs
└── package.json            # Root workspace configuration
```
