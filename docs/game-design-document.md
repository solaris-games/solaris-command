# Game Design Document - Solaris: Command

**Version:** 0.3 (Draft)
**Status:** In Development
**Scope:** Core Gameplay Loops & Mechanics

---

## 1. Game Time Structure
Solaris operates on a persistent clock divided into two distinct rhythms. This structure balances real-time tension with long-term strategic planning.

* **The Tick (Hourly):** The heartbeat of the game. Every hour, the server resolves all pending fleet movements, calculates combat results, and updates the map state.
* **The Cycle (Daily):** A 24-hour milestone. At the start of a new cycle, the "Logistics Phase" occurs: units are resupplied, Action Points (AP) and Movement Points (MP) are restored, stations advance their construction states, victory points (VPs) and economic resources (Prestige) are calculated.

---

## 2. Game Objects
The universe consists of four primary entity types: **Units**, **Structures**, **Planets**, and the **Terrain** itself.

### A. Units (Fleets)
Units are the primary method of projecting power.
* **Step Mechanics:** A unit is not a single entity but a collection of "Steps" (representing HP and fleet size).
    * **Active Steps:** Operational ships contributing to Combat Value.
    * **Suppressed Steps:** Damaged/disorganized ships. They do not contribute to combat and must be recovered via Supply.
    * **Specialist Steps:** Rare, high-value steps (e.g., Artillery, Carriers) that provide unique bonuses to the unit stack.
* **Unit Classes:**
    * **Frigates:** High MP, low cost.
    * **Destroyers:** The backbone of the fleet. Balanced stats.
    * **Battleships:** Heavy armor, high firepower, low MP.
    * Any many more...

### B. Structures
Fixed assets that define territory and logistics.
* **Planets:** The economic engine. They generate **Prestige**.
    * *Capital Planets:* These serve as **Root Supply Sources**. They function indefinitely and cannot be besieged out of supply (though they can be captured).
    * Capturing an enemy *Capital Planet* is devastating, it could very well knock the opposing player out of the game.
* **Stations:** Deployable logistics hubs. They extend supply range from Planets to deep space.
    * *Pool Limit:* The number of deployable stations is capped by the number of Planets controlled.
    * When deployed, a station provides supply at the beginning of the following cycle.

### C. Terrain
The hex grid imposes strategic constraints via terrain types.
* **Empty Space:** Standard movement (1 MP) and combat.
* **Asteroid/Debris Fields:** High movement cost (2 MP). Provides **Defense Shifts** in combat (beneficial for smaller ships).
* **Nebulas/Gas Clouds/Industrial Zones:** Very high movement cost (3 MP). Dangerous for supply lines (units may struggle to trace supply through them).
* **Gravity Wells/Radiation Storms:** Impassable.

---

## 3. The Movement Engine
Movement is simultaneous but resolved sequentially per Tick.

### Core Rules
* **Movement Points (MP):** A pool of points refreshed every Cycle.
* **Speed Constraint:** Regardless of total MP, all units physically move at a speed of **1 Hex per Tick**. (High MP units can simply sustain movement for more hours in the day).

### Tactical Movement
* **Zone of Control (ZOC):** Most units exert a ZOC into all 6 adjacent hexes. Movement into hexes with enemy ZOC consumes **double** MP.
* **Front Lines & Capture:** Moving a unit into a hex owned by an enemy captures it. Under certain conditions (e.g., surrounding an area), adjacent hexes may also flip ownership.
* **[Collision] The Crash Rule:** If two or more units attempt to enter the same hex on the same Tick, a **Collision** occurs.
    * *Scope:* This applies to **ALL** units (Enemy vs Enemy, Ally vs Ally, or Self vs Self).
    * *Outcome:* All involved units "bounce" (stay in current hex), expend **All Remaining MP**, and suffer **1 Step Suppression**.
    * *Note:* If a unit attempts to enter a hex that is already occupied then that unit will bounce (not the unit in the hex).

> **Scenario: The Race**
> **Player A** (Frigates, High MP) and **Player B** (Destroyers, Low MP) both race for a neutral planet.
> * **The Plan:** Player A plots a direct course. Player B is closer but has less MP.
> * **The Result:** Player B arrives first. Their Destroyers exert **Zone of Control**. When Player A arrives 2 hours later, they enter the ZOC and run out of MP, unable to bypass the enemy fleet.

---

## 4. The Combat Engine
Combat is deterministic, relying on preparation, positioning and coordination.

### Constraints
* **1-Stack Limit:** Only one unit may occupy a hex at a time.
* **The AP Economy:** Units receive **1 Action Point (AP) per Cycle**. A unit can effectively initiate only one offensive action per day.

### The Combat Sequence
1.  **Declaration:** Attacker targets an adjacent enemy and spends **1 AP**.
    * *Setting:* The Player toggles **"Advance on Victory"** (Default: ON).
2.  **Preparation (The Timer):** The attacking unit enters `PREPARING` state.
    * *Minimum Reaction Window:* Attacks must be declared at least **15 minutes** before the next Tick.
3.  **The Defender's Choice:** The defender receives a notification.
    * *Option A - Stand Ground:* Combat occurs when the timer ends.
    * *Option B - Retreat:* The defender moves to an adjacent safe hex (Cost: 1 AP).
