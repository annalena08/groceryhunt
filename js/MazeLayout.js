import { PLAYER_BOUNDS } from './MallConfig.js';

export const CELL = 3.6;
export const MAZE_COLS = 14;
export const MAZE_ROWS = 11;

/** 1 = shelf wall, 0 = walkable path. Row 0 = back, last row = front (entrance). */
export const MAZE_GRID = [
  [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
  [1, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 1],
  [1, 0, 1, 0, 1, 0, 1, 1, 0, 1, 1, 0, 1, 1],
  [1, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1],
  [1, 1, 1, 0, 1, 1, 1, 1, 0, 1, 0, 1, 0, 1],
  [1, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 1, 0, 1],
  [1, 0, 1, 1, 1, 0, 1, 0, 1, 0, 0, 0, 0, 1],
  [1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 1, 1, 0, 1],
  [1, 1, 0, 1, 1, 1, 1, 0, 1, 1, 1, 0, 0, 1],
  [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
  [1, 1, 1, 1, 1, 0, 0, 1, 1, 1, 1, 1, 1, 1]
];

/** Category alcoves — path cells where section signs are placed (aisle 0–9) */
export const CATEGORY_ROOMS = [
  { col: 2, row: 1, aisle: 0 },
  { col: 11, row: 1, aisle: 1 },
  { col: 2, row: 3, aisle: 2 },
  { col: 9, row: 3, aisle: 3 },
  { col: 3, row: 5, aisle: 4 },
  { col: 11, row: 5, aisle: 5 },
  { col: 2, row: 7, aisle: 6 },
  { col: 8, row: 7, aisle: 7 },
  { col: 3, row: 9, aisle: 8 },
  { col: 10, row: 9, aisle: 9 }
];

export function gridToWorld(col, row) {
  const x = PLAYER_BOUNDS.minX + col * CELL + CELL / 2;
  const z = PLAYER_BOUNDS.minZ + row * CELL + CELL / 2;
  return { x, z };
}

export function getCategoryRoomCenter(aisleIndex) {
  const room = CATEGORY_ROOMS.find(r => r.aisle === aisleIndex) ?? CATEGORY_ROOMS[0];
  return gridToWorld(room.col, room.row);
}

/** All walkable path cell centres */
export function getPathCells() {
  const paths = [];
  for (let row = 0; row < MAZE_ROWS; row++) {
    for (let col = 0; col < MAZE_COLS; col++) {
      if (MAZE_GRID[row][col] === 0) {
        paths.push({ col, row, ...gridToWorld(col, row) });
      }
    }
  }
  return paths;
}

/** BFS — assign each path cell to nearest category region */
export function buildPathRegions() {
  const region = Array.from({ length: MAZE_ROWS }, () => Array(MAZE_COLS).fill(-1));
  const queue = [];

  for (const room of CATEGORY_ROOMS) {
    if (MAZE_GRID[room.row][room.col] === 0) {
      region[room.row][room.col] = room.aisle;
      queue.push({ col: room.col, row: room.row });
    }
  }

  const dirs = [[0, 1], [0, -1], [1, 0], [-1, 0]];
  while (queue.length) {
    const { col, row } = queue.shift();
    const aisle = region[row][col];
    for (const [dc, dr] of dirs) {
      const nc = col + dc;
      const nr = row + dr;
      if (nc < 0 || nc >= MAZE_COLS || nr < 0 || nr >= MAZE_ROWS) continue;
      if (MAZE_GRID[nr][nc] !== 0 || region[nr][nc] !== -1) continue;
      region[nr][nc] = aisle;
      queue.push({ col: nc, row: nr });
    }
  }
  return region;
}

export function getEntrancePosition() {
  return gridToWorld(6, MAZE_ROWS - 1);
}

export function getMazeSpawnPoints() {
  return getPathCells();
}

export function nearestAisle(col, row) {
  let best = 0;
  let bestDist = Infinity;
  for (const room of CATEGORY_ROOMS) {
    const d = Math.hypot(col - room.col, row - room.row);
    if (d < bestDist) {
      bestDist = d;
      best = room.aisle;
    }
  }
  return best;
}
