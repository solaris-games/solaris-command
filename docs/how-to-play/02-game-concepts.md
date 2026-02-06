# Game Concepts: Time

Solaris: Command operates on a persistent clock divided into two distinct rhythms. This structure balances real-time tension with long-term strategic planning. You don't need to be online 24/7, but you do need to plan your day.

## The Tick
The **Tick** is the heartbeat of the game.
*   **Frequency:** Every hour by default.
*   **What Happens:** The server resolves all pending fleet movements, calculates combat results, and updates the map state.
*   **Player Action:** You schedule your moves and attacks to happen on future ticks.

> **Strategy Tip:** Since all movement happens at the same time, you can predict exactly when an enemy fleet will arrive. Use this to set up ambushes!

## The Cycle (Daily)
The **Cycle** is a 20-tick milestone.
*   **Frequency:** Every 20 hours by default.
*   **What Happens:** The "Logistics Phase".
    *   **Resupply:** Units trace supply lines to recover.
    *   **Refill:** Action Points (AP) and Movement Points (MP) are fully restored.
    *   **Economy:** You earn **Prestige** based on the planets you control.
    *   **Score:** Victory Points (VPs) are calculated.

> **Strategy Tip:** The end of a Cycle is a critical moment. Ensure your units are in a safe position and within supply range before the Cycle ticks over, or they won't recover their MP for the next day.
