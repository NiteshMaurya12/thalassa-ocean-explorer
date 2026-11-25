import {
  MAX_OCEAN_DEPTH,
  OCEAN_ZONES,
  MARINE_ORGANISMS,
} from '../data/oceanData';
import { MarineOrganismData, OceanZoneData } from '../types/ocean';

/**
 * Clamp any depth input into valid ocean bounds [0, MAX_OCEAN_DEPTH].
 */
export function clampDepth(depth: number): number {
  if (!Number.isFinite(depth)) return 0;
  return Math.max(0, Math.min(MAX_OCEAN_DEPTH, Math.round(depth)));
}

/**
 * Calculate approximate hydrostatic pressure in atmospheres (atm).
 * Formula: P(z) = P0 + (rho * g * z) / 101325
 * Assumptions:
 * - P0 = 1.0 atm standard atmospheric surface pressure
 * - rho = 1027 kg/m^3 average seawater column density
 * - g = 9.80665 m/s^2 standard gravitational acceleration
 * - 1 atm = 101,325 Pascals
 */
export function calculateHydrostaticPressureAtm(depthMetres: number): number {
  const z = Math.max(0, depthMetres);
  const rho = 1027; // kg/m^3
  const g = 9.80665; // m/s^2
  const pascalsPerAtm = 101325;
  const pressureAtm = 1.0 + (rho * g * z) / pascalsPerAtm;
  return Number(pressureAtm.toFixed(1));
}

/**
 * Calculate illustrative solar irradiance percentage remaining at depth (0% to 100%).
 * - 0m: 100%
 * - 200m (photic boundary): ~1.0%
 * - 200m to 1000m (dysphotic): decays from 1.0% to 0.0%
 * - >= 1000m (aphotic): 0.0%
 */
export function calculateSunlightPercentage(depthMetres: number): number {
  const z = Math.max(0, depthMetres);
  if (z === 0) return 100;
  if (z >= 1000) return 0;
  if (z <= 200) {
    // Exponential decay such that I(200) = 1.0% -> k = ln(100) / 200 ≈ 0.02302585
    const k = Math.log(100) / 200;
    const pct = 100 * Math.exp(-k * z);
    return Number(pct.toFixed(2));
  }
  // 200m to 1000m: decay from 1.0% to 0%
  const t = (z - 200) / 800;
  const pct = 1.0 * Math.exp(-5 * t) * (1 - t);
  return Number(Math.max(0, pct).toFixed(3));
}

/**
 * Calculate illustrative mid-latitude ocean temperature profile (°C).
 * Explicitly labelled as an illustrative mid-latitude reference profile.
 */
export function calculateIllustrativeTemperatureC(depthMetres: number): number {
  const z = Math.max(0, depthMetres);
  if (z <= 50) {
    // Surface mixed layer: 22.0°C down to 20.0°C
    return Number((22.0 - (z / 50) * 2.0).toFixed(1));
  }
  if (z <= 200) {
    // Upper thermocline: 20.0°C down to 14.5°C
    const t = (z - 50) / 150;
    return Number((20.0 - t * 5.5).toFixed(1));
  }
  if (z <= 1000) {
    // Permanent thermocline: 14.5°C down to 4.2°C
    const t = (z - 200) / 800;
    return Number((14.5 - Math.pow(t, 0.75) * 10.3).toFixed(1));
  }
  if (z <= 4000) {
    // Bathypelagic: 4.2°C down to 1.8°C
    const t = (z - 1000) / 3000;
    return Number((4.2 - t * 2.4).toFixed(1));
  }
  if (z <= 6000) {
    // Abyssopelagic: 1.8°C down to 1.2°C
    const t = (z - 4000) / 2000;
    return Number((1.8 - t * 0.6).toFixed(1));
  }
  // Hadal: 1.2°C with slight adiabatic compression warming to 1.6°C at 10,935m
  const t = Math.min(1, (z - 6000) / (MAX_OCEAN_DEPTH - 6000));
  return Number((1.2 + t * 0.4).toFixed(1));
}

/**
 * Return the active OceanZoneData for a given depth in metres.
 */
export function getZoneForDepth(depthMetres: number): OceanZoneData {
  const z = clampDepth(depthMetres);
  for (const zone of OCEAN_ZONES) {
    if (z >= zone.minDepth && z <= zone.maxDepth) {
      return zone;
    }
  }
  return OCEAN_ZONES[OCEAN_ZONES.length - 1];
}

/**
 * Filter marine organisms visible within or near the selected depth.
 * An organism is considered visible at depth `z` if `z` falls within its
 * illustrative depth range `[illustrativeMinDepth, illustrativeMaxDepth]`.
 */
export function getVisibleOrganismsAtDepth(
  depthMetres: number,
  toleranceMetres = 0
): MarineOrganismData[] {
  const z = clampDepth(depthMetres);
  return MARINE_ORGANISMS.filter(
    (org) =>
      z >= org.illustrativeMinDepth - toleranceMetres &&
      z <= org.illustrativeMaxDepth + toleranceMetres
  );
}

/**
 * Compute true proportional percentage of total ocean depth (0 to 100).
 * Used so the Depth Comparison Visualization maintains accurate scale proportions.
 */
export function getProportionalDepthPercent(depthMetres: number): number {
  const z = clampDepth(depthMetres);
  return Number(((z / MAX_OCEAN_DEPTH) * 100).toFixed(4));
}

/**
 * Map ocean depth in metres [0, 10935] to 3D scene vertical Y coordinate.
 * We use a non-linear piece-wise visual coordinate mapping in 3D space so that
 * the user gets rich vertical spatial density in the 0-200m and 200-1000m zones
 * while still traversing a massive vertical column down to -220 units at 10,935m.
 */
export function depthToWorldY(depthMetres: number): number {
  const z = clampDepth(depthMetres);
  if (z === 0) return 0;
  if (z <= 200) {
    // 0 -> 200m maps to 0 -> -36 world units
    return -(z / 200) * 36;
  }
  if (z <= 1000) {
    // 200 -> 1000m maps to -36 -> -84 world units (48 units)
    return -36 - ((z - 200) / 800) * 48;
  }
  if (z <= 4000) {
    // 1000 -> 4000m maps to -84 -> -136 world units (52 units)
    return -84 - ((z - 1000) / 3000) * 52;
  }
  if (z <= 6000) {
    // 4000 -> 6000m maps to -136 -> -176 world units (40 units)
    return -136 - ((z - 4000) / 2000) * 40;
  }
  // 6000 -> 10935m maps to -176 -> -225 world units (49 units)
  return -176 - ((z - 6000) / (MAX_OCEAN_DEPTH - 6000)) * 49;
}
