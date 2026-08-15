const { Jimp } = require('jimp');
const path = require('path');

async function removeBackground() {
  const imagePath = path.join(__dirname, 'public/rocket.png');
  console.log('Reading image from:', imagePath);
  
  const image = await Jimp.read(imagePath);
  
  image.scan(0, 0, image.bitmap.width, image.bitmap.height, function(x, y, idx) {
    const r = this.bitmap.data[idx + 0];
    const g = this.bitmap.data[idx + 1];
    const b = this.bitmap.data[idx + 2];
    
    // If pixel is very close to white, make it transparent
    if (r > 245 && g > 245 && b > 245) {
      this.bitmap.data[idx + 3] = 0; // Alpha = 0 (transparent)
    } else if (r > 230 && g > 230 && b > 230) {
      // Soft transition for anti-aliasing edges
      const maxVal = Math.max(r, g, b);
      // Map 230-245 to alpha 255-0
      const alpha = Math.max(0, Math.min(255, Math.round((245 - maxVal) / 15 * 255)));
      this.bitmap.data[idx + 3] = alpha;
    }
  });

  await image.write(imagePath);
  console.log('Background removed successfully and image overwritten.');
}

removeBackground().catch(err => {
  console.error('Error processing image:', err);
});
