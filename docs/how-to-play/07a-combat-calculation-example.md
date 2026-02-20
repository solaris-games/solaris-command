# Combat Calculation: An In-Depth Example

The combat system in Solaris: Command is designed to be deterministic and strategic. Understanding how combat odds are calculated is key to making informed decisions on the battlefield. This guide will walk you through a detailed example of a combat calculation.

For this example, we will have a **Heavy Destroyer** attacking an **Armoured Cruiser**.

- **Attacker:** Heavy Destroyer
  - Attack: `4`
  - Shock: `1`
  - Steps: `2` (at full strength)
- **Defender:** Armoured Cruiser
  - Defense: `4`
  - Shock: `2`
  - Steps: `3` (at full strength)

The combat calculation follows these steps:

1.  Calculate Attack and Defense Power
2.  Calculate the Odds Ratio and Odds Score
3.  Calculate Combat Shifts
4.  Determine the Final Score

---

### Step 1: Calculate Attack and Defense Power

The power of a unit in combat is determined by its base stats multiplied by the number of active (not suppressed) steps it has.

- **Attack Power** = `(Attacker's Attack Stat + Specialist Attack Buffs) * Number of Attacker's Steps`
- **Defense Power** = `(Defender's Defense Stat + Specialist Defense Buffs) * Number of Defender's Steps`

In our example:

- **Attack Power** = `4 (Heavy Destroyer's Attack) * 2 (Steps) = 8`
- **Defense Power** = `4 (Armoured Cruiser's Defense) * 3 (Steps) = 12`

---

### Step 2: Calculate the Odds Ratio and Odds Score

The **Odds Ratio** is a direct comparison of the Attack Power to the Defense Power.

- **Odds Ratio** = `Attack Power / Defense Power`
- **Odds Ratio** = `8 / 12 = 0.66`

This ratio is then converted into a wargame-style **Odds Score**. This score simplifies the ratio into a single number that will be used in the final calculation.

The brackets are:
| Ratio | Odds Score |
| :--- | :--- |
| 3:1 or better (>= 3.0) | `+3` |
| 2:1 (>= 2.0) | `+2` |
| 1.5:1 (>= 1.5) | `+1` |
| 1:1 (>= 1.0) | `0` |
| 1:1.5 (< 1.0) | `-1` |
| 1:2 (< 0.5) | `-2` |
| 1:3 or worse (< 0.33) | `-3` |

In our example, the ratio is `0.66`. Since this is less than `1`, we take the inverse `(1 / 0.66 = 1.51)` to determine the defender's advantage. This falls into the `1:1.5` bracket, which gives an **Odds Score of -1**.

---

### Step 3: Calculate Combat Shifts

Combat **Shifts** are modifiers that adjust the Odds Score based on tactical and environmental factors. They represent advantages or disadvantages outside of the raw power of the units involved.

Common shifts include:

- **Terrain:** Attacking into difficult terrain like an asteroid field or nebula can give a negative shift to the attacker.
- **Planets:** A defender on a planet gains a defensive bonus.
- **Disorganization:** Attacking a unit that is `REGROUPING` provides a bonus.
- **Shock:** If the attacker's shock is greater than the defender's, the attacker gets a bonus (unless the defender has torpedoes).
- **Specialists:** Engineers, Artillery, and other specialists can add positive or negative shifts.

Let's assume our combat takes place in an **Asteroid Field**, which gives a `DEFENDER_TERRAIN_BONUS` of `-1`.

Additionally, the **Shock Shift** is calculated. The shift is the difference between the attacker's and defender's shock, but it only applies if the attacker has superior shock.

- `Shock Difference = Attacker Shock - Defender Shock = 1 - 2 = -1`

Since the difference is not positive, the attacker does not get an shock bonus. There is no penalty for having less shock in this step; the defender's higher shock is already factored into their higher `Defense Power`.

So, the total shifts in our example are:

- **Terrain Shift (Asteroid Field):** `-1`
- **Total Shifts:** `-1`

---

### Step 4: Determine the Final Score

The **Final Score** is the sum of the Odds Score and all Combat Shifts. This score is used to look up the result of the combat on the Combat Results Table (CRT).

- **Final Score** = `Odds Score + Total Shifts`
- **Final Score** = `-1 + (-1) = -2`

This final score is then used to determine the outcome of the battle from the CRT, which specifies the step losses for both the attacker and the defender. A lower score is better for the defender, while a higher score is better for the attacker. In this case, a score of -2 would likely result in a favorable outcome for the defending Armoured Cruiser.
