import { describe, it, expect } from "vitest";
import { FogOfWar } from "./fog-of-war";
import { HexUtils } from "./hex-utils";
import { ObjectId } from "mongodb";
import { Unit } from "../models/unit";
import { Planet } from "../models/planet";
import { Station } from "../models/station";

describe("FogOfWar", () => {
  const player1Id = new ObjectId();
  const player2Id = new ObjectId();

  const mockUnit = (idStr: string, pid: ObjectId, q: number, r: number): Unit =>
    ({
      // Create a valid 24-char hex string from the input
      _id: new ObjectId(idStr.padEnd(24, "0")),
      catalogId: "unit_corvette_01", // Hex range of 3
      playerId: pid,
      location: { q, r, s: -q - r },
      steps: [{ isSuppressed: false, specialistId: null }]
      // ... minimal other props
    } as any);

  it("should calculate visible hexes from units", () => {
    // Player 1 has a unit at 0,0,0
    const units = [mockUnit("1", player1Id, 0, 0)];
    const planets: Planet[] = [];
    const stations: Station[] = [];

    const visibleHexes = FogOfWar.getVisibleHexes(
      player1Id,
      units,
      planets,
      stations
    );

    // Range 5 (Corvette) from 0,0,0 should be 91 hexes
    expect(visibleHexes.size).toBe(91);
    expect(visibleHexes.has("0,0,0")).toBe(true);
    expect(visibleHexes.has("1,-1,0")).toBe(true);
  });

  it("should filter enemy units correctly", () => {
    const p1Unit = mockUnit("1", player1Id, 0, 0); // At center
    const p2UnitVisible = mockUnit("2", player2Id, 1, -1); // Neighbor (Visible)
    const p2UnitHidden = mockUnit("3", player2Id, 5, 5); // Far away (Hidden)

    const units = [p1Unit, p2UnitVisible, p2UnitHidden];
    const planets: Planet[] = [];
    const stations: Station[] = [];

    const visibleHexes = FogOfWar.getVisibleHexes(
      player1Id,
      units,
      planets,
      stations
    );
    const filtered = FogOfWar.filterVisibleUnits(
      player1Id,
      units,
      visibleHexes
    );

    expect(filtered.length).toBe(2);
    expect(filtered.find((u) => u._id.toString() === p1Unit._id.toString())).toBeDefined();
    expect(filtered.find((u) => u._id.toString() === p2UnitVisible._id.toString())).toBeDefined();
    expect(filtered.find((u) => u._id.toString() === p2UnitHidden._id.toString())).toBeUndefined();
  });
});
