import express from "express";
import { ObjectId } from "mongodb";
import { authenticateToken } from "../middleware/auth";
import { getDb } from "../db/instance";
import { Game, GameStates, Player, Hex, Unit, Planet, Station, FogOfWar, HexUtils } from "@solaris-command/core";

const router = express.Router();

// GET /api/v1/games
// List open games and my games
router.get("/", authenticateToken, async (req, res) => {
  const userId = req.user?.id;
  if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    const db = getDb();

    // 1. Find games where user is a player
    const myPlayers = await db.collection<Player>("players")
        .find({ userId: userId })
        .toArray();

    const myGameIds = myPlayers.map(p => p.gameId);

    // 2. Query Games
    // Return:
    // - Games I am in (regardless of status)
    // - Games that are PENDING (open to join)
    const games = await db.collection<Game>("games").find({
        $or: [
            { _id: { $in: myGameIds } },
            { "state.status": GameStates.PENDING }
        ]
    }).sort({ "state.startDate": -1 }).limit(50).toArray();

    // Map to simple response
    const response = games.map(g => ({
        id: g._id,
        name: g.name,
        description: g.description,
        status: g.state.status,
        tick: g.state.tick,
        state: g.state, // Include full state object if needed, or specific fields as requested
        joined: myGameIds.some(id => id.toString() === g._id.toString())
    }));

    res.json(response);

  } catch (error) {
    console.error("Error listing games:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// POST /api/v1/games
// Create a new game (Basic implementation for testing/admin)
router.post("/", authenticateToken, async (req, res) => {
    try {
        const db = getDb();

        // Basic Default Game
        const newGame: any = {
            settings: {
                tickDurationMS: 1000 * 60 * 60, // 1 hour
                ticksPerCycle: 24,
                victoryPointsTarget: 100,
                maxPlayers: 10
            },
            state: {
                status: GameStates.PENDING,
                tick: 0,
                cycle: 0,
                startDate: new Date(),
                lastTickDate: new Date()
            }
        };

        const result = await db.collection("games").insertOne(newGame);
        res.json({ id: result.insertedId, ...newGame });
    } catch (error) {
        console.error("Error creating game:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

// POST /api/v1/games/:id/join
router.post("/:id/join", authenticateToken, async (req, res) => {
    const userId = req.user?.id;
    const gameId = req.params.id;

    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    try {
        const db = getDb();
        const game = await db.collection<Game>("games").findOne({ _id: new ObjectId(gameId) });

        if (!game) return res.status(404).json({ error: "Game not found" });
        if (game.state.status !== GameStates.PENDING) {
            return res.status(400).json({ error: "Game is not open for joining" });
        }

        // Check if already joined
        const existingPlayer = await db.collection<Player>("players").findOne({
            gameId: new ObjectId(gameId),
            userId: userId
        });

        if (existingPlayer) {
            return res.status(400).json({ error: "Already joined this game" });
        }

        // Create Player
        // Note: Actual logic for spawning units/planets usually happens here or when game starts.
        // Assuming for now we just create the player record.
        // TODO: Need to assign a starting location? Or is that done when game starts?
        // The Design Doc says: "Join game - Initial fleets, spawn points etc."

        // Let's create a basic player entry. Spawning might be complex.
        const newPlayer: any = {
            gameId: new ObjectId(gameId),
            userId: userId,
            username: req.user?.username || "Unknown",
            faction: "Terran", // Default for now
            resources: {
                prestige: 100, // Starting money
                actionPoints: 0,
                movementPoints: 0
            },
            stats: {
                victoryPoints: 0
            },
            status: "ACTIVE"
        };

        await db.collection("players").insertOne(newPlayer);

        res.json({ message: "Joined game", player: newPlayer });

    } catch (error) {
        console.error("Error joining game:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

// POST /api/v1/games/:id/leave
router.post("/:id/leave", authenticateToken, async (req, res) => {
    const userId = req.user?.id;
    const gameId = req.params.id;
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    try {
        const db = getDb();
        const game = await db.collection<Game>("games").findOne({ _id: new ObjectId(gameId) });
        if (!game) return res.status(404).json({ error: "Game not found" });

        if (game.state.status !== GameStates.PENDING) {
            return res.status(400).json({ error: "Cannot leave a game that has started. Concede instead." });
        }

        const result = await db.collection("players").deleteOne({
            gameId: new ObjectId(gameId),
            userId: userId
        });

        if (result.deletedCount === 0) {
             return res.status(400).json({ error: "Not a player in this game" });
        }

        res.json({ message: "Left game" });

    } catch (error) {
         console.error("Error leaving game:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

// POST /api/v1/games/:id/concede
router.post("/:id/concede", authenticateToken, async (req, res) => {
     const userId = req.user?.id;
    const gameId = req.params.id;
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    try {
        const db = getDb();
        const game = await db.collection<Game>("games").findOne({ _id: new ObjectId(gameId) });
        if (!game) return res.status(404).json({ error: "Game not found" });

        // Update player status to DEFEATED or similar
         const result = await db.collection("players").updateOne({
            gameId: new ObjectId(gameId),
            userId: userId
        }, {
            $set: { status: "DEFEATED" } // or CONCEDED if the enum supports it
        });

        if (result.matchedCount === 0) {
             return res.status(400).json({ error: "Not a player in this game" });
        }

        // Units are implicitly neutral/inactive when player is defeated.
        // No need to delete them.

        res.json({ message: "Conceded game" });
    } catch (error) {
         console.error("Error conceding game:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

// GET /api/v1/games/:id
// Get full game state (with FoW filtering)
router.get("/:id", authenticateToken, async (req, res) => {
    const userId = req.user?.id;
    const gameId = req.params.id;

    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    try {
        const db = getDb();

        const [game, players] = await Promise.all([
             db.collection<Game>("games").findOne({ _id: new ObjectId(gameId) }),
             db.collection<Player>("players").find({ gameId: new ObjectId(gameId) }).toArray()
        ]);

        if (!game) return res.status(404).json({ error: "Game not found" });

        // Determine if user is a player in this game
        const currentPlayer = players.find(p => p.userId === userId);

        // Load World Data
        // Optimization: Could limit fields or query based on visibility if DB supports it,
        // but for now loading all and filtering in memory as per plan.
        const [hexes, allUnits, planets, stations] = await Promise.all([
             db.collection<Hex>("hexes").find({ gameId: new ObjectId(gameId) }).toArray(),
             db.collection<Unit>("units").find({ gameId: new ObjectId(gameId) }).toArray(),
             db.collection<Planet>("planets").find({ gameId: new ObjectId(gameId) }).toArray(),
             db.collection<Station>("stations").find({ gameId: new ObjectId(gameId) }).toArray(),
        ]);

        let response: any = {
            game,
            players,
            hexes, // Hexes are always known
            planets, // Planets are always known
            stations, // Stations are always known
            units: []
        };

        if (currentPlayer && game.state.status === GameStates.ACTIVE) {
            // Apply Fog of War for Units
            const visibleHexes = FogOfWar.getVisibleHexes(
                currentPlayer._id,
                allUnits,
                planets,
                stations,
                2 // Vision Range
            );

            // Filter Units
            response.units = FogOfWar.filterVisibleUnits(
                currentPlayer._id,
                allUnits,
                visibleHexes
            );

        } else if (game.state.status === GameStates.COMPLETED) {
            // Reveal all
            response.units = allUnits;
        } else {
            // Spectator or Pending
            if (game.state.status === GameStates.PENDING && currentPlayer) {
                 response.units = allUnits.filter(u => u.playerId.toString() === currentPlayer._id.toString());
            } else {
                // Spectator: See map (hexes, planets, stations) but NO units
                response.units = [];
            }
        }

        res.json(response);

    } catch (error) {
         console.error("Error fetching game:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

// GET /api/v1/games/:id/events
// Get game events (as a player)
router.get("/:id/events", authenticateToken, async (req, res) => {
    const userId = req.user?.id;
    const gameId = req.params.id;

    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    try {
        const db = getDb();

        // Check if player is in game
        const player = await db.collection<Player>("players").findOne({
            gameId: new ObjectId(gameId),
            userId: userId
        });

        if (!player) {
            return res.status(403).json({ error: "Must be a player to view events" });
        }

        // Logic: Return events
        // 1. Global events
        // 2. Private events for this player?
        // 3. Combat reports?
        // For now, returning all events for the game as a simple implementation.
        // In future: Filter combat reports to only show if player was involved or had vision.

        const events = await db.collection("game_events")
            .find({ gameId: new ObjectId(gameId) })
            .sort({ createdAt: -1 })
            .limit(100)
            .toArray();

        res.json(events);

    } catch (error) {
        console.error("Error fetching game events:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

export default router;
