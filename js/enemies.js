// Quake Enemy Spawning System
// Spawns random enemies across all pages with authentic Quake sounds
// Difficulty affects spawn rate: Easy=rare, Normal=occasional, Hard=frequent, Nightmare=swarm
// SECRET #5: Kill 69 enemies for "You just gibbed everywhere!"
// PEACE MODE: When all 5 secrets found, enemies become unicorns and puppies!

(function() {
    'use strict';

    // Track total kills across sessions (persistent)
    let totalKills = parseInt(localStorage.getItem('zaparena_total_kills') || '0');
    let secret5Found = localStorage.getItem('zaparena_secret5') === 'true';

    // Check if all 5 secrets have been found (Peace Mode)
    function allSecretsFound() {
        for (let i = 1; i <= 5; i++) {
            if (localStorage.getItem('zaparena_secret' + i) !== 'true') {
                return false;
            }
        }
        return true;
    }

    // Peace Mode flag - checked at init and when secrets change
    let peaceModeActive = allSecretsFound();

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

    // PEACE MODE: Friendly creatures that replace enemies when all secrets found
    const FRIENDLY_CREATURES = [
        {
            name: 'unicorn',
            emoji: '🦄',
            size: 80,
            spawnSound: 'pickup',  // Use pickup sound as "sparkle"
            petSound: 'secret'     // Happy sound when petted
        },
        {
            name: 'puppy',
            emoji: '🐕',
            size: 70,
            spawnSound: 'pickup',
            petSound: 'secret'
        },
        {
            name: 'kitten',
            emoji: '🐱',
            size: 65,
            spawnSound: 'pickup',
            petSound: 'secret'
        },
        {
            name: 'bunny',
            emoji: '🐰',
            size: 60,
            spawnSound: 'pickup',
            petSound: 'secret'
        },
        {
            name: 'rainbow',
            emoji: '🌈',
            size: 100,
            spawnSound: 'pickup',
            petSound: 'secret'
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

    // PEACE MODE: Create hearts and sparkles instead of blood
    function createLoveExplosion(x, y) {
        const hearts = ['❤️', '💖', '💕', '✨', '⭐', '🌟', '💫', '🎀'];
        const particleCount = 12 + Math.floor(Math.random() * 8);

        for (let i = 0; i < particleCount; i++) {
            const particle = document.createElement('div');
            particle.className = 'love-particle';
            particle.textContent = hearts[Math.floor(Math.random() * hearts.length)];

            const size = 20 + Math.random() * 20;
            particle.style.fontSize = size + 'px';
            particle.style.left = x + 'px';
            particle.style.top = y + 'px';

            const angle = Math.random() * Math.PI * 2;
            const velocity = 80 + Math.random() * 150;
            const endX = Math.cos(angle) * velocity;
            const endY = Math.sin(angle) * velocity - 80;

            particle.style.setProperty('--end-x', endX + 'px');
            particle.style.setProperty('--end-y', endY + 'px');
            particle.style.setProperty('--rotation', (Math.random() * 360) + 'deg');

            document.body.appendChild(particle);

            setTimeout(() => particle.remove(), 1500);
        }

        playSound('secret');
    }

    // PEACE MODE: Spawn a friendly creature instead of an enemy
    function spawnFriendlyCreature() {
        const settings = getSettings();

        if (activeEnemies >= settings.maxActive) {
            return;
        }

        const creature = FRIENDLY_CREATURES[Math.floor(Math.random() * FRIENDLY_CREATURES.length)];

        const el = document.createElement('div');
        el.className = 'friendly-creature';
        el.dataset.creature = creature.name;

        // Random position
        const x = 50 + Math.random() * (window.innerWidth - creature.size - 100);
        const y = 50 + Math.random() * (window.innerHeight - creature.size - 100);

        el.style.cssText = `
            position: fixed;
            left: ${x}px;
            top: ${y}px;
            width: ${creature.size}px;
            height: ${creature.size}px;
            font-size: ${creature.size * 0.8}px;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            z-index: 9000;
            animation: friendlySpawn 0.5s ease-out forwards;
            filter: drop-shadow(0 0 15px rgba(255, 200, 255, 0.8));
            user-select: none;
        `;
        el.textContent = creature.emoji;

        playSound(creature.spawnSound);

        activeEnemies++;

        // Click to pet (instead of kill!)
        el.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();

            const rect = el.getBoundingClientRect();
            const centerX = rect.left + rect.width / 2;
            const centerY = rect.top + rect.height / 2;

            // Hearts explosion instead of blood
            createLoveExplosion(centerX, centerY);

            // Happy bounce animation
            el.style.animation = 'friendlyPet 0.5s ease-out';

            // Show happy message
            const msg = document.createElement('div');
            msg.className = 'pet-message';
            msg.textContent = ['Good boy!', 'So cute!', 'Aww!', '*happiness*', 'Friend!'][Math.floor(Math.random() * 5)];
            msg.style.cssText = `
                position: fixed;
                left: ${centerX}px;
                top: ${centerY - 40}px;
                transform: translateX(-50%);
                font-family: 'Press Start 2P', monospace;
                font-size: 0.6rem;
                color: #ff69b4;
                text-shadow: 2px 2px 0 #fff;
                z-index: 9001;
                animation: petMessageFloat 1s ease-out forwards;
                pointer-events: none;
            `;
            document.body.appendChild(msg);
            setTimeout(() => msg.remove(), 1000);

            // Reset animation after bounce
            setTimeout(() => {
                el.style.animation = 'friendlyBounce 2s ease-in-out infinite';
            }, 500);
        });

        document.body.appendChild(el);

        // Friendly wandering (more playful movement)
        const lifespan = 12000 + Math.random() * 15000;
        const wanderInterval = setInterval(() => {
            if (!document.body.contains(el)) {
                clearInterval(wanderInterval);
                return;
            }

            const currentX = parseFloat(el.style.left);
            const currentY = parseFloat(el.style.top);
            const newX = Math.max(0, Math.min(window.innerWidth - creature.size, currentX + (Math.random() - 0.5) * 100));
            const newY = Math.max(0, Math.min(window.innerHeight - creature.size, currentY + (Math.random() - 0.5) * 100));

            el.style.transition = 'left 1s ease-in-out, top 1s ease-in-out';
            el.style.left = newX + 'px';
            el.style.top = newY + 'px';
        }, 2500);

        // Friendly fade out (not death!)
        setTimeout(() => {
            clearInterval(wanderInterval);
            if (document.body.contains(el)) {
                el.style.animation = 'friendlyBye 1s ease-out forwards';
                activeEnemies--;
                setTimeout(() => el.remove(), 1000);
            }
        }, lifespan);
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

            /* ===== PEACE MODE STYLES ===== */
            @keyframes friendlySpawn {
                0% {
                    opacity: 0;
                    transform: scale(0) rotate(-180deg);
                }
                50% {
                    transform: scale(1.3) rotate(10deg);
                }
                100% {
                    opacity: 1;
                    transform: scale(1) rotate(0deg);
                }
            }

            @keyframes friendlyBounce {
                0%, 100% {
                    transform: translateY(0) scale(1);
                }
                50% {
                    transform: translateY(-10px) scale(1.1);
                }
            }

            @keyframes friendlyPet {
                0% { transform: scale(1); }
                25% { transform: scale(1.3) rotate(-10deg); }
                50% { transform: scale(1.4) rotate(10deg); }
                75% { transform: scale(1.2) rotate(-5deg); }
                100% { transform: scale(1) rotate(0deg); }
            }

            @keyframes friendlyBye {
                0% {
                    opacity: 1;
                    transform: scale(1) translateY(0);
                }
                50% {
                    opacity: 1;
                    transform: scale(1.2) translateY(-20px);
                }
                100% {
                    opacity: 0;
                    transform: scale(0.5) translateY(-50px);
                }
            }

            @keyframes loveFloat {
                0% {
                    opacity: 1;
                    transform: translate(0, 0) rotate(0deg) scale(1);
                }
                100% {
                    opacity: 0;
                    transform: translate(var(--end-x), var(--end-y)) rotate(var(--rotation)) scale(0.5);
                }
            }

            @keyframes petMessageFloat {
                0% {
                    opacity: 1;
                    transform: translateX(-50%) translateY(0);
                }
                100% {
                    opacity: 0;
                    transform: translateX(-50%) translateY(-30px);
                }
            }

            .friendly-creature {
                animation: friendlyBounce 2s ease-in-out infinite;
                transition: filter 0.2s;
            }

            .friendly-creature:hover {
                filter: drop-shadow(0 0 25px rgba(255, 150, 255, 1)) brightness(1.2) !important;
                transform: scale(1.1);
            }

            .love-particle {
                position: fixed;
                pointer-events: none;
                z-index: 9999;
                animation: loveFloat 1.5s ease-out forwards;
            }

            /* Peace Mode Banner (shown once when all secrets found) */
            .peace-mode-banner {
                position: fixed;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                background: linear-gradient(135deg, #ff69b4 0%, #ffb6c1 50%, #87ceeb 100%);
                border: 4px solid #fff;
                padding: 40px 60px;
                z-index: 10001;
                text-align: center;
                box-shadow: 0 0 100px rgba(255, 105, 180, 0.8), inset 0 0 30px rgba(255, 255, 255, 0.3);
                animation: peaceBannerPulse 0.5s ease-in-out infinite;
                font-family: 'Press Start 2P', monospace;
                border-radius: 20px;
            }

            @keyframes peaceBannerPulse {
                0%, 100% { transform: translate(-50%, -50%) scale(1); }
                50% { transform: translate(-50%, -50%) scale(1.02); }
            }

            @keyframes peaceBannerFade {
                0% { opacity: 1; transform: translate(-50%, -50%) scale(1); }
                100% { opacity: 0; transform: translate(-50%, -50%) scale(0.9); }
            }

            .peace-mode-banner h2 {
                font-size: 1.5rem;
                color: #fff;
                text-shadow: 3px 3px 0 #ff69b4, -1px -1px 0 #87ceeb;
                margin-bottom: 15px;
            }

            .peace-mode-banner p {
                font-size: 0.7rem;
                color: #fff;
                text-shadow: 2px 2px 0 #ff69b4;
                margin-bottom: 10px;
            }

            .peace-mode-banner .emoji-row {
                font-size: 2rem;
                margin: 15px 0;
            }

            /* Glitter explosion animation */
            @keyframes glitterBurst {
                0% {
                    opacity: 1;
                    transform: translate(0, 0) rotate(0deg) scale(0.5);
                }
                50% {
                    opacity: 1;
                    transform: translate(calc(var(--end-x) * 0.6), calc(var(--end-y) * 0.6)) rotate(calc(var(--rotation) * 0.5)) scale(1.2);
                }
                100% {
                    opacity: 0;
                    transform: translate(var(--end-x), var(--end-y)) rotate(var(--rotation)) scale(0.3);
                }
            }

            .glitter-particle {
                position: fixed;
                pointer-events: none;
                z-index: 10002;
            }

            /* Rainbow glow animation for HUD secrets when all found */
            @keyframes rainbowGlow {
                0%, 100% {
                    text-shadow: 0 0 10px #ff69b4, 0 0 20px #ff69b4;
                    filter: hue-rotate(0deg);
                }
                33% {
                    text-shadow: 0 0 10px #87ceeb, 0 0 20px #87ceeb;
                    filter: hue-rotate(120deg);
                }
                66% {
                    text-shadow: 0 0 10px #98fb98, 0 0 20px #98fb98;
                    filter: hue-rotate(240deg);
                }
            }
        `;
        document.head.appendChild(style);
    }

    // PEACE MODE: Create massive glitter explosion for celebration
    function createGlitterExplosion() {
        const glitters = ['✨', '⭐', '🌟', '💫', '🎀', '💖', '🦋', '🌸', '🎉', '🎊', '💝', '🌈'];
        const particleCount = 80;

        // Create particles from center of screen
        const centerX = window.innerWidth / 2;
        const centerY = window.innerHeight / 2;

        for (let i = 0; i < particleCount; i++) {
            setTimeout(() => {
                const particle = document.createElement('div');
                particle.className = 'glitter-particle';
                particle.textContent = glitters[Math.floor(Math.random() * glitters.length)];

                const size = 24 + Math.random() * 32;
                particle.style.fontSize = size + 'px';
                particle.style.position = 'fixed';
                particle.style.left = centerX + 'px';
                particle.style.top = centerY + 'px';
                particle.style.zIndex = '10002';
                particle.style.pointerEvents = 'none';

                const angle = Math.random() * Math.PI * 2;
                const velocity = 150 + Math.random() * 300;
                const endX = Math.cos(angle) * velocity;
                const endY = Math.sin(angle) * velocity;

                particle.style.setProperty('--end-x', endX + 'px');
                particle.style.setProperty('--end-y', endY + 'px');
                particle.style.setProperty('--rotation', (Math.random() * 720 - 360) + 'deg');
                particle.style.animation = 'glitterBurst 2s ease-out forwards';

                document.body.appendChild(particle);

                setTimeout(() => particle.remove(), 2000);
            }, i * 20);
        }
    }

    // Show peace mode banner (once per session)
    function showPeaceModeBanner() {
        // Only show once per session
        if (sessionStorage.getItem('zaparena_peace_banner_shown')) return;
        sessionStorage.setItem('zaparena_peace_banner_shown', 'true');

        // Play cute celebration sound (pickup is more cheerful than monster sounds)
        playSound('pickup');
        setTimeout(() => playSound('pickup'), 200);
        setTimeout(() => playSound('pickup'), 400);

        // GLITTER EXPLOSION FIRST!
        createGlitterExplosion();

        // Then show banner after a brief moment
        setTimeout(() => {
            const banner = document.createElement('div');
            banner.className = 'peace-mode-banner';
            banner.innerHTML = `
                <h2>🌈 PEACE MODE UNLOCKED! 🌈</h2>
                <div class="emoji-row">🦄 🐕 🐱 🐰 🦋</div>
                <p>All 5 secrets found!</p>
                <p>Enemies are now friends! ✨</p>
            `;
            document.body.appendChild(banner);

            // Spawn a bunch of friendly creatures to celebrate
            for (let i = 0; i < 5; i++) {
                setTimeout(() => spawnFriendlyCreature(), i * 300);
            }

            setTimeout(() => {
                banner.style.animation = 'peaceBannerFade 0.5s ease-out forwards';
                setTimeout(() => banner.remove(), 500);
            }, 4000);
        }, 500);
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
        preloadSound('pickup');
        preloadSound('secret');

        // Check for peace mode
        peaceModeActive = allSecretsFound();

        // Show peace mode banner if all secrets found
        if (peaceModeActive) {
            showPeaceModeBanner();
        }

        // Spawn function - enemies OR friendly creatures based on peace mode
        function spawnCreature() {
            // Re-check peace mode in case secrets were found during session
            peaceModeActive = allSecretsFound();

            if (peaceModeActive) {
                spawnFriendlyCreature();
            } else {
                spawnEnemy();
            }
        }

        // Spawn at random intervals based on difficulty
        function scheduleNextSpawn() {
            const settings = getSettings();
            const delay = settings.minDelay + Math.random() * (settings.maxDelay - settings.minDelay);

            setTimeout(() => {
                // Only spawn if document is visible
                if (!document.hidden) {
                    spawnCreature();
                }
                scheduleNextSpawn();
            }, delay);
        }

        // Initial spawn after page load based on difficulty
        const settings = getSettings();
        const initialDelay = settings.initialMin + Math.random() * (settings.initialMax - settings.initialMin);

        setTimeout(() => {
            if (!document.hidden) {
                spawnCreature();
            }
            scheduleNextSpawn();
        }, initialDelay);

        // Listen for storage changes (secrets found, difficulty changes)
        window.addEventListener('storage', function(e) {
            if (e.key === 'zaparena_difficulty') {
                console.log('[Quake Enemy System] Difficulty changed to:', e.newValue);
            }
            // Check if a secret was found and if we should activate peace mode
            if (e.key && e.key.startsWith('zaparena_secret')) {
                const wasInPeaceMode = peaceModeActive;
                peaceModeActive = allSecretsFound();
                if (!wasInPeaceMode && peaceModeActive) {
                    console.log('[Quake Enemy System] ALL SECRETS FOUND! PEACE MODE ACTIVATED!');
                    showPeaceModeBanner();
                }
            }
        });

        const difficulty = getDifficulty();
        if (peaceModeActive) {
            console.log('[Quake Enemy System] PEACE MODE ACTIVE - Spawning unicorns and puppies!');
        } else {
            console.log('[Quake Enemy System] Initialized at difficulty:', difficulty);
            console.log('[Quake Enemy System] Spawn interval:', settings.minDelay/1000 + '-' + settings.maxDelay/1000 + 's, Max enemies:', settings.maxActive);
        }
    }

    // Kill an enemy at a specific position (for arsenal weapon hits)
    // Returns true if an enemy was killed
    function killEnemyAtPosition(x, y, hitRadius) {
        hitRadius = hitRadius || 60;  // Default hit radius

        const enemies = document.querySelectorAll('.quake-enemy');
        for (const enemy of enemies) {
            const rect = enemy.getBoundingClientRect();
            const enemyCenterX = rect.left + rect.width / 2;
            const enemyCenterY = rect.top + rect.height / 2;

            // Check if projectile hits within radius of enemy center
            const dist = Math.sqrt(Math.pow(x - enemyCenterX, 2) + Math.pow(y - enemyCenterY, 2));

            if (dist <= hitRadius + Math.max(rect.width, rect.height) / 2) {
                // Kill this enemy!
                playSound('sgun1');
                createEnemyGibs(enemyCenterX, enemyCenterY);

                enemy.style.animation = 'enemyDeath 0.2s ease-out forwards';
                activeEnemies--;
                setTimeout(() => enemy.remove(), 200);

                // Increment kills
                totalKills++;
                localStorage.setItem('zaparena_total_kills', totalKills.toString());

                if (window.ZapArena && window.ZapArena.updateKillsDisplay) {
                    window.ZapArena.updateKillsDisplay();
                }

                // SECRET #5 check
                if (totalKills === 69 && !secret5Found) {
                    triggerSecret5(enemyCenterX, enemyCenterY);
                }

                return true;
            }
        }
        return false;
    }

    // Kill all enemies along a path (for explosive weapons)
    // Returns count of enemies killed
    function killEnemiesAlongPath(startX, startY, endX, endY, explosionRadius) {
        explosionRadius = explosionRadius || 100;
        let killCount = 0;

        const enemies = document.querySelectorAll('.quake-enemy');
        for (const enemy of enemies) {
            const rect = enemy.getBoundingClientRect();
            const enemyCenterX = rect.left + rect.width / 2;
            const enemyCenterY = rect.top + rect.height / 2;

            // Check distance from enemy to the line segment
            const distToLine = pointToLineDistance(enemyCenterX, enemyCenterY, startX, startY, endX, endY);

            if (distToLine <= explosionRadius + Math.max(rect.width, rect.height) / 2) {
                playSound('sgun1');
                createEnemyGibs(enemyCenterX, enemyCenterY);

                enemy.style.animation = 'enemyDeath 0.2s ease-out forwards';
                activeEnemies--;
                setTimeout(() => enemy.remove(), 200);

                totalKills++;
                localStorage.setItem('zaparena_total_kills', totalKills.toString());

                if (window.ZapArena && window.ZapArena.updateKillsDisplay) {
                    window.ZapArena.updateKillsDisplay();
                }

                if (totalKills === 69 && !secret5Found) {
                    triggerSecret5(enemyCenterX, enemyCenterY);
                }

                killCount++;
            }
        }
        return killCount;
    }

    // Helper: Calculate distance from point to line segment
    function pointToLineDistance(px, py, x1, y1, x2, y2) {
        const A = px - x1;
        const B = py - y1;
        const C = x2 - x1;
        const D = y2 - y1;

        const dot = A * C + B * D;
        const lenSq = C * C + D * D;
        let param = -1;

        if (lenSq !== 0) {
            param = dot / lenSq;
        }

        let xx, yy;

        if (param < 0) {
            xx = x1;
            yy = y1;
        } else if (param > 1) {
            xx = x2;
            yy = y2;
        } else {
            xx = x1 + param * C;
            yy = y1 + param * D;
        }

        const dx = px - xx;
        const dy = py - yy;
        return Math.sqrt(dx * dx + dy * dy);
    }

    // Expose API for arsenal weapons
    window.ZapArenaEnemies = {
        killAtPosition: killEnemyAtPosition,
        killAlongPath: killEnemiesAlongPath,
        getActiveCount: function() { return activeEnemies; },
        isPeaceMode: function() { return peaceModeActive; }
    };

    // Start when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
