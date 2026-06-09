export class TouchControls {
  constructor(player, isMobile) {
    this.player = player;
    this.isMobile = isMobile;
    this.active = false;

    if (!isMobile) return;

    this.moveStick = document.getElementById('move-stick');
    this.moveKnob = document.getElementById('move-knob');
    this.lookZone = document.getElementById('look-zone');
    this.touchControlsEl = document.getElementById('touch-controls');

    this.moveTouchId = null;
    this.lookTouchId = null;
    this.moveCenter = { x: 0, y: 0 };
    this.moveVector = { x: 0, z: 0 };

    this._bindEvents();
  }

  show() {
    if (this.isMobile && this.touchControlsEl) {
      this.touchControlsEl.classList.remove('hidden');
      document.getElementById('collect-btn')?.classList.remove('hidden');
    }
  }

  hide() {
    if (this.touchControlsEl) {
      this.touchControlsEl.classList.add('hidden');
    }
  }

  _bindEvents() {
    this.moveStick.addEventListener('touchstart', e => this._onMoveStart(e), { passive: false });
    this.moveStick.addEventListener('touchmove', e => this._onMoveMove(e), { passive: false });
    this.moveStick.addEventListener('touchend', e => this._onMoveEnd(e), { passive: false });

    this.lookZone.addEventListener('touchstart', e => this._onLookStart(e), { passive: false });
    this.lookZone.addEventListener('touchmove', e => this._onLookMove(e), { passive: false });
    this.lookZone.addEventListener('touchend', e => this._onLookEnd(e), { passive: false });
  }

  _onMoveStart(e) {
    e.preventDefault();
    const touch = e.changedTouches[0];
    this.moveTouchId = touch.identifier;
    const rect = this.moveStick.getBoundingClientRect();
    this.moveCenter = { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
    this._updateMoveKnob(touch.clientX, touch.clientY);
  }

  _onMoveMove(e) {
    e.preventDefault();
    for (const touch of e.changedTouches) {
      if (touch.identifier === this.moveTouchId) {
        this._updateMoveKnob(touch.clientX, touch.clientY);
      }
    }
  }

  _onMoveEnd(e) {
    for (const touch of e.changedTouches) {
      if (touch.identifier === this.moveTouchId) {
        this.moveTouchId = null;
        this.moveVector = { x: 0, z: 0 };
        this.moveKnob.style.transform = 'translate(0, 0)';
        this.player.setMoveInput(0, 0);
      }
    }
  }

  _updateMoveKnob(clientX, clientY) {
    const maxDist = 40;
    let dx = clientX - this.moveCenter.x;
    let dy = clientY - this.moveCenter.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist > maxDist) {
      dx = (dx / dist) * maxDist;
      dy = (dy / dist) * maxDist;
    }

    this.moveKnob.style.transform = `translate(${dx}px, ${dy}px)`;

    this.moveVector.x = dx / maxDist;
    this.moveVector.z = dy / maxDist;
    this.player.setMoveInput(this.moveVector.x, this.moveVector.z);
  }

  _onLookStart(e) {
    e.preventDefault();
    const touch = e.changedTouches[0];
    if (this.moveTouchId === touch.identifier) return;
    this.lookTouchId = touch.identifier;
    this.lastLook = { x: touch.clientX, y: touch.clientY };
  }

  _onLookMove(e) {
    e.preventDefault();
    for (const touch of e.changedTouches) {
      if (touch.identifier === this.lookTouchId) {
        const dx = touch.clientX - this.lastLook.x;
        const dy = touch.clientY - this.lastLook.y;
        this.player.setLookInput(dx, dy);
        this.lastLook = { x: touch.clientX, y: touch.clientY };
      }
    }
  }

  _onLookEnd(e) {
    for (const touch of e.changedTouches) {
      if (touch.identifier === this.lookTouchId) {
        this.lookTouchId = null;
      }
    }
  }
}

export function isMobileDevice() {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
    || (navigator.maxTouchPoints > 1 && window.innerWidth < 1024);
}
