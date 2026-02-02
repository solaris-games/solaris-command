# Movement

Movement in Solaris is simultaneous but resolved sequentially every Tick (hour).

## Core Rules

### Movement Points (MP)
MP is the fuel tank of your unit.
*   MP refreshes fully at the start of every **Cycle**.
*   Different unit classes have different MP pools (Frigates go far; Dreadnaughts do not).

### The Speed Limit
Regardless of how much MP a unit has, **all units physically move at a speed of 1 Hex per Tick.**
*   A Frigate with 20 MP doesn't move 20 hexes in one hour. It moves 1 hex per hour, for 20 hours.
*   A Dreadnaught with 8 MP moves 1 hex per hour, for 8 hours, then must stop.

## Tactical Movement

### Zone of Control (ZOC)
Most units exert a **Zone of Control** into all 6 adjacent hexes.
*   **Effect:** Moving into a hex that is in an enemy's ZOC costs **Double MP**.
*   **Tactics:** You can use ZOC to slow down enemy advances or screen your valuable planets.

### Capturing Territory
Moving a unit into a hex owned by an enemy captures it. If you surround an area, you may flip ownership of adjacent hexes automatically.

## Movement Collisions (The Crash Rule)
What happens if two fleets try to enter the same hex at the same time? A **Collision**.

*   **Who:** Applies to ALL units (Enemy vs Enemy, or even Ally vs Ally).
*   **Resolution:** The unit with the better **Initiative** (usually lighter/faster ships) wins the hex.
*   **The Loser:** The other unit "bounces". It:
    1.  Stays in its current hex.
    2.  Expends the MP it tried to use.
    3.  Suffers **1 Step Suppression** (damage from emergency braking/confusion).

> **Strategy Tip:** This is a vital mechanic. If you know a massive enemy Battleship is moving to a specific hex at 14:00, you can rush a cheap Corvette into that hex at 14:00. If your Corvette has higher initiative, it will take the hex, and the Battleship will bounce, take damage, and waste its movement!
