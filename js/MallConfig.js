export const MALL_WIDTH = 56;
export const MALL_DEPTH = 44;
export const WALL_HEIGHT = 4;
export const WALL_THICKNESS = 0.5;
export const INNER_MARGIN = 1.2;

export const PLAYER_BOUNDS = {
  minX: -MALL_WIDTH / 2 + INNER_MARGIN + WALL_THICKNESS,
  maxX: MALL_WIDTH / 2 - INNER_MARGIN - WALL_THICKNESS,
  minZ: -MALL_DEPTH / 2 + INNER_MARGIN + WALL_THICKNESS,
  maxZ: MALL_DEPTH / 2 - INNER_MARGIN - WALL_THICKNESS
};

export const AISLE_COUNT = 10;

export const DIFFICULTIES = {
  easy: { label: 'Easy', items: 3, enemies: 3 },
  normal: { label: 'Normal', items: 5, enemies: 3 },
  hard: { label: 'Hard', items: 7, enemies: 3 },
  blackFriday: { label: 'Black Friday', items: 10, enemies: 5 }
};

export const DEFAULT_DIFFICULTY = 'normal';
/** Yell scare — flee duration, player cooldown, and targeting range. */
export const SCARE_DURATION = 3;
export const SCARE_COOLDOWN = 12;
export const SCARE_DISTANCE = 5;
export const SHELF_LEVELS = 4;
export const SHELF_LEVEL_H = 0.62;
export const SHELF_DEPTH = 1.38;
