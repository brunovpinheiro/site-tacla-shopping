/*!
 * MuxModalPlayer v1.0.0
 * Modal video player for HLS/Mux streams
 * Usage: add data-mux-modal attributes to your trigger buttons
 */
(function (global) {
  'use strict';

  // ─── Inject styles ────────────────────────────────────────────────────────
  const CSS = `
    .mmp-overlay {
      position: fixed;
      inset: 0;
      z-index: 99999;
      background: rgba(0, 0, 0, 0.0);
      display: flex;
      align-items: center;
      justify-content: center;
      opacity: 0;
      pointer-events: none;
      transition: opacity 0.35s cubic-bezier(0.4, 0, 0.2, 1),
                  background 0.35s cubic-bezier(0.4, 0, 0.2, 1);
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    }
    .mmp-overlay.mmp-visible {
      opacity: 1;
      pointer-events: all;
      background: rgba(0, 0, 0, 0.92);
    }

    .mmp-container {
      position: relative;
      width: 90vw;
      max-width: 90vw;
      height: 90vh;
      max-height: 90vh;
      display: flex;
      align-items: center;
      justify-content: center;
      transform: scale(0.94) translateY(16px);
      transition: transform 0.4s cubic-bezier(0.34, 1.2, 0.64, 1);
    }
    .mmp-overlay.mmp-visible .mmp-container {
      transform: scale(1) translateY(0);
    }

    .mmp-video-wrap {
      position: relative;
      width: 100%;
      height: 100%;
      background: #000;
      border-radius: 10px;
      overflow: hidden;
      box-shadow: 0 32px 80px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.06);
    }

    .mmp-video {
      width: 100%;
      height: 100%;
      object-fit: contain;
      display: block;
      background: #000;
    }

    /* ── Close button ── */
    .mmp-close {
      position: absolute;
      top: -44px;
      right: 0;
      width: 36px;
      height: 36px;
      background: rgba(255,255,255,0.1);
      border: 1px solid rgba(255,255,255,0.18);
      border-radius: 50%;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: background 0.2s, transform 0.2s;
      color: #fff;
      padding: 0;
      line-height: 1;
    }
    .mmp-close:hover {
      background: rgba(255,255,255,0.22);
      transform: scale(1.1) rotate(90deg);
    }
    .mmp-close svg { display: block; }

    /* ── Custom controls bar ── */
    .mmp-controls {
      position: absolute;
      bottom: 0;
      left: 0;
      right: 0;
      padding: 36px 20px 16px;
      background: linear-gradient(to top, rgba(0,0,0,0.85) 0%, transparent 100%);
      display: flex;
      flex-direction: column;
      gap: 10px;
      opacity: 0;
      transition: opacity 0.25s;
    }
    .mmp-video-wrap:hover .mmp-controls,
    .mmp-video-wrap.mmp-paused .mmp-controls {
      opacity: 1;
    }

    /* Progress */
    .mmp-progress-wrap {
      position: relative;
      height: 4px;
      background: rgba(255,255,255,0.25);
      border-radius: 2px;
      cursor: pointer;
      transition: height 0.15s;
    }
    .mmp-progress-wrap:hover { height: 6px; }
    .mmp-progress-bar {
      height: 100%;
      background: #fff;
      border-radius: 2px;
      width: 0%;
      pointer-events: none;
      transition: width 0.1s linear;
    }
    .mmp-progress-buffer {
      position: absolute;
      top: 0; left: 0;
      height: 100%;
      background: rgba(255,255,255,0.3);
      border-radius: 2px;
      width: 0%;
      pointer-events: none;
    }
    .mmp-progress-thumb {
      position: absolute;
      top: 50%;
      transform: translate(-50%, -50%) scale(0);
      width: 14px;
      height: 14px;
      background: #fff;
      border-radius: 50%;
      pointer-events: none;
      transition: transform 0.15s;
      box-shadow: 0 1px 4px rgba(0,0,0,0.5);
    }
    .mmp-progress-wrap:hover .mmp-progress-thumb { transform: translate(-50%, -50%) scale(1); }

    /* Bottom row */
    .mmp-row {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .mmp-btn {
      background: none;
      border: none;
      cursor: pointer;
      padding: 4px;
      color: #fff;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 4px;
      transition: opacity 0.15s;
      flex-shrink: 0;
    }
    .mmp-btn:hover { opacity: 0.75; }

    .mmp-time {
      font-size: 13px;
      color: rgba(255,255,255,0.85);
      letter-spacing: 0.02em;
      font-variant-numeric: tabular-nums;
      white-space: nowrap;
    }

    .mmp-spacer { flex: 1; }

    .mmp-volume-wrap {
      display: flex;
      align-items: center;
      gap: 8px;
      overflow: hidden;
      max-width: 30px;
      transition: max-width 0.25s ease;
    }
    .mmp-volume-wrap:hover { max-width: 120px; }
    .mmp-volume-slider {
      -webkit-appearance: none;
      appearance: none;
      width: 80px;
      height: 3px;
      background: rgba(255,255,255,0.35);
      border-radius: 2px;
      cursor: pointer;
      outline: none;
      flex-shrink: 0;
    }
    .mmp-volume-slider::-webkit-slider-thumb {
      -webkit-appearance: none;
      width: 12px; height: 12px;
      background: #fff;
      border-radius: 50%;
      cursor: pointer;
    }

    /* Loading spinner */
    .mmp-spinner {
      position: absolute;
      top: 50%; left: 50%;
      transform: translate(-50%, -50%);
      width: 48px; height: 48px;
      border: 3px solid rgba(255,255,255,0.15);
      border-top-color: #fff;
      border-radius: 50%;
      animation: mmp-spin 0.75s linear infinite;
      pointer-events: none;
      opacity: 0;
      transition: opacity 0.2s;
    }
    .mmp-spinner.mmp-show { opacity: 1; }
    @keyframes mmp-spin { to { transform: translate(-50%, -50%) rotate(360deg); } }

    /* Big play/pause center */
    .mmp-center-btn {
      position: absolute;
      top: 50%; left: 50%;
      transform: translate(-50%, -50%) scale(0);
      background: rgba(0,0,0,0.55);
      border: 2px solid rgba(255,255,255,0.7);
      border-radius: 50%;
      width: 68px; height: 68px;
      display: flex; align-items: center; justify-content: center;
      pointer-events: none;
      opacity: 0;
      transition: transform 0.1s, opacity 0.1s;
    }
    .mmp-center-btn.mmp-show {
      transform: translate(-50%, -50%) scale(1);
      opacity: 1;
    }
    .mmp-center-btn.mmp-fade {
      transform: translate(-50%, -50%) scale(1.2);
      opacity: 0;
      transition: transform 0.5s ease-out, opacity 0.5s ease-out;
    }

    @media (max-width: 600px) {
      .mmp-container { width: 95vw; max-width: 95vw; height: auto; max-height: 90vh; }
      .mmp-video-wrap { height: calc(95vw * 9/16); }
      .mmp-close { top: -40px; }
      .mmp-time { font-size: 11px; }
    }
  `;

  function injectStyles() {
    if (document.getElementById('mmp-styles')) return;
    const style = document.createElement('style');
    style.id = 'mmp-styles';
    style.textContent = CSS;
    document.head.appendChild(style);
  }

  // ─── Icons ─────────────────────────────────────────────────────────────────
  const ICONS = {
    close: `<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M12 4L4 12M4 4l8 8" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>`,
    play: `<svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M5 3.5l10 5.5-10 5.5V3.5z" fill="currentColor"/></svg>`,
    playLg: `<svg width="28" height="28" viewBox="0 0 28 28" fill="none"><path d="M8 4.5l16 9.5-16 9.5V4.5z" fill="white"/></svg>`,
    pause: `<svg width="18" height="18" viewBox="0 0 18 18" fill="none"><rect x="4" y="3" width="3.5" height="12" rx="1" fill="currentColor"/><rect x="10.5" y="3" width="3.5" height="12" rx="1" fill="currentColor"/></svg>`,
    pauseLg: `<svg width="28" height="28" viewBox="0 0 28 28" fill="none"><rect x="6" y="4" width="5" height="20" rx="1.5" fill="white"/><rect x="17" y="4" width="5" height="20" rx="1.5" fill="white"/></svg>`,
    volumeOn: `<svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M3 6.5h2.5L9 3.5v11l-3.5-3H3v-4z" fill="currentColor"/><path d="M11.5 5.5a4 4 0 0 1 0 7M13 3.5a6.5 6.5 0 0 1 0 11" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>`,
    volumeOff: `<svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M3 6.5h2.5L9 3.5v11l-3.5-3H3v-4z" fill="currentColor"/><path d="M12 7l3 4M15 7l-3 4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>`,
    fullscreen: `<svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M3 6.5V3.5h3M15 6.5V3.5h-3M3 11.5v3h3M15 11.5v3h-3" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
    exitFs: `<svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M6.5 3.5v3h-3M11.5 3.5v3h3M6.5 14.5v-3h-3M11.5 14.5v-3h3" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
  };

  // ─── Helpers ───────────────────────────────────────────────────────────────
  function formatTime(s) {
    if (isNaN(s)) return '0:00';
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, '0')}`;
  }

  function loadHlsJs(cb) {
    if (window.Hls) return cb(window.Hls);
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/hls.js@latest/dist/hls.min.js';
    script.onload = () => cb(window.Hls);
    script.onerror = () => cb(null);
    document.head.appendChild(script);
  }

  // ─── MuxModalPlayer ────────────────────────────────────────────────────────
  function MuxModalPlayer(options) {
    this.options = Object.assign({
      triggerSelector: '[data-mux-modal]',
      playbackIdAttr: 'data-mux-playback-id',
      streamUrlAttr: 'data-mux-stream-url', // full HLS url alternative
      posterAttr: 'data-mux-poster',
      autoplay: true,
    }, options || {});

    this._hls = null;
    this._overlay = null;
    this._video = null;
    this._centerBtn = null;
    this._progressBar = null;
    this._progressBuffer = null;
    this._progressThumb = null;
    this._timeEl = null;
    this._volumeSlider = null;
    this._playBtn = null;
    this._muteBtn = null;
    this._fsBtn = null;
    this._spinner = null;
    this._centerFadeTimer = null;

    injectStyles();
    this._buildModal();
    this._bindTriggers();
    this._bindKeys();
  }

  MuxModalPlayer.prototype._buildModal = function () {
    const overlay = document.createElement('div');
    overlay.className = 'mmp-overlay';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.setAttribute('aria-label', 'Video player');

    overlay.innerHTML = `
      <div class="mmp-container">
        <button class="mmp-close" aria-label="Fechar">${ICONS.close}</button>
        <div class="mmp-video-wrap">
          <video class="mmp-video" playsinline></video>
          <div class="mmp-spinner"></div>
          <div class="mmp-center-btn"></div>
          <div class="mmp-controls">
            <div class="mmp-progress-wrap">
              <div class="mmp-progress-buffer"></div>
              <div class="mmp-progress-bar"></div>
              <div class="mmp-progress-thumb"></div>
            </div>
            <div class="mmp-row">
              <button class="mmp-btn mmp-play-btn" aria-label="Play/Pause">${ICONS.play}</button>
              <div class="mmp-volume-wrap">
                <button class="mmp-btn mmp-mute-btn" aria-label="Mute">${ICONS.volumeOn}</button>
                <input type="range" class="mmp-volume-slider" min="0" max="1" step="0.05" value="1" aria-label="Volume">
              </div>
              <span class="mmp-time">0:00 / 0:00</span>
              <span class="mmp-spacer"></span>
              <button class="mmp-btn mmp-fs-btn" aria-label="Fullscreen">${ICONS.fullscreen}</button>
            </div>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(overlay);

    this._overlay     = overlay;
    this._video       = overlay.querySelector('.mmp-video');
    this._spinner     = overlay.querySelector('.mmp-spinner');
    this._centerBtn   = overlay.querySelector('.mmp-center-btn');
    this._progressWrap   = overlay.querySelector('.mmp-progress-wrap');
    this._progressBar    = overlay.querySelector('.mmp-progress-bar');
    this._progressBuffer = overlay.querySelector('.mmp-progress-buffer');
    this._progressThumb  = overlay.querySelector('.mmp-progress-thumb');
    this._timeEl      = overlay.querySelector('.mmp-time');
    this._volumeSlider = overlay.querySelector('.mmp-volume-slider');
    this._playBtn     = overlay.querySelector('.mmp-play-btn');
    this._muteBtn     = overlay.querySelector('.mmp-mute-btn');
    this._fsBtn       = overlay.querySelector('.mmp-fs-btn');

    this._bindModalEvents();
  };

  MuxModalPlayer.prototype._bindModalEvents = function () {
    const self = this;
    const v = this._video;

    // Close via button or overlay background click
    this._overlay.querySelector('.mmp-close').addEventListener('click', function () {
      self.close();
    });
    this._overlay.addEventListener('click', function (e) {
      if (e.target === self._overlay) self.close();
    });

    // Play/pause toggle
    this._playBtn.addEventListener('click', function () { self._togglePlay(); });
    v.addEventListener('click', function () { self._togglePlay(); });

    // Video events
    v.addEventListener('waiting', function () { self._spinner.classList.add('mmp-show'); });
    v.addEventListener('playing', function () { self._spinner.classList.remove('mmp-show'); });
    v.addEventListener('canplay', function () { self._spinner.classList.remove('mmp-show'); });
    v.addEventListener('pause',   function () {
      self._playBtn.innerHTML = ICONS.play;
      self._overlay.querySelector('.mmp-video-wrap').classList.add('mmp-paused');
    });
    v.addEventListener('play',    function () {
      self._playBtn.innerHTML = ICONS.pause;
      self._overlay.querySelector('.mmp-video-wrap').classList.remove('mmp-paused');
    });

    v.addEventListener('timeupdate', function () {
      if (!v.duration) return;
      const pct = (v.currentTime / v.duration) * 100;
      self._progressBar.style.width = pct + '%';
      self._progressThumb.style.left = pct + '%';
      self._timeEl.textContent = formatTime(v.currentTime) + ' / ' + formatTime(v.duration);
    });

    v.addEventListener('progress', function () {
      if (!v.duration || !v.buffered.length) return;
      const pct = (v.buffered.end(v.buffered.length - 1) / v.duration) * 100;
      self._progressBuffer.style.width = pct + '%';
    });

    // Progress scrubbing
    let scrubbing = false;
    function seek(e) {
      const rect = self._progressWrap.getBoundingClientRect();
      const pct  = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
      if (v.duration) v.currentTime = pct * v.duration;
    }
    this._progressWrap.addEventListener('mousedown', function (e) { scrubbing = true; seek(e); });
    document.addEventListener('mousemove',  function (e) { if (scrubbing) seek(e); });
    document.addEventListener('mouseup',    function ()  { scrubbing = false; });

    // Volume
    this._volumeSlider.addEventListener('input', function () {
      v.volume = parseFloat(this.value);
      v.muted  = v.volume === 0;
      self._muteBtn.innerHTML = v.muted ? ICONS.volumeOff : ICONS.volumeOn;
    });
    this._muteBtn.addEventListener('click', function () {
      v.muted = !v.muted;
      self._muteBtn.innerHTML = v.muted ? ICONS.volumeOff : ICONS.volumeOn;
      self._volumeSlider.value = v.muted ? 0 : v.volume;
    });

    // Fullscreen
    this._fsBtn.addEventListener('click', function () { self._toggleFullscreen(); });
    document.addEventListener('fullscreenchange', function () {
      self._fsBtn.innerHTML = document.fullscreenElement ? ICONS.exitFs : ICONS.fullscreen;
    });
  };

  MuxModalPlayer.prototype._togglePlay = function () {
    const v = this._video;
    const icon = v.paused ? ICONS.pauseLg : ICONS.playLg;
    this._showCenterPulse(icon);
    v.paused ? v.play() : v.pause();
  };

  MuxModalPlayer.prototype._showCenterPulse = function (icon) {
    const cb = this._centerBtn;
    cb.innerHTML = icon;
    cb.classList.remove('mmp-fade');
    cb.classList.add('mmp-show');
    clearTimeout(this._centerFadeTimer);
    this._centerFadeTimer = setTimeout(function () {
      cb.classList.add('mmp-fade');
      setTimeout(function () { cb.classList.remove('mmp-show', 'mmp-fade'); }, 500);
    }, 600);
  };

  MuxModalPlayer.prototype._toggleFullscreen = function () {
    const wrap = this._overlay.querySelector('.mmp-video-wrap');
    if (!document.fullscreenElement) {
      wrap.requestFullscreen && wrap.requestFullscreen();
    } else {
      document.exitFullscreen && document.exitFullscreen();
    }
  };

  MuxModalPlayer.prototype._bindTriggers = function () {
    const self = this;
    const opts = this.options;
    document.addEventListener('click', function (e) {
      const trigger = e.target.closest(opts.triggerSelector);
      if (!trigger) return;
      e.preventDefault();
      const playbackId = trigger.getAttribute(opts.playbackIdAttr);
      const streamUrl  = trigger.getAttribute(opts.streamUrlAttr);
      const poster     = trigger.getAttribute(opts.posterAttr) || '';
      const src = streamUrl || (playbackId
        ? 'https://stream.mux.com/' + playbackId + '.m3u8'
        : null);
      if (src) self.open(src, poster);
    });
  };

  MuxModalPlayer.prototype._bindKeys = function () {
    const self = this;
    document.addEventListener('keydown', function (e) {
      if (!self._overlay.classList.contains('mmp-visible')) return;
      if (e.key === 'Escape') self.close();
      if (e.key === ' ' || e.key === 'k') { e.preventDefault(); self._togglePlay(); }
      if (e.key === 'f') self._toggleFullscreen();
      if (e.key === 'ArrowRight') self._video.currentTime += 10;
      if (e.key === 'ArrowLeft')  self._video.currentTime -= 10;
      if (e.key === 'm') {
        self._video.muted = !self._video.muted;
        self._muteBtn.innerHTML = self._video.muted ? ICONS.volumeOff : ICONS.volumeOn;
      }
    });
  };

  MuxModalPlayer.prototype.open = function (src, poster) {
    const self = this;
    const v = this._video;

    if (poster) v.setAttribute('poster', poster);
    this._spinner.classList.add('mmp-show');

    // Show overlay
    this._overlay.classList.add('mmp-visible');
    document.body.style.overflow = 'hidden';

    loadHlsJs(function (Hls) {
      if (Hls && Hls.isSupported()) {
        if (self._hls) { self._hls.destroy(); }
        const hls = new Hls({ enableWorker: true, lowLatencyMode: false });
        self._hls = hls;
        hls.loadSource(src);
        hls.attachMedia(v);
        hls.on(Hls.Events.MANIFEST_PARSED, function () {
          if (self.options.autoplay) v.play().catch(function () {});
        });
        hls.on(Hls.Events.ERROR, function (event, data) {
          if (data.fatal) {
            console.warn('[MuxModalPlayer] HLS fatal error', data);
          }
        });
      } else if (v.canPlayType('application/vnd.apple.mpegurl')) {
        // Native HLS (Safari / iOS)
        v.src = src;
        v.load();
        if (self.options.autoplay) v.play().catch(function () {});
      } else {
        console.error('[MuxModalPlayer] HLS not supported in this browser.');
      }
    });
  };

  MuxModalPlayer.prototype.close = function () {
    const v = this._video;
    v.pause();
    this._overlay.classList.remove('mmp-visible');
    document.body.style.overflow = '';

    // Clean up after transition
    const self = this;
    setTimeout(function () {
      v.src = '';
      v.removeAttribute('poster');
      self._progressBar.style.width = '0%';
      self._progressBuffer.style.width = '0%';
      self._progressThumb.style.left = '0%';
      self._timeEl.textContent = '0:00 / 0:00';
      self._playBtn.innerHTML = ICONS.play;
      self._spinner.classList.remove('mmp-show');
      if (self._hls) { self._hls.destroy(); self._hls = null; }
    }, 400);
  };

  // ─── Auto-init + expose ────────────────────────────────────────────────────
  function autoInit() {
    if (document.querySelector('[data-mux-modal]')) {
      global.muxModalPlayer = new MuxModalPlayer();
    }
  }

  global.MuxModalPlayer = MuxModalPlayer;

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', autoInit);
  } else {
    autoInit();
  }

}(window));
