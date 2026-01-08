// Zap Arena Secrets System
// Handles cross-page secret detection (Konami code, etc.)

(function() {
    'use strict';

    // Secret Banner creation (reusable)
    function showSecretBanner(description) {
        let banner = document.getElementById('secretBannerGlobal');
        if (!banner) {
            banner = document.createElement('div');
            banner.id = 'secretBannerGlobal';
            banner.style.cssText = 'display: none; position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); z-index: 10001; background: rgba(0,0,0,0.95); border: 3px solid #cf6b2f; padding: 2rem 3rem; text-align: center; font-family: "Press Start 2P", cursive;';
            banner.innerHTML = '<div style="color: #cf6b2f; font-size: 1.5rem; text-shadow: 0 0 20px #cf6b2f; animation: pulse 0.5s ease-in-out infinite;">SECRET FOUND!</div><div id="secretCountGlobal" style="color: #ffcc00; font-size: 0.8rem; margin-top: 1rem;">SECRET X OF 5</div><div id="secretDescGlobal" style="color: #888; font-size: 0.5rem; margin-top: 0.5rem;"></div>';
            document.body.appendChild(banner);
        }

        // Count total secrets
        let count = 0;
        for (let i = 1; i <= 5; i++) {
            if (localStorage.getItem('zaparena_secret' + i) === 'true') count++;
        }
        document.getElementById('secretCountGlobal').textContent = 'SECRET ' + count + ' OF 5';
        document.getElementById('secretDescGlobal').textContent = description;
        banner.style.display = 'block';

        // Play sound
        try {
            const sound = new Audio('audio/pickup.wav');
            sound.volume = 0.5;
            sound.play().catch(() => {});
        } catch(e) {}

        // Update HUD
        if (window.ZapArena && window.ZapArena.updateSecretsDisplay) {
            window.ZapArena.updateSecretsDisplay();
        }

        // Hide after 3 seconds
        setTimeout(() => { banner.style.display = 'none'; }, 3000);
    }

    // ===== SECRET 2: Konami Code (works on all pages) =====
    let secret2Found = localStorage.getItem('zaparena_secret2') === 'true';
    const konamiCode = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a'];
    let konamiIndex = 0;

    document.addEventListener('keydown', function(e) {
        if (secret2Found) return;

        // Check if key matches current position in sequence (case-insensitive for letters)
        const keyLower = e.key.toLowerCase();
        const expectedLower = konamiCode[konamiIndex].toLowerCase();
        if (e.key === konamiCode[konamiIndex] || keyLower === expectedLower) {
            konamiIndex++;

            // Complete!
            if (konamiIndex === konamiCode.length) {
                localStorage.setItem('zaparena_secret2', 'true');
                secret2Found = true;

                showSecretBanner('IDDQD? No, it\'s Konami!');

                // Screen shake for extra effect
                document.body.classList.add('shake');
                setTimeout(() => document.body.classList.remove('shake'), 400);

                // Play multiple sounds
                try {
                    new Audio('audio/powerup.wav').play().catch(() => {});
                    setTimeout(() => new Audio('audio/gib.wav').play().catch(() => {}), 200);
                } catch(e) {}

                console.log('[Secret 2] Konami Code entered!');
                konamiIndex = 0;
            }
        } else {
            konamiIndex = 0;
        }
    });

    // Expose showSecretBanner globally for other secrets to use
    window.ZapArenaSecrets = {
        showSecretBanner: showSecretBanner
    };

    console.log('[Secrets] Global secrets system initialized');
})();