4.  **Resolution:** Combat resolves instantly (Hits, Suppression, Armor Saves).
5.  **Advance on Victory (Blitz):**
    * If the Defender is destroyed or retreats, AND the Attacker has `Advance on Victory` enabled, AND the Attacker has enough MP to move:
    * The Attacker **instantly moves** into the captured hex as part of the combat resolution.
    * *Note:* This movement happens *before* other units move in the current Tick.
6.  **Regrouping:** Both units enter a `REGROUPING` cooldown.

### Combat Operations
The player can choose the method of attack, these are as follows:
* **Standard Attack:** The normal attack type, both units engage in combat.
* **Feint Attack:** Simulates a limited attack. **Suppresses 1 step from both sides**, useful for weaker units attacking stronger targets.
* **Suppressive Fire:** Simulates using artillery without actually moving into the attack. **Suppresses 2 steps** from the opposing unit.
    * This attack is available only if the unit has an **Artillery** specialist step. This attacking specialist step will be suppressed in the attack.

### Collision Override (The "Interloper" Rule)
Because Combat resolves before standard Movement, a "Crash" can occur if a third party tries to enter a hex being fought over.
* **Scenario:** Attacker A attacks Defender B. Neutral C attempts to move into B's hex on the same Tick.
* **Outcome:**
    1.  Attacker A defeats Defender B.
    2.  Attacker A advances into the hex immediately.
    3.  Neutral C attempts to enter the hex, but finds it occupied by Attacker A.
    4.  **Result:** Neutral C suffers a **Crash** (Bounces, loses MP, Suppressed). Attacker A is unaffected (they hold the ground).

### Combat Shifts
Combat results are modified by "Shifts" (moving the result column up or down).
* **Armor Shift:** Heavy units reduce damage from light units.
* **Terrain Shift:** Defenders in cover force worse die rolls for attackers.

#### Simultaneous Attack Resolution (Sequential 1v1)
If multiple units are scheduled to attack the same hex on the same Tick, they resolve as a rapid sequence of discrete 1v1 battles.

**1. Sequence Order (Initiative)**
Attacks trigger based on **Unit Class Initiative** (Fastest to Slowest). Tiebreaker: **Remaining MP**.
1.  **Frigates** (First)
2.  **Destroyers**
3.  **Battleships** (Last)

**2. The Chain Effect**
Damage is applied immediately. If the first attacker suppresses the target, the second attacker hits a suppressed target.

**3. The "Whiff" Risk**
If an early attack destroys the defender or forces a retreat, subsequent attacks in the chain **Fail** (Target Not Found). The late attackers expend AP but deal no damage.

---

## 5. The Supply Engine
Supply is the lifeline of the fleet. Units must trace a valid path to a source to recover and function.

### The Network
Supply propagates outwards: **Capital Planet (Root) -> Planet/Station (Relay) -> Unit (Consumer)**.

### Out of Supply (OOS) States
Penalties for being cut off are progressive based on the duration (in Cycles) the unit has been OOS.

| Duration | Penalty Effect |
| :--- | :--- |
| **1 Cycle** | **Disruption:** Unit cannot recover previously suppressed steps. |
| **2 Cycles** | **Starvation:** Unit sets **AP to 0**. **2 Steps** are immediately Suppressed. |
| **3 Cycles** | **Crippled:** AP is 0. **Max MP is halved**. All remaining steps are Suppressed. Terrain movement is blocked. |
| **4+ Cycles** | **Collapse:** All effects of Cycle 3 apply. Additionally, **3 Steps are Destroyed** per cycle (Deserters/Failure). |

### Recovery
Once a connection is re-established, units recover slowly.
* **Rate:** Recover **2 Suppressed Steps** per Cycle.

> **Scenario: The Siege**
> Player A flanks Player B's massive fleet and destroys the Supply Station feeding them.
> * **Result:** Player B's fleet is cut off. In 2 Cycles, they will lose all Action Points (cannot attack). In 3 Cycles, they will be unable to move effectively. Player B is forced to retreat immediately or face total collapse.

---

## 6. Player Economy (Prestige)
There is no complex resource management (metal/crystal). The currency is **Prestige**, representing political and military influence.

### Earning & Spending
* **Income:** Prestige is calculated at the end of every Cycle based on the number of **Planets** controlled.
* **Cap:** A player is capped on the *number* of units they can control, scaling with their Planet count.

### Deployment & Reconstitution
* **New Deployment:** Players spend Prestige to deploy new units.
    * *Rule:* New units spawn adjacent to the Capital. **They spawn with All Steps Suppressed.** They require supply cycles to become combat-ready.
* **Reinforcement:** Prestige can purchase **Specialist Steps** or replace lost standard steps. These also spawn/attach in a Suppressed state.
* **Scrapping:** Players can decommission units or individual steps to free up Unit Cap slots or recoup a small amount of Prestige.

## 7. Win Conditions
To win the game, players must earn Victory Points (VPs) which are earned by controlling planets. VPs are awarded at the end of each cycle and the
first player to reach a certain number of VPs will win the game.