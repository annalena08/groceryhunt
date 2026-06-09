import * as THREE from "three";
import { AngryCustomer } from "./AngryCustomer.js";
import {
  PLAYER_BOUNDS,
  SCARE_DURATION,
  SCARE_COOLDOWN,
  SCARE_DISTANCE,
} from "./MallConfig.js";
import { getScareLine } from "./ScareDialogue.js";
import {
  getCategoryRoomCenter,
  getPathCells,
  getEntrancePosition,
} from "./MazeLayout.js";

const TIME_PENALTY = 10;
const PLAYER_CATCH_COOLDOWN = 1.8;
const ENEMY_RADIUS = 0.45;
const SCARE_CONE = Math.cos((40 * Math.PI) / 180);

export class EnemyManager {
  constructor(scene, colliders, bounds = PLAYER_BOUNDS) {
    this.scene = scene;
    this.colliders = colliders;
    this.bounds = bounds;
    this.enemies = [];
    this.playerCatchCooldown = 0;
    this.scareCooldown = 0;
    this.pathCells = getPathCells();
  }

  spawnAll(spawnPos, enemyCount) {
    this.clear();
    this.scareCooldown = 0;
    for (let i = 0; i < enemyCount; i++) {
      const pos = this._findSafePosition(spawnPos, 12 + i * 2);
      const enemy = new AngryCustomer(
        this.scene,
        this.colliders,
        this.bounds,
        i,
        pos,
      );
      enemy.resolveSafePosition = (avoid, minDist) =>
        this._findSafePosition(avoid, minDist);
      this.enemies.push(enemy);
    }
  }

  clear() {
    this.enemies.forEach((e) => e.dispose());
    this.enemies = [];
  }

  _collides(x, z) {
    for (const c of this.colliders) {
      if (
        x + ENEMY_RADIUS > c.minX &&
        x - ENEMY_RADIUS < c.maxX &&
        z + ENEMY_RADIUS > c.minZ &&
        z - ENEMY_RADIUS < c.maxZ
      ) {
        return true;
      }
    }
    return false;
  }

  _isValidPosition(x, z, avoidPos, minDist = 0) {
    const m = 0.8;
    if (x < this.bounds.minX + m || x > this.bounds.maxX - m) return false;
    if (z < this.bounds.minZ + m || z > this.bounds.maxZ - m) return false;
    if (this._collides(x, z)) return false;
    if (avoidPos && minDist > 0) {
      const d = Math.hypot(x - avoidPos.x, z - avoidPos.z);
      if (d < minDist) return false;
    }
    return true;
  }

  _findSafePosition(avoidPos, minDist = 0) {
    const shuffled = [...this.pathCells].sort(() => Math.random() - 0.5);

    for (const cell of shuffled) {
      if (this._isValidPosition(cell.x, cell.z, avoidPos, minDist)) {
        return new THREE.Vector3(cell.x, 0, cell.z);
      }
    }

    for (let aisle = 0; aisle < 10; aisle++) {
      const room = getCategoryRoomCenter(aisle);
      if (this._isValidPosition(room.x, room.z, avoidPos, minDist)) {
        return new THREE.Vector3(room.x, 0, room.z);
      }
    }

    const entrance = getEntrancePosition();
    return new THREE.Vector3(entrance.x, 0, entrance.z - 2);
  }

  update(dt, playerPos, frozen = false) {
    if (this.playerCatchCooldown > 0) {
      this.playerCatchCooldown -= dt;
    }

    if (this.scareCooldown > 0) {
      this.scareCooldown -= dt;
    }

    let caught = false;

    for (const enemy of this.enemies) {
      if (enemy.isInsideGeometry()) {
        const safe = this._findSafePosition(playerPos, 10);
        enemy.mesh.position.copy(safe);
      }

      if (frozen) {
        enemy.freezePose(dt);
      } else {
        enemy.update(dt, playerPos);
      }

      if (
        !frozen &&
        !caught &&
        this.playerCatchCooldown <= 0 &&
        enemy.isCaught(playerPos)
      ) {
        caught = true;
        this.playerCatchCooldown = PLAYER_CATCH_COOLDOWN;
        enemy.teleportFarFrom(playerPos);
      }
    }

    return caught;
  }

  getScareTarget(playerPos, playerYaw, unlimitedYell = false) {
    if (!unlimitedYell && this.scareCooldown > 0) return null;

    const forwardX = -Math.sin(playerYaw);
    const forwardZ = -Math.cos(playerYaw);

    let best = null;
    let bestDist = SCARE_DISTANCE;

    for (const enemy of this.enemies) {
      if (!enemy.isScareable()) continue;

      const dx = enemy.position.x - playerPos.x;
      const dz = enemy.position.z - playerPos.z;
      const dist = Math.hypot(dx, dz);
      if (dist > SCARE_DISTANCE) continue;

      const dot = (dx * forwardX + dz * forwardZ) / Math.max(dist, 0.001);
      if (dot < SCARE_CONE) continue;

      if (dist < bestDist) {
        bestDist = dist;
        best = enemy;
      }
    }

    return best;
  }

  getScareCooldownRemaining() {
    return Math.max(0, this.scareCooldown);
  }

  tryScare(playerPos, playerYaw, unlimitedYell = false) {
    if (!unlimitedYell && this.scareCooldown > 0) {
      return { ok: false, reason: 'cooldown' };
    }

    const enemy = this.getScareTarget(playerPos, playerYaw, unlimitedYell);
    if (!enemy) {
      return { ok: false, reason: 'none' };
    }

    enemy.scare(SCARE_DURATION);
    if (!unlimitedYell) {
      this.scareCooldown = SCARE_COOLDOWN;
    }

    return { ok: true, line: getScareLine(), enemy };
  }

  applyCatchPenalty() {
    return TIME_PENALTY;
  }

  getEnemyPositions() {
    return this.enemies.map((e) => e.position.clone());
  }
}

export { TIME_PENALTY };
