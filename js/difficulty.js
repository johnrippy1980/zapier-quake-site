// Zap Arena Difficulty & Secrets Persistence System
// Handles cross-page difficulty persistence and secrets tracking

(function() {
    'use strict';

    const TOTAL_SECRETS = 5;
    const SECRET_KEYS = [
        'zaparena_secret1', // Secret 1: Quake logo click
        'zaparena_secret2', // Secret 2: Konami code
        'zaparena_secret3', // Secret 3: NIN ammo box
        'zaparena_secret4', // Secret 4: n8n.io gib shower
        'zaparena_secret5'  // Secret 5: 69 kills
    ];

    // Get current difficulty from localStorage
    function getDifficulty() {
        return localStorage.getItem('zaparena_difficulty') || 'easy';
    }

    // Get armor value for difficulty
    function getArmorForDifficulty(difficulty) {
        const armorMap = {
            easy: 100,
            normal: 50,
            hard: 25,
            nightmare: 0
        };
        return armorMap[difficulty] || 100;
    }

    // Count found secrets
    function countSecrets() {
        let count = 0;
        SECRET_KEYS.forEach(key => {
            if (localStorage.getItem(key) === 'true') {
                count++;
            }
        });
        return count;
    }

    // Update the HUD secrets display to show X/5 format or cute emoji when all found
    function updateSecretsDisplay() {
        const hudSecrets = document.getElementById('hudSecrets');
        if (hudSecrets) {
            const found = countSecrets();
            if (found === TOTAL_SECRETS) {
                // All secrets found - show cute celebration!
                hudSecrets.textContent = '🌈✨';
                hudSecrets.title = 'All secrets found! Peace Mode active!';
                hudSecrets.style.animation = 'rainbowGlow 2s ease-in-out infinite';
            } else {
                hudSecrets.textContent = found + '/' + TOTAL_SECRETS;
                hudSecrets.title = 'Secrets found';
                hudSecrets.style.animation = '';
            }
        }

        // Update the label too if all secrets found
        const hudSecretsLabel = hudSecrets ? hudSecrets.parentElement.querySelector('.hud-label') : null;
        if (hudSecretsLabel) {
            if (countSecrets() === TOTAL_SECRETS) {
                hudSecretsLabel.textContent = 'ALL FOUND!';
                hudSecretsLabel.style.color = '#ff69b4';
            } else {
                hudSecretsLabel.textContent = 'SECRETS';
                hudSecretsLabel.style.color = '';
            }
        }
    }

    // Update HUD armor based on difficulty
    function updateArmorDisplay() {
        const hudArmor = document.getElementById('hudArmor');
        if (hudArmor) {
            const difficulty = getDifficulty();
            hudArmor.textContent = getArmorForDifficulty(difficulty);
        }
    }

    // Update difficulty button text and menu state
    function updateDifficultyUI() {
        const difficulty = getDifficulty();

        // Update button text
        const difficultyBtn = document.getElementById('difficultyBtn');
        if (difficultyBtn) {
            difficultyBtn.textContent = difficulty.toUpperCase();
        }

        // Update active option in menu
        const difficultyOptions = document.querySelectorAll('.difficulty-option');
        difficultyOptions.forEach(option => {
            if (option.dataset.difficulty === difficulty) {
                option.classList.add('active');
            } else {
                option.classList.remove('active');
            }
        });

        // Apply visual effects based on difficulty
        applyDifficultyEffects(difficulty);
    }

    // Apply visual effects for current difficulty
    function applyDifficultyEffects(difficulty) {
        const vignette = document.querySelector('.vignette');
        const crtOverlay = document.querySelector('.crt-overlay');

        if (!vignette || !crtOverlay) return;

        // Reset all difficulty classes
        vignette.classList.remove('nightmare');
        crtOverlay.classList.remove('hard', 'nightmare');
        vignette.style.opacity = '1';
        vignette.style.background = '';

        // Apply difficulty-specific visual effects
        if (difficulty === 'easy') {
            vignette.style.opacity = '0.3';
            vignette.style.background = 'radial-gradient(ellipse at center, transparent 50%, rgba(31, 23, 11, 0.3) 100%)';
            crtOverlay.style.opacity = '0.3';
        } else if (difficulty === 'normal') {
            vignette.style.background = 'radial-gradient(ellipse at center, transparent 40%, rgba(31, 23, 11, 0.5) 100%)';
            crtOverlay.style.opacity = '0.5';
        } else if (difficulty === 'hard') {
            vignette.style.background = 'radial-gradient(ellipse at center, transparent 30%, rgba(100, 20, 10, 0.45) 100%)';
            crtOverlay.classList.add('hard');
            crtOverlay.style.opacity = '';
        } else if (difficulty === 'nightmare') {
            vignette.classList.add('nightmare');
            crtOverlay.classList.add('nightmare');
            crtOverlay.style.opacity = '';
        }
    }

    // Set up difficulty selector interaction
    function setupDifficultySelector() {
        const difficultyBtn = document.getElementById('difficultyBtn');
        const difficultyMenu = document.getElementById('difficultyMenu');
        const difficultyOptions = document.querySelectorAll('.difficulty-option');

        if (!difficultyBtn || !difficultyMenu) return;

        // Toggle menu
        difficultyBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            difficultyMenu.classList.toggle('show');

            // Try to play menu sound
            try {
                const menuSound = new Audio('audio/pickup.wav');
                menuSound.volume = 0.3;
                menuSound.play().catch(() => {});
            } catch(e) {}
        });

        // Close menu when clicking outside
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.difficulty-selector')) {
                difficultyMenu.classList.remove('show');
            }
        });

        // Handle difficulty selection
        difficultyOptions.forEach(option => {
            option.addEventListener('click', () => {
                const difficulty = option.dataset.difficulty;

                // Save to localStorage
                localStorage.setItem('zaparena_difficulty', difficulty);

                // Update UI
                difficultyBtn.textContent = difficulty.toUpperCase();

                // Update active state
                difficultyOptions.forEach(opt => opt.classList.remove('active'));
                option.classList.add('active');

                // Close menu
                difficultyMenu.classList.remove('show');

                // Apply visual effects
                applyDifficultyEffects(difficulty);

                // Update armor display
                updateArmorDisplay();

                // Pain flash for hard/nightmare
                if (difficulty === 'hard' || difficulty === 'nightmare') {
                    const painFlash = document.querySelector('.pain-flash');
                    if (painFlash) {
                        painFlash.classList.add('active');
                        setTimeout(() => painFlash.classList.remove('active'), 200);
                    }
                }

                // Screen shake for nightmare
                if (difficulty === 'nightmare') {
                    document.body.classList.add('shake');
                    setTimeout(() => document.body.classList.remove('shake'), 400);
                }

                // Play selection sound
                try {
                    const selectSound = new Audio('audio/pickup.wav');
                    selectSound.volume = 0.4;
                    selectSound.play().catch(() => {});
                } catch(e) {}

                console.log('[Difficulty System] Changed to:', difficulty);
            });
        });
    }

    // Update kills display with persistent count
    function updateKillsDisplay() {
        const hudKills = document.getElementById('hudKills');
        if (hudKills) {
            const totalKills = parseInt(localStorage.getItem('zaparena_total_kills') || '0');
            hudKills.textContent = totalKills;
        }
    }

    // Initialize on page load
    function init() {
        // Update all displays
        updateDifficultyUI();
        updateSecretsDisplay();
        updateArmorDisplay();
        updateKillsDisplay();

        // Set up difficulty selector if present
        setupDifficultySelector();

        // Listen for storage changes from other tabs
        window.addEventListener('storage', (e) => {
            if (e.key === 'zaparena_difficulty') {
                updateDifficultyUI();
                updateArmorDisplay();
            }
            if (e.key && e.key.startsWith('zaparena_secret')) {
                updateSecretsDisplay();
            }
            if (e.key === 'zaparena_total_kills') {
                updateKillsDisplay();
            }
        });

        console.log('[Difficulty System] Initialized - Difficulty:', getDifficulty(), ', Secrets:', countSecrets() + '/' + TOTAL_SECRETS);
    }

    // Expose functions globally for other scripts
    window.ZapArena = {
        getDifficulty,
        countSecrets,
        updateSecretsDisplay,
        updateArmorDisplay,
        updateKillsDisplay,
        TOTAL_SECRETS
    };

    // Start when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
