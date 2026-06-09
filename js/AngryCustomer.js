import * as THREE from 'three';

const CUSTOMER_SPEED = 4.2;
const FLEE_SPEED = 5.8;
const CATCH_RADIUS = 1.15;
const ENEMY_HEIGHT = 1.6;

const SHIRT_COLORS = [0xe94560, 0xff6b6b, 0x6c5ce7, 0xff9f43, 0x00b894];
const PANT_COLORS = [0x2d3436, 0x636e72, 0x0984e3, 0x2c3e50];
const SKIN_TONES = [0xffcc99, 0xf5cba7, 0xe0ac69, 0xc68642];

function mesh(geo, color, opts = {}) {
  const mat = new THREE.MeshStandardMaterial({
    color,
    roughness: opts.roughness ?? 0.65,
    metalness: opts.metalness ?? 0.05
  });
  const m = new THREE.Mesh(geo, mat);
  if (opts.position) m.position.set(...opts.position);
  if (opts.rotation) m.rotation.set(...opts.rotation);
  if (opts.scale) m.scale.set(...opts.scale);
  return m;
}

/** Stylised low-poly angry shopper */
export function createAngryCustomerMesh(variant = 0) {
  const g = new THREE.Group();
  const shirt = SHIRT_COLORS[variant % SHIRT_COLORS.length];
  const pants = PANT_COLORS[variant % PANT_COLORS.length];
  const skin = SKIN_TONES[variant % SKIN_TONES.length];

  // Legs (animated in update)
  const legGeo = new THREE.CylinderGeometry(0.09, 0.1, 0.55, 8);
  const leftLeg = mesh(legGeo, pants, { position: [-0.12, 0.28, 0] });
  const rightLeg = mesh(legGeo, pants, { position: [0.12, 0.28, 0] });
  g.add(leftLeg, rightLeg);

  // Torso / jacket
  g.add(mesh(new THREE.BoxGeometry(0.42, 0.55, 0.24), shirt, { position: [0, 0.82, 0] }));

  // Arms — raised angrily
  const armGeo = new THREE.CylinderGeometry(0.07, 0.08, 0.42, 8);
  const leftArm = mesh(armGeo, shirt, { position: [-0.28, 0.9, 0.05], rotation: [0.4, 0, 0.5] });
  const rightArm = mesh(armGeo, shirt, { position: [0.28, 0.9, 0.05], rotation: [0.4, 0, -0.5] });
  g.add(leftArm, rightArm);

  // Hands
  g.add(mesh(new THREE.SphereGeometry(0.08, 8, 6), skin, { position: [-0.38, 1.08, 0.12] }));
  g.add(mesh(new THREE.SphereGeometry(0.08, 8, 6), skin, { position: [0.38, 1.08, 0.12] }));

  // Shopping basket on left hand
  const basket = mesh(new THREE.CylinderGeometry(0.14, 0.1, 0.18, 8), 0xc48850, {
    position: [-0.42, 0.95, 0.18], rotation: [0.2, 0, 0]
  });
  g.add(basket);
  g.add(mesh(new THREE.TorusGeometry(0.12, 0.015, 6, 12), 0x888888, {
    position: [-0.42, 1.06, 0.18], rotation: [Math.PI / 2, 0, 0]
  }));

  // Head
  g.add(mesh(new THREE.SphereGeometry(0.2, 12, 10), skin, { position: [0, 1.28, 0] }));

  // Hair
  g.add(mesh(new THREE.SphereGeometry(0.21, 10, 8, 0, Math.PI * 2, 0, Math.PI / 2), 0x3d2314, {
    position: [0, 1.32, -0.02]
  }));

  // Angry eyebrows
  g.add(mesh(new THREE.BoxGeometry(0.1, 0.025, 0.03), 0x2d1b0e, {
    position: [-0.07, 1.36, 0.17], rotation: [0, 0, 0.45]
  }));
  g.add(mesh(new THREE.BoxGeometry(0.1, 0.025, 0.03), 0x2d1b0e, {
    position: [0.07, 1.36, 0.17], rotation: [0, 0, -0.45]
  }));

  // Frown
  g.add(mesh(new THREE.TorusGeometry(0.05, 0.012, 6, 12, Math.PI), 0x884444, {
    position: [0, 1.2, 0.18], rotation: [0.1, 0, Math.PI]
  }));

  // Red angry cheeks
  g.add(mesh(new THREE.CircleGeometry(0.04, 8), 0xff6666, {
    position: [-0.14, 1.24, 0.17], rotation: [0, 0, 0]
  }));
  g.add(mesh(new THREE.CircleGeometry(0.04, 8), 0xff6666, {
    position: [0.14, 1.24, 0.17], rotation: [0, 0, 0]
  }));

  // Anger steam puffs above head
  for (let i = 0; i < 3; i++) {
    const puffMat = new THREE.MeshStandardMaterial({
      color: 0xff4444,
      transparent: true,
      opacity: 0.75,
      roughness: 0.9
    });
    const puff = new THREE.Mesh(
      new THREE.SphereGeometry(0.05 + i * 0.015, 6, 5),
      puffMat
    );
    puff.position.set((i - 1) * 0.08, 1.55 + i * 0.06, 0);
    puff.scale.set(1, 1.3, 1);
    puff.userData.isSteam = true;
    puff.userData.steamIndex = i;
    g.add(puff);
  }

  g.traverse(c => {
    if (c.isMesh) {
      c.castShadow = true;
      c.receiveShadow = true;
    }
  });

  g.userData.leftLeg = leftLeg;
  g.userData.rightLeg = rightLeg;
  g.userData.leftArm = leftArm;
  g.userData.rightArm = rightArm;

  return g;
}

