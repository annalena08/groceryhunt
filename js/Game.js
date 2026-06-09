import * as THREE from 'three';
import { generateShoppingList } from './ItemDatabase.js';
import { MallScene, PLAYER_BOUNDS } from './MallScene.js';
import { SHOPPING_LIST_SIZE } from './MallConfig.js';
import { Player } from './Player.js';
import { TouchControls, isMobileDevice } from './TouchControls.js';
import { Minimap } from './Minimap.js';
import { EnemyManager } from './EnemyManager.js';
import { AudioManager } from './AudioManager.js';
import {
  getRejectMessage,
  isAlphabeticalOrder,
  getAlphabeticalEasterEggMessage,
  getCheckoutSuccessMessage
} from './CashierDialogue.js';

const GAME_DURATION = 5 * 60; // 5 minutes
const COLLECT_DISTANCE = 2.5;
const LABEL_DISTANCE = 3.5;
const CASHIER_DISTANCE = 2.8;

export class Game {
  constructor() {
    this.isRunning = false;
    this.isMobile = isMobileDevice();
    this.shoppingList = [];
    this.timeRemaining = GAME_DURATION;
    this.lastTime = 0;
    this.nearestCollectible = null;
    this.nearestScareTarget = null;
    this.nearCashier = false;
    this.collectionOrder = [];
    this.dialogueActive = false;
    this.dialoguePendingWin = false;
    this.dialogueAlphabeticalBonus = false;

    this._initThree();
    this._initUI();
  }

  _initThree() {
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.domElement.id = 'game-canvas';
    document.body.appendChild(this.renderer.domElement);

    this.camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      100
    );

    this.mall = new MallScene();
    this.player = new Player(this.camera, this.mall.colliders, PLAYER_BOUNDS);
    this.enemies = new EnemyManager(this.mall.scene, this.mall.colliders, PLAYER_BOUNDS);
    this.audio = new AudioManager();
    this.minimap = new Minimap(
      document.getElementById('minimap'),
      this.mall.aisleZones
    );
    this.touchControls = new TouchControls(this.player, this.isMobile);

