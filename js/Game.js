import * as THREE from 'three';
import { generateShoppingList } from './ItemDatabase.js';
import { MallScene, PLAYER_BOUNDS } from './MallScene.js';
import { DIFFICULTIES, DEFAULT_DIFFICULTY } from './MallConfig.js';
import { Player } from './Player.js';
import { TouchControls, isMobileDevice } from './TouchControls.js';
import { Minimap } from './Minimap.js';
import { EnemyManager } from './EnemyManager.js';
import { AudioManager } from './AudioManager.js';
import { PowerUpManager } from './PowerUpManager.js';
import {
  getRejectMessage,
  isAlphabeticalOrder,
  getAlphabeticalEasterEggMessage,
  getCheckoutSuccessMessage,
  getTimeWarningMessage
} from './CashierDialogue.js';

const GAME_DURATION = 5 * 60; // 5 minutes
const COLLECT_DISTANCE = 2.5;
const LABEL_DISTANCE = 3.5;
const CASHIER_DISTANCE = 2.8;

export class Game {
  constructor() {
    this.isRunning = false;
    this.isMobile = isMobileDevice();
    if (this.isMobile) {
      document.documentElement.classList.add('touch-device');
    }
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
    this.dialogueDismissLocked = false;
    this.dialogueDismissLockTimer = 0;
    this.patTimeWarningPlayed = false;
    this.difficultyId = DEFAULT_DIFFICULTY;

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
    this.powerUps = new PowerUpManager(this.mall.scene);
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
      dialogueBtn: document.getElementById('dialogue-btn'),
      itemRadarHud: document.getElementById('item-radar-hud'),
      radarArrow: document.getElementById('radar-arrow'),
      radarItemName: document.getElementById('radar-item-name'),
      radarAisleHint: document.getElementById('radar-aisle-hint'),
      radarDistance: document.getElementById('radar-distance'),
      powerupPanel: document.getElementById('powerup-panel'),
      powerupStatus: document.getElementById('powerup-status'),
      powerupToast: document.getElementById('powerup-toast'),
      checkoutPointer: document.getElementById('checkout-pointer'),
      checkoutArrow: document.getElementById('checkout-arrow'),
      checkoutDistance: document.getElementById('checkout-distance'),
      checkoutToast: document.getElementById('checkout-toast'),
      endStats: document.getElementById('end-stats')
    };

    this._bindTapButton(document.getElementById('start-btn'), () => {
      this.audio.unlock();
      this.start();
    });
    this._bindTapButton(document.getElementById('menu-btn'), () => {
      this.goToMainMenu();
    });
    this._bindTapButton(this.ui.collectBtn, () => {
      if (!this.dialogueActive) this._tryInteract();
    });
    this.ui.dialogueBtn?.addEventListener('click', () => this._dismissDialogue());
    this._initDifficultyPicker();
  }

  _initDifficultyPicker() {
    const buttons = document.querySelectorAll('.difficulty-btn');
    buttons.forEach(btn => {
      btn.addEventListener('click', () => this._selectDifficulty(btn.dataset.difficulty));
    });
    this._selectDifficulty(this.difficultyId);
  }

  _selectDifficulty(id) {
    if (!DIFFICULTIES[id]) return;
    this.difficultyId = id;
    document.querySelectorAll('.difficulty-btn').forEach(btn => {
      btn.classList.toggle('selected', btn.dataset.difficulty === id);
    });
  }

  _getDifficulty() {
    return DIFFICULTIES[this.difficultyId];
  }

  _bindTapButton(el, handler) {
    if (!el) return;

    let touchTriggered = false;

    el.addEventListener('pointerdown', e => {
      if (e.pointerType === 'touch' || e.pointerType === 'pen') {
        e.preventDefault();
        e.stopPropagation();
        touchTriggered = true;
        handler();
      }
    });

    el.addEventListener('click', e => {
      if (touchTriggered) {
        e.preventDefault();
        touchTriggered = false;
        return;
      }
      handler();
    });
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
      if (e.code === 'KeyE' && this.dialogueActive && !this.dialogueDismissLocked) {
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

    const difficulty = this._getDifficulty();
    this.shoppingList = generateShoppingList(difficulty.items);
    this.collectionOrder = [];
    this.timeRemaining = GAME_DURATION;
    this.isRunning = true;
    this.lastTime = performance.now();
    this.checkoutToastShown = false;
    this.patTimeWarningPlayed = false;
    this.runStats = { powerUpsCollected: 0, timesCaught: 0, scaresUsed: 0 };
    this._hideDialogue();

    // Reset scene collectibles
    this.mall.collectibles.forEach(c => this.mall.scene.remove(c));
    this.mall.collectibles = [];
    this.mall.placeCollectibles(this.shoppingList);

    const spawn = this.mall.getSpawnPosition();
    this.player.setPosition(spawn.x, spawn.y, spawn.z);
    this.enemies.spawnAll(spawn, difficulty.enemies);
    this.powerUps.start(spawn);

    this._renderShoppingList();
    this._updateHUD();

    if (!this.isMobile) {
      this.renderer.domElement.requestPointerLock();
    }

    this._loop();
  }

  goToMainMenu() {
    this.isRunning = false;
    this.ui.end.classList.add('hidden');
    this.ui.game.classList.add('hidden');
    this.ui.start.classList.remove('hidden');
    this.ui.checkoutPointer?.classList.add('hidden');
    this.ui.checkoutToast?.classList.add('hidden');
    this.ui.itemRadarHud?.classList.add('hidden');
    this.touchControls.hide();

    if (document.pointerLockElement) {
      document.exitPointerLock();
    }
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

    const total = this.shoppingList.length;
    const found = this.shoppingList.filter(i => i.found).length;
    const allFound = found === total;
    this.ui.progress.textContent = allFound
      ? `${found} / ${total} — Checkout!`
      : `${found} / ${total} found`;
    this.ui.progress.classList.toggle('checkout-ready', allFound);

    if (allFound && !this.checkoutToastShown) {
      this.checkoutToastShown = true;
      this.ui.checkoutToast?.classList.remove('hidden');
      setTimeout(() => this.ui.checkoutToast?.classList.add('hidden'), 3500);
    }

    if (this.powerUps.hasYellBoost()) {
      this.ui.scareCooldown.classList.remove('hidden', 'ready');
      this.ui.scareCooldown.textContent = 'Yell: FREE!';
      this.ui.scareCooldown.classList.add('powerup-active');
    } else {
      this.ui.scareCooldown.classList.remove('powerup-active');
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

    this._updatePowerUpUI();
  }

  _updatePowerUpUI() {
    const active = this.powerUps.getActiveEffects();
    const toast = this.powerUps.getPickupToast();

    if (active.length > 0) {
      this.ui.powerupPanel.classList.remove('hidden');
      this.ui.powerupStatus.innerHTML = active.map(e =>
        `<div class="powerup-active-item powerup-${e.type}">${e.icon} ${e.label} — ${Math.ceil(e.remaining)}s</div>`
      ).join('');
    } else {
      this.ui.powerupPanel.classList.add('hidden');
      this.ui.powerupStatus.innerHTML = '';
    }

    if (toast) {
      this.ui.powerupToast.classList.remove('hidden');
      this.ui.powerupToast.textContent = toast.text;
    } else {
      this.ui.powerupToast.classList.add('hidden');
    }
  }

  _loop() {
    if (!this.isRunning) return;

    const now = performance.now();
    const dt = Math.min((now - this.lastTime) / 1000, 0.05);
    this.lastTime = now;

    if (this.dialogueDismissLockTimer > 0) {
      this.dialogueDismissLockTimer = Math.max(0, this.dialogueDismissLockTimer - dt);
      if (this.dialogueDismissLockTimer <= 0) {
        this.dialogueDismissLocked = false;
      }
    }

    if (!this.dialogueActive) {
      this.timeRemaining -= dt;
      if (this.timeRemaining <= 0) {
        this.timeRemaining = 0;
        this._endGame(false);
        return;
      }

      this._checkPatTimeWarning();
    }

    this.player.update(dt);
    this.audio.updateFootsteps(this.player.isMoving, this.player.distanceMoved);

    const pos = this.player.getPosition();
    const unlimitedYell = this.powerUps.hasYellBoost();

    this.powerUps.update(dt, pos, this.mall.collectibles, {
      onTimeBonus: seconds => {
        this.timeRemaining += seconds;
      },
      onPowerUpCollected: () => {
        this.runStats.powerUpsCollected++;
      }
    });

    if (this.enemies.update(dt, pos, this.powerUps.isFrozen())) {
      this._onPlayerCaught();
    }

    this._checkNearestInteractable(unlimitedYell);
    this._updateHUD();

    const allFound = this.shoppingList.every(i => i.found);
    const navTarget = this._updateNavigationHUD(pos, allFound);

    this.minimap.update(
      pos.x,
      pos.z,
      this.player.yaw,
      this.mall.collectibles,
      this.enemies.getEnemyPositions(),
      this.mall.getCashierPosition(),
      this.shoppingList,
      navTarget
    );

    this.renderer.render(this.mall.scene, this.camera);
    requestAnimationFrame(() => this._loop());
  }

  _checkNearestInteractable(unlimitedYell = false) {
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
    this.nearestScareTarget = this.enemies.getScareTarget(pos, this.player.yaw, unlimitedYell);

    const interactTarget = this._getInteractTarget();
    const showPrompt = interactTarget !== null;
    const promptText = interactTarget === 'cashier'
      ? 'Press E to check out'
      : interactTarget === 'scare'
        ? 'Press E to yell — Go away!'
        : 'Press E or tap Collect';

    if (this.isMobile) {
      this.ui.collectBtn.classList.remove('hidden');
      this.ui.collectBtn.classList.toggle('action-ready', showPrompt);
      const labels = {
        cashier: 'Check\nOut',
        scare: 'Yell!',
        collectible: 'Collect'
      };
      this.ui.collectBtn.textContent = showPrompt
        ? (labels[interactTarget] ?? 'Collect')
        : '···';
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
    if (this.dialogueActive) return;

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
    const result = this.enemies.tryScare(pos, this.player.yaw, this.powerUps.hasYellBoost());
    if (!result.ok) return;

    this.runStats.scaresUsed++;
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
    this.runStats.timesCaught++;
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

  _getCheckoutTarget(playerPos) {
    const cashierPos = this.mall.getCashierPosition();
    if (!cashierPos) return null;

    const distance = Math.hypot(playerPos.x - cashierPos.x, playerPos.z - cashierPos.z);
    return { x: cashierPos.x, z: cashierPos.z, distance, mode: 'checkout' };
  }

  _getNearestUncollectedTarget(playerPos) {
    let nearest = null;
    let nearestDist = Infinity;

    for (const c of this.mall.collectibles) {
      if (c.userData.collected) continue;
      const dist = playerPos.distanceTo(c.position);
      if (dist < nearestDist) {
        nearestDist = dist;
        nearest = c;
      }
    }

    if (!nearest) return null;

    const item = this.shoppingList.find(i => i.id === nearest.userData.collectibleId);
    if (!item || item.found) return null;

    return {
      x: nearest.position.x,
      z: nearest.position.z,
      item,
      distance: nearestDist,
      mode: 'item'
    };
  }

  _pointCompass(arrowEl, playerPos, target) {
    if (!arrowEl || !target) return;
    const dx = target.x - playerPos.x;
    const dz = target.z - playerPos.z;
    const worldAngle = Math.atan2(dx, dz);
    const relative = worldAngle - this.player.yaw;
    arrowEl.style.transform = `rotate(${(relative * 180) / Math.PI}deg)`;
  }

  _updateNavigationHUD(playerPos, allFound) {
    if (allFound) {
      const checkout = this._getCheckoutTarget(playerPos);
      if (!checkout) return null;

      if (this.powerUps.hasItemRadar()) {
        this.ui.checkoutPointer?.classList.add('hidden');
        this.ui.itemRadarHud?.classList.remove('hidden');
        this.ui.itemRadarHud?.classList.add('checkout-mode');
        this._pointCompass(this.ui.radarArrow, playerPos, checkout);
        if (this.ui.radarItemName) this.ui.radarItemName.textContent = 'Checkout at Pat\'s';
        if (this.ui.radarAisleHint) this.ui.radarAisleHint.textContent = 'Entrance · green EXIT on map';
        if (this.ui.radarDistance) {
          this.ui.radarDistance.textContent = `${Math.round(checkout.distance)}m away`;
        }
      } else {
        this.ui.itemRadarHud?.classList.add('hidden');
        this.ui.itemRadarHud?.classList.remove('checkout-mode');
        this.ui.checkoutPointer?.classList.remove('hidden');
        this._pointCompass(this.ui.checkoutArrow, playerPos, checkout);
        if (this.ui.checkoutDistance) {
          this.ui.checkoutDistance.textContent = `${Math.round(checkout.distance)}m to checkout`;
        }
      }

      return checkout;
    }

    this.ui.checkoutPointer?.classList.add('hidden');
    this.ui.itemRadarHud?.classList.remove('checkout-mode');

    if (!this.powerUps.hasItemRadar()) {
      this.ui.itemRadarHud?.classList.add('hidden');
      return null;
    }

    const target = this._getNearestUncollectedTarget(playerPos);
    if (!target) {
      this.ui.itemRadarHud?.classList.add('hidden');
      return null;
    }

    const AISLE_LABELS = ['D', 'M', 'V', 'F', 'B', 'S', 'Fr', 'De', 'Be', 'Sn'];
    const aisleLabel = AISLE_LABELS[target.item.aisle] ?? '?';

    this.ui.itemRadarHud.classList.remove('hidden');
    this._pointCompass(this.ui.radarArrow, playerPos, target);
    if (this.ui.radarItemName) this.ui.radarItemName.textContent = target.item.name;
    if (this.ui.radarAisleHint) {
      this.ui.radarAisleHint.textContent = `${target.item.categoryName} · Aisle ${aisleLabel}`;
    }
    if (this.ui.radarDistance) {
      this.ui.radarDistance.textContent = `${Math.round(target.distance)}m away`;
    }

    return target;
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
      : getCheckoutSuccessMessage(total);

    this.dialoguePendingWin = true;
    this.dialogueAlphabeticalBonus = alphabetical;
    this._showDialogue('Pat (Cashier)', message, alphabetical ? 'easter-egg' : 'success');
  }

  _checkPatTimeWarning() {
    if (this.patTimeWarningPlayed || this.timeRemaining > 10) return;

    this.patTimeWarningPlayed = true;
    this._showDialogue('Pat (Cashier)', getTimeWarningMessage(), 'urgent');
  }

  _showDialogue(speaker, text, mood = 'neutral') {
    this.dialogueActive = true;
    this.dialogueDismissLocked = true;
    this.dialogueDismissLockTimer = 0.65;
    this.ui.dialogue.classList.remove('hidden');
    this.ui.dialogue.classList.remove('angry', 'success', 'easter-egg', 'urgent');
    this.ui.dialogue.classList.add(mood);
    this.ui.dialogueSpeaker.textContent = speaker;
    this.ui.dialogueText.textContent = text;
    this.ui.dialogueBtn.textContent = mood === 'success' ? 'Done' : 'OK';

    if (document.pointerLockElement) {
      document.exitPointerLock();
    }
  }

  _dismissDialogue() {
    if (!this.dialogueActive || this.dialogueDismissLocked) return;

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
    this.powerUps.clear();
    this.touchControls.hide();

    if (document.pointerLockElement) {
      document.exitPointerLock();
    }

    this.ui.game.classList.add('hidden');
    this.ui.end.classList.remove('hidden');

    const total = this.shoppingList.length;
    const found = this.shoppingList.filter(i => i.found).length;
    const difficulty = this._getDifficulty();
    const elapsed = GAME_DURATION - this.timeRemaining;
    const elapsedMins = Math.floor(elapsed / 60);
    const elapsedSecs = Math.floor(elapsed % 60);
    const timeLeftMins = Math.floor(this.timeRemaining / 60);
    const timeLeftSecs = Math.floor(this.timeRemaining % 60);
    const stats = this.runStats ?? { powerUpsCollected: 0, timesCaught: 0, scaresUsed: 0 };

    if (won) {
      this.ui.endTitle.textContent = alphabeticalBonus
        ? 'Checkout Complete — Certified Perfectionist!'
        : 'Shopping Complete!';
      this.ui.endMessage.textContent = alphabeticalBonus
        ? 'You collected every item in alphabetical order. Pat is still recovering.'
        : 'You found everything and checked out with Pat. Great job!';
    } else {
      this.ui.endTitle.textContent = "Time's Up!";
      this.ui.endMessage.textContent = 'The clock ran out before you could finish shopping.';
    }

    const statLines = [
      `<li><span>Difficulty</span><span>${difficulty.label}</span></li>`,
      `<li><span>Items found</span><span>${found} / ${total}</span></li>`,
      `<li><span>Time played</span><span>${elapsedMins}:${String(elapsedSecs).padStart(2, '0')}</span></li>`,
      `<li><span>Time left</span><span>${won ? `${timeLeftMins}:${String(timeLeftSecs).padStart(2, '0')}` : '0:00'}</span></li>`,
      `<li><span>Power-ups collected</span><span>${stats.powerUpsCollected}</span></li>`,
      `<li><span>Karen scares</span><span>${stats.scaresUsed}</span></li>`,
      `<li><span>Times caught</span><span>${stats.timesCaught}</span></li>`
    ];

    if (won && alphabeticalBonus) {
      statLines.push('<li><span>Bonus</span><span>Alphabetical order!</span></li>');
    }

    this.ui.endStats.innerHTML = statLines.join('');
  }

  _onResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }
}
