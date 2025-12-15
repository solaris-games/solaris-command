# Solaris Map Generator

A developer tool to create custom maps for Solaris: Command.

## Getting Started

1.  Run `npm install` from the repo root to install dependencies.
2.  Run `npm run dev:map-gen` from the repo root to start the development server.
3.  Open the URL (usually `http://localhost:5173`).

## Features

*   **Radius:** Adjust map size.
*   **Player Count:** Set the intended number of players (and required capitals).
*   **Terrain Painting:** Select a terrain type and click hexes to paint.
*   **Planet/Capital Placement:** Place planets. Note: Placing a planet will force the hex terrain to EMPTY.
*   **Export:** Click "Save" to output the map JSON to the browser console.

## Usage

1.  Set the desired radius and player count.
2.  Click "Generate Map" to create a blank grid.
3.  Paint terrain and place planets.
    *   Ensure you place exactly one Capital Planet for each player.
4.  Open the Developer Console (F12).
5.  Click "Save (Console Log)".
6.  Copy the JSON object from the console to use in the game source code.
