import * as THREE from 'three';
import { getPathCells } from './MazeLayout.js';

export const POWERUP_CONFIG = {
  yellBoost: { duration: 30, label: 'Free Yell', icon: '📢', color: 0xff7722 },
  freeze: { duration: 10, label: 'Karen Freeze', icon: '❄️', color: 0x55bbff },
  itemRadar: { duration: 12, label: 'Item Radar', icon: '🧭', color: 0xffee33 },
  timeBonus: { duration: 0, label: '+10 Seconds', icon: '⏱️', color: 0x2ecc71, timeAdd: 10 }
};

const TYPES = Object.keys(POWERUP_CONFIG);
const PICKUP_RADIUS = 1.15;
const FLOOR_LIFETIME = 30;
const RESPAWN_DELAY = 16;
const MIN_DIST_PLAYER = 8;
const MIN_DIST_PICKUP = 5;
const SLOT_COUNT = 4;

function mesh(geo, color, opts = {}) {
  const mat = new THREE.MeshStandardMaterial({
    color,
    emissive: color,
    emissiveIntensity: opts.emissive ?? 0.35,
    roughness: 0.4,
    metalness: opts.metalness ?? 0.2,
    transparent: opts.transparent ?? false,
    opacity: opts.opacity ?? 1
  });
  const m = new THREE.Mesh(geo, mat);
  if (opts.position) m.position.set(...opts.position);
  if (opts.rotation) m.rotation.set(...opts.rotation);
  if (opts.scale) m.scale.set(...opts.scale);
  return m;
}

function createPickupMesh(type) {
  const cfg = POWERUP_CONFIG[type];
  const g = new THREE.Group();
  g.userData.powerUpType = type;

  if (type === 'yellBoost') {
    g.add(mesh(new THREE.CylinderGeometry(0.22, 0.32, 0.35, 8), cfg.color, {
      position: [0, 0.2, 0], rotation: [Math.PI, 0, 0]
    }));
    g.add(mesh(new THREE.TorusGeometry(0.28, 0.05, 8, 16), cfg.color, {
      position: [0, 0.42, 0], rotation: [Math.PI / 2, 0, 0], emissive: 0.5
    }));
  } else if (type === 'freeze') {
    const crystal = mesh(new THREE.OctahedronGeometry(0.32, 0), cfg.color, {
      position: [0, 0.35, 0], emissive: 0.55
    });
    g.add(crystal);
    g.userData.spinMesh = crystal;
    g.add(mesh(new THREE.RingGeometry(0.38, 0.44, 6), 0xaaddff, {
      position: [0, 0.05, 0], rotation: [-Math.PI / 2, 0, 0], emissive: 0.25
    }));
  } else if (type === 'itemRadar') {
    g.add(mesh(new THREE.CylinderGeometry(0.28, 0.28, 0.06, 16), cfg.color, {
      position: [0, 0.08, 0], emissive: 0.4
    }));
    g.add(mesh(new THREE.ConeGeometry(0.14, 0.38, 3), 0xffffff, {
      position: [0, 0.32, -0.12], rotation: [0.55, 0, 0], emissive: 0.5
    }));
    g.add(mesh(new THREE.SphereGeometry(0.1, 8, 6), cfg.color, {
      position: [0, 0.22, 0], emissive: 0.65
    }));
    g.add(mesh(new THREE.TorusGeometry(0.42, 0.035, 6, 20), cfg.color, {
      position: [0, 0.08, 0], rotation: [-Math.PI / 2, 0, 0]
    }));
  } else if (type === 'timeBonus') {
    g.add(mesh(new THREE.TorusGeometry(0.3, 0.07, 8, 20), cfg.color, {
      position: [0, 0.32, 0], rotation: [Math.PI / 2, 0, 0], emissive: 0.45
    }));
    g.add(mesh(new THREE.BoxGeometry(0.08, 0.28, 0.08), 0xffffff, {
      position: [0, 0.38, 0], emissive: 0.3
    }));
    g.add(mesh(new THREE.BoxGeometry(0.22, 0.08, 0.08), 0xffffff, {
      position: [0.06, 0.28, 0], emissive: 0.3
    }));
  }

  const ring = mesh(new THREE.TorusGeometry(0.45, 0.03, 6, 24), cfg.color, {
    position: [0, 0.04, 0], rotation: [-Math.PI / 2, 0, 0], emissive: 0.6
  });
  ring.material.transparent = true;
  ring.material.opacity = 0.85;
  g.add(ring);
  g.userData.baseRing = ring;

  g.traverse(c => {
    if (c.isMesh) {
      c.castShadow = true;
      c.receiveShadow = true;
    }
  });

  return g;
}

export class PowerUpManager {
  constructor(scene) {
    this.scene = scene;
    this.pathCells = getPathCells();
    this.pickups = [];
    this.pendingRespawns = [];
    this.effects = { yellBoost: 0, freeze: 0, itemRadar: 0 };
    this.lastPickupToast = null;
  }

  start(playerPos) {
    this.clear();
    const count = 3 + Math.floor(Math.random() * 2);
    for (let i = 0; i < count; i++) {
      this._spawnPickup(playerPos);
    }
  }

  clear() {
    this.pickups.forEach(p => this.scene.remove(p.mesh));
    this.pickups = [];
    this.pendingRespawns = [];
    this.effects = { yellBoost: 0, freeze: 0, itemRadar: 0 };
    this.lastPickupToast = null;
  }

  update(dt, playerPos, collectibles, callbacks = {}) {
    this._tickEffects(dt);
    this._tickRespawns(dt, playerPos);
    this._tickPickups(dt, playerPos, collectibles, callbacks);
    this._animatePickups(dt);
  }

