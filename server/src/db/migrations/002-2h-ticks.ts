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
      "settings.ticksPerCycle": ticksPerCycle,
      "settings.tickDurationMS": tickDurationMS,
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
      const tick = Math.max(0, rawTicks);

      const rawCycles = Math.floor(tick / ticksPerCycle);
      const cycle = Math.max(0, rawCycles);

      const lastTickDate = new Date(
        new Date(game.state.startDate).getTime() + tick * tickDurationMS,
      );
      const nextTickDate = new Date(lastTickDate.getTime() + tickDurationMS);

      const totalTicksForNextCycle = (cycle + 1) * ticksPerCycle;
      const nextCycleTickDate = new Date(
        new Date(game.state.startDate).getTime() +
          totalTicksForNextCycle * tickDurationMS,
      );

      Object.assign(updateFields, {
        "state.tick": tick,
        "state.cycle": cycle,
        "state.lastTickDate": lastTickDate,
        "state.nextTickDate": nextTickDate,
        "state.nextCycleTickDate": nextCycleTickDate,
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
