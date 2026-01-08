// Quake Enemy Spawning System
// Spawns random enemies across all pages with authentic Quake sounds
// Difficulty affects spawn rate: Easy=rare, Normal=occasional, Hard=frequent, Nightmare=swarm
// SECRET #5: Kill 69 enemies for "You just gibbed everywhere!"

(function() {
    'use strict';

    // Track total kills across sessions (persistent)
    let totalKills = parseInt(localStorage.getItem('zaparena_total_kills') || '0');
    let secret5Found = localStorage.getItem('zaparena_secret5') === 'true';

    // Difficulty settings - spawn intervals in milliseconds
    const DIFFICULTY_SETTINGS = {
        easy: {
            minDelay: 45000,      // 45 seconds minimum
            maxDelay: 90000,      // 90 seconds maximum
            initialMin: 20000,    // 20 second initial delay
            initialMax: 40000,    // 40 second initial delay
            maxActive: 1          // Max enemies on screen at once
        },
        normal: {
            minDelay: 20000,      // 20 seconds minimum
            maxDelay: 40000,      // 40 seconds maximum
            initialMin: 10000,    // 10 second initial delay
            initialMax: 20000,    // 20 second initial delay
            maxActive: 2          // Max enemies on screen
        },
        hard: {
            minDelay: 8000,       // 8 seconds minimum
            maxDelay: 18000,      // 18 seconds maximum
            initialMin: 3000,     // 3 second initial delay
            initialMax: 8000,     // 8 second initial delay
            maxActive: 4          // Max enemies on screen
        },
        nightmare: {
            minDelay: 3000,       // 3 seconds minimum
            maxDelay: 8000,       // 8 seconds maximum
            initialMin: 1000,     // 1 second initial delay
            initialMax: 3000,     // 3 second initial delay
            maxActive: 8          // Max enemies on screen - SWARM MODE
        }
    };

    // Enemy types configuration
    const ENEMIES = [
        {
            name: 'shambler',
            image: 'images/shambler-preview.png',
            width: 120,
            height: 140,
            spawnSound: 'shambler'
        },
        {
            name: 'knight',
            image: 'images/knight.png',
            width: 80,
            height: 100,
            spawnSound: 'door'
        },
        {
            name: 'ogre',
            image: 'images/ogre.png',
            width: 100,
            height: 120,
            spawnSound: 'door'
        },
        {
            name: 'fiend',
            image: 'images/fiend.png',
            width: 90,
            height: 80,
            spawnSound: 'jump'
        },
        {
            name: 'grunt',
            image: 'images/grunt.png',
            width: 70,
            height: 90,
            spawnSound: 'guncock'
        }
    ];

    // Audio cache
    const audioCache = {};

    // Track active enemies
    let activeEnemies = 0;

    // Get current difficulty from localStorage
    function getDifficulty() {
        return localStorage.getItem('zaparena_difficulty') || 'easy';
    }

    // Get difficulty settings
    function getSettings() {
        return DIFFICULTY_SETTINGS[getDifficulty()] || DIFFICULTY_SETTINGS.easy;
    }

    // Preload sounds
    function preloadSound(name) {
        if (!audioCache[name]) {
            audioCache[name] = new Audio('audio/' + name + '.wav');
            audioCache[name].volume = 0.4;
        }
        return audioCache[name];
    }

    // Play a sound
    function playSound(name) {
        try {
            const sound = preloadSound(name);
            const clone = sound.cloneNode();
            clone.volume = sound.volume;
            clone.play().catch(() => {});
        } catch (e) {}
    }

    // Create blood gibs (smaller than secret explosion)
    function createEnemyGibs(x, y) {
        const gibCount = 8 + Math.floor(Math.random() * 6);

        for (let i = 0; i < gibCount; i++) {
            const gib = document.createElement('div');
            gib.className = 'enemy-gib';

            const size = 6 + Math.random() * 12;
            gib.style.width = size + 'px';
            gib.style.height = size + 'px';
            gib.style.left = x + 'px';
            gib.style.top = y + 'px';

            const angle = Math.random() * Math.PI * 2;
            const velocity = 100 + Math.random() * 200;
            const endX = Math.cos(angle) * velocity;
            const endY = Math.sin(angle) * velocity - 50;

            gib.style.setProperty('--end-x', endX + 'px');
            gib.style.setProperty('--end-y', endY + 'px');
            gib.style.setProperty('--rotation', (Math.random() * 720 - 360) + 'deg');

            document.body.appendChild(gib);

            setTimeout(() => gib.remove(), 1000);
        }

        playSound('gib');
    }

    // Spawn an enemy
    function spawnEnemy() {
        const settings = getSettings();

        // Check if we've hit max active enemies for this difficulty
        if (activeEnemies >= settings.maxActive) {
            return;
        }

        const enemy = ENEMIES[Math.floor(Math.random() * ENEMIES.length)];

        const el = document.createElement('div');
        el.className = 'quake-enemy';
        el.dataset.enemy = enemy.name;

        // Random position on screen edges or within visible area
        const spawnEdge = Math.random() < 0.3;
        let x, y;

        if (spawnEdge) {
            // Spawn from edges
            const side = Math.floor(Math.random() * 4);
            switch (side) {
                case 0: x = -enemy.width; y = Math.random() * (window.innerHeight - enemy.height); break;
                case 1: x = window.innerWidth; y = Math.random() * (window.innerHeight - enemy.height); break;
                case 2: x = Math.random() * (window.innerWidth - enemy.width); y = -enemy.height; break;
                case 3: x = Math.random() * (window.innerWidth - enemy.width); y = window.innerHeight; break;
            }
        } else {
            // Random position within viewport
            x = 50 + Math.random() * (window.innerWidth - enemy.width - 100);
            y = 50 + Math.random() * (window.innerHeight - enemy.height - 100);
        }

        el.style.cssText = `
            position: fixed;
            left: ${x}px;
            top: ${y}px;
            width: ${enemy.width}px;
            height: ${enemy.height}px;
            background-image: url('${enemy.image}');
            background-size: contain;
            background-repeat: no-repeat;
            background-position: center;
            cursor: crosshair;
            z-index: 9000;
            image-rendering: pixelated;
            animation: enemySpawn 0.3s ease-out forwards;
            filter: drop-shadow(0 0 10px rgba(255, 100, 0, 0.5));
        `;

        // Play spawn sound
        playSound(enemy.spawnSound);

        // Track active enemy count
        activeEnemies++;

        // Click to kill
        el.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();

            const rect = el.getBoundingClientRect();
            const centerX = rect.left + rect.width / 2;
            const centerY = rect.top + rect.height / 2;

            // Super shotgun sound
            playSound('sgun1');

            // Blood gibs
            createEnemyGibs(centerX, centerY);

            // Remove enemy with death animation
            el.style.animation = 'enemyDeath 0.2s ease-out forwards';
            activeEnemies--;
            setTimeout(() => el.remove(), 200);

            // Increment total kills (persistent)
            totalKills++;
            localStorage.setItem('zaparena_total_kills', totalKills.toString());

            // Update HUD kills using the global API if available
            if (window.ZapArena && window.ZapArena.updateKillsDisplay) {
                window.ZapArena.updateKillsDisplay();
            }

            // SECRET #5: 69 kills triggers "You just gibbed everywhere!"
            if (totalKills === 69 && !secret5Found) {
                triggerSecret5(centerX, centerY);
            }
        });

        document.body.appendChild(el);

        // Enemy wanders around or despawns after a while
        const lifespan = 8000 + Math.random() * 12000;
        const wanderInterval = setInterval(() => {
            if (!document.body.contains(el)) {
                clearInterval(wanderInterval);
                return;
            }

            const currentX = parseFloat(el.style.left);
            const currentY = parseFloat(el.style.top);
            const newX = Math.max(0, Math.min(window.innerWidth - enemy.width, currentX + (Math.random() - 0.5) * 60));
            const newY = Math.max(0, Math.min(window.innerHeight - enemy.height, currentY + (Math.random() - 0.5) * 60));

            el.style.transition = 'left 0.5s ease-out, top 0.5s ease-out';
            el.style.left = newX + 'px';
            el.style.top = newY + 'px';
        }, 2000);

        setTimeout(() => {
            clearInterval(wanderInterval);
            if (document.body.contains(el)) {
                el.style.animation = 'enemyFadeOut 1s ease-out forwards';
                activeEnemies--;
                setTimeout(() => el.remove(), 1000);
            }
        }, lifespan);
    }

    // SECRET #5: "You just gibbed everywhere!" - massive gib explosion at 69 kills
    function triggerSecret5(originX, originY) {
        secret5Found = true;
        localStorage.setItem('zaparena_secret5', 'true');

        // Play multiple gib sounds for chaos
        playSound('gib');
        setTimeout(() => playSound('gib'), 100);
        setTimeout(() => playSound('gib'), 200);
        setTimeout(() => playSound('gib'), 300);

        // Try to play secret sound if available
        try {
            const secretSound = new Audio('audio/secret.wav');
            secretSound.volume = 0.6;
            setTimeout(() => secretSound.play().catch(() => {}), 500);
        } catch(e) {}

        // MASSIVE gib shower from all corners of the screen
        const gibPoints = [
            { x: window.innerWidth / 2, y: window.innerHeight / 2 },
            { x: window.innerWidth * 0.2, y: window.innerHeight * 0.3 },
            { x: window.innerWidth * 0.8, y: window.innerHeight * 0.3 },
            { x: window.innerWidth * 0.3, y: window.innerHeight * 0.7 },
            { x: window.innerWidth * 0.7, y: window.innerHeight * 0.7 }
        ];

        // Spawn 100+ gibs across the screen
        for (let wave = 0; wave < 5; wave++) {
            setTimeout(() => {
                gibPoints.forEach(point => {
                    for (let i = 0; i < 20; i++) {
                        setTimeout(() => {
                            createEnemyGibs(
                                point.x + (Math.random() - 0.5) * 200,
                                point.y + (Math.random() - 0.5) * 200
                            );
                        }, i * 30);
                    }
                });
            }, wave * 150);
        }

        // Create red screen flash
        const flash = document.createElement('div');
        flash.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(139, 0, 0, 0.6);
            pointer-events: none;
            z-index: 10000;
            animation: secret5Flash 1s ease-out forwards;
        `;
        document.body.appendChild(flash);
        setTimeout(() => flash.remove(), 1000);

        // Show the secret banner
        const banner = document.createElement('div');
        banner.className = 'secret5-banner';
        banner.innerHTML = `
            <h2>SECRET FOUND!</h2>
            <p class="secret5-message">YOU JUST GIBBED EVERYWHERE!</p>
            <p class="secret5-count">69 KILLS - NICE.</p>
            <div class="secret5-number">SECRET 5 OF 5</div>
        `;
        document.body.appendChild(banner);

        // Update secrets counter in HUD using the global API
        if (window.ZapArena && window.ZapArena.updateSecretsDisplay) {
            window.ZapArena.updateSecretsDisplay();
        }

        // Remove banner after 5 seconds
        setTimeout(() => {
            banner.style.animation = 'secret5FadeOut 0.5s ease-out forwards';
            setTimeout(() => banner.remove(), 500);
        }, 5000);

        console.log('[Quake Enemy System] SECRET #5 FOUND: You just gibbed everywhere! (69 kills)');
    }

    // Add required CSS
    function injectStyles() {
        if (document.getElementById('enemy-system-styles')) return;

        const style = document.createElement('style');
        style.id = 'enemy-system-styles';
        style.textContent = `
            @keyframes enemySpawn {
                0% {
                    opacity: 0;
                    transform: scale(0.3) translateY(20px);
                    filter: brightness(3) drop-shadow(0 0 20px rgba(255, 150, 0, 1));
                }
                50% {
                    filter: brightness(1.5) drop-shadow(0 0 15px rgba(255, 100, 0, 0.8));
                }
                100% {
                    opacity: 1;
                    transform: scale(1) translateY(0);
                    filter: drop-shadow(0 0 10px rgba(255, 100, 0, 0.5));
                }
            }

            @keyframes enemyDeath {
                0% {
                    transform: scale(1);
                    opacity: 1;
                }
                50% {
                    transform: scale(1.2);
                    filter: brightness(2) saturate(2);
                }
                100% {
                    transform: scale(0.5);
                    opacity: 0;
                    filter: brightness(0.5);
                }
            }

            @keyframes enemyFadeOut {
                0% {
                    opacity: 1;
                    transform: scale(1);
                }
                100% {
                    opacity: 0;
                    transform: scale(0.8) translateY(-20px);
                }
            }

            @keyframes gibFly {
                0% {
                    opacity: 1;
                    transform: translate(0, 0) rotate(0deg);
                }
                100% {
                    opacity: 0;
                    transform: translate(var(--end-x), var(--end-y)) rotate(var(--rotation));
                }
            }

            .quake-enemy {
                transition: filter 0.1s;
            }

            .quake-enemy:hover {
                filter: drop-shadow(0 0 15px rgba(255, 0, 0, 0.8)) brightness(1.2) !important;
            }

            .enemy-gib {
                position: fixed;
                pointer-events: none;
                z-index: 9999;
                background: radial-gradient(ellipse at 30% 30%, #8B0000 0%, #5a0000 40%, #3a0000 70%, #2a0000 100%);
                border-radius: 40% 60% 50% 50%;
                box-shadow:
                    inset -2px -2px 4px rgba(0, 0, 0, 0.5),
                    inset 2px 2px 4px rgba(180, 50, 50, 0.3),
                    0 0 8px rgba(139, 0, 0, 0.6);
                animation: gibFly 1s ease-out forwards;
            }

            /* SECRET #5: 69 kills banner */
            @keyframes secret5Flash {
                0% { opacity: 1; }
                100% { opacity: 0; }
            }

            @keyframes secret5FadeOut {
                0% { opacity: 1; transform: translate(-50%, -50%) scale(1); }
                100% { opacity: 0; transform: translate(-50%, -50%) scale(0.8); }
            }

            @keyframes secret5Pulse {
                0%, 100% { transform: translate(-50%, -50%) scale(1); }
                50% { transform: translate(-50%, -50%) scale(1.02); }
            }

            .secret5-banner {
                position: fixed;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                background: rgba(139, 0, 0, 0.95);
                border: 4px solid #ffcc00;
                padding: 40px 80px;
                z-index: 10001;
                text-align: center;
                box-shadow: 0 0 100px rgba(255, 0, 0, 0.8), inset 0 0 50px rgba(0, 0, 0, 0.5);
                animation: secret5Pulse 0.5s ease-in-out infinite;
                font-family: 'Press Start 2P', monospace;
            }

            .secret5-banner h2 {
                font-size: 2rem;
                color: #ffcc00;
                text-shadow: 4px 4px 0 #000, 0 0 40px rgba(255, 200, 0, 0.8);
                margin-bottom: 20px;
            }

            .secret5-message {
                font-size: 1rem;
                color: #ff6666;
                text-shadow: 2px 2px 0 #000;
                margin-bottom: 10px;
            }

            .secret5-count {
                font-size: 1.5rem;
                color: #ffffff;
                text-shadow: 2px 2px 0 #000, 0 0 20px rgba(255, 255, 255, 0.5);
                margin: 20px 0;
            }

            .secret5-number {
                font-size: 0.8rem;
                color: #ffcc00;
                margin-top: 20px;
            }
        `;
        document.head.appendChild(style);
    }

    // Initialize enemy spawning system
    function init() {
        injectStyles();

        // Preload all sounds
        preloadSound('shambler');
        preloadSound('door');
        preloadSound('jump');
        preloadSound('guncock');
        preloadSound('sgun1');
        preloadSound('gib');

        // Spawn enemies at random intervals based on difficulty
        function scheduleNextSpawn() {
            const settings = getSettings();
            const delay = settings.minDelay + Math.random() * (settings.maxDelay - settings.minDelay);

            setTimeout(() => {
                // Only spawn if document is visible
                if (!document.hidden) {
                    spawnEnemy();
                }
                scheduleNextSpawn();
            }, delay);
        }

        // Initial spawn after page load based on difficulty
        const settings = getSettings();
        const initialDelay = settings.initialMin + Math.random() * (settings.initialMax - settings.initialMin);

        setTimeout(() => {
            if (!document.hidden) {
                spawnEnemy();
            }
            scheduleNextSpawn();
        }, initialDelay);

        // Listen for difficulty changes
        window.addEventListener('storage', function(e) {
            if (e.key === 'zaparena_difficulty') {
                console.log('[Quake Enemy System] Difficulty changed to:', e.newValue);
            }
        });

        const difficulty = getDifficulty();
        console.log('[Quake Enemy System] Initialized at difficulty:', difficulty);
        console.log('[Quake Enemy System] Spawn interval:', settings.minDelay/1000 + '-' + settings.maxDelay/1000 + 's, Max enemies:', settings.maxActive);
    }

    // Start when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
