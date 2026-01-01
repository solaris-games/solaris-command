# Client Setup Guide

This repository contains multiple client applications.

## 1. Client Prototype (`client-prototype`)

This is the **primary development tool** for testing game mechanics and API interactions. It provides a raw, functional UI to visualize the game state and perform actions.

_Note: There is **a lot** of missing functionality in the prototype, prefer the real `client/` app over the prototype where possible._

### Setup & Run
1.  Ensure you have run `npm install` in the root directory.
2.  Start the prototype:
    ```bash
    npm run dev:proto
    ```
3.  Open your browser to the URL shown (usually `http://localhost:5173`).

### Usage
*   The prototype is pre-configured to talk to `http://localhost:3000`.
*   It often includes a "Debug" or "Dev" login button that utilizes the `POST /api/v1/auth/dev` endpoint automatically.

## 2. Map Generator (`client-map-generator`)

A specialized tool for creating and editing map data.

### Setup & Run
1.  Ensure you have run `npm install` in the root directory.
2.  Start the map generator:
    ```bash
    npm run dev:map-gen
    ```
3.  Open your browser to the URL shown.

## 3. Client (`client`)

*   **Status**: Planning Phase.
*   **Purpose**: This workspace is reserved for the future production-grade frontend application.
*   **Current State**: Empty.

Frontend developers will begin populating this workspace soon. It will likely follow a similar stack (Vue 3 + Vite) but with a focus on production UI/UX rather than raw debug functionality.
