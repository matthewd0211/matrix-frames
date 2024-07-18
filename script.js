document.addEventListener('DOMContentLoaded', function() {
    console.log("DOM Content Loaded");
    const canvas = document.getElementById('matrixCanvas');
    if (!canvas) {
        console.error("Canvas element not found!");
        return;
    }
    const ctx = canvas.getContext('2d');
    if (!ctx) {
        console.error("Unable to get 2D context!");
        return;
    }

    let columns, drops, speeds, trails;
    const glyphSize = 15;
    const maxTrailLength = 100;

    const colors = {
        background: '#0E0C15',
        gradientStart: '#01FFB3',
        gradientEnd: '#B062E8'
    };

    const svgPaths = [
        'Assets/1.svg', 'Assets/2.svg', 'Assets/3.svg', 'Assets/4.svg', 'Assets/5.svg', 'Assets/6.svg',
        'Assets/7.svg', 'Assets/8.svg', 'Assets/9.svg', 'Assets/10.svg', 'Assets/11.svg', 'Assets/12.svg',
    ];

    const glyphs = [];

    const centerImage = new Image();
    centerImage.src = 'Assets/group1.svg';

    function resizeCanvas() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        columns = Math.floor(canvas.width / glyphSize);
        drops = Array(columns).fill(0);
        speeds = Array(columns).fill(0).map(() => Math.random() * 0.5 + 0.1);
        trails = Array(columns).fill(null).map(() => []);
        console.log(`Canvas resized: ${canvas.width}x${canvas.height}, Columns: ${columns}`);
    }

    function drawGlowingText(image, x, y) {
        const offscreenCanvas = document.createElement('canvas');
        const offscreenCtx = offscreenCanvas.getContext('2d');
        offscreenCanvas.width = glyphSize;
        offscreenCanvas.height = glyphSize;

        offscreenCtx.drawImage(image, 0, 0, glyphSize, glyphSize);
        const imageData = offscreenCtx.getImageData(0, 0, glyphSize, glyphSize);
        const data = imageData.data;

        for (let i = 0; i < data.length; i += 4) {
            data[i] = data[i + 1] = data[i + 2] = 255;
        }
        offscreenCtx.putImageData(imageData, 0, 0);

        ctx.shadowColor = 'rgba(255, 255, 255, 1)';
        ctx.shadowBlur = 30;
        ctx.drawImage(offscreenCanvas, x, y, glyphSize, glyphSize);
        ctx.shadowBlur = 0;
    }

    function drawGlitchEffect() {
        if (Math.random() > 0.9) {
            const glitchHeight = Math.random() * 20 + 5;
            const glitchY = Math.random() * canvas.height;
            const glitchXOffset = (Math.random() - 0.5) * 30;

            const imageData = ctx.getImageData(0, glitchY, canvas.width, glitchHeight);
            ctx.putImageData(imageData, glitchXOffset, glitchY);
        }
    }

    function drawCenterImage() {
        if (centerImage.complete && centerImage.naturalHeight !== 0) {
            const centerWidth = Math.min(800, canvas.width * 0.8);
            const centerHeight = centerWidth * (centerImage.height / centerImage.width);
            const centerX = (canvas.width - centerWidth) / 2;
            const centerY = (canvas.height - centerHeight) / 2;
            ctx.drawImage(centerImage, centerX, centerY, centerWidth, centerHeight);
        } else {
            console.log("Center image not loaded or failed to load. Skipping draw.");
        }
    }

    function createGradientOverlay() {
        const gradientCanvas = document.createElement('canvas');
        const gradientCtx = gradientCanvas.getContext('2d');
        gradientCanvas.width = canvas.width;
        gradientCanvas.height = canvas.height;

        const gradient = gradientCtx.createLinearGradient(0, 0, 0, canvas.height);
        gradient.addColorStop(0, colors.gradientStart);
        gradient.addColorStop(1, colors.gradientEnd);

        gradientCtx.fillStyle = gradient;
        gradientCtx.fillRect(0, 0, canvas.width, canvas.height);

        return gradientCanvas;
    }

    function draw() {
        console.log("Draw function called");
        // Clear the canvas
        ctx.fillStyle = colors.background;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Draw matrix effect
        for (let i = 0; i < columns; i++) {
            const x = i * glyphSize;

            if (drops[i] * glyphSize > canvas.height && Math.random() > 0.99) {
                drops[i] = 0;
                trails[i] = [];
            }

            if (drops[i] % 1 < speeds[i]) {
                trails[i].unshift({
                    char: glyphs[Math.floor(Math.random() * glyphs.length)],
                    opacity: 1
                });
                if (trails[i].length > maxTrailLength) {
                    trails[i].pop();
                }
            }

            for (let j = 0; j < trails[i].length; j++) {
                const y = Math.floor(drops[i] - j) * glyphSize;
                if (j === 0 && trails[i][j].char) {
                    drawGlowingText(trails[i][j].char, x, y);
                } else if (trails[i][j].char) {
                    ctx.globalAlpha = trails[i][j].opacity;
                    ctx.drawImage(trails[i][j].char, x, y, glyphSize, glyphSize);
                    ctx.globalAlpha = 1.0;
                }
                trails[i][j].opacity -= 0.015;
            }

            trails[i] = trails[i].filter(char => char.opacity > 0);
            drops[i] += speeds[i];
        }

        drawGlitchEffect();

        // Apply gradient overlay to matrix effect
        const gradientCanvas = createGradientOverlay();
        ctx.globalCompositeOperation = 'multiply';
        ctx.drawImage(gradientCanvas, 0, 0);
        ctx.globalCompositeOperation = 'source-over';

        // Draw the center image on top of everything
        drawCenterImage();

        requestAnimationFrame(draw);
    }

    function preloadGlyphs(paths, callback) {
        let loadedCount = 0;
        paths.forEach((path, index) => {
            const img = new Image();
            img.onload = function() {
                glyphs[index] = img;
                loadedCount++;
                console.log(`Loaded glyph ${index + 1}/${paths.length}`);
                if (loadedCount === paths.length) {
                    callback();
                }
            };
            img.onerror = function() {
                console.error(`Failed to load image: ${path}`);
                loadedCount++;
                if (loadedCount === paths.length) {
                    callback();
                }
            };
            img.src = path;
        });
    }

    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();

    centerImage.onload = function() {
        console.log("Center image loaded");
        preloadGlyphs(svgPaths, () => {
            console.log("All glyphs loaded, starting animation");
            requestAnimationFrame(draw);
        });
    };

    centerImage.onerror = function() {
        console.error("Failed to load center image");
        preloadGlyphs(svgPaths, () => {
            console.log("All glyphs loaded, starting animation without center image");
            requestAnimationFrame(draw);
        });
    };

    console.log("Animation setup complete");
});
