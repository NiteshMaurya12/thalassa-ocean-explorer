export type ZoneId = 'epipelagic' | 'mesopelagic' | 'bathypelagic' | 'abyssopelagic' | 'hadal';

export type OrganismModelType =
  | 'blue_whale'
  | 'sea_turtle'
  | 'dolphin'
  | 'tuna'
  | 'lanternfish'
  | 'jellyfish'
  | 'sperm_whale'
  | 'anglerfish'
  | 'vampire_squid'
  | 'deep_jellyfish'
  | 'giant_isopod'
  | 'sea_cucumber'
  | 'deep_crab'
  | 'hadal_snailfish'
  | 'amphipod';

export interface OceanZoneData {
  id: ZoneId;
  name: string;
  subtitle: string;
  minDepth: number;
  maxDepth: number;
  lightLevelDescription: string;
  pressureRangeAtm: string;
  temperatureRangeC: string;
  summary: string;
  environmentalTraits: string[];
  colorHex: string;
  accentHex: string;
  fogHex: string;
}

export interface MarineOrganismData {
  id: string;
  commonName: string;
  scientificName: string;
  zoneId: ZoneId;
  /** Illustrative depth range in the 3D explorer (metres) */
  illustrativeMinDepth: number;
  illustrativeMaxDepth: number;
  /** Center depth where camera focuses when clicking "Explore Depth Range" */
  characteristicDepth: number;
  /** Verified literature depth range string for educational distinction */
  verifiedDepthRecord: string;
  habitat: string;
  shortDescription: string;
  adaptations: string[];
  sizeEstimate: string;
  bioluminescent: boolean;
  modelType: OrganismModelType;
  primaryColor: string;
  secondaryColor: string;
  emissiveColor: string;
  /** 3D horizontal offset in scene */
  sceneOffsetX: number;
  sceneOffsetZ: number;
}

export interface DepthLandmark {
  id: string;
  depth: number;
  title: string;
  category: 'zone' | 'exploration' | 'biology' | 'geology';
  description: string;
}

export interface TrenchData {
  id: string;
  name: string;
  oceanBasin: string;
  maxDepthMetres: number;
  deepestPointName: string;
  lengthKm: number;
  pressureAtm: number;
  tectonicPlates: string;
  notableDescent: string;
  description: string;
  coordinates: string;
}

export interface OceanFactData {
  id: string;
  category: 'pressure' | 'sunlight' | 'temperature' | 'geography';
  title: string;
  metricValue: string;
  metricUnit: string;
  formulaOrPrinciple: string;
  summary: string;
  details: string;
  dataPoints: { label: string; depthM: number; value: string }[];
}

export interface DiscoveryMilestone {
  id: string;
  year: string;
  title: string;
  depthMetres: number;
  vesselOrMethod: string;
  region: string;
  summary: string;
  scientificImpact: string;
}
