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
/** Items required to checkout. Use 3 for debug, 10 for production. */
export const SHOPPING_LIST_SIZE = 3;
/** Angry customers in the maze. Use 1 for debug, 4 for production. */
export const ENEMY_COUNT = 4;
/** Yell scare — flee duration, player cooldown, and targeting range. */
export const SCARE_DURATION = 3;
export const SCARE_COOLDOWN = 12;
export const SCARE_DISTANCE = 5;
export const SHELF_LEVELS = 4;
export const SHELF_LEVEL_H = 0.62;
export const SHELF_DEPTH = 1.38;
