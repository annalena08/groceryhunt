import * as THREE from 'three';
import { CATEGORIES } from './ItemDatabase.js';
import { createItemMesh, createDecoyMesh } from './ItemFactory.js';
import {
  createFloorTexture,
  createCeilingTexture,
  createWallTexture,
  createShelfTexture,
  createSignTexture,
  createCategoryLabelTexture,
  createItemLabelSprite
} from './Textures.js';
import {
  MALL_WIDTH,
  MALL_DEPTH,
  WALL_HEIGHT,
  WALL_THICKNESS,
  INNER_MARGIN,
  PLAYER_BOUNDS,
  AISLE_COUNT,
  SHELF_LEVELS,
  SHELF_LEVEL_H,
  SHELF_DEPTH
} from './MallConfig.js';
import {
  MAZE_GRID,
  MAZE_COLS,
  MAZE_ROWS,
  CELL,
  CATEGORY_ROOMS,
  gridToWorld,
  getCategoryRoomCenter,
  buildPathRegions,
  getEntrancePosition,
  nearestAisle
} from './MazeLayout.js';
import { createCashierStation } from './CashierNPC.js';

export {
  MALL_WIDTH,
  MALL_DEPTH,
  WALL_HEIGHT,
  PLAYER_BOUNDS,
  AISLE_COUNT
} from './MallConfig.js';

export { getCategoryRoomCenter as getBayCenterX } from './MazeLayout.js';

export class MallScene {
  constructor() {
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x87ceeb);
    this.scene.fog = new THREE.Fog(0xcccccc, 28, 55);

    this.colliders = [];
    this.collectibles = [];
    this.aisleZones = [];
    this.shelfSlots = [];
    this.pathRegions = buildPathRegions();
    this.cashier = null;

