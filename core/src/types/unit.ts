export enum UnitClass {
  FRIGATE = 'FRIGATE', // High initiative
  DESTROYER = 'DESTROYER', // Mid initiative
  BATTLESHIP = 'BATTLESHIP' // Low initiative
}

export enum UnitStatus {
  IDLE = 'IDLE',
  MOVING = 'MOVING',
  PREPARING = 'PREPARING', // Locked in combat countdown
  REGROUPING = 'REGROUPING' // Cooldown after combat
}

export enum SpecialistType {
  ARTILLERY = 'ARTILLERY',   // Indirect fire / Offensive Shift
  MARINES = 'MARINES',       // Assault / Planet Capture
  RECON = 'RECON',           // Intel / ZOC movement
  LOGISTICS = 'LOGISTICS',   // OOS Survival
  TORPEDO = 'TORPEDO',       // Anti-Capital Ship (Armor Piercing)
  FLAK = 'FLAK'              // Defensive / Anti-Specialist
}