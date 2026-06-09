import * as THREE from 'three';

const MOVE_SPEED = 6;
const MOUSE_SENSITIVITY = 0.002;
const PLAYER_RADIUS = 0.4;
const PLAYER_HEIGHT = 1.7;

export class Player {
  constructor(camera, colliders, bounds = null) {
    this.camera = camera;
    this.colliders = colliders;
    this.bounds = bounds;

    this.position = new THREE.Vector3();
    this.velocity = new THREE.Vector3();
    this.yaw = 0;
    this.pitch = 0;

    this.keys = {};
    this.moveInput = { x: 0, z: 0 };
    this.lookInput = { x: 0, y: 0 };
    this.isMoving = false;
    this.distanceMoved = 0;

    this._setupKeyboard();
  }

  _setupKeyboard() {
    window.addEventListener('keydown', e => {
      this.keys[e.code] = true;
      if (['KeyW', 'KeyA', 'KeyS', 'KeyD', 'Space'].includes(e.code)) {
        e.preventDefault();
      }
    });
    window.addEventListener('keyup', e => {
      this.keys[e.code] = false;
    });
  }

  setPosition(x, y, z) {
    this.position.set(x, y, z);
    this._updateCamera();
  }

  setMouseSensitivity(deltaX, deltaY) {
    this.yaw -= deltaX * MOUSE_SENSITIVITY;
    this.pitch -= deltaY * MOUSE_SENSITIVITY;
    this.pitch = Math.max(-Math.PI / 2 + 0.05, Math.min(Math.PI / 2 - 0.05, this.pitch));
  }

  setMoveInput(x, z) {
    this.moveInput.x = x;
    this.moveInput.z = z;
  }

  setLookInput(x, y) {
    this.lookInput.x = x;
    this.lookInput.y = y;
  }

  update(dt) {
    const prevX = this.position.x;
    const prevZ = this.position.z;

    // Keyboard input
    let mx = this.moveInput.x;
    let mz = this.moveInput.z;

    if (this.keys['KeyW']) mz -= 1;
    if (this.keys['KeyS']) mz += 1;
    if (this.keys['KeyA']) mx -= 1;
    if (this.keys['KeyD']) mx += 1;

    // Normalize
    const len = Math.sqrt(mx * mx + mz * mz);
    if (len > 0) {
      mx /= len;
      mz /= len;
    }

    // Touch look
    if (this.lookInput.x !== 0 || this.lookInput.y !== 0) {
      this.yaw -= this.lookInput.x * MOUSE_SENSITIVITY * 60 * dt;
      this.pitch -= this.lookInput.y * MOUSE_SENSITIVITY * 60 * dt;
      this.pitch = Math.max(-Math.PI / 2 + 0.05, Math.min(Math.PI / 2 - 0.05, this.pitch));
      this.lookInput.x = 0;
      this.lookInput.y = 0;
    }

    // Move relative to yaw
    const forward = new THREE.Vector3(-Math.sin(this.yaw), 0, -Math.cos(this.yaw));
    const right = new THREE.Vector3(Math.cos(this.yaw), 0, -Math.sin(this.yaw));

    const move = new THREE.Vector3();
    move.addScaledVector(forward, -mz);
    move.addScaledVector(right, mx);
    move.normalize().multiplyScalar(MOVE_SPEED * dt);

    this._moveWithCollision(move);

    const dx = this.position.x - prevX;
    const dz = this.position.z - prevZ;
    this.distanceMoved = Math.sqrt(dx * dx + dz * dz);
    this.isMoving = len > 0 && this.distanceMoved > 0.002;

    this._updateCamera();
  }

  _moveWithCollision(delta) {
    const newX = this.position.x + delta.x;
    const newZ = this.position.z + delta.z;

    if (!this._collides(newX, this.position.z)) {
      this.position.x = newX;
    }
    if (!this._collides(this.position.x, newZ)) {
      this.position.z = newZ;
    }

    // Keep inside mall bounds
    const margin = 0.6;
    if (this.bounds) {
      this.position.x = Math.max(this.bounds.minX + margin, Math.min(this.bounds.maxX - margin, this.position.x));
      this.position.z = Math.max(this.bounds.minZ + margin, Math.min(this.bounds.maxZ - margin, this.position.z));
    }
  }

  _collides(x, z) {
    for (const c of this.colliders) {
      if (
        x + PLAYER_RADIUS > c.minX &&
        x - PLAYER_RADIUS < c.maxX &&
        z + PLAYER_RADIUS > c.minZ &&
        z - PLAYER_RADIUS < c.maxZ
      ) {
        return true;
      }
    }
    return false;
  }

  _updateCamera() {
    this.camera.position.copy(this.position);
    this.camera.rotation.order = 'YXZ';
    this.camera.rotation.y = this.yaw;
    this.camera.rotation.x = this.pitch;
  }

  getPosition() {
    return this.position.clone();
  }

  getForwardDirection() {
    const dir = new THREE.Vector3(0, 0, -1);
    dir.applyQuaternion(this.camera.quaternion);
    return dir;
  }
}

export { PLAYER_HEIGHT };
