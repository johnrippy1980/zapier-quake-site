// Quake Enemy Spawning System
// Spawns random enemies across all pages with authentic Quake sounds

(function() {
    'use strict';

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
            setTimeout(() => el.remove(), 200);

            // Update HUD kills if available
            const hudKills = document.getElementById('hudKills');
            if (hudKills) {
                hudKills.textContent = parseInt(hudKills.textContent || 0) + 1;
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
                setTimeout(() => el.remove(), 1000);
            }
        }, lifespan);
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

        // Spawn enemies at random intervals
        function scheduleNextSpawn() {
            // Random interval between 15-45 seconds
            const delay = 15000 + Math.random() * 30000;
            setTimeout(() => {
                // Only spawn if document is visible
                if (!document.hidden) {
                    spawnEnemy();
                }
                scheduleNextSpawn();
            }, delay);
        }

        // Initial spawn after page load (5-15 seconds)
        setTimeout(() => {
            if (!document.hidden) {
                spawnEnemy();
            }
            scheduleNextSpawn();
        }, 5000 + Math.random() * 10000);

        console.log('[Quake Enemy System] Initialized');
    }

    // Start when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
