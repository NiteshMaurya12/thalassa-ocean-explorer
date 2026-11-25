import test from 'node:test';
import assert from 'node:assert/strict';
import {
  clampDepth,
  calculateHydrostaticPressureAtm,
  calculateSunlightPercentage,
  calculateIllustrativeTemperatureC,
  getZoneForDepth,
  getVisibleOrganismsAtDepth,
  getProportionalDepthPercent,
  depthToWorldY,
} from './oceanMath';
import { MAX_OCEAN_DEPTH, OCEAN_ZONES } from '../data/oceanData';

test('clampDepth restricts values to [0, MAX_OCEAN_DEPTH]', () => {
  assert.equal(clampDepth(-50), 0);
  assert.equal(clampDepth(0), 0);
  assert.equal(clampDepth(500.4), 500);
  assert.equal(clampDepth(15000), MAX_OCEAN_DEPTH);
  assert.equal(clampDepth(Number.NaN), 0);
});

test('calculateHydrostaticPressureAtm computes accurate hydrostatic approximation', () => {
  assert.equal(calculateHydrostaticPressureAtm(0), 1.0);
  // At 100m: 1 + (1027 * 9.80665 * 100) / 101325 ≈ 10.94 -> 10.9 atm
  assert.equal(calculateHydrostaticPressureAtm(100), 10.9);
  // At 1000m: 1 + (1027 * 9.80665 * 1000) / 101325 ≈ 100.397 -> 100.4 atm
  assert.equal(calculateHydrostaticPressureAtm(1000), 100.4);
  // At Challenger Deep (10,935m): ≈ 1087.9 atm
  assert.equal(calculateHydrostaticPressureAtm(10935), 1087.9);
});

test('calculateSunlightPercentage decays exponentially and reaches 0 at 1000m', () => {
  assert.equal(calculateSunlightPercentage(0), 100);
  assert.equal(calculateSunlightPercentage(200), 1.0);
  assert.ok(calculateSunlightPercentage(500) < 1.0 && calculateSunlightPercentage(500) > 0);
  assert.equal(calculateSunlightPercentage(1000), 0);
  assert.equal(calculateSunlightPercentage(6000), 0);
});

test('calculateIllustrativeTemperatureC reflects thermocline and abyssal cold', () => {
  const surfaceTemp = calculateIllustrativeTemperatureC(0);
  const twilightTemp = calculateIllustrativeTemperatureC(500);
  const abyssalTemp = calculateIllustrativeTemperatureC(5000);
  assert.ok(surfaceTemp > twilightTemp);
  assert.ok(twilightTemp > abyssalTemp);
  assert.ok(abyssalTemp >= 1.0 && abyssalTemp <= 2.5);
});

test('getZoneForDepth maps all five ocean depth zones accurately', () => {
  assert.equal(getZoneForDepth(0).id, 'epipelagic');
  assert.equal(getZoneForDepth(199).id, 'epipelagic');
  assert.equal(getZoneForDepth(250).id, 'mesopelagic');
  assert.equal(getZoneForDepth(1500).id, 'bathypelagic');
  assert.equal(getZoneForDepth(4500).id, 'abyssopelagic');
  assert.equal(getZoneForDepth(8000).id, 'hadal');
  assert.equal(getZoneForDepth(10935).id, 'hadal');
});

test('getVisibleOrganismsAtDepth returns representative species for each zone', () => {
  const surfaceSpecies = getVisibleOrganismsAtDepth(50);
  assert.ok(surfaceSpecies.some((s) => s.id === 'blue-whale'));
  assert.ok(!surfaceSpecies.some((s) => s.id === 'anglerfish'));

  const midnightSpecies = getVisibleOrganismsAtDepth(1650);
  assert.ok(midnightSpecies.some((s) => s.id === 'anglerfish'));

  const hadalSpecies = getVisibleOrganismsAtDepth(7500);
  assert.ok(hadalSpecies.some((s) => s.id === 'hadal-snailfish'));
});

test('getProportionalDepthPercent preserves non-equal true scale proportions', () => {
  const epipelagicSpan = getProportionalDepthPercent(200) - getProportionalDepthPercent(0);
  const bathypelagicSpan = getProportionalDepthPercent(4000) - getProportionalDepthPercent(1000);
  // 200m is ~1.83% of 10,935m, whereas 3000m is ~27.43%
  assert.ok(epipelagicSpan < 2.5);
  assert.ok(bathypelagicSpan > 25);
  assert.equal(getProportionalDepthPercent(MAX_OCEAN_DEPTH), 100);
  assert.equal(OCEAN_ZONES.length, 5);
});

test('depthToWorldY decreases monotonically with depth', () => {
  assert.equal(depthToWorldY(0), 0);
  assert.ok(depthToWorldY(200) < depthToWorldY(0));
  assert.ok(depthToWorldY(1000) < depthToWorldY(200));
  assert.ok(depthToWorldY(4000) < depthToWorldY(1000));
  assert.ok(depthToWorldY(6000) < depthToWorldY(4000));
  assert.ok(depthToWorldY(10935) < depthToWorldY(6000));
});
