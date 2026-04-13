/**
 * wallGraph.ts — Wall connectivity analysis for architectural blueprints.
 *
 * Builds a graph from wall endpoints, finds connected components,
 * traces closed room polygons, and validates wall topology.
 */

import type { Wall, Vector2D } from '../../types/blueprint';
import { distance, pointsEqual, polygonArea, polygonCentroid } from './polygonUtils';

/** A node in the wall graph — a unique endpoint where walls meet. */
interface WallNode {
  id: string;
  position: Vector2D;
  /** Wall IDs that have an endpoint at this node. */
  wallIds: string[];
}

/** A traced room polygon derived from wall geometry. */
export interface TracedRoom {
  wallIds: string[];
  vertices: Vector2D[];
  area: number;
  centroid: Vector2D;
}

/** Result of wall graph analysis. */
export interface WallGraphAnalysis {
  nodes: WallNode[];
  /** Walls that have at least one endpoint not connected to any other wall. */
  floatingWalls: string[];
  /** Walls where both endpoints connect to the graph. */
  connectedWalls: string[];
  /** Closed room polygons traced from the wall graph. */
  tracedRooms: TracedRoom[];
  /** Endpoints that connect to only one wall (dead ends). */
  deadEnds: Vector2D[];
}

/**
 * Build a wall connectivity graph.
 *
 * Two wall endpoints are considered connected if they are within `tolerance` metres.
 * Default tolerance = 0.1m (10cm) to account for AI coordinate imprecision.
 */
export function buildWallGraph(walls: Wall[], tolerance = 0.1): WallGraphAnalysis {
  if (walls.length === 0) {
    return { nodes: [], floatingWalls: [], connectedWalls: [], tracedRooms: [], deadEnds: [] };
  }

  // 1. Collect all unique endpoints (merge nearby points)
  const nodes: WallNode[] = [];

  function findOrCreateNode(point: Vector2D): WallNode {
    for (const node of nodes) {
      if (pointsEqual(node.position, point, tolerance)) {
        return node;
      }
    }
    const node: WallNode = {
      id: `node_${nodes.length}`,
      position: { x: point.x, y: point.y },
      wallIds: [],
    };
    nodes.push(node);
    return node;
  }

  // Map each wall to its start/end nodes
  const wallNodeMap = new Map<string, { startNode: WallNode; endNode: WallNode }>();

  for (const wall of walls) {
    const startNode = findOrCreateNode(wall.start);
    const endNode = findOrCreateNode(wall.end);
    if (!startNode.wallIds.includes(wall.id)) startNode.wallIds.push(wall.id);
    if (!endNode.wallIds.includes(wall.id)) endNode.wallIds.push(wall.id);
    wallNodeMap.set(wall.id, { startNode, endNode });
  }

  // 2. Classify walls as floating vs connected
  const floatingWalls: string[] = [];
  const connectedWalls: string[] = [];

  for (const wall of walls) {
    const entry = wallNodeMap.get(wall.id);
    if (!entry) continue;
    const { startNode, endNode } = entry;
    // A wall is floating if either endpoint connects to only itself
    const startConnected = startNode.wallIds.length > 1;
    const endConnected = endNode.wallIds.length > 1;
    if (!startConnected || !endConnected) {
      floatingWalls.push(wall.id);
    } else {
      connectedWalls.push(wall.id);
    }
  }

  // 3. Find dead ends (nodes with only one wall)
  const deadEnds = nodes
    .filter(n => n.wallIds.length === 1)
    .map(n => n.position);

  // 4. Trace closed room polygons using wall adjacency
  const tracedRooms = traceRoomPolygons(walls, nodes, wallNodeMap);

  return { nodes, floatingWalls, connectedWalls, tracedRooms, deadEnds };
}

/**
 * Trace closed polygons from the wall graph.
 *
 * Uses a planar face tracing algorithm:
 * At each node, sort outgoing edges by angle and follow the "next right" edge.
 * This produces all minimal closed faces in the planar graph.
 */
