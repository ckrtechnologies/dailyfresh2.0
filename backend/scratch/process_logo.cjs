const sharp = require('sharp');
const path = require('path');

const inputPath = 'c:/dev/dailyfresh/customerapp/src/assets/logo.jpg';
const outputPath = 'c:/dev/dailyfresh/customerapp/src/assets/logo.png';

async function removeBackground() {
    try {
        console.log('Processing logo to remove background...');
        
        // We'll use a simple threshold to make white/light pixels transparent
        // For a more professional look, we might need more complex logic, 
        // but often logos have a clean white background.
        await sharp(inputPath)
            .ensureAlpha()
            .toFormat('png')
            .raw()
            .toBuffer({ resolveWithObject: true })
            .then(({ data, info }) => {
                const { width, height, channels } = info;
                for (let i = 0; i < data.length; i += channels) {
                    const r = data[i];
                    const g = data[i + 1];
                    const b = data[i + 2];
                    
                    // If pixel is near white, make it transparent
                    if (r > 240 && g > 240 && b > 240) {
                        data[i + 3] = 0;
                    }
                }
                return sharp(data, { raw: { width, height, channels } }).toFile(outputPath);
            });

        console.log('Success! Logo saved as logo.png with transparency.');
    } catch (error) {
        console.error('Error processing image:', error);
    }
}

removeBackground();
