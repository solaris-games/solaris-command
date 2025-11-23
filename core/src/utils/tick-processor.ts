import { ObjectId } from 'mongodb';
import { Game } from '../models/game';
import { Unit, UnitClasses, UnitStatuses } from '../models/unit';
import { GameMap as GameMap } from '../models/game-map';
import { Hex } from '../models/hex';
import { Planet } from '../models/planet';
import { CombatEngine } from './combat-engine';
import { HexUtils } from './hex-utils';
import { UnitManagerHelper } from './unit-manager';
import { CombatReport } from '../types/combat';
import { Station } from '../models';

// Sorting order for Simultaneous Combat (High Initiative acts first)
const INITIATIVE_ORDER: Record<UnitClasses, number> = {
  [UnitClasses.FRIGATE]: 0,   // Fast/Screening
  [UnitClasses.DESTROYER]: 1, // Medium
  [UnitClasses.BATTLESHIP]: 2 // Slow/Heavy
};

export const TickProcessor = {

  /**
   * The Main Physics Loop.
   * Executes Combat -> Moves Units -> Handles Collisions -> Updates Territory.
   * Returns objects representing the CHANGES to be made (does not mutate DB directly).
   */
  processTick(
    game: Game, 
    mapHexes: Hex[],
    units: Unit[], 
    planets: Planet[],
    stations: Station[]
  ): {
    unitUpdates: Map<string, Unit>,          // Full unit objects (heavily mutated)
    hexUpdates: Map<string, Partial<Hex>>,   // Partial updates (unitId, playerId)
    planetUpdates: Map<string, Partial<Planet>>, // Capture updates
    combatReports: CombatReport[],           // Logs for the UI
    unitsToRemove: ObjectId[]                // Dead units to delete
    stationsToRemove: ObjectId[]             // Captured stations to delete
  } {
    const currentTick = game.state.tick + 1;
    
    // --- OUTPUT CONTAINERS ---
    const unitUpdates = new Map<string, Unit>();
    const hexUpdates = new Map<string, Partial<Hex>>();
    const planetUpdates = new Map<string, Partial<Planet>>();
    const combatReports: CombatReport[] = [];
    const unitsToRemove: ObjectId[] = [];
    const stationsToRemove: ObjectId[] = [];

    // --- WORKING SETS (In-Memory State) ---
    // We track unit locations in a Map for O(1) lookup during collision/combat checks.
    // This map is updated continuously as the Tick progresses (e.g., after a Blitz move).
    const unitLocations = new Map<string, Unit>();
    units.forEach(u => unitLocations.set(HexUtils.getID(u.location), u));

    // Lookup map for Planets to check for capture logic efficiently
    const planetLookup = new Map<string, Planet>();
    planets.forEach(p => planetLookup.set(HexUtils.getID(p.location), p));

    const stationLookup = new Map<string, Station>();
    stations.forEach(s => stationLookup.set(HexUtils.getID(s.location), s));

    /**
     * Helper: Handle Territory Capture
     * Called whenever a unit successfully enters a hex (via Movement or Combat Blitz).
     */
    const handleCapture = (hexId: string, unit: Unit) => {
        // 1. Flip Hex Ownership
        const existingHexUpdate = hexUpdates.get(hexId) || {};
        hexUpdates.set(hexId, { 
            ...existingHexUpdate,
            unitId: unit._id, // Unit is now seated here
            playerId: unit.playerId // Territory flips to Unit owner
        });

        // 2. Flip Planet Ownership (if one exists here)
        const planet = planetLookup.get(hexId);
        if (planet && String(planet.playerId) !== String(unit.playerId)) {
            planetUpdates.set(planet._id.toString(), { playerId: unit.playerId });
        }

        // 3. Destroy hostile stations
        const station = stationLookup.get(hexId);
        if (station && String(station.playerId) !== String(unit.playerId)) {
            stationsToRemove.push(station._id);
        }
    };

    // =================================================================================
    // PHASE 1: COMBAT RESOLUTION
    // Combat happens BEFORE movement. This allows "Blitz" moves to seize ground.
    // =================================================================================
    
    // 1. Identify Units Declaring Attack
    const attackers = units.filter(u => u.status === UnitStatuses.PREPARING);

    // 2. Group by Target Hex (To handle Multi-Unit vs Single-Defender scenarios)
    const attacksByHex = new Map<string, Unit[]>();
    attackers.forEach(att => {
        if (!att.combat.targetHex) return;
        const key = HexUtils.getID(att.combat.targetHex);
        if (!attacksByHex.has(key)) attacksByHex.set(key, []);
        attacksByHex.get(key)!.push(att);
    });

    // 3. Resolve Battles per Hex
    attacksByHex.forEach((hexAttackers, targetHexId) => {
        
        // Sort Attackers: Frigates (High Init) strike before Battleships.
        // Tiebreaker: Units with more MP act faster.
        hexAttackers.sort((a, b) => {
            const initDiff = INITIATIVE_ORDER[a.class] - INITIATIVE_ORDER[b.class];
            if (initDiff !== 0) return initDiff;
            return b.stats.mp - a.stats.mp;
        });

        // Execute Sequential 1v1s
        for (const attacker of hexAttackers) {
            
            // Lookup Target Hex
            // TODO: In a massive map, mapHexes.find is slow O(N). In production, mapHexes should be a Map<string, Hex>.
            const targetHex = mapHexes.find(h => HexUtils.getID(h.coords) === targetHexId);
            if (!targetHex) continue;

            // Lookup Defender (Is there a unit at the location RIGHT NOW?)
            const defender = unitLocations.get(targetHexId);

            // Whiff Check: Did the defender die or retreat in a previous sequence step?
            // Also check Friendly Fire (Attacker vs Attacker race condition)
            if (!defender || String(defender.playerId) === String(attacker.playerId)) {
                attacker.status = UnitStatuses.REGROUPING; // Attack fails/cancels
                attacker.combat.targetHex = null;
                unitUpdates.set(attacker._id.toString(), attacker);
                continue;
            }

            // EXECUTE COMBAT
            // advanceOnVictory: TRUE means the unit will move into the hex if they win
            const battleResult = CombatEngine.resolveBattle(attacker, defender, mapHexes, { advanceOnVictory: true }); 
            
            // Log Report
            battleResult.report.tick = currentTick;
            combatReports.push(battleResult.report);

            // Queue State Updates
            unitUpdates.set(attacker._id.toString(), attacker);
            unitUpdates.set(defender._id.toString(), defender);

            // Check Casualties
            if (attacker.steps.length === 0) unitsToRemove.push(attacker._id);
            
            if (defender.steps.length === 0) {
                // Defender Destroyed
                unitsToRemove.push(defender._id);
                unitLocations.delete(targetHexId); // Remove from board
                hexUpdates.set(targetHexId, { unitId: null }); // Clear seat
            } else if (battleResult.report.defender.retreated) {
                // Defender Retreated
                unitLocations.delete(targetHexId); // Left old hex
                const newDefLoc = HexUtils.getID(defender.location);
                unitLocations.set(newDefLoc, defender); // Occupy new hex
                
                hexUpdates.set(targetHexId, { unitId: null }); // Clear old seat
                // Note: Defender implicitly "captures" retreat hex, or at least occupies it
                const existing = hexUpdates.get(newDefLoc) || {};
                hexUpdates.set(newDefLoc, { ...existing, unitId: defender._id });
            }

            // Handle Blitz (Advance on Victory)
            if (battleResult.attackerWonHex) {
                const oldLoc = HexUtils.getID(attacker.location);
                
                // Update Memory
                unitLocations.delete(oldLoc);
                unitLocations.set(targetHexId, attacker);

                // Update DB: Vacate old hex
                hexUpdates.set(oldLoc, { unitId: null });

                // Update DB: Capture new hex (and planet)
                handleCapture(targetHexId, attacker);
            }
        }
    });

    // =================================================================================
    // PHASE 2: MOVEMENT INTENT
    // Gather all units that want to move this tick.
    // =================================================================================
    
    interface MoveIntent { unit: Unit; from: string; to: string; toCoord: any; }
    const moveIntents: MoveIntent[] = [];

    units.forEach(unit => {
        // Unit must be MOVING, have a path, have MP, and NOT be dead from combat above
        if (
            unit.status === UnitStatuses.MOVING && 
            unit.movement.path.length > 0 && 
            unit.stats.mp > 0 && 
            !unitsToRemove.some(id => String(id) === String(unit._id))
        ) {
            const nextHex = unit.movement.path[0];
            moveIntents.push({ 
                unit, 
                from: HexUtils.getID(unit.location), 
                to: HexUtils.getID(nextHex), 
                toCoord: nextHex 
            });
        }
    });

    // =================================================================================
    // PHASE 3: COLLISION RESOLUTION & EXECUTION
    // Check for "Crashes" (Multiple units entering same hex, or entering occupied hex)
    // =================================================================================

    // Group intents by Destination
    const movesByDest = new Map<string, MoveIntent[]>();
    moveIntents.forEach(intent => {
        if (!movesByDest.has(intent.to)) movesByDest.set(intent.to, []);
        movesByDest.get(intent.to)!.push(intent);
    });

    movesByDest.forEach((intents, destId) => {
        // Check 1: Is the destination occupied? (Note: unitLocations acts as the live board state)
        const occupier = unitLocations.get(destId);
        
        // Check 2: Are multiple units trying to enter?
        const isCrash = intents.length > 1 || occupier !== undefined;

        if (isCrash) {
            // --- CRASH RESOLUTION ---
            // "The Crash Rule": All movers Bounce, lose MP, and get Suppressed.
            intents.forEach(({ unit }) => {
                unit.stats.mp = 0; // Lose momentum
                unit.steps = UnitManagerHelper.suppressSteps(unit.steps, 1); // Take damage
                unit.status = UnitStatuses.REGROUPING; // Forced stop
                
                // Update DB
                unitUpdates.set(unit._id.toString(), unit);
            });
            // Note: Occupier is unaffected (Interloper Rule)

        } else {
            // --- MOVEMENT SUCCESS ---
            const intent = intents[0];
            const unit = intent.unit;
            
            // Calculate Cost based on Target Terrain
            const targetHex = mapHexes.find(h => HexUtils.getID(h.coords) === destId);
            const cost = (targetHex?.terrain === 'ASTEROID_FIELD' || targetHex?.terrain === 'DEBRIS_FIELD') ? 2 : 1;

            // Apply State Changes
            unit.location = intent.toCoord;
            unit.stats.mp = Math.max(0, unit.stats.mp - cost);
            unit.movement.path.shift(); // Pop the step

            // Stop if path done or out of gas
            if (unit.movement.path.length === 0 || unit.stats.mp === 0) {
                unit.status = UnitStatuses.IDLE;
            }
            unitUpdates.set(unit._id.toString(), unit);

            // Update Working Set (for next logic steps, though this is the end of tick)
            unitLocations.delete(intent.from);
            unitLocations.set(intent.to, unit);

            // Update Hexes: Vacate Old
            hexUpdates.set(intent.from, { unitId: null });

            // Update Hexes: Capture New
            handleCapture(destId, unit);
        }
    });

    return { unitUpdates, hexUpdates, planetUpdates, combatReports, unitsToRemove, stationsToRemove };
  }
};