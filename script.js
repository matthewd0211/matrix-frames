document.addEventListener('DOMContentLoaded', function() {
    const canvas = document.getElementById('matrixCanvas');
    const ctx = canvas.getContext('2d');

    let columns, drops, speeds, trails;
    const glyphSize = 15; // Adjust based on your desired density
    const maxTrailLength = 100; // Maximum number of characters in a trail

    // Define colors
    const colors = {
        background: '#0E0C15', // Dark background
        gradientStart: '#01FFB3', // Teal
        gradientEnd: '#B062E8'  // Purple
    };

    // Paths to custom SVG glyphs
    const svgPaths = [
        '1.svg',
        '2.svg',
        '3.svg',
        '4.svg',
        '5.svg',
        '6.svg',
        '7.svg',
        '8.svg',
        '9.svg',
        '10.svg',
        '11.svg',
        '12.svg',
        // Add paths to all glyphs here
    ];

    const glyphs = []; // Array to hold Image objects for glyphs

    // Preload SVGs and convert to Image objects
    function preloadGlyphs(paths, callback) {
        let loadedCount = 0;
        paths.forEach((path, index) => {
            const img = new Image();
            img.onload = function() {
                glyphs[index] = img;
                loadedCount++;
                if (loadedCount === paths.length) {
                    callback();
                }
            };
            img.src = path;
        });
    }

    const logo = new Image();
    logo.src = 'Logo.png'; // Path to logo file
    logo.onload = function() {
        console.log("Logo loaded");
    };
    logo.onerror = function() {
        console.error("Failed to load logo");
    };

    const centerImage = new Image();
    centerImage.src = 'Group192.png'; // Path to center image
    centerImage.onload = function() {
        console.log("Center image loaded");
    };
    centerImage.onerror = function() {
        console.error("Failed to load center image");
    };

    function resizeCanvas() {
        // Set the canvas size to 1920x1080
        canvas.width = 1920;
        canvas.height = 1080;
        columns = Math.floor(canvas.width / glyphSize);
        drops = Array(columns).fill(0);
        speeds = Array(columns).fill(0).map(() => Math.random() * 0.5 + 0.1); // Speeds between 0.05 and 0.6
        trails = Array(columns).fill(null).map(() => []);
        console.log(`Canvas size: ${canvas.width}x${canvas.height}, Columns: ${columns}`);
    }

    function drawGlowingText(image, x, y) {
        const offscreenCanvas = document.createElement('canvas');
        const offscreenCtx = offscreenCanvas.getContext('2d');
        offscreenCanvas.width = glyphSize;
        offscreenCanvas.height = glyphSize;

        // Draw the image on the offscreen canvas in white
        offscreenCtx.drawImage(image, 0, 0, glyphSize, glyphSize);
        const imageData = offscreenCtx.getImageData(0, 0, glyphSize, glyphSize);
        const data = imageData.data;

        for (let i = 0; i < data.length; i += 4) {
            // Set the color to white
            data[i] = 255;     // Red
            data[i + 1] = 255; // Green
            data[i + 2] = 255; // Blue
        }
        offscreenCtx.putImageData(imageData, 0, 0);

        // Apply the glow effect
        ctx.shadowColor = 'rgba(255, 255, 255, 1)';
        ctx.shadowBlur = 30; // Increase blur for more glow
        ctx.drawImage(offscreenCanvas, x, y, glyphSize, glyphSize);
        ctx.shadowBlur = 0;
    }

    function drawGlitchEffect() {
        if (Math.random() > 0.9) { // Increase probability of glitch effect
            const glitchHeight = Math.random() * 20 + 5; // Height of the glitch
            const glitchY = Math.random() * canvas.height; // Random Y position
            const glitchXOffset = (Math.random() - 0.5) * 30; // Horizontal shift amount

            // Copy a portion of the canvas and shift it horizontally
            const imageData = ctx.getImageData(0, glitchY, canvas.width, glitchHeight);
            ctx.putImageData(imageData, glitchXOffset, glitchY);
        }
    }

    function drawLogo() {
        const logoWidth = 250; // Adjust the width of the top-left logo
        const logoHeight = logoWidth * (logo.height / logo.width);
        const logoX = 20; // Distance from the left edge
        const logoY = 20; // Distance from the top edge
        ctx.drawImage(logo, logoX, logoY, logoWidth, logoHeight);
    }

    function drawCenterImage() {
        const centerWidth = 800; // Adjust the width of the center image
        const centerHeight = centerWidth * (centerImage.height / centerImage.width);
        const centerX = (canvas.width - centerWidth) / 2;
        const centerY = (canvas.height - centerHeight) / 2;
        ctx.drawImage(centerImage, centerX, centerY, centerWidth, centerHeight);
    }

    function createGradientOverlay() {
        const gradientCanvas = document.createElement('canvas');
        const gradientCtx = gradientCanvas.getContext('2d');
        gradientCanvas.width = canvas.width;
        gradientCanvas.height = canvas.height;

        // Create top-to-bottom gradient
        const gradient = gradientCtx.createLinearGradient(0, 0, 0, canvas.height);
        gradient.addColorStop(0, colors.gradientStart);
        gradient.addColorStop(1, colors.gradientEnd);

        // Apply gradient
        gradientCtx.fillStyle = gradient;
        gradientCtx.fillRect(0, 0, canvas.width, canvas.height);

        return gradientCanvas;
    }

    function draw() {
        // Clear the entire canvas
        ctx.fillStyle = colors.background;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        for (let i = 0; i < columns; i++) {
            const x = i * glyphSize;

            // Update trail
            if (drops[i] * glyphSize > canvas.height && Math.random() > 0.99) {
                drops[i] = 0;
                trails[i] = [];
            }

            // Add new character to trail
            if (drops[i] % 1 < speeds[i]) {
                trails[i].unshift({
                    char: glyphs[Math.floor(Math.random() * glyphs.length)],
                    opacity: 1
                });
                if (trails[i].length > maxTrailLength) {
                    trails[i].pop();
                }
            }

            // Draw trail
            for (let j = 0; j < trails[i].length; j++) {
                const y = Math.floor(drops[i] - j) * glyphSize;
                if (j === 0) {
                    drawGlowingText(trails[i][j].char, x, y);
                } else {
                    ctx.globalAlpha = trails[i][j].opacity;
                    ctx.drawImage(trails[i][j].char, x, y, glyphSize, glyphSize);
                    ctx.globalAlpha = 1.0;
                }
                trails[i][j].opacity -= 0.015; // Fade out characters
            }

            // Remove fully faded characters
            trails[i] = trails[i].filter(char => char.opacity > 0);

            // Move drop
            drops[i] += speeds[i];
        }

        drawGlitchEffect();

        // Apply gradient overlay
        const gradientCanvas = createGradientOverlay();
        ctx.globalCompositeOperation = 'multiply';
        ctx.drawImage(gradientCanvas, 0, 0);
        ctx.globalCompositeOperation = 'source-over';

        // Draw the center image after the matrix code
        drawCenterImage();

        requestAnimationFrame(draw);
    }

    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();

    // Preload glyphs and start animation
    preloadGlyphs(svgPaths, () => {
        logo.onload = () => {
            centerImage.onload = () => {
                requestAnimationFrame(draw);
            };
        };
    });

    console.log("Animation started");
});
