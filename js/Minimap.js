import { PLAYER_BOUNDS } from './MallConfig.js';
import {
  MAZE_GRID,
  MAZE_COLS,
  MAZE_ROWS,
  CATEGORY_ROOMS
} from './MazeLayout.js';

const AISLE_LABELS = ['D', 'M', 'V', 'F', 'B', 'S', 'Fr', 'De', 'Be', 'Sn'];

export class Minimap {
  constructor(canvas, aisleZones) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.aisleZones = aisleZones;
    this.padding = 5;
    this.legendH = 24;
    this.pulse = 0;

    this.canvas.width = 210;
    this.canvas.height = 210;
    this.mapRect = this._computeMapRect();
  }

  _computeMapRect() {
    const w = this.canvas.width;
    const h = this.canvas.height - this.legendH;
    const pad = this.padding;
    return { x: pad, y: pad, w: w - pad * 2, h: h - pad * 2 };
  }

  _gridToCanvas(col, row) {
    const r = this.mapRect;
    return {
      x: r.x + ((col + 0.5) / MAZE_COLS) * r.w,
      y: r.y + ((row + 0.5) / MAZE_ROWS) * r.h
    };
  }

  _worldToCanvas(wx, wz) {
    const { minX, maxX, minZ, maxZ } = PLAYER_BOUNDS;
    const r = this.mapRect;
    return {
      x: r.x + ((wx - minX) / (maxX - minX)) * r.w,
      y: r.y + ((wz - minZ) / (maxZ - minZ)) * r.h
    };
  }

  _cellSize() {
    return {
      w: this.mapRect.w / MAZE_COLS,
      h: this.mapRect.h / MAZE_ROWS
    };
  }

  _drawMaze(ctx) {
    const { w: cellW, h: cellH } = this._cellSize();

    for (let row = 0; row < MAZE_ROWS; row++) {
      for (let col = 0; col < MAZE_COLS; col++) {
        const p = this._gridToCanvas(col, row);
        const isWall = MAZE_GRID[row][col] === 1;

        ctx.fillStyle = isWall ? '#4a3728' : '#243044';
        ctx.fillRect(p.x - cellW / 2, p.y - cellH / 2, cellW - 0.5, cellH - 0.5);

        if (isWall) {
          ctx.strokeStyle = '#6b5344';
          ctx.lineWidth = 0.5;
          ctx.strokeRect(p.x - cellW / 2, p.y - cellH / 2, cellW - 0.5, cellH - 0.5);
        }
      }
    }
  }

  _drawNeededAisleHighlights(ctx, neededAisles) {
    if (neededAisles.size === 0) return;

    const { w: cellW, h: cellH } = this._cellSize();
    const pulse = 0.45 + Math.sin(this.pulse) * 0.2;

    for (const room of CATEGORY_ROOMS) {
      if (!neededAisles.has(room.aisle)) continue;

      const zone = this.aisleZones[room.aisle];
      const hex = (zone?.color ?? 0xffee00).toString(16).padStart(6, '0');
      const p = this._gridToCanvas(room.col, room.row);

      ctx.fillStyle = `#${hex}${Math.floor(pulse * 255).toString(16).padStart(2, '0')}`;
      ctx.fillRect(p.x - cellW / 2 + 1, p.y - cellH / 2 + 1, cellW - 2, cellH - 2);
    }
  }

  _drawCategoryMarkers(ctx, neededAisles) {
    for (const room of CATEGORY_ROOMS) {
      const zone = this.aisleZones[room.aisle];
      const hex = (zone?.color ?? 0xffffff).toString(16).padStart(6, '0');
      const p = this._gridToCanvas(room.col, room.row);
      const needed = neededAisles.has(room.aisle);
      const radius = needed ? 5.5 : 4;

      if (needed) {
        ctx.beginPath();
        ctx.arc(p.x, p.y, radius + 3, 0, Math.PI * 2);
        ctx.strokeStyle = `#${hex}`;
        ctx.lineWidth = 2;
        ctx.stroke();
      }

      ctx.beginPath();
      ctx.arc(p.x, p.y, radius, 0, Math.PI * 2);
      ctx.fillStyle = `#${hex}`;
      ctx.fill();
      ctx.strokeStyle = needed ? '#ffffff' : '#ffffff66';
      ctx.lineWidth = needed ? 1.5 : 1;
      ctx.stroke();

      ctx.fillStyle = '#1a1a2e';
      ctx.font = 'bold 7px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(AISLE_LABELS[room.aisle] ?? '?', p.x, p.y + 0.5);
    }
  }

  _drawEntranceAndCheckout(ctx, cashierPos) {
    const entrance = this._gridToCanvas(6, MAZE_ROWS - 1);
    const { w: cellW } = this._cellSize();

    ctx.fillStyle = '#2ecc7144';
    ctx.fillRect(entrance.x - cellW, entrance.y - cellW * 0.4, cellW * 2, cellW * 0.8);

    ctx.fillStyle = '#2ecc71';
    ctx.font = 'bold 7px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('EXIT', entrance.x, entrance.y);

    if (cashierPos) {
      const cp = this._worldToCanvas(cashierPos.x, cashierPos.z);
      ctx.beginPath();
      ctx.arc(cp.x, cp.y, 4, 0, Math.PI * 2);
      ctx.fillStyle = '#2ecc71';
      ctx.fill();
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }
  }

  _drawCollectibles(ctx, collectibles) {
    collectibles.forEach(c => {
      if (c.userData.collected) return;
      const p = this._worldToCanvas(c.position.x, c.position.z);

      ctx.beginPath();
      ctx.arc(p.x, p.y, 3.5, 0, Math.PI * 2);
      ctx.fillStyle = '#ffee00';
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1;
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(p.x, p.y, 5 + Math.sin(this.pulse * 2) * 1.5, 0, Math.PI * 2);
      ctx.strokeStyle = '#ffee0066';
      ctx.lineWidth = 1;
      ctx.stroke();
    });
  }

  _drawEnemies(ctx, enemies) {
    enemies.forEach(ep => {
      const p = this._worldToCanvas(ep.x, ep.z);
      ctx.beginPath();
      ctx.arc(p.x, p.y, 4, 0, Math.PI * 2);
      ctx.fillStyle = '#ff4466';
      ctx.fill();
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 1.2;
      ctx.stroke();
    });
  }

  _drawRadarGuide(ctx, playerX, playerZ, radarTarget) {
    if (!radarTarget) return;

    const isCheckout = radarTarget.mode === 'checkout';
    const from = this._worldToCanvas(playerX, playerZ);
    const to = this._worldToCanvas(radarTarget.x, radarTarget.z);
    const pulse = 0.6 + Math.sin(this.pulse * 2) * 0.4;
    const lineColor = isCheckout
      ? `rgba(46, 204, 113, ${pulse})`
      : `rgba(255, 238, 68, ${pulse})`;
    const markerColor = isCheckout ? '#2ecc71' : '#ffee44';

    ctx.save();
    ctx.setLineDash([4, 4]);
    ctx.strokeStyle = lineColor;
    ctx.lineWidth = isCheckout ? 2.5 : 2;
    ctx.beginPath();
    ctx.moveTo(from.x, from.y);
    ctx.lineTo(to.x, to.y);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.beginPath();
    ctx.arc(to.x, to.y, 7 + Math.sin(this.pulse * 3) * 2, 0, Math.PI * 2);
    ctx.strokeStyle = markerColor;
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(to.x, to.y, 4, 0, Math.PI * 2);
    ctx.fillStyle = markerColor;
    ctx.fill();
    ctx.restore();
  }

  _drawPlayer(ctx, playerX, playerZ, playerYaw) {
    const p = this._worldToCanvas(playerX, playerZ);

    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate(-playerYaw);

    ctx.fillStyle = '#4ecdc4';
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(0, -7);
    ctx.lineTo(-5, 5);
    ctx.lineTo(0, 2);
    ctx.lineTo(5, 5);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.restore();
  }

  _drawLegend(ctx, neededCount) {
    const w = this.canvas.width;
    const y = this.canvas.height - this.legendH + 6;

    ctx.fillStyle = '#ffffff55';
    ctx.font = '8px sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText('You', 8, y);

    ctx.fillStyle = '#4ecdc4';
    ctx.fillRect(28, y + 1, 6, 6);

    ctx.fillStyle = '#ffffff55';
    ctx.fillText('Item', 40, y);
    ctx.fillStyle = '#ffee00';
    ctx.beginPath();
    ctx.arc(62, y + 4, 3, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#ffffff55';
    ctx.fillText('Enemy', 72, y);
    ctx.fillStyle = '#ff4466';
    ctx.beginPath();
    ctx.arc(104, y + 4, 3, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#ffffff55';
    ctx.textAlign = 'right';
    ctx.fillText(neededCount > 0 ? `${neededCount} aisle${neededCount > 1 ? 's' : ''} left` : 'Go checkout!', w - 8, y);
  }

  update(playerX, playerZ, playerYaw, collectibles, enemies = [], cashierPos = null, shoppingList = [], radarTarget = null) {
    this.pulse += 0.08;

    const ctx = this.ctx;
    const w = this.canvas.width;
    const h = this.canvas.height;

    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = '#12121f';
    ctx.fillRect(0, 0, w, h);

    const neededAisles = new Set(
      shoppingList.filter(item => !item.found).map(item => item.aisle)
    );

    this._drawMaze(ctx);
    this._drawNeededAisleHighlights(ctx, neededAisles);
    this._drawCategoryMarkers(ctx, neededAisles);
    this._drawEntranceAndCheckout(ctx, cashierPos);
    this._drawCollectibles(ctx, collectibles);
    this._drawRadarGuide(ctx, playerX, playerZ, radarTarget);
    this._drawEnemies(ctx, enemies);
    this._drawPlayer(ctx, playerX, playerZ, playerYaw);
    this._drawLegend(ctx, neededAisles.size);

    ctx.strokeStyle = '#ffffff33';
    ctx.lineWidth = 1;
    ctx.strokeRect(this.mapRect.x - 0.5, this.mapRect.y - 0.5, this.mapRect.w + 1, this.mapRect.h + 1);

    ctx.fillStyle = '#ffffff66';
    ctx.font = 'bold 8px sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText('N', this.mapRect.x + 3, this.mapRect.y + 3);
  }
}
