import { connectToDb, closeDb } from "./instance";
import { MigrationLogModel } from "./schemas";
import fs from "fs";
import path from "path";
import { Db } from "mongodb";

const MIGRATIONS_DIR = path.join(__dirname, "migrations");

const getMigrationFiles = () => {
  return fs
    .readdirSync(MIGRATIONS_DIR)
    .filter((file) => file.endsWith(".ts"))
    .sort();
};

const runMigrations = async () => {
  const connection = await connectToDb();
  const db: Db = connection.db;

  try {
    const executedMigrations = await MigrationLogModel.find({}).lean();
    const executedFilenames = new Set(
      executedMigrations.map((m) => m.filename),
    );

    const migrationFiles = getMigrationFiles();
    if (migrationFiles.length === 0) {
      console.log("No migrations to run.");
    }

    for (const file of migrationFiles) {
      if (executedFilenames.has(file)) {
        console.log(`Skipping already executed migration: ${file}`);
        continue;
      }

      console.log(`Executing migration: ${file}`);
      const migration = await import(path.join(MIGRATIONS_DIR, file));

      if (typeof migration.up !== "function") {
        throw new Error(`Migration ${file} does not have an 'up' function.`);
      }

      await migration.up(db);

      await MigrationLogModel.create({
        filename: file,
        executedAt: new Date(),
      });

      console.log(`Successfully executed migration: ${file}`);
    }

    if (migrationFiles.length > 0) {
      console.log("All migrations executed successfully.");
    }
  } catch (error) {
    console.error("Error running migrations:", error);
    process.exit(1);
  } finally {
    await closeDb();
  }
};

runMigrations();