    this._buildLighting();
    this._buildStructure();
    this._buildCashier();
  }

  _buildLighting() {
    this.scene.add(new THREE.AmbientLight(0xffffff, 0.55));
    this.scene.add(new THREE.HemisphereLight(0xffffff, 0x555555, 0.35));

    for (const room of CATEGORY_ROOMS) {
      const { x, z } = gridToWorld(room.col, room.row);
      const light = new THREE.PointLight(0xffffee, 65, 14);
      light.position.set(x, WALL_HEIGHT - 0.4, z);
      this.scene.add(light);
    }

    const dir = new THREE.DirectionalLight(0xffffff, 0.25);
    dir.position.set(0, 12, 8);
    this.scene.add(dir);
  }

  _buildStructure() {
    const floorTex = createFloorTexture();
    const ceilTex = createCeilingTexture();
    const extWallTex = createWallTexture('#b8b0a0');
    const intWallTex = createWallTexture('#d8d0c4');
    const shelfTex = createShelfTexture();

    const floor = new THREE.Mesh(
      new THREE.PlaneGeometry(MALL_WIDTH, MALL_DEPTH),
      new THREE.MeshStandardMaterial({ map: floorTex, roughness: 0.8 })
    );
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    this.scene.add(floor);

    const ceiling = new THREE.Mesh(
      new THREE.PlaneGeometry(MALL_WIDTH, MALL_DEPTH),
      new THREE.MeshStandardMaterial({ map: ceilTex, roughness: 0.9 })
    );
    ceiling.rotation.x = Math.PI / 2;
    ceiling.position.y = WALL_HEIGHT;
    this.scene.add(ceiling);

    this._buildOuterWalls(extWallTex, intWallTex);
    this._buildMazeShelves(shelfTex);
    this._buildCategorySigns();
    this._buildPathMarkers();
  }

  _buildMazeShelves(shelfTex) {
    const shelfMat = new THREE.MeshStandardMaterial({ map: shelfTex, roughness: 0.7 });
    const catKeys = Object.keys(CATEGORIES);

    for (let row = 0; row < MAZE_ROWS; row++) {
      for (let col = 0; col < MAZE_COLS; col++) {
        if (MAZE_GRID[row][col] !== 1) continue;

        const aisle = nearestAisle(col, row);
        const cat = CATEGORIES[catKeys[aisle]];
        const backColor = '#' + cat.color.toString(16).padStart(6, '0');
        const backMat = new THREE.MeshStandardMaterial({
          map: createWallTexture(backColor),
          roughness: 0.85
        });

        const { x, z } = gridToWorld(col, row);
        this._addMazeShelfBlock(x, z, shelfMat, backMat, cat, catKeys[aisle], aisle, col, row);
      }
    }
  }

  _addMazeShelfBlock(x, z, shelfMat, backMat, category, catKey, aisleIndex, col, row) {
    const group = new THREE.Group();
    group.position.set(x, 0, z);

    const half = CELL / 2;
    const span = CELL - 0.22;
    const totalH = SHELF_LEVELS * SHELF_LEVEL_H + 0.35;

    const dirs = [
      { dx: 0, dz: -1 },
      { dx: 0, dz: 1 },
      { dx: -1, dz: 0 },
      { dx: 1, dz: 0 }
    ];

    let facadeCount = 0;
    let labeled = false;

    for (const dir of dirs) {
      const nc = col + dir.dx;
      const nr = row + dir.dz;
      const facesPath =
        nc >= 0 && nc < MAZE_COLS && nr >= 0 && nr < MAZE_ROWS && MAZE_GRID[nr][nc] === 0;
      if (!facesPath) continue;

      facadeCount++;
      this._buildShelfFacade(group, dir, category, shelfMat, backMat, aisleIndex, x, z, !labeled);
      labeled = true;
    }

    // Interior backing for cells not open on all sides (avoids see-through gaps)
    if (facadeCount > 0 && facadeCount < 4) {
      const inner = new THREE.Mesh(
        new THREE.BoxGeometry(span * 0.6, totalH * 0.85, span * 0.6),
        backMat
      );
      inner.position.set(0, totalH * 0.45, 0);
      group.add(inner);
    }

    // Fully enclosed wall cell — compact stock shelf
    if (facadeCount === 0) {
      this._buildStockShelf(group, span, totalH, shelfMat, backMat, category);
    }

    this.scene.add(group);

    this.colliders.push({
      minX: x - half + 0.1,
      maxX: x + half - 0.1,
      minZ: z - half + 0.1,
      maxZ: z + half - 0.1
    });
  }

  /** Grocery shelf unit facing an adjacent aisle (classic look) */
  _buildShelfFacade(group, dir, category, shelfMat, backMat, aisleIndex, worldX, worldZ, showLabel) {
    const half = CELL / 2;
    const span = CELL - 0.22;
    const depth = SHELF_DEPTH;
    const totalH = SHELF_LEVELS * SHELF_LEVEL_H + 0.35;

    const fg = new THREE.Group();
    fg.rotation.y = Math.atan2(dir.dx, dir.dz);

    const frontZ = half - 0.08;
    const shelfCenterZ = frontZ - depth / 2;

    // Back panel
    const back = new THREE.Mesh(new THREE.BoxGeometry(span, totalH, 0.1), backMat);
    back.position.set(0, totalH / 2, frontZ - depth - 0.05);
    back.castShadow = true;
    back.receiveShadow = true;
    fg.add(back);

    // Side panels
    for (const sx of [-span / 2, span / 2]) {
      const side = new THREE.Mesh(new THREE.BoxGeometry(0.08, totalH, depth), shelfMat);
      side.position.set(sx, totalH / 2, shelfCenterZ);
      side.castShadow = true;
      fg.add(side);
    }

    // Top trim
    const topTrim = new THREE.Mesh(new THREE.BoxGeometry(span + 0.06, 0.08, depth + 0.06), shelfMat);
    topTrim.position.set(0, totalH + 0.02, shelfCenterZ);
    fg.add(topTrim);

    for (let level = 0; level < SHELF_LEVELS; level++) {
      const y = 0.35 + level * SHELF_LEVEL_H;
      const board = new THREE.Mesh(new THREE.BoxGeometry(span, 0.07, depth), shelfMat);
      board.position.set(0, y, shelfCenterZ);
      board.castShadow = true;
      board.receiveShadow = true;
      fg.add(board);

      for (let p = 0; p < 3; p++) {
        const decoy = createDecoyMesh(category.color);
        decoy.position.set(
          (p - 1) * 0.38,
          y + 0.15,
          shelfCenterZ + (p % 2 === 0 ? -0.28 : 0.28)
        );
        decoy.scale.setScalar(0.88 + Math.random() * 0.22);
        fg.add(decoy);
      }

      const outX = dir.dx * (half - 0.18);
      const outZ = dir.dz * (half - 0.18);
      this.shelfSlots.push({
        x: worldX + outX,
        z: worldZ + outZ,
        y: y + 0.22,
        aisle: aisleIndex,
        side: 1,
        level
      });
    }

    if (showLabel) {
      const label = this._createCategoryLabel(category, category.color);
      label.position.set(0, totalH + 0.12, shelfCenterZ - 0.05);
      fg.add(label);
    }

    group.add(fg);
  }

  /** Enclosed maze block — small stock shelf cluster */
  _buildStockShelf(group, span, totalH, shelfMat, backMat, category) {
    const depth = SHELF_DEPTH * 0.85;
    const back = new THREE.Mesh(new THREE.BoxGeometry(span, totalH, 0.1), backMat);
    back.position.set(0, totalH / 2, -depth / 2);
    group.add(back);

    for (let level = 0; level < SHELF_LEVELS; level++) {
      const y = 0.35 + level * SHELF_LEVEL_H;
      const board = new THREE.Mesh(new THREE.BoxGeometry(span, 0.07, depth), shelfMat);
      board.position.set(0, y, 0);
      group.add(board);
      for (let p = 0; p < 2; p++) {
        const decoy = createDecoyMesh(category.color);
        decoy.position.set((p - 0.5) * 0.5, y + 0.14, 0);
        group.add(decoy);
      }
    }
  }

  _buildCategorySigns() {
    const catKeys = Object.keys(CATEGORIES);

    for (const room of CATEGORY_ROOMS) {
      const cat = CATEGORIES[catKeys[room.aisle]];
      const { x, z } = gridToWorld(room.col, room.row);

      const sign = this._createCategoryLabel(cat, cat.color);
      sign.position.set(x, 3.0, z);
      this.scene.add(sign);

      const hex = cat.color.toString(16).padStart(6, '0');
      this.aisleZones.push({
        x,
        z,
        width: CELL * 1.8,
        depth: CELL * 1.8,
        name: cat.name,
        color: cat.color
      });
    }

    const entranceSign = this._createSign('GROCERY HUNT MAZE', '#e94560', 5, 1.2);
    const entrance = getEntrancePosition();
    entranceSign.position.set(entrance.x, 3.2, entrance.z + 1.2);
    this.scene.add(entranceSign);
  }

  _buildPathMarkers() {
    const pathMat = new THREE.MeshStandardMaterial({ color: 0xd4ccc0, roughness: 0.92 });
    for (let row = 0; row < MAZE_ROWS; row++) {
      for (let col = 0; col < MAZE_COLS; col++) {
        if (MAZE_GRID[row][col] !== 0) continue;
        const { x, z } = gridToWorld(col, row);
        const strip = new THREE.Mesh(
          new THREE.PlaneGeometry(CELL - 0.25, CELL - 0.25),
          pathMat
        );
        strip.rotation.x = -Math.PI / 2;
        strip.position.set(x, 0.012, z);
        this.scene.add(strip);
      }
    }
  }

  _buildOuterWalls(extTex, intTex) {
    const hw = MALL_WIDTH / 2;
    const hd = MALL_DEPTH / 2;
    const t = WALL_THICKNESS;
    const h = WALL_HEIGHT;

    const wallMat = new THREE.MeshStandardMaterial({ map: extTex, roughness: 0.9 });
    const innerMat = new THREE.MeshStandardMaterial({ map: intTex, roughness: 0.85 });

    const addSolidWall = (x, z, sx, sy, sz) => {
      const mesh = new THREE.Mesh(new THREE.BoxGeometry(sx, sy, sz), wallMat);
      mesh.position.set(x, sy / 2, z);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      this.scene.add(mesh);
      this.colliders.push({
        minX: x - sx / 2,
        maxX: x + sx / 2,
        minZ: z - sz / 2,
        maxZ: z + sz / 2
      });
    };

    addSolidWall(-hw + t / 2, 0, t, h, MALL_DEPTH);
    addSolidWall(hw - t / 2, 0, t, h, MALL_DEPTH);
    addSolidWall(0, -hd + t / 2, MALL_WIDTH, h, t);

    const entranceGap = 5;
    const sideLen = (MALL_WIDTH - entranceGap) / 2;
    addSolidWall(-entranceGap / 2 - sideLen / 2, hd - t / 2, sideLen, h, t);
    addSolidWall(entranceGap / 2 + sideLen / 2, hd - t / 2, sideLen, h, t);
  }

  _createSign(text, color, width = 4, height = 1) {
    const tex = createSignTexture(text, color);
    const mat = new THREE.MeshBasicMaterial({ map: tex, transparent: true });
    return new THREE.Mesh(new THREE.PlaneGeometry(width, height), mat);
  }

  _createCategoryLabel(category, color) {
    const hex = color.toString(16).padStart(6, '0');
    const tex = createCategoryLabelTexture(category.name, `#${hex}`);
    const mat = new THREE.MeshBasicMaterial({ map: tex, transparent: true });
    return new THREE.Mesh(new THREE.PlaneGeometry(2.6, 0.48), mat);
  }

  _slotKey(slot) {
    return `${slot.x.toFixed(1)}_${slot.z.toFixed(1)}_${slot.level}`;
  }

  _pickRandomSlot(aisleIndex, usedSlots) {
    const available = this.shelfSlots.filter(s => {
      if (s.aisle !== aisleIndex) return false;
      return !usedSlots.has(this._slotKey(s));
    });
    if (available.length === 0) return null;

    const slot = available[Math.floor(Math.random() * available.length)];
    usedSlots.add(this._slotKey(slot));
    return {
      x: slot.x + (Math.random() - 0.5) * 0.3,
      y: slot.y + (Math.random() - 0.5) * 0.08,
      z: slot.z + (Math.random() - 0.5) * 0.4
    };
  }

  placeCollectibles(shoppingList) {
    const usedSlots = new Set();
    const items = [...shoppingList].sort(() => Math.random() - 0.5);

    items.forEach((item) => {
      const cat = CATEGORIES[item.category];
      let slot = this._pickRandomSlot(cat.aisle, usedSlots);

      if (!slot) {
        const room = getCategoryRoomCenter(cat.aisle);
        slot = {
          x: room.x + (Math.random() - 0.5) * 1.2,
          z: room.z + (Math.random() - 0.5) * 1.2,
          y: 0.8 + Math.random() * 1.2
        };
      }

      const group = new THREE.Group();
      group.position.set(slot.x, slot.y, slot.z);

      group.add(createItemMesh(item.name, cat.color));

      const ring = new THREE.Mesh(
        new THREE.RingGeometry(0.22, 0.32, 16),
        new THREE.MeshBasicMaterial({ color: 0xffee00, transparent: true, opacity: 0.65, side: THREE.DoubleSide })
      );
      ring.rotation.x = -Math.PI / 2;
      ring.position.y = -0.12;
      group.add(ring);

      const label = createItemLabelSprite(item.name);
      label.position.y = 0.42;
      label.visible = false;
      group.add(label);

      group.userData.collectibleId = item.id;
      group.userData.itemName = item.name;
      group.userData.category = item.category;
      group.userData.label = label;

      this.scene.add(group);
      this.collectibles.push(group);
    });
  }

  _buildCashier() {
    const pos = gridToWorld(5, MAZE_ROWS - 2);
    this.cashier = createCashierStation(pos);
    this.scene.add(this.cashier.mesh);
  }

  getCashierPosition() {
    return this.cashier?.position ?? null;
  }

  getSpawnPosition() {
    const e = getEntrancePosition();
    return new THREE.Vector3(e.x, 1.7, e.z);
  }
}