export class AngryCustomer {
  constructor(scene, colliders, bounds, variant, position) {
    this.scene = scene;
    this.colliders = colliders;
    this.bounds = bounds;
    this.mesh = createAngryCustomerMesh(variant);
    this.mesh.position.copy(position);
    this.mesh.position.y = 0;
    scene.add(this.mesh);

    this.radius = 0.45;
    this.walkPhase = Math.random() * Math.PI * 2;
    this.cooldown = 0;
    this.scaredTimer = 0;
    this.resolveSafePosition = null;
  }

  scare(duration) {
    this.scaredTimer = Math.max(this.scaredTimer, duration);
  }

  isScareable() {
    return this.scaredTimer <= 0 && this.cooldown <= 0;
  }

  get position() {
    return this.mesh.position;
  }

  update(dt, playerPos) {
    if (this.scaredTimer > 0) {
      this.scaredTimer -= dt;
      this._fleeFromPlayer(dt, playerPos);
      this._animateFleeSteam();
      return Math.hypot(
        playerPos.x - this.mesh.position.x,
        playerPos.z - this.mesh.position.z
      );
    }

    if (this.cooldown > 0) {
      this.cooldown -= dt;
      this._animateIdle(dt);
      return Infinity;
    }

    const dx = playerPos.x - this.mesh.position.x;
    const dz = playerPos.z - this.mesh.position.z;
    const dist = Math.sqrt(dx * dx + dz * dz);

    if (dist > 0.15) {
      const move = new THREE.Vector3(dx / dist, 0, dz / dist).multiplyScalar(CUSTOMER_SPEED * dt);
      this._moveWithCollision(move);
      this.mesh.rotation.y = Math.atan2(dx, dz);
      this._animateWalk(dt);
    } else {
      this._animateIdle(dt);
    }

    // Steam bob
    if (this.scaredTimer <= 0) {
      this._restoreSteam();
      this.mesh.traverse(c => {
        if (c.userData.isSteam) {
          const i = c.userData.steamIndex;
          c.position.y = 1.55 + i * 0.06 + Math.sin(performance.now() * 0.006 + i) * 0.03;
          c.material.opacity = 0.55 + Math.sin(performance.now() * 0.008 + i * 2) * 0.25;
        }
      });
    }

    return dist;
  }

  _fleeFromPlayer(dt, playerPos) {
    const dx = this.mesh.position.x - playerPos.x;
    const dz = this.mesh.position.z - playerPos.z;
    const dist = Math.sqrt(dx * dx + dz * dz);

    if (dist > 0.12) {
      const move = new THREE.Vector3(dx / dist, 0, dz / dist).multiplyScalar(FLEE_SPEED * dt);
      this._moveWithCollision(move);
      this.mesh.rotation.y = Math.atan2(dx, dz);
      this._animateWalk(dt * 1.4);
    } else {
      const angle = Math.random() * Math.PI * 2;
      const move = new THREE.Vector3(Math.sin(angle), 0, Math.cos(angle)).multiplyScalar(FLEE_SPEED * dt);
      this._moveWithCollision(move);
      this._animateWalk(dt);
    }
  }

