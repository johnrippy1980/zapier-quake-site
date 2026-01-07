// ===== QUAKE HUD SYSTEM =====
// Shared across all pages - handles HUD, music, and secrets

// Sound system using Web Audio API
const AudioContext = window.AudioContext || window.webkitAudioContext;
let audioCtx = null;

function initAudio() {
    if (!audioCtx) {
        audioCtx = new AudioContext();
    }
}

function playMenuSound() {
    initAudio();
    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    oscillator.type = 'square';
    oscillator.frequency.setValueAtTime(220, audioCtx.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(110, audioCtx.currentTime + 0.1);
    gainNode.gain.setValueAtTime(0.3, audioCtx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.1);
    oscillator.start(audioCtx.currentTime);
    oscillator.stop(audioCtx.currentTime + 0.1);
}

function playSelectSound() {
    initAudio();
    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    oscillator.type = 'square';
    oscillator.frequency.setValueAtTime(150, audioCtx.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(300, audioCtx.currentTime + 0.05);
    oscillator.frequency.exponentialRampToValueAtTime(100, audioCtx.currentTime + 0.15);
    gainNode.gain.setValueAtTime(0.4, audioCtx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.15);
    oscillator.start(audioCtx.currentTime);
    oscillator.stop(audioCtx.currentTime + 0.15);
}

function playSecretSound() {
    initAudio();
    const notes = [220, 330, 440, 550];
    notes.forEach((freq, i) => {
        setTimeout(() => {
            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();
            osc.connect(gain);
            gain.connect(audioCtx.destination);
            osc.type = 'square';
            osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
            gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.15);
            osc.start();
            osc.stop(audioCtx.currentTime + 0.15);
        }, i * 80);
    });
}

// ===== SECRETS SYSTEM =====
const TOTAL_SECRETS = 3;
let foundSecrets = JSON.parse(localStorage.getItem('quake_secrets') || '[]');

function updateSecretsDisplay() {
    const secretsFound = document.getElementById('secrets-found');
    if (secretsFound) {
        secretsFound.textContent = foundSecrets.length;
    }
}

function showSecretPopup(message) {
    const popup = document.getElementById('secret-popup');
    const msgEl = document.getElementById('secret-message');
    if (popup && msgEl) {
        msgEl.textContent = message;
        popup.classList.add('show');
        setTimeout(() => popup.classList.remove('show'), 2000);
    }
}

function findSecret(secretId, message) {
    if (foundSecrets.includes(secretId)) return false;
    foundSecrets.push(secretId);
    localStorage.setItem('quake_secrets', JSON.stringify(foundSecrets));
    updateSecretsDisplay();
    playSecretSound();
    showSecretPopup(message);
    return true;
}

function initSecrets() {
    updateSecretsDisplay();
    document.querySelectorAll('.secret-area').forEach(area => {
        const secretId = area.dataset.secret;
        const message = area.dataset.secretMsg || 'You found a secret!';
        if (foundSecrets.includes(secretId)) {
            area.style.opacity = '0.7';
        }
        area.addEventListener('click', (e) => {
            if (!foundSecrets.includes(secretId)) {
                e.preventDefault();
                findSecret(secretId, message);
                area.classList.add('found');
                setTimeout(() => { area.style.opacity = '0.7'; }, 500);
            }
        });
    });
}

// ===== MUSIC SYSTEM =====
let isPlaying = localStorage.getItem('quake_music_playing') === 'true';
let musicTime = parseFloat(localStorage.getItem('quake_music_time') || '0');

function initMusic() {
    const musicBtn = document.getElementById('music-btn');
    const musicText = document.getElementById('music-text');
    const quakeTheme = document.getElementById('quake-theme');

    if (!musicBtn || !quakeTheme) return;

    // Restore music state
    if (isPlaying) {
        quakeTheme.currentTime = musicTime;
        quakeTheme.play().then(() => {
            musicBtn.classList.add('playing');
            if (musicText) musicText.textContent = 'STOP THEME';
        }).catch(e => {
            console.log('Auto-play blocked');
            isPlaying = false;
            localStorage.setItem('quake_music_playing', 'false');
        });
    }

    // Save position periodically
    setInterval(() => {
        if (isPlaying && !quakeTheme.paused) {
            localStorage.setItem('quake_music_time', quakeTheme.currentTime.toString());
        }
    }, 1000);

    // Save before navigating
    window.addEventListener('beforeunload', () => {
        if (isPlaying) {
            localStorage.setItem('quake_music_time', quakeTheme.currentTime.toString());
        }
    });

    musicBtn.addEventListener('click', () => {
        playMenuSound();
        if (isPlaying) {
            quakeTheme.pause();
            musicBtn.classList.remove('playing');
            if (musicText) musicText.textContent = 'PLAY THEME';
            localStorage.setItem('quake_music_playing', 'false');
        } else {
            quakeTheme.play().catch(e => console.log('Audio play failed:', e));
            musicBtn.classList.add('playing');
            if (musicText) musicText.textContent = 'STOP THEME';
            localStorage.setItem('quake_music_playing', 'true');
        }
        isPlaying = !isPlaying;
    });

    musicBtn.addEventListener('mouseenter', playMenuSound);
}

// ===== HUD ANIMATIONS =====
function animateValue(element, start, end, duration) {
    if (!element) return;
    let startTimestamp = null;
    const step = (timestamp) => {
        if (!startTimestamp) startTimestamp = timestamp;
        const progress = Math.min((timestamp - startTimestamp) / duration, 1);
        element.textContent = Math.floor(progress * (end - start) + start);
        if (progress < 1) window.requestAnimationFrame(step);
    };
    window.requestAnimationFrame(step);
}

function initHudAnimations() {
    setTimeout(() => {
        animateValue(document.getElementById('health-value'), 0, 100, 1500);
        animateValue(document.getElementById('armor-value'), 0, 150, 1500);
        animateValue(document.getElementById('shells'), 0, 25, 1000);
        animateValue(document.getElementById('nails'), 0, 100, 1200);
        animateValue(document.getElementById('rockets'), 0, 10, 800);
        animateValue(document.getElementById('cells'), 0, 50, 1100);
    }, 500);
}

// ===== WEAPON SWITCHING =====
function initWeaponSwitching() {
    const ammoBoxes = document.querySelectorAll('.ammo-box');
    if (!ammoBoxes.length) return;

    document.addEventListener('keydown', (e) => {
        const weaponKeys = ['1', '2', '3', '4'];
        const keyIndex = weaponKeys.indexOf(e.key);
        if (keyIndex !== -1) {
            playMenuSound();
            ammoBoxes.forEach((box, i) => {
                box.classList.toggle('active', i === keyIndex);
            });
        }
    });

    ammoBoxes.forEach((box) => {
        box.addEventListener('click', () => {
            playMenuSound();
            ammoBoxes.forEach(b => b.classList.remove('active'));
            box.classList.add('active');
        });
    });
}

// ===== HOVER SOUNDS =====
function initHoverSounds() {
    document.querySelectorAll('.nav-link, .cta-button, .feature-card, .link-card, .stat-card, .project-card').forEach(el => {
        el.addEventListener('mouseenter', playMenuSound);
    });
}

// ===== INITIALIZE ALL =====
document.addEventListener('DOMContentLoaded', () => {
    initSecrets();
    initMusic();
    initHudAnimations();
    initWeaponSwitching();
    initHoverSounds();
});
