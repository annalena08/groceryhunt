import * as THREE from 'three';
import { createSignTexture } from './Textures.js';

const INTERACT_DISTANCE = 2.8;

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
  m.castShadow = opts.castShadow !== false;
  m.receiveShadow = opts.receiveShadow !== false;
  return m;
}

/** Checkout counter with a friendly cashier NPC */
export function createCashierStation(position) {
  const station = new THREE.Group();
  station.position.set(position.x, 0, position.z);

  const counter = mesh(new THREE.BoxGeometry(3.2, 1.05, 0.85), 0x8b7355, {
    position: [0, 0.525, 0.35]
  });
  station.add(counter);

  const counterTop = mesh(new THREE.BoxGeometry(3.25, 0.06, 0.9), 0xd4c4a8, {
    position: [0, 1.08, 0.35]
  });
  station.add(counterTop);

  // Register
  const register = mesh(new THREE.BoxGeometry(0.55, 0.35, 0.4), 0x444444, {
    position: [-0.7, 1.25, 0.2]
  });
  station.add(register);
  station.add(mesh(new THREE.BoxGeometry(0.45, 0.28, 0.02), 0x88ccff, {
    position: [-0.7, 1.28, 0.01]
  }));

  // Conveyor belt hint
  station.add(mesh(new THREE.BoxGeometry(1.4, 0.04, 0.5), 0x333333, {
    position: [0.9, 1.1, 0.55]
  }));

  // "CHECKOUT" sign
  const signTex = createSignTexture('CHECKOUT', '#2ecc71', 42);
  const signMat = new THREE.MeshBasicMaterial({ map: signTex, transparent: true });
  const sign = new THREE.Mesh(new THREE.PlaneGeometry(2.4, 0.55), signMat);
  sign.position.set(0, 2.35, 0.35);
  station.add(sign);

  // Cashier character
  const cashier = new THREE.Group();
  cashier.position.set(0, 0, -0.55);

  const skin = 0xf5cba7;
  const apron = 0x27ae60;
  const shirt = 0xf8f9fa;

  cashier.add(mesh(new THREE.CylinderGeometry(0.09, 0.1, 0.55, 8), 0x2c3e50, {
    position: [-0.12, 0.28, 0]
  }));
  cashier.add(mesh(new THREE.CylinderGeometry(0.09, 0.1, 0.55, 8), 0x2c3e50, {
    position: [0.12, 0.28, 0]
  }));
  cashier.add(mesh(new THREE.BoxGeometry(0.4, 0.5, 0.22), shirt, { position: [0, 0.78, 0] }));
  cashier.add(mesh(new THREE.BoxGeometry(0.38, 0.45, 0.08), apron, { position: [0, 0.72, 0.14] }));

  const armGeo = new THREE.CylinderGeometry(0.06, 0.07, 0.38, 8);
  cashier.add(mesh(armGeo, shirt, { position: [-0.26, 0.85, 0.1], rotation: [0.3, 0, 0.4] }));
  cashier.add(mesh(armGeo, shirt, { position: [0.26, 0.85, 0.05], rotation: [0.2, 0, -0.3] }));

  cashier.add(mesh(new THREE.SphereGeometry(0.19, 12, 10), skin, { position: [0, 1.24, 0] }));
  cashier.add(mesh(new THREE.SphereGeometry(0.2, 10, 8, 0, Math.PI * 2, 0, Math.PI / 2), 0x5d4037, {
    position: [0, 1.28, -0.02]
  }));

  // Friendly smile (small arc)
  cashier.add(mesh(new THREE.TorusGeometry(0.04, 0.01, 6, 12, Math.PI), 0xcc6666, {
    position: [0, 1.18, 0.17], rotation: [0.2, 0, 0]
  }));

  // Name tag
  const tagTex = createSignTexture('PAT', '#3498db', 28);
  const tagMat = new THREE.MeshBasicMaterial({ map: tagTex, transparent: true });
  const tag = new THREE.Mesh(new THREE.PlaneGeometry(0.35, 0.12), tagMat);
  tag.position.set(0, 0.95, 0.24);
  cashier.add(tag);

  station.add(cashier);

  // Queue lane marker on floor
  const lane = mesh(new THREE.PlaneGeometry(2.5, 1.8), 0xf1c40f, {
    position: [0, 0.015, 1.6],
    rotation: [-Math.PI / 2, 0, 0]
  });
  lane.material.transparent = true;
  lane.material.opacity = 0.25;
  lane.receiveShadow = true;
  station.add(lane);

  station.userData.type = 'cashier';
  station.userData.interactDistance = INTERACT_DISTANCE;

  return {
    mesh: station,
    position: new THREE.Vector3(position.x, 0, position.z),
    interactDistance: INTERACT_DISTANCE
  };
}