  _animateFleeSteam() {
    this.mesh.traverse(c => {
      if (c.userData.isSteam) {
        c.visible = false;
      }
    });
  }

  _restoreSteam() {
    this.mesh.traverse(c => {
      if (c.userData.isSteam) {
        c.visible = true;
      }
    });
  }

  _moveWithCollision(delta) {
    const px = this.mesh.position.x;
    const pz = this.mesh.position.z;

    const newX = px + delta.x;
    if (!this._collides(newX, pz)) this.mesh.position.x = newX;

    const newZ = pz + delta.z;
    if (!this._collides(this.mesh.position.x, newZ)) this.mesh.position.z = newZ;

    const m = 0.5;
    this.mesh.position.x = Math.max(this.bounds.minX + m, Math.min(this.bounds.maxX - m, this.mesh.position.x));
    this.mesh.position.z = Math.max(this.bounds.minZ + m, Math.min(this.bounds.maxZ - m, this.mesh.position.z));
  }

  _collides(x, z) {
    for (const c of this.colliders) {
      if (
        x + this.radius > c.minX &&
        x - this.radius < c.maxX &&
        z + this.radius > c.minZ &&
        z - this.radius < c.maxZ
      ) return true;
    }
    return false;
  }

  _animateWalk(dt) {
    this.walkPhase += dt * 10;
    const swing = Math.sin(this.walkPhase) * 0.35;
    const { leftLeg, rightLeg, leftArm, rightArm } = this.mesh.userData;
    leftLeg.rotation.x = swing;
    rightLeg.rotation.x = -swing;
    leftArm.rotation.x = 0.4 - swing * 0.5;
    rightArm.rotation.x = 0.4 + swing * 0.5;
    this.mesh.position.y = Math.abs(Math.sin(this.walkPhase * 2)) * 0.04;
  }

  _animateIdle(dt) {
    this.walkPhase += dt * 4;
    const bob = Math.sin(this.walkPhase) * 0.02;
    this.mesh.position.y = bob;
  }

  teleportFarFrom(playerPos, minDist = 16) {
    const pos = this.resolveSafePosition
      ? this.resolveSafePosition(playerPos, minDist)
      : this._defaultTeleport(playerPos, minDist);
    this.mesh.position.copy(pos);
    this.cooldown = 2.0;
  }

  _defaultTeleport(playerPos, minDist) {
    for (let attempt = 0; attempt < 40; attempt++) {
      const angle = Math.random() * Math.PI * 2;
      const dist = minDist + Math.random() * 10;
      const x = playerPos.x + Math.sin(angle) * dist;
      const z = playerPos.z + Math.cos(angle) * dist;

      if (
        x > this.bounds.minX + 1 && x < this.bounds.maxX - 1 &&
        z > this.bounds.minZ + 1 && z < this.bounds.maxZ - 1 &&
        !this._collides(x, z)
      ) {
        const pd = Math.hypot(x - playerPos.x, z - playerPos.z);
        if (pd >= minDist) {
          return new THREE.Vector3(x, 0, z);
        }
      }
    }
    return new THREE.Vector3(
      playerPos.x > 0 ? this.bounds.minX + 4 : this.bounds.maxX - 4,
      0,
      this.bounds.maxZ - 4
    );
  }

  isInsideGeometry() {
    return this._collides(this.mesh.position.x, this.mesh.position.z);
  }

  isCaught(playerPos) {
    if (this.cooldown > 0 || this.scaredTimer > 0) return false;
    const dx = playerPos.x - this.mesh.position.x;
    const dz = playerPos.z - this.mesh.position.z;
    return Math.sqrt(dx * dx + dz * dz) < CATCH_RADIUS;
  }

  dispose() {
    this.scene.remove(this.mesh);
  }
}

export { CATCH_RADIUS, ENEMY_HEIGHT };