function traceRoomPolygons(
  walls: Wall[],
  nodes: WallNode[],
  wallNodeMap: Map<string, { startNode: WallNode; endNode: WallNode }>,
): TracedRoom[] {
  if (walls.length < 3) return [];

  // Build adjacency: node -> list of { neighborNode, wallId, angle }
  type Edge = { neighborNode: WallNode; wallId: string; angle: number };
  const adjacency = new Map<string, Edge[]>();

  for (const wall of walls) {
    const entry = wallNodeMap.get(wall.id);
    if (!entry) continue;
    const { startNode, endNode } = entry;

    const angleForward = Math.atan2(
      endNode.position.y - startNode.position.y,
      endNode.position.x - startNode.position.x,
    );
    const angleReverse = Math.atan2(
      startNode.position.y - endNode.position.y,
      startNode.position.x - endNode.position.x,
    );

    if (!adjacency.has(startNode.id)) adjacency.set(startNode.id, []);
    if (!adjacency.has(endNode.id)) adjacency.set(endNode.id, []);

    adjacency.get(startNode.id)!.push({
      neighborNode: endNode,
      wallId: wall.id,
      angle: angleForward,
    });
    adjacency.get(endNode.id)!.push({
      neighborNode: startNode,
      wallId: wall.id,
      angle: angleReverse,
    });
  }

  // Sort edges at each node by angle
  for (const edges of adjacency.values()) {
    edges.sort((a, b) => a.angle - b.angle);
  }

  // Track used directed edges (wallId + direction)
  const usedEdges = new Set<string>();
  const rooms: TracedRoom[] = [];

  function directedEdgeKey(fromNodeId: string, wallId: string): string {
    return `${fromNodeId}:${wallId}`;
  }

  // For each directed edge, trace a face
  for (const wall of walls) {
    const entry = wallNodeMap.get(wall.id);
    if (!entry) continue;

    for (const [startNode, endNode] of [
      [entry.startNode, entry.endNode],
      [entry.endNode, entry.startNode],
    ] as [WallNode, WallNode][]) {
      const startKey = directedEdgeKey(startNode.id, wall.id);
      if (usedEdges.has(startKey)) continue;

      // Trace the face
      const faceVertices: Vector2D[] = [];
      const faceWallIds: string[] = [];
      let currentNode = startNode;
      let currentWallId = wall.id;
      let nextNode = endNode;
      let steps = 0;
      const maxSteps = walls.length * 2 + 2;

      while (steps < maxSteps) {
        const edgeKey = directedEdgeKey(currentNode.id, currentWallId);
        if (usedEdges.has(edgeKey)) break;
        usedEdges.add(edgeKey);

        faceVertices.push(currentNode.position);
        if (!faceWallIds.includes(currentWallId)) {
          faceWallIds.push(currentWallId);
        }

        // At nextNode, find the "next right turn" edge
        const edges = adjacency.get(nextNode.id);
        if (!edges || edges.length === 0) break;

        // Incoming angle (from currentNode to nextNode)
        const incomingAngle = Math.atan2(
          nextNode.position.y - currentNode.position.y,
          nextNode.position.x - currentNode.position.x,
        );
        // Reverse it to get the direction we came from
        const fromAngle = incomingAngle + Math.PI;

        // Find the next edge going clockwise from fromAngle
        let bestEdge: Edge | null = null;
        let bestAngleDiff = Infinity;

        for (const edge of edges) {
          if (edge.wallId === currentWallId &&
              edge.neighborNode.id === currentNode.id) {
            continue; // Don't go back the way we came
          }
          // Angle difference (clockwise from fromAngle)
          let diff = edge.angle - fromAngle;
          while (diff <= 0) diff += 2 * Math.PI;
          while (diff > 2 * Math.PI) diff -= 2 * Math.PI;
          if (diff < bestAngleDiff) {
            bestAngleDiff = diff;
            bestEdge = edge;
          }
        }

        if (!bestEdge) break;

        currentNode = nextNode;
        currentWallId = bestEdge.wallId;
        nextNode = bestEdge.neighborNode;
        steps++;

        // Check if we're back to the start
        if (currentNode.id === startNode.id && currentWallId === wall.id) {
          break;
        }
      }

      // Valid room if we traced a closed polygon with 3+ vertices
      if (faceVertices.length >= 3 && faceWallIds.length >= 3) {
        const area = polygonArea(faceVertices);
        // Filter out the outer boundary (largest polygon) and tiny slivers
        if (area > 1.0 && area < 500) {
          rooms.push({
            wallIds: faceWallIds,
            vertices: faceVertices,
            area,
            centroid: polygonCentroid(faceVertices),
          });
        }
      }
    }
  }

  // Deduplicate rooms (same wall set traced from different starting edges)
  const uniqueRooms: TracedRoom[] = [];
  const seenWallSets = new Set<string>();

  for (const room of rooms) {
    const key = [...room.wallIds].sort().join(',');
    if (!seenWallSets.has(key)) {
      seenWallSets.add(key);
      uniqueRooms.push(room);
    }
  }

  return uniqueRooms;
}

/**
 * Get the other endpoint of a wall relative to a given point.
 */
export function otherEndpoint(wall: Wall, point: Vector2D, tolerance = 0.1): Vector2D {
  if (pointsEqual(wall.start, point, tolerance)) return wall.end;
  return wall.start;
}

/**
 * Calculate actual wall length from start/end coordinates.
 */
export function wallLength(wall: Wall): number {
  return distance(wall.start, wall.end);
}