  hasYellBoost() {
    return this.effects.yellBoost > 0;
  }

  isFrozen() {
    return this.effects.freeze > 0;
  }

  hasItemRadar() {
    return this.effects.itemRadar > 0;
  }

  getActiveEffects() {
    const active = [];
    if (this.effects.yellBoost > 0) {
      active.push({
        type: 'yellBoost',
        ...POWERUP_CONFIG.yellBoost,
        remaining: this.effects.yellBoost
      });
    }
    if (this.effects.freeze > 0) {
      active.push({
        type: 'freeze',
        ...POWERUP_CONFIG.freeze,
        remaining: this.effects.freeze
      });
    }
    if (this.effects.itemRadar > 0) {
      active.push({
        type: 'itemRadar',
        ...POWERUP_CONFIG.itemRadar,
        remaining: this.effects.itemRadar
      });
    }
    return active;
  }

  getPickupToast() {
    const toast = this.lastPickupToast;
    if (toast && toast.time > 0) return toast;
    return null;
  }

  _tickEffects(dt) {
    if (this.effects.yellBoost > 0) this.effects.yellBoost = Math.max(0, this.effects.yellBoost - dt);
    if (this.effects.freeze > 0) this.effects.freeze = Math.max(0, this.effects.freeze - dt);
    if (this.effects.itemRadar > 0) this.effects.itemRadar = Math.max(0, this.effects.itemRadar - dt);

    if (this.lastPickupToast) {
      this.lastPickupToast.time -= dt;
      if (this.lastPickupToast.time <= 0) this.lastPickupToast = null;
    }
  }

  _tickRespawns(dt, playerPos) {
    for (let i = this.pendingRespawns.length - 1; i >= 0; i--) {
      this.pendingRespawns[i].timer -= dt;
      if (this.pendingRespawns[i].timer <= 0) {
        this._spawnPickup(playerPos, this.pendingRespawns[i].type);
        this.pendingRespawns.splice(i, 1);
      }
    }
  }

  _tickPickups(dt, playerPos, collectibles, callbacks) {
    for (let i = this.pickups.length - 1; i >= 0; i--) {
      const p = this.pickups[i];
      p.floorTime -= dt;

      const dist = Math.hypot(
        playerPos.x - p.mesh.position.x,
        playerPos.z - p.mesh.position.z
      );

      if (dist < PICKUP_RADIUS) {
        this._collectPickup(p, callbacks);
        this.scene.remove(p.mesh);
        this.pickups.splice(i, 1);
        continue;
      }

      if (p.floorTime <= 0) {
        this.scene.remove(p.mesh);
        this.pickups.splice(i, 1);
        this.pendingRespawns.push({ type: p.type, timer: RESPAWN_DELAY * 0.5 });
      }
    }

    while (this.pickups.length < SLOT_COUNT && this.pendingRespawns.length === 0) {
      const oldest = this.pickups.reduce((min, p) => (!min || p.floorTime < min.floorTime ? p : min), null);
      if (!oldest || oldest.floorTime < FLOOR_LIFETIME * 0.4) {
        this._spawnPickup(playerPos);
      } else {
        break;
      }
    }
  }

  _collectPickup(pickup, callbacks) {
    const cfg = POWERUP_CONFIG[pickup.type];
    this.lastPickupToast = { text: `${cfg.icon} ${cfg.label}!`, time: 2.2 };
    callbacks.onPowerUpCollected?.(pickup.type);

    if (pickup.type === 'timeBonus') {
      callbacks.onTimeBonus?.(cfg.timeAdd);
    } else {
      this.effects[pickup.type] = Math.max(this.effects[pickup.type], cfg.duration);
    }

    this.pendingRespawns.push({ type: pickup.type, timer: RESPAWN_DELAY });
  }

  _spawnPickup(avoidPos, forcedType = null) {
    const type = forcedType ?? TYPES[Math.floor(Math.random() * TYPES.length)];
    const pos = this._findSpawnPosition(avoidPos);
    if (!pos) return;

    const mesh = createPickupMesh(type);
    mesh.position.set(pos.x, 0, pos.z);
    this.scene.add(mesh);

    this.pickups.push({
      type,
      mesh,
      floorTime: FLOOR_LIFETIME,
      x: pos.x,
      z: pos.z
    });
  }

  _findSpawnPosition(avoidPos) {
    const shuffled = [...this.pathCells].sort(() => Math.random() - 0.5);

    for (const cell of shuffled) {
      const distPlayer = Math.hypot(cell.x - avoidPos.x, cell.z - avoidPos.z);
      if (distPlayer < MIN_DIST_PLAYER) continue;

      let tooClose = false;
      for (const p of this.pickups) {
        if (Math.hypot(cell.x - p.x, cell.z - p.z) < MIN_DIST_PICKUP) {
          tooClose = true;
          break;
        }
      }
      if (tooClose) continue;

      return { x: cell.x, z: cell.z };
    }

    return null;
  }

  _animatePickups(dt) {
    const t = performance.now() * 0.001;
    for (const p of this.pickups) {
      p.mesh.position.y = Math.sin(t * 2.5 + p.x) * 0.06;
      p.mesh.rotation.y += dt * 1.8;
      if (p.mesh.userData.spinMesh) {
        p.mesh.userData.spinMesh.rotation.y += dt * 3;
      }
      if (p.mesh.userData.baseRing) {
        p.mesh.userData.baseRing.material.emissiveIntensity = 0.45 + Math.sin(t * 4) * 0.2;
      }
    }
  }
}
