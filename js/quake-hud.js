// ===== AUTHENTIC QUAKE 1 SOUND & HUD SYSTEM =====
// Recreating the original 1996 id Software sounds with Web Audio API

// Use existing AudioContext if already defined (avoids conflict with inline scripts)
const QuakeAudioContext = window.AudioContext || window.webkitAudioContext;
let audioCtx = null;

function initAudio() {
    if (!audioCtx) {
        audioCtx = new QuakeAudioContext();
    }
}

// Authentic Quake menu tick sound (menu1.wav recreation)
function playMenuSound() {
    initAudio();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain);
    gain.connect(audioCtx.destination);

    // Quake menu tick - short sharp click
    osc.type = 'square';
    osc.frequency.setValueAtTime(1200, audioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(200, audioCtx.currentTime + 0.02);

    gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.05);

    osc.start(audioCtx.currentTime);
    osc.stop(audioCtx.currentTime + 0.05);
}

// Quake select/confirm sound (menu2.wav recreation)
function playSelectSound() {
    initAudio();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain);
    gain.connect(audioCtx.destination);

    osc.type = 'square';
    osc.frequency.setValueAtTime(400, audioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(600, audioCtx.currentTime + 0.03);
    osc.frequency.exponentialRampToValueAtTime(300, audioCtx.currentTime + 0.08);

    gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.1);

    osc.start(audioCtx.currentTime);
    osc.stop(audioCtx.currentTime + 0.1);
}

// Quake secret found sound (authentic rising chime)
function playSecretSound() {
    initAudio();
    // Play a rising arpeggio like the actual Quake secret sound
    const notes = [330, 392, 494, 587, 659];
    notes.forEach((freq, i) => {
        setTimeout(() => {
            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();
            osc.connect(gain);
            gain.connect(audioCtx.destination);

            osc.type = 'square';
            osc.frequency.setValueAtTime(freq, audioCtx.currentTime);

            gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.2);

            osc.start();
            osc.stop(audioCtx.currentTime + 0.2);
        }, i * 60);
    });
}

// Quake item pickup sound
function playPickupSound() {
    initAudio();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain);
    gain.connect(audioCtx.destination);

    osc.type = 'square';
    osc.frequency.setValueAtTime(200, audioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(800, audioCtx.currentTime + 0.08);

    gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.12);

    osc.start(audioCtx.currentTime);
    osc.stop(audioCtx.currentTime + 0.12);
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
        setTimeout(() => popup.classList.remove('show'), 2500);
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
        const message = area.dataset.secretMsg || 'You found a secret area!';
        if (foundSecrets.includes(secretId)) {
            area.style.opacity = '0.6';
        }
        area.addEventListener('click', (e) => {
            if (!foundSecrets.includes(secretId)) {
                e.preventDefault();
                findSecret(secretId, message);
                area.classList.add('found');
                setTimeout(() => { area.style.opacity = '0.6'; }, 500);
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
            if (musicText) musicText.textContent = 'STOP';
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
        playSelectSound();
        if (isPlaying) {
            quakeTheme.pause();
            musicBtn.classList.remove('playing');
            if (musicText) musicText.textContent = 'MUSIC';
            localStorage.setItem('quake_music_playing', 'false');
        } else {
            quakeTheme.play().catch(e => console.log('Audio play failed:', e));
            musicBtn.classList.add('playing');
            if (musicText) musicText.textContent = 'STOP';
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
        animateValue(document.getElementById('health-value'), 0, 100, 800);
        animateValue(document.getElementById('armor-value'), 0, 100, 800);
        animateValue(document.getElementById('ammo-value'), 0, 25, 600);
    }, 300);
}

// ===== HOVER SOUNDS =====
function initHoverSounds() {
    document.querySelectorAll('.nav-link, .cta-button, .feature-card, .link-card, .stat-card, .project-card, .quake-btn').forEach(el => {
        el.addEventListener('mouseenter', playMenuSound);
    });
}

// ===== INITIALIZE ALL =====
document.addEventListener('DOMContentLoaded', () => {
    initSecrets();
    initMusic();
    initHudAnimations();
    initHoverSounds();
});
