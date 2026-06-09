import * as THREE from 'three';

/** Procedural canvas textures for mall surfaces */
export function createFloorTexture() {
  const size = 256;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = '#c8c0b0';
  ctx.fillRect(0, 0, size, size);

  const tile = size / 8;
  for (let y = 0; y < 8; y++) {
    for (let x = 0; x < 8; x++) {
      const shade = ((x + y) % 2 === 0) ? '#d4ccc0' : '#b8b0a0';
      ctx.fillStyle = shade;
      ctx.fillRect(x * tile, y * tile, tile, tile);
      ctx.strokeStyle = '#a09888';
      ctx.lineWidth = 1;
      ctx.strokeRect(x * tile + 1, y * tile + 1, tile - 2, tile - 2);
    }
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(8, 8);
  return tex;
}

export function createCeilingTexture() {
  const size = 256;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = '#e8e8e8';
  ctx.fillRect(0, 0, size, size);

  const panelW = size / 4;
  for (let x = 0; x < 4; x++) {
    ctx.fillStyle = '#f5f5f5';
    ctx.fillRect(x * panelW + 2, 2, panelW - 4, size - 4);
    ctx.strokeStyle = '#ccc';
    ctx.lineWidth = 2;
    ctx.strokeRect(x * panelW + 2, 2, panelW - 4, size - 4);

    // Light fixture
    ctx.fillStyle = '#ffffee';
    ctx.fillRect(x * panelW + panelW / 2 - 12, size / 2 - 6, 24, 12);
    ctx.shadowColor = '#ffffcc';
    ctx.shadowBlur = 8;
    ctx.fillRect(x * panelW + panelW / 2 - 12, size / 2 - 6, 24, 12);
    ctx.shadowBlur = 0;
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(6, 6);
  return tex;
}

export function createWallTexture(color = '#d0c8b8') {
  const size = 128;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = color;
  ctx.fillRect(0, 0, size, size);

  for (let i = 0; i < 20; i++) {
    ctx.fillStyle = `rgba(0,0,0,${Math.random() * 0.04})`;
    ctx.fillRect(Math.random() * size, Math.random() * size, Math.random() * 30 + 5, 2);
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(2, 1);
  return tex;
}

export function createShelfTexture() {
  const size = 128;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = '#8B6914';
  ctx.fillRect(0, 0, size, size);

  for (let y = 0; y < size; y += 4) {
    ctx.strokeStyle = `rgba(0,0,0,${0.1 + Math.random() * 0.1})`;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(size, y + Math.random() * 2);
    ctx.stroke();
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  return tex;
}

export function createSignTexture(text, bgColor = '#e94560', fontSize = 36) {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 128;
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = bgColor;
  ctx.fillRect(8, 8, 496, 112);

  ctx.fillStyle = '#fff';
  ctx.font = `bold ${fontSize}px Segoe UI, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, 256, 64);

  return new THREE.CanvasTexture(canvas);
}

export function createCategoryLabelTexture(text, bgColor = '#333333') {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 96;
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = bgColor;
  ctx.fillRect(0, 0, 512, 96);

  ctx.strokeStyle = '#ffffff55';
  ctx.lineWidth = 3;
  ctx.strokeRect(2, 2, 508, 92);

  ctx.fillStyle = '#fff';
  ctx.font = 'bold 32px Segoe UI, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, 256, 48);

  const tex = new THREE.CanvasTexture(canvas);
  tex.needsUpdate = true;
  return tex;
}

export function createItemLabelTexture(text) {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  const fontSize = 22;
  const padX = 12;
  const padY = 6;

  ctx.font = `bold ${fontSize}px Segoe UI, sans-serif`;
  const textW = ctx.measureText(text).width;
  canvas.width = Math.ceil(textW + padX * 2);
  canvas.height = fontSize + padY * 2;

  ctx.font = `bold ${fontSize}px Segoe UI, sans-serif`;
  ctx.fillStyle = 'rgba(0, 0, 0, 0.72)';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = '#ffe66d';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, canvas.width / 2, canvas.height / 2);

  const tex = new THREE.CanvasTexture(canvas);
  tex.needsUpdate = true;
  return { texture: tex, width: canvas.width, height: canvas.height };
}

/** Billboard sprite label for 3D items */
export function createItemLabelSprite(text) {
  const { texture, width, height } = createItemLabelTexture(text);
  const material = new THREE.SpriteMaterial({
    map: texture,
    transparent: true,
    depthTest: false,
    depthWrite: false
  });
  const sprite = new THREE.Sprite(material);
  const scale = 0.012;
  sprite.scale.set(width * scale, height * scale, 1);
  sprite.renderOrder = 999;
  return sprite;
}
