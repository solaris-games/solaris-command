import { UnitSpecialist } from '../models';
import { SpecialistType } from '../types';

export const SPECIALIST_CATALOG: UnitSpecialist[] = [
  {
    id: "spec_artillery_01",
    type: SpecialistType.ARTILLERY,
    name: "Railgun Battery",
    description: "Long-range kinetic bombardment. Applies an Artillery Shift before main combat begins.",
    cost: 150,
    stats: {
      attack: 2,
      defense: 0,
      armor: 0,
      artillery: 1,
      siege: 0,
      logistics: false
    }
  },
  {
    id: "spec_marines_01",
    type: SpecialistType.MARINES,
    name: "Orbital Drop Corps",
    description: "Elite infantry for boarding actions and planetary assault. Negates defensive bonuses of Stations and Planets.",
    cost: 100,
    stats: {
      attack: 1,
      defense: 1,
      armor: 0,
      artillery: 0,
      siege: 2,
      logistics: false
    }
  },
  {
    id: "spec_recon_01",
    type: SpecialistType.RECON,
    name: "AWACS Wing",
    description: "Advanced sensors and electronic warfare. Captures adjacent hexes during movement and allows retreat through enemy ZOC.",
    cost: 75,
    stats: {
      attack: 0,
      defense: 1,
      armor: 0,
      artillery: 0,
      siege: 0,
      logistics: false
    }
  },
  {
    id: "spec_logistics_01",
    type: SpecialistType.LOGISTICS,
    name: "Fleet Tender",
    description: "Carries fuel and repair drones. Extends the unit's Out of Supply grace period by 1 Cycle.",
    cost: 125,
    stats: {
      attack: 0,
      defense: 0,
      armor: 0,
      artillery: 0,
      siege: 0,
      logistics: true
    }
  },
  {
    id: "spec_torpedo_01",
    type: SpecialistType.TORPEDO,
    name: "Strike Bombers",
    description: "Dedicated anti-capital ship munitions. Negates the Armor Shift of heavy targets.",
    cost: 125,
    stats: {
      attack: 3,
      defense: 0,
      armor: 0,
      artillery: 0,
      siege: 0,
      logistics: false
    }
  },
  {
    id: "spec_flak_01",
    type: SpecialistType.FLAK,
    name: "CIWS Network",
    description: "Point-defense grid. Provides high defense and prioritized suppression against enemy Specialists.",
    cost: 100,
    stats: {
      attack: 1,
      defense: 3,
      armor: 1,
      artillery: 0,
      siege: 0,
      logistics: false
    }
  }
];

// Helper to find by Type quickly (Useful for lookup during combat logic)
export const SPECIALIST_MAP = new Map<SpecialistType, UnitSpecialist>(
  SPECIALIST_CATALOG.map(s => [s.type, s])
);

// Helper to find by ID (Useful for the Shop/Purchase logic)
export const SPECIALIST_ID_MAP = new Map<string, UnitSpecialist>(
  SPECIALIST_CATALOG.map(s => [s.id, s])
);