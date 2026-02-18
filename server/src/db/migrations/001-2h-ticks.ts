import { CONSTANTS, Game } from "@solaris-command/core";
import { Db, ObjectId } from "mongodb";

export const up = async (db: Db): Promise<void> => {
  // We have migrated to tick duration, so all games need to be updated and their dates recalculates.
  const games = await db.collection("games").find<Game>({});

  for await (const game of games) {
    const ticksPerCycle = CONSTANTS.GAME_DEFAULT_TICKS_PER_CYCLE;
    const tickDurationMS = CONSTANTS.GAME_DEFAULT_TICK_DURATION_MS;

    // Update ticksPerCycle and tickDurationMS for all games
    const updateFields: any = {
      ticksPerCycle,
      tickDurationMS,
    };

    if (!game.state.startDate) {
      console.warn(
        `Game ${game._id} has no startDate in state, only updating ticksPerCycle and tickDurationMS.`,
      );
    } else {
      const now = new Date();
      const timeSinceStartMS =
        now.getTime() - new Date(game.state.startDate).getTime();

      const rawTicks = Math.floor(timeSinceStartMS / tickDurationMS);
      const ticks = Math.max(0, rawTicks);

      const rawCycles = Math.floor(ticks / ticksPerCycle);
      const cycles = Math.max(0, rawCycles);

      const lastTickDate = new Date(
        new Date(game.state.startDate).getTime() + ticks * tickDurationMS,
      );
      const nextTickDate = new Date(lastTickDate.getTime() + tickDurationMS);

      const totalTicksForNextCycle = (cycles + 1) * ticksPerCycle;
      const nextCycleTickDate = new Date(
        new Date(game.state.startDate).getTime() +
          totalTicksForNextCycle * tickDurationMS,
      );

      Object.assign(updateFields, {
        ticks,
        cycles,
        lastTickDate,
        nextTickDate,
        nextCycleTickDate,
      });
    }

    await db
      .collection("games")
      .updateOne(
        { _id: new ObjectId(String(game._id)) },
        { $set: updateFields },
      );
  }
};
