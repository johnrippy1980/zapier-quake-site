// ===== AUTHENTIC QUAKE 1 SOUND & HUD SYSTEM =====
// Using actual Quake 1 sound files from Mindgrid Audio pack

// Preload audio files for instant playback
const quakeSounds = {
    menu1: null,
    menu2: null,
    menu3: null,
    pickup: null,
    nailgun: null,
    jump: null
};

let soundsLoaded = false;

// Preload all sound files
function preloadSounds() {
    if (soundsLoaded) return;

    const soundFiles = {
        menu1: 'audio/menu1.wav',
        menu2: 'audio/menu2.wav',
        menu3: 'audio/menu3.wav',
        pickup: 'audio/pickup.wav',
        nailgun: 'audio/nailgun.wav',
        jump: 'audio/jump.wav'
    };

    Object.entries(soundFiles).forEach(([name, path]) => {
        const audio = new Audio(path);
        audio.preload = 'auto';
        audio.volume = 0.4;
        quakeSounds[name] = audio;
    });

    soundsLoaded = true;
}

// Play a sound (with clone to allow overlapping)
function playSound(soundName) {
    if (!quakeSounds[soundName]) return;

    // Clone audio to allow overlapping sounds
    const sound = quakeSounds[soundName].cloneNode();
    sound.volume = 0.4;
    sound.play().catch(e => console.log('Sound play blocked:', e));
}

// Authentic Quake menu tick sound (menu1.wav)
function playMenuSound() {
    playSound('menu1');
}

// Quake select/confirm sound (menu2.wav)
function playSelectSound() {
    playSound('menu2');
}

// Quake secret found sound (using pickup with nailgun combo)
function playSecretSound() {
    playSound('pickup');
    // Layer the nailgun for dramatic effect
    setTimeout(() => playSound('nailgun'), 100);
}

// Quake item pickup sound
function playPickupSound() {
    playSound('pickup');
}

// Quake jump sound
function playJumpSound() {
    playSound('jump');
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

    // Add click sounds to buttons
    document.querySelectorAll('.cta-button, .quake-btn, button').forEach(el => {
        el.addEventListener('click', playSelectSound);
    });
}

// ===== INITIALIZE ALL =====
document.addEventListener('DOMContentLoaded', () => {
    preloadSounds();
    initSecrets();
    initMusic();
    initHudAnimations();
    initHoverSounds();
});
