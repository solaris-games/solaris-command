import { Db, MongoClient } from "mongodb";

export async function up(db: Db, client: MongoClient) {
  console.log("🛠️  Initializing Database Scema...");

  const createCollectionSafe = async (name: string, options: any) => {
    try {
      await db.createCollection(name, options);
      console.log(`✅ Collection \`${name}\` created.`);
    } catch (err: any) {
      if (err.code === 48) {
        console.log(
          `⚠️  Collection \`${name}\` already exists. Skipping creation.`
        );
      } else {
        throw err;
      }
    }
  };

  try {
    // --- 1. GAMES COLLECTION ---
    await createCollectionSafe("games", {
      validator: {
        $jsonSchema: {
          bsonType: "object",
          required: ["name", "description", "state", "settings"],
          properties: {
            name: { bsonType: "string" },
            description: { bsonType: "string" },
            state: {
              bsonType: "object",
              required: [
                "status",
                "playerCount",
                "tick",
                "cycle",
                "createdDate",
                "startDate",
                "endDate",
                "lastTickDate",
                "winnerPlayerId",
              ],
              properties: {
                status: {
                  bsonType: "string",
                  enum: ["PENDING", "STARTING", "ACTIVE", "COMPLETED", "LOCKED"],
                },
                playerCount: { bsonType: "int" },
                tick: { bsonType: "int" },
                cycle: { bsonType: "int" },
                createdDate: { bsonType: "date" },
                startDate: { bsonType: ["date", "null"] },
                endDate: { bsonType: ["date", "null"] },
                lastTickDate: { bsonType: ["date", "null"] },
                winnerPlayerId: { bsonType: ["objectId", "null"] },
              },
            },
            settings: {
              bsonType: "object",
              required: [
                "playerCount",
                "ticksPerCycle",
                "tickDurationMS",
                "victoryPointsToWin",
                "combatVersion",
                "movementVersion",
              ],
              properties: {
                playerCount: { bsonType: "int" },
                ticksPerCycle: { bsonType: "int" },
                tickDurationMS: { bsonType: "int" },
                victoryPointsToWin: { bsonType: "int" },
                combatVersion: { bsonType: "string" },
                movementVersion: { bsonType: "string" },
              },
            },
          },
        },
      },
    });

    // Index: Find Active games quickly for the Cron Loop
    await db.collection("games").createIndex({ "state.status": 1 });

    // --- 2. HEXES COLLECTION ---
    await createCollectionSafe("hexes", {
      validator: {
        $jsonSchema: {
          bsonType: "object",
          required: [
            "gameId",
            "unitId",
            "playerId",
            "coords",
            "terrain",
            "supply",
          ],
          properties: {
            gameId: { bsonType: "objectId" },
            unitId: { bsonType: ["objectId", "null"] },
            playerId: { bsonType: ["objectId", "null"] },
            coords: {
              bsonType: "object",
              required: ["q", "r", "s"],
              properties: {
                q: { bsonType: "int" },
                r: { bsonType: "int" },
                s: { bsonType: "int" },
              },
            },
            terrain: {
              bsonType: "string",
              enum: [
                "EMPTY",
                "ASTEROID_FIELD",
                "DEBRIS_FIELD",
                "NEBULA",
                "GAS_CLOUD",
                "GRAVITY_WELL",
                "RADIATION_STORM",
                "INDUSTRIAL_ZONE",
              ],
            },
            supply: {
              bsonType: "object",
              required: ["isInSupply", "ticksLastSupply", "ticksOutOfSupply"],
              properties: {
                isInSupply: { bsonType: "bool" },
                ticksLastSupply: { bsonType: "int", minimum: 0 },
                ticksOutOfSupply: { bsonType: "int", minimum: 0 },
              },
            },
          },
        },
      },
    });

    // Index: The Coordinate System (Unique per game)
    await db
      .collection("hexes")
      .createIndex(
        { gameId: 1, "coords.q": 1, "coords.r": 1, "coords.s": 1 },
        { unique: true }
      );

    // Index: Region queries
    await db.collection("hexes").createIndex({ gameId: 1 });

    // --- 3. UNITS COLLECTION ---
    await createCollectionSafe("units", {
      validator: {
        $jsonSchema: {
          bsonType: "object",
          required: [
            "gameId",
            "playerId",
            "catalogId",
            "location",
            "steps",
            "state",
            "movement",
            "combat",
            "supply",
          ],
          properties: {
            gameId: { bsonType: "objectId" },
            playerId: { bsonType: "objectId" },
            catalogId: { bsonType: "string" },
            location: {
              bsonType: "object",
              required: ["q", "r", "s"],
              properties: {
                q: { bsonType: "int" },
                r: { bsonType: "int" },
                s: { bsonType: "int" },
              },
            },
            steps: {
              bsonType: "array",
              items: {
                bsonType: "object",
                required: ["isSuppressed", "specialistId"],
                properties: {
                  isSuppressed: { bsonType: "bool" },
                  specialistId: { bsonType: ["string", "null"] },
                },
              },
            },
            state: {
              bsonType: "object",
              required: [
                "status",
                "ap",
                "mp",
                "activeSteps",
                "suppressedSteps",
              ],
              properties: {
                status: {
                  bsonType: "string",
                  enum: ["IDLE", "MOVING", "PREPARING", "REGROUPING"],
                },
                ap: { bsonType: "int" },
                mp: { bsonType: "int" },
                activeSteps: { bsonType: "int", minimum: 0 },
                suppressedSteps: { bsonType: "int", minimum: 0 },
              },
            },
            movement: {
              bsonType: "object",
              required: ["path"],
              properties: {
                path: {
                  bsonType: "array",
                  items: {
                    bsonType: "string",
                  },
                },
              },
            },
            combat: {
              bsonType: "object",
              required: ["hexId", "operation"],
              properties: {
                hexId: { bsonType: ["objectId", "null"] },
                operation: {
                  bsonType: "string",
                  enum: ["STANDARD", "FEINT", "SUPPRESSIVE_FIRE"],
                },
              },
            },
            supply: {
              bsonType: "object",
              required: ["isInSupply", "ticksLastSupply", "ticksOutOfSupply"],
              properties: {
                isInSupply: { bsonType: "bool" },
                ticksLastSupply: { bsonType: "int", minimum: 0 },
                ticksOutOfSupply: { bsonType: "int", minimum: 0 },
              },
            },
          },
        },
      },
    });

    // Index: Find all units for a player
    await db.collection("units").createIndex({ gameId: 1, playerId: 1 });
    // Index: Collision Detection / Map population
    await db.collection("units").createIndex({
      gameId: 1,
      "location.q": 1,
      "location.r": 1,
      "location.s": 1,
    });

    // --- 4. PLAYERS COLLECTION ---
    await createCollectionSafe("players", {
      validator: {
        $jsonSchema: {
          bsonType: "object",
          required: [
            "gameId",
            "userId",
            "alias",
            "color",
            "status",
            "prestigePoints",
            "victoryPoints",
            "lastSeenDate",
          ],
          properties: {
            gameId: { bsonType: "objectId" },
            userId: { bsonType: "objectId" },
            alias: { bsonType: "string", minLength: 3 },
            color: { bsonType: "string", minLength: 7, maxLength: 7 },
            status: {
              bsonType: "string",
              enum: ["ACTIVE", "DEFEATED"],
            },
            prestigePoints: { bsonType: "int", minimum: 0 },
            victoryPoints: { bsonType: "int", minimum: 0 },
            lastSeenDate: { bsonType: "date" },
          },
        },
      },
    });
    // Unique: One player entry per user per game
    await db
      .collection("players")
      .createIndex({ gameId: 1, userId: 1 }, { unique: true });
    // Find all players in a game
    await db.collection("players").createIndex({ gameId: 1 });

    // --- 5. PLANETS COLLECTION ---
    await createCollectionSafe("planets", {
      validator: {
        $jsonSchema: {
          bsonType: "object",
          required: [
            "gameId",
            "playerId",
            "name",
            "location",
            "supply",
            "isCapital",
          ],
          properties: {
            gameId: { bsonType: "objectId" },
            playerId: { bsonType: "objectId" },
            name: { bsonType: "string" },
            location: {
              bsonType: "object",
              required: ["q", "r", "s"],
              properties: {
                q: { bsonType: "int" },
                r: { bsonType: "int" },
                s: { bsonType: "int" },
              },
            },
            supply: {
              bsonType: "object",
              required: ["isInSupply", "isRoot"],
              properties: {
                isInSupply: { bsonType: "bool" },
                isRoot: { bsonType: "bool" },
              },
            },
            isCapital: { bsonType: "bool" },
          },
        },
      },
    });
    await db.collection("planets").createIndex({ gameId: 1, playerId: 1 });
    // Find planet by location
    await db.collection("planets").createIndex({
      gameId: 1,
      "location.q": 1,
      "location.r": 1,
      "location.s": 1,
    });

    // --- 6. STATIONS COLLECTION ---
    await createCollectionSafe("stations", {
      validator: {
        $jsonSchema: {
          bsonType: "object",
          required: ["gameId", "playerId", "location", "supply"],
          properties: {
            gameId: { bsonType: "objectId" },
            playerId: { bsonType: "objectId" },
            location: {
              bsonType: "object",
              required: ["q", "r", "s"],
              properties: {
                q: { bsonType: "int" },
                r: { bsonType: "int" },
                s: { bsonType: "int" },
              },
            },
            supply: {
              bsonType: "object",
              required: ["isInSupply", "isRoot"],
              properties: {
                isInSupply: { bsonType: "bool" },
                isRoot: { bsonType: "bool" },
              },
            },
          },
        },
      },
    });
    await db.collection("stations").createIndex({ gameId: 1, playerId: 1 });
    // Find station by location
    await db.collection("stations").createIndex({
      gameId: 1,
      "location.q": 1,
      "location.r": 1,
      "location.s": 1,
    });

    // --- 7. GAME EVENTS (Combat Reports) ---
    await createCollectionSafe("game_events", {
      validator: {
        $jsonSchema: {
          bsonType: "object",
          required: ["gameId", "playerId", "tick", "type", "data"],
          properties: {
            gameId: { bsonType: "objectId" },
            playerId: { bsonType: ["objectId", "null"] },
            tick: { bsonType: "int" },
            type: { bsonType: "string" },
            data: { bsonType: "object" },
          },
        },
      },
    });
    // TTL Index: Automatically delete reports older than 14 days to save space
    await db
      .collection("game_events")
      .createIndex({ createdAt: 1 }, { expireAfterSeconds: 1209600 });
    // Find events for game
    await db.collection("game_events").createIndex({ gameId: 1, tick: -1 });

    // --- 8. USERS COLLECTION ---
    // Often created implicitly, but good to be explicit for indexes.
    // Ensure collection exists (with permissive validation or strict if desired)
    // For now, permissive as User model is simple.
    // listCollections approach for Users as we might not want to enforce schema yet or it's simple
    // BUT consistent with createCollectionSafe is better.
    await createCollectionSafe("users", {
      validator: {
        $jsonSchema: {
          bsonType: "object",
          required: [
            "googleId",
            "username",
            "email",
            "lastSeenDate",
            "achievements",
          ],
          properties: {
            googleId: { bsonType: "string" },
            username: { bsonType: "string" },
            email: { bsonType: "string" },
            lastSeenDate: { bsonType: "date" },
            achievements: {
              bsonType: "object",
              required: ["victories", "rank", "renown"],
              properties: {
                victories: { bsonType: "int" },
                rank: { bsonType: "int" },
                renown: { bsonType: "int" },
              },
            },
          },
        },
      },
    });

    // Auth Index: Look up by googleId
    await db.collection("users").createIndex({ googleId: 1 }, { unique: true });
    // Email index (sparse/unique if we want)
    await db.collection("users").createIndex({ email: 1 });

    console.log("✅ Initial setup complete.");
  } catch (err: any) {
    console.error("🔥 Database setup failed:", err);
    throw err;
  }
}
