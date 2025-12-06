import { Db, MongoClient } from "mongodb";

export async function up(db: Db, client: MongoClient) {
  console.log("🛠️  Initializing Database Scema...");

  const createCollectionSafe = async (name: string, options: any) => {
    try {
      await db.createCollection(name, options);
      console.log(`✅ Collection \`${name}\` created.`);
    } catch (err: any) {
      if (err.code === 48) {
        console.log(`⚠️  Collection \`${name}\` already exists. Skipping creation.`);
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
          required: ["state", "settings", "playerIds"],
          properties: {
            playerIds: {
                bsonType: "array",
                items: { bsonType: "objectId" }
            },
            state: {
              bsonType: "object",
              required: ["status", "tick", "cycle"],
              properties: {
                status: { enum: ["PENDING", "STARTING", "ACTIVE", "COMPLETED"] },
                tick: { bsonType: "int" },
                cycle: { bsonType: "int" },
              },
            },
            settings: {
                bsonType: "object",
                required: ["playerCount", "ticksPerCycle", "tickDurationMS", "victoryPointsToWin"],
                properties: {
                    playerCount: { bsonType: "int" },
                    ticksPerCycle: { bsonType: "int" },
                    tickDurationMS: { bsonType: "int" },
                    victoryPointsToWin: { bsonType: "int" }
                }
            }
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
          required: ["gameId", "coords", "terrain", "isImpassable"],
          properties: {
            gameId: { bsonType: "objectId" },
            coords: {
              bsonType: "object",
              required: ["q", "r", "s"],
              properties: {
                q: { bsonType: "int" },
                r: { bsonType: "int" },
                s: { bsonType: "int" },
              },
            },
            terrain: { bsonType: "string" },
            isImpassable: { bsonType: "bool" }
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
          required: ["gameId", "playerId", "location", "state", "catalogId"],
          properties: {
            state: {
                bsonType: "object",
                required: ["status", "ap", "mp", "activeSteps", "suppressedSteps"],
                properties: {
                    status: { enum: ["IDLE", "MOVING", "PREPARING", "REGROUPING"] },
                    ap: { bsonType: "int" },
                    mp: { bsonType: "int" },
                    activeSteps: { bsonType: "int" },
                    suppressedSteps: { bsonType: "int" }
                }
            },
            location: {
                bsonType: "object",
                required: ["q", "r", "s"],
                properties: {
                  q: { bsonType: "int" },
                  r: { bsonType: "int" },
                  s: { bsonType: "int" },
                },
            }
          },
        },
      },
    });

    // Index: Find all units for a player
    await db.collection("units").createIndex({ gameId: 1, playerId: 1 });
    // Index: Collision Detection / Map population
    await db
      .collection("units")
      .createIndex({
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
                required: ["gameId", "userId", "status", "prestigePoints", "victoryPoints"],
                properties: {
                    status: { enum: ["ACTIVE", "DEFEATED"] },
                    prestigePoints: { bsonType: "double" }, // Or int/long depending on logic, double is safe for numbers
                    victoryPoints: { bsonType: "double" }
                }
            }
        }
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
                required: ["gameId", "location", "name", "isCapital"],
                properties: {
                     location: {
                        bsonType: "object",
                        required: ["q", "r", "s"],
                        properties: {
                          q: { bsonType: "int" },
                          r: { bsonType: "int" },
                          s: { bsonType: "int" },
                        },
                    },
                    isCapital: { bsonType: "bool" }
                }
            }
         }
    });
    await db.collection("planets").createIndex({ gameId: 1, playerId: 1 });
    // Find planet by location
    await db.collection("planets").createIndex({
        gameId: 1,
        "location.q": 1,
        "location.r": 1,
        "location.s": 1
    });


    // --- 6. STATIONS COLLECTION ---
    await createCollectionSafe("stations", {
        validator: {
            $jsonSchema: {
                bsonType: "object",
                required: ["gameId", "location", "status"],
                properties: {
                     status: { enum: ["CONSTRUCTING", "ACTIVE", "DECOMMISSIONING"] },
                     location: {
                        bsonType: "object",
                        required: ["q", "r", "s"],
                        properties: {
                          q: { bsonType: "int" },
                          r: { bsonType: "int" },
                          s: { bsonType: "int" },
                        },
                    }
                }
            }
        }
    });
    await db.collection("stations").createIndex({ gameId: 1, playerId: 1 });
    // Find station by location
    await db.collection("stations").createIndex({
        gameId: 1,
        "location.q": 1,
        "location.r": 1,
        "location.s": 1
    });


    // --- 7. GAME EVENTS (Combat Reports) ---
    await createCollectionSafe("game_events", {});
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
    await createCollectionSafe("users", {});

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
