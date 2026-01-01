import { describe, it, expect } from "vitest";
import { HexUtils } from "./hex-utils";
import { HexCoords } from "../types/geometry";

describe("HexUtils", () => {
  const center: HexCoords = { q: 0, r: 0, s: 0 };
  const neighborE: HexCoords = { q: 1, r: 0, s: -1 }; // East
  const neighborNE: HexCoords = { q: 1, r: -1, s: 0 }; // North East

  describe("Basic Operations", () => {
    it("equals should return true for same coordinates", () => {
      expect(HexUtils.equals(center, { q: 0, r: 0, s: 0 })).toBe(true);
    });

    it("equals should return false for different coordinates", () => {
      expect(HexUtils.equals(center, neighborE)).toBe(false);
    });

    it("add should combine two coordinates", () => {
      const result = HexUtils.add(center, neighborE);
      expect(result).toEqual(neighborE);

      const result2 = HexUtils.add(neighborE, neighborE);
      expect(result2).toEqual({ q: 2, r: 0, s: -2 });
    });

    it("subtract should calculate difference", () => {
      const result = HexUtils.subtract(neighborE, center);
      expect(result).toEqual(neighborE);

      const result2 = HexUtils.subtract(center, neighborE);
      expect(result2).toEqual({ q: -1, r: 0, s: 1 });
    });

    it("scale should multiply coordinates", () => {
      const result = HexUtils.scale(neighborE, 2);
      expect(result).toEqual({ q: 2, r: 0, s: -2 });
    });
  });

  describe("Distance & Neighbors", () => {
    it("distance should be correct for adjacent hexes", () => {
      expect(HexUtils.distance(center, neighborE)).toBe(1);
    });

    it("distance should work for non-adjacent hexes", () => {
      const farHex = { q: 2, r: -2, s: 0 };
      expect(HexUtils.distance(center, farHex)).toBe(2);
    });

    it("direction should return correct vector for index", () => {
      // 0 is East-ish (1, 0, -1) based on HEX_DIRECTIONS
      expect(HexUtils.direction(0)).toEqual(neighborE);
    });

    it("neighbor should return correct adjacent hex", () => {
      const result = HexUtils.neighbor(center, 0);
      expect(result).toEqual(neighborE);
    });

    it("neighbors should return all 6 surrounding hexes", () => {
      const neighbors = HexUtils.neighbors(center);
      expect(neighbors).toHaveLength(6);
      // Check specific known neighbor
      expect(neighbors).toContainEqual(neighborE);
      expect(neighbors).toContainEqual(neighborNE);
    });
  });

  describe("Range & Rings", () => {
    it("getHexCoordsInRange (radius 0) should return only center", () => {
      const range = HexUtils.getHexCoordsInRange(center, 0);
      expect(range).toHaveLength(1);
      expect(range[0]).toEqual(center);
    });

    it("getHexCoordsInRange (radius 1) should return center + 6 neighbors", () => {
      const range = HexUtils.getHexCoordsInRange(center, 1);
      expect(range).toHaveLength(7); // 1 + 6
    });

    it("getHexCoordsInRange (radius 2) should return 19 hexes", () => {
      // Formula: 3n(n+1) + 1 => 3*2(3) + 1 = 19
      const range = HexUtils.getHexCoordsInRange(center, 2);
      expect(range).toHaveLength(19);
    });

    it("getHexCoordsInRing (radius 0) should return center", () => {
      const ring = HexUtils.getHexCoordsInRing(center, 0);
      expect(ring).toHaveLength(1);
      expect(ring[0]).toEqual(center);
    });

    it("getHexCoordsInRing (radius 1) should return 6 hexes", () => {
      const ring = HexUtils.getHexCoordsInRing(center, 1);
      expect(ring).toHaveLength(6);
    });

    it("getHexCoordsInRing (radius 2) should return 12 hexes", () => {
      // Ring size is usually radius * 6
      const ring = HexUtils.getHexCoordsInRing(center, 2);
      expect(ring).toHaveLength(12);
    });
  });

  describe("Serialization", () => {
    it("getID should return correct string format", () => {
      expect(HexUtils.getCoordsID(center)).toBe("0,0,0");
      expect(HexUtils.getCoordsID(neighborE)).toBe("1,0,-1");
    });

    it("parseCoordsID should reverse getCoordsID", () => {
      const id = "1,-2,1";
      const coord = HexUtils.parseCoordsID(id);
      expect(coord).toEqual({ q: 1, r: -2, s: 1 });
    });
  });
});
