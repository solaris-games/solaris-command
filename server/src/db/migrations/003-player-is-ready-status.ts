import { Player } from "@solaris-command/core";
import { Db } from "mongodb";

export const up = async (db: Db): Promise<void> => {
  await db.collection<Player>("players").updateMany(
    {},
    {
      $set: {
        isReady: false,
      },
    },
  );
};
