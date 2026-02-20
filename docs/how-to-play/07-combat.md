# Combat

Combat is deterministic, relying on preparation, positioning, and coordination rather than random dice rolls alone.

## Constraints
*   **1-Stack Limit:** Only one unit may occupy a hex at a time.
*   **The AP Economy:** Units receive **1 Action Point (AP) per Cycle**. A unit can effectively initiate only **one** offensive action per cycle. Choose your battles wisely.

## The Combat Sequence
1.  **Declaration:** Attacker targets an adjacent enemy and spends **1 AP**.
    *   *Option:* Toggle **"Advance on Victory"** to chase the enemy if they retreat.
2.  **Preparation:** The attacking unit enters a `PREPARING` state. The attack is scheduled.
3.  **Resolution:** Combat resolves at the end of the tick.
    *   Hits are calculated.
    *   Suppression is applied.
4.  **Advance on Victory (Blitz):**
    *   If the Defender is destroyed or retreats...
    *   AND the Attacker has `Advance on Victory` enabled...
    *   AND the Attacker has enough MP...
    *   The Attacker **instantly moves** into the captured hex.
5.  **Regrouping:** Units enter a cooldown state.
    * Note that attacks resulting in overruns will not cause the attacker to regroup after combat.

## Attack Methods
You can choose how to attack:

*   **Standard Attack:** Full engagement. Both sides deal damage.
*   **Feint Attack:** A limited probe. **Suppresses 1 step from both sides**.
    *   *Use:* Good for weak units attacking strong targets to soften them up.
*   **Suppressive Fire:** Artillery bombardment. **Suppresses 2 steps** from the enemy.
    *   *Requirement:* Requires an **Artillery** specialist step.

## Combat Shifts
Combat is modified by "Shifts" (moving the results up or down a table).
*   **Shock Shift:** Heavy units take deal more damage to light units.
*   **Terrain Shift:** Defenders in Asteroids/Debris are harder to hit.

## The Interloper Rule (Collision Override)
Combat resolves *before* movement.
If Attacker A attacks Defender B, and captures the hex, Attacker A moves in immediately.
If a third unit (Neutral C) was trying to move into that same hex on the same tick, they will find it occupied by Attacker A. Neutral C will suffer a **Collision** (Bounce, Damage, MP loss).

> **Strategy Tip:** Timing is everything. Coordinate your attacks to clear a path, then have a fast reserve fleet move through the gap shortly afterwards (note that combat occurs **before** movement).
