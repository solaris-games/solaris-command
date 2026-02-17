# Supply

Supply is the lifeline of your fleet. Without it, your ships are just drifting metal coffins.

## The Network
Supply propagates outwards like a web:
1.  **Source:** Capital Planet (The root).
2.  **Relay:** Friendly Planets or Stations.
3.  **Consumer:** Your Unit.

**Capital Planets** have a supply range of `6` MP. **Planets** and **Stations** have a supply range of `4` MP. Units must be within MP range of a Source or Relay to be "In Supply".

_Note: The **Planet** or **Station** determines the supply range, **not** the unit's MP._

## Out of Supply (OOS)
If a unit cannot trace a path to a supply source during the daily Cycle check, it is **Out of Supply**. The penalties get worse every day (Cycle) it remains cut off.

| Duration | Penalty |
| :--- | :--- |
| **1 Cycle** | **Disruption:** Cannot recover suppressed steps. **Max MP is halved.** |
| **2 Cycles** | **Starvation:** Unit has **0 AP** (Cannot attack). **2 Steps** are Suppressed immediately. |
| **3 Cycles** | **Crippled:** **0 AP**. All remaining steps are Suppressed. The unit is useless. |
| **4+ Cycles** | **Collapse:** All above effects. Plus **3 Steps are Destroyed** per cycle. The fleet dissolves.

## Recovery
Once a connection is re-established, units recover slowly. You only recover **2 Suppressed Steps** per Cycle.

> **Strategy Tip: The Siege**
> You don't always need to destroy the enemy fleet in combat. If you can flank them and destroy their supply Station, they will be cut off. In 2 days (Cycles), they will be unable to attack. In 3 days, they will be defenseless. Encirclement is often more effective than brute force.
