import { describe, it, expect, vi } from "vitest";
import { StationFactory } from "./station-factory";
import { UnifiedId } from "../types";

describe("StationFactory", () => {
  it("should create a station with default values", () => {
    const gameId = "game1" as UnifiedId;
    const playerId = "player1" as UnifiedId;
    const hexId = "hex1" as UnifiedId;
    const location = { q: 1, r: 0, s: -1 };
    const idGenerator = vi.fn().mockReturnValue("station1" as UnifiedId);

    const station = StationFactory.create(
      gameId,
      playerId,
      hexId,
      location,
      idGenerator
    );

    expect(station).toEqual({
      _id: "station1",
      gameId,
      playerId,
      hexId,
      location,
      supply: {
        isInSupply: true,
        isRoot: false,
      },
    });
    expect(idGenerator).toHaveBeenCalled();
  });
});