    window.addEventListener('resize', () => this._onResize());
    this._setupPointerLock();
    this._setupCollect();
  }

  _initUI() {
    this.ui = {
      loading: document.getElementById('loading-screen'),
      start: document.getElementById('start-screen'),
      game: document.getElementById('game-ui'),
      end: document.getElementById('end-screen'),
      timer: document.getElementById('timer'),
      progress: document.getElementById('progress'),
      listItems: document.getElementById('list-items'),
      interactPrompt: document.getElementById('interact-prompt'),
      collectBtn: document.getElementById('collect-btn'),
      endTitle: document.getElementById('end-title'),
      endMessage: document.getElementById('end-message'),
      catchFlash: document.getElementById('catch-flash'),
      catchAlert: document.getElementById('catch-alert'),
      scareAlert: document.getElementById('scare-alert'),
      scareCooldown: document.getElementById('scare-cooldown'),
      dialogue: document.getElementById('cashier-dialogue'),
      dialogueSpeaker: document.getElementById('dialogue-speaker'),
      dialogueText: document.getElementById('dialogue-text'),
      dialogueBtn: document.getElementById('dialogue-btn')
    };

    document.getElementById('start-btn').addEventListener('click', () => {
      this.audio.unlock();
      this.start();
    });
    document.getElementById('restart-btn').addEventListener('click', () => {
      this.audio.unlock();
      this.restart();
    });
    this.ui.collectBtn?.addEventListener('click', () => this._tryInteract());
    this.ui.dialogueBtn?.addEventListener('click', () => this._dismissDialogue());
  }

  _setupPointerLock() {
    if (this.isMobile) return;

    this.renderer.domElement.addEventListener('click', () => {
      if (!this.isRunning || this.dialogueActive) return;
      if (this._canInteract()) {
        this._tryInteract();
      } else {
        this.renderer.domElement.requestPointerLock();
      }
    });

    document.addEventListener('pointerlockchange', () => {
      this.pointerLocked = document.pointerLockElement === this.renderer.domElement;
    });

    document.addEventListener('mousemove', e => {
      if (this.isRunning && this.pointerLocked) {
        this.player.setMouseSensitivity(e.movementX, e.movementY);
      }
    });

    window.addEventListener('keydown', e => {
      if (e.code === 'KeyE' && this.isRunning && !this.dialogueActive) {
        this._tryInteract();
      }
      if (e.code === 'KeyE' && this.dialogueActive) {
        this._dismissDialogue();
      }
    });
  }

  _setupCollect() {
    // Collection via E key is handled in _setupPointerLock
  }

  async init() {
    // Brief delay so textures generate
    await new Promise(r => setTimeout(r, 300));
    this.ui.loading.classList.add('hidden');
    this.ui.start.classList.remove('hidden');
  }

  start() {
    this.ui.start.classList.add('hidden');
    this.ui.game.classList.remove('hidden');
    this.touchControls.show();

    this.shoppingList = generateShoppingList();
    this.collectionOrder = [];
    this.timeRemaining = GAME_DURATION;
    this.isRunning = true;
    this.lastTime = performance.now();
    this._hideDialogue();

    // Reset scene collectibles
    this.mall.collectibles.forEach(c => this.mall.scene.remove(c));
    this.mall.collectibles = [];
    this.mall.placeCollectibles(this.shoppingList);

    const spawn = this.mall.getSpawnPosition();
    this.player.setPosition(spawn.x, spawn.y, spawn.z);
    this.enemies.spawnAll(spawn);

    this._renderShoppingList();
    this._updateHUD();

    if (!this.isMobile) {
      this.renderer.domElement.requestPointerLock();
    }

    this._loop();
  }

  restart() {
    this.ui.end.classList.add('hidden');
    this.ui.game.classList.remove('hidden');
    this.start();
  }

  _renderShoppingList() {
    this.ui.listItems.innerHTML = '';
    this.shoppingList.forEach(item => {
      const li = document.createElement('li');
      li.dataset.id = item.id;
      li.innerHTML = `<span>${item.name}</span>`;
      if (item.found) li.classList.add('found');
      this.ui.listItems.appendChild(li);
    });
  }

  _updateHUD() {
    const mins = Math.floor(this.timeRemaining / 60);
    const secs = Math.floor(this.timeRemaining % 60);
    this.ui.timer.textContent = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    this.ui.timer.classList.toggle('warning', this.timeRemaining <= 60);

    const found = this.shoppingList.filter(i => i.found).length;
    const allFound = found === this.shoppingList.length;
    this.ui.progress.textContent = allFound
      ? `${found} / ${SHOPPING_LIST_SIZE} — Checkout!`
      : `${found} / ${SHOPPING_LIST_SIZE} found`;
    this.ui.progress.classList.toggle('checkout-ready', allFound);

    const scareCd = this.enemies.getScareCooldownRemaining();
    if (scareCd > 0) {
      this.ui.scareCooldown.classList.remove('hidden', 'ready');
      this.ui.scareCooldown.textContent = `Yell: ${Math.ceil(scareCd)}s`;
    } else {
      this.ui.scareCooldown.classList.remove('hidden');
      this.ui.scareCooldown.classList.add('ready');
      this.ui.scareCooldown.textContent = 'Yell: ready';
    }
  }

  _loop() {
    if (!this.isRunning) return;

    const now = performance.now();
    const dt = Math.min((now - this.lastTime) / 1000, 0.05);
    this.lastTime = now;

    this.timeRemaining -= dt;
    if (this.timeRemaining <= 0) {
      this.timeRemaining = 0;
      this._endGame(false);
      return;
    }

    this.player.update(dt);
    this.audio.updateFootsteps(this.player.isMoving, this.player.distanceMoved);

    const pos = this.player.getPosition();
    if (this.enemies.update(dt, pos)) {
      this._onPlayerCaught();
    }

    this._checkNearestInteractable();
    this._updateHUD();

    this.minimap.update(
      pos.x,
      pos.z,
      this.player.yaw,
      this.mall.collectibles,
      this.enemies.getEnemyPositions(),
      this.mall.getCashierPosition(),
      this.shoppingList
    );

    this.renderer.render(this.mall.scene, this.camera);
    requestAnimationFrame(() => this._loop());
  }

  _checkNearestInteractable() {
    const pos = this.player.getPosition();
    let nearest = null;
    let nearestDist = COLLECT_DISTANCE;

    for (const c of this.mall.collectibles) {
      if (c.userData.collected) continue;
      const dist = pos.distanceTo(c.position);
      if (dist < nearestDist) {
        nearestDist = dist;
        nearest = c;
      }
    }

    this.nearestCollectible = nearest;

    const cashierPos = this.mall.getCashierPosition();
    let nearCashier = false;
    if (cashierPos) {
      const cashierDist = Math.hypot(pos.x - cashierPos.x, pos.z - cashierPos.z);
      nearCashier = cashierDist <= CASHIER_DISTANCE;
    }
    this.nearCashier = nearCashier;
    this.nearestScareTarget = this.enemies.getScareTarget(pos, this.player.yaw);

    const interactTarget = this._getInteractTarget();
    const showPrompt = interactTarget !== null;
    const promptText = interactTarget === 'cashier'
      ? 'Press E to check out'
      : interactTarget === 'scare'
        ? 'Press E to yell — Go away!'
        : 'Press E or tap Collect';

    if (this.isMobile) {
      this.ui.collectBtn.classList.toggle('hidden', !showPrompt);
      if (showPrompt) {
        const labels = {
          cashier: 'Check Out',
          scare: 'Yell!',
          collectible: 'Collect'
        };
        this.ui.collectBtn.textContent = labels[interactTarget] ?? 'Collect';
      }
    } else {
      this.ui.interactPrompt.classList.toggle('hidden', !showPrompt);
      if (showPrompt) {
        this.ui.interactPrompt.textContent = promptText;
      }
    }

    this.mall.collectibles.forEach(c => {
      if (c.userData.collected) return;

      const dist = pos.distanceTo(c.position);
      const isNearest = c === nearest;

      if (c.userData.label) {
        c.userData.label.visible = dist <= LABEL_DISTANCE;
      }

      c.scale.setScalar(isNearest ? 1 + Math.sin(performance.now() * 0.005) * 0.08 : 1);
    });
  }

  _getInteractTarget() {
    if (this.nearCashier) return 'cashier';
    if (this.nearestCollectible) return 'collectible';
    if (this.nearestScareTarget) return 'scare';
    return null;
  }

  _canInteract() {
    return this._getInteractTarget() !== null;
  }

  _tryInteract() {
    const target = this._getInteractTarget();
    if (target === 'cashier') {
      this._tryCheckout();
    } else if (target === 'collectible') {
      this._tryCollect();
    } else if (target === 'scare') {
      this._tryScare();
    }
  }

  _tryScare() {
    const pos = this.player.getPosition();
    const result = this.enemies.tryScare(pos, this.player.yaw);
    if (!result.ok) return;

    this._showScareAlert(result.line);
  }

  _showScareAlert(line) {
    const alert = this.ui.scareAlert;
    const text = alert.querySelector('.scare-text');

    alert.classList.remove('hidden', 'active');
    if (text) text.textContent = `"${line}"`;
    void alert.offsetWidth;
    alert.classList.add('active');

    setTimeout(() => {
      alert.classList.remove('active');
      alert.classList.add('hidden');
    }, 3600);
  }

  _onPlayerCaught() {
    const penalty = this.enemies.applyCatchPenalty();
    this.timeRemaining = Math.max(0, this.timeRemaining - penalty);

    this.audio.playCatchAlert();
    this._showCatchAlert();

    if (this.timeRemaining <= 0) {
      this.timeRemaining = 0;
      this._endGame(false);
    }
  }

  _showCatchAlert() {
    const flash = this.ui.catchFlash;
    const alert = this.ui.catchAlert;

    flash.classList.remove('hidden', 'active');
    alert.classList.remove('hidden', 'active');
    void flash.offsetWidth;
    flash.classList.add('active');
    alert.classList.add('active');

    this.ui.timer.classList.add('penalty-flash');
    setTimeout(() => this.ui.timer.classList.remove('penalty-flash'), 500);

    setTimeout(() => {
      flash.classList.remove('active');
      alert.classList.remove('active');
      flash.classList.add('hidden');
      alert.classList.add('hidden');
    }, 900);
  }

  _tryCollect() {
    if (!this.nearestCollectible || this.nearestCollectible.userData.collected) return;

    const id = this.nearestCollectible.userData.collectibleId;
    const item = this.shoppingList.find(i => i.id === id);
    if (!item || item.found) return;

    item.found = true;
    this.collectionOrder.push(item.name);
    this.nearestCollectible.userData.collected = true;

    // Collection effect — shrink and fade
    const mesh = this.nearestCollectible;
    mesh.visible = false;

    const li = this.ui.listItems.querySelector(`[data-id="${id}"]`);
    if (li) li.classList.add('found');
  }

  _tryCheckout() {
    const found = this.shoppingList.filter(i => i.found).length;
    const total = this.shoppingList.length;

    if (found < total) {
      this.dialoguePendingWin = false;
      this.dialogueAlphabeticalBonus = false;
      this._showDialogue('Pat (Cashier)', getRejectMessage(found, total), 'angry');
      return;
    }

    const alphabetical = isAlphabeticalOrder(this.collectionOrder);
    const message = alphabetical
      ? getAlphabeticalEasterEggMessage()
      : getCheckoutSuccessMessage();

    this.dialoguePendingWin = true;
    this.dialogueAlphabeticalBonus = alphabetical;
    this._showDialogue('Pat (Cashier)', message, alphabetical ? 'easter-egg' : 'success');
  }

  _showDialogue(speaker, text, mood = 'neutral') {
    this.dialogueActive = true;
    this.ui.dialogue.classList.remove('hidden');
    this.ui.dialogue.classList.remove('angry', 'success', 'easter-egg');
    this.ui.dialogue.classList.add(mood);
    this.ui.dialogueSpeaker.textContent = speaker;
    this.ui.dialogueText.textContent = text;
    this.ui.dialogueBtn.textContent = mood === 'angry' ? 'OK' : 'Done';

    if (document.pointerLockElement) {
      document.exitPointerLock();
    }
  }

  _dismissDialogue() {
    if (!this.dialogueActive) return;

    const pendingWin = this.dialoguePendingWin;
    const alphabeticalBonus = this.dialogueAlphabeticalBonus;
    this._hideDialogue();

    if (pendingWin) {
      this._endGame(true, alphabeticalBonus);
    }
  }

  _hideDialogue() {
    this.dialogueActive = false;
    this.dialoguePendingWin = false;
    this.dialogueAlphabeticalBonus = false;
    this.ui.dialogue.classList.add('hidden');
  }

  _endGame(won, alphabeticalBonus = false) {
    this.isRunning = false;
    this.enemies.clear();
    this.touchControls.hide();

    if (document.pointerLockElement) {
      document.exitPointerLock();
    }

    this.ui.game.classList.add('hidden');
    this.ui.end.classList.remove('hidden');

    if (won) {
      this.ui.endTitle.textContent = alphabeticalBonus
        ? 'Checkout Complete — Certified Perfectionist!'
        : 'Shopping Complete!';
      const mins = Math.floor((GAME_DURATION - this.timeRemaining) / 60);
      const secs = Math.floor((GAME_DURATION - this.timeRemaining) % 60);
      this.ui.endMessage.textContent = alphabeticalBonus
        ? `You found all ${SHOPPING_LIST_SIZE} items in ${mins}:${String(secs).padStart(2, '0')} — in alphabetical order. Pat is still recovering.`
        : `You found all ${SHOPPING_LIST_SIZE} items and checked out in ${mins}:${String(secs).padStart(2, '0')}! Great job!`;
    } else {
      this.ui.endTitle.textContent = "Time's Up!";
      const found = this.shoppingList.filter(i => i.found).length;
      this.ui.endMessage.textContent =
        `You found ${found} out of ${SHOPPING_LIST_SIZE} items. Better luck next time!`;
    }
  }

  _onResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }
}
