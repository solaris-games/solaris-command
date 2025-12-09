import { MongoClient } from "mongodb";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { MigrationLog } from "@solaris-command/core";

// ESM fix for __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const mongoUri =
  process.env.MONGO_URI || "mongodb://localhost:27017/solaris-command";

const MIGRATIONS_DIR = path.join(__dirname, "migrations");

async function migrate() {
  console.log("🚀 Starting database migration...");
  console.log(`📂 Migrations directory: ${MIGRATIONS_DIR}`);

  const client = await MongoClient.connect(mongoUri);
  const db = client.db();

  try {
    // 1. Ensure Migrations Collection Exists
    const collections = await db
      .listCollections({ name: "migrations" })
      .toArray();
    if (collections.length === 0) {
      await db.createCollection("migrations", {
        validator: {
          $jsonSchema: {
            bsonType: "object",
            required: ["filename", "executedAt"],
            properties: {
              filename: { bsonType: "string" },
              executedAt: { bsonType: "date" },
            },
          },
        },
      });
      // Unique index on filename to prevent double execution (though code logic handles it)
      await db
        .collection<MigrationLog>("migrations")
        .createIndex({ filename: 1 }, { unique: true });
    }

    // 2. Get executed migrations
    const executedMigrations = await db
      .collection<MigrationLog>("migrations")
      .find({})
      .sort({ filename: 1 })
      .toArray();
    const executedFilenames = new Set(
      executedMigrations.map((m) => m.filename)
    );

    // 3. Get file list
    const files = fs
      .readdirSync(MIGRATIONS_DIR)
      .filter((file) => file.endsWith(".ts"))
      .sort();

    // 4. Execute pending migrations
    for (const file of files) {
      if (!executedFilenames.has(file)) {
        console.log(`⚡ Running migration: ${file}`);

        // Dynamic import
        const migrationPath = path.join(MIGRATIONS_DIR, file);
        const migrationModule = await import(migrationPath);

        if (typeof migrationModule.up !== "function") {
          throw new Error(
            `Migration ${file} does not export an 'up' function.`
          );
        }

        await migrationModule.up(db, client);

        // Log success
        await db.collection<MigrationLog>("migrations").insertOne({
          filename: file,
          executedAt: new Date(),
        } as any);

        console.log(`✅ Completed: ${file}`);
      } else {
        console.log(`⏩ Skipped (already executed): ${file}`);
      }
    }

    console.log("✨ All migrations applied successfully.");
  } catch (err) {
    console.error("🔥 Migration failed:", err);
    process.exit(1);
  } finally {
    await client.close();
  }
}

// Run if called directly
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  migrate();
}
