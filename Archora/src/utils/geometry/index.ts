export {
  distance,
  pointsEqual,
  polygonArea,
  polygonCentroid,
  pointInPolygon,
  boundingBox,
  snapToGrid,
  snapPointToGrid,
  rectangleFitsInPolygon,
  pointToSegmentDistance,
  segmentsIntersect,
} from './polygonUtils';

export {
  buildWallGraph,
  wallLength,
  otherEndpoint,
} from './wallGraph';
export type { TracedRoom, WallGraphAnalysis } from './wallGraph';

export {
  validateBlueprint,
  violationSummary,
} from './blueprintValidator';
export type { Violation, ViolationSeverity } from './blueprintValidator';

export { autoRepairBlueprint } from './autoRepair';
export type { RepairReport } from './autoRepair';

export { ScaleBar } from './ScaleBar';
