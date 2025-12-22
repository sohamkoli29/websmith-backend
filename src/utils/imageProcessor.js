import sharp from 'sharp';

// Image processing configurations
export const IMAGE_CONFIGS = {
  THUMBNAIL: {
    width: 150,
    height: 150,
    fit: 'cover',
    format: 'webp',
    quality: 80
  },
  MEDIUM: {
    width: 800,
    height: null, // auto
    fit: 'inside',
    format: 'webp',
    quality: 85
  },
  LARGE: {
    width: 1200,
    height: null,
    fit: 'inside',
    format: 'webp',
    quality: 90
  },
  AVATAR: {
    width: 200,
    height: 200,
    fit: 'cover',
    format: 'webp',
    quality: 85
  }
};

// Process and optimize image
export async function processImage(buffer, config = IMAGE_CONFIGS.MEDIUM) {
  try {
    let image = sharp(buffer);

    // Get original metadata
    const metadata = await image.metadata();
    
    // Resize if needed
    if (config.width || config.height) {
      image = image.resize({
        width: config.width,
        height: config.height,
        fit: config.fit || 'inside',
        withoutEnlargement: true
      });
    }

    // Convert to specified format
    switch (config.format) {
      case 'webp':
        image = image.webp({ quality: config.quality || 85 });
        break;
      case 'jpeg':
      case 'jpg':
        image = image.jpeg({ quality: config.quality || 85 });
        break;
      case 'png':
        image = image.png({ compressionLevel: 9 });
        break;
      default:
        // Keep original format with optimization
        if (metadata.format === 'jpeg' || metadata.format === 'jpg') {
          image = image.jpeg({ quality: config.quality || 85 });
        } else if (metadata.format === 'png') {
          image = image.png({ compressionLevel: 9 });
        } else {
          image = image.webp({ quality: config.quality || 85 });
        }
    }

    // Apply additional optimizations
    if (config.format !== 'png') {
      image = image.sharpen();
    }

    const processedBuffer = await image.toBuffer();
    
    return {
      buffer: processedBuffer,
      format: config.format || metadata.format,
      width: config.width || metadata.width,
      height: config.height || metadata.height,
      size: processedBuffer.length,
      originalSize: buffer.length
    };
  } catch (error) {
    console.error('Image processing error:', error);
    throw new Error(`Image processing failed: ${error.message}`);
  }
}

// Generate multiple sizes for an image
export async function generateImageSizes(buffer, sizes = ['thumbnail', 'medium', 'large']) {
  const results = {};

  for (const size of sizes) {
    const config = IMAGE_CONFIGS[size.toUpperCase()];
    if (config) {
      try {
        results[size] = await processImage(buffer, config);
      } catch (error) {
        console.error(`Error generating ${size} size:`, error);
      }
    }
  }

  return results;
}

// Extract dominant color from image
export async function getDominantColor(buffer) {
  try {
    const { dominant } = await sharp(buffer)
      .resize(20, 20)
      .raw()
      .toBuffer({ resolveWithObject: true })
      .then(({ data, info }) => {
        const pixels = [];
        for (let i = 0; i < data.length; i += info.channels) {
          pixels.push([data[i], data[i + 1], data[i + 2]]);
        }
        
        // Simple dominant color calculation
        const colorCounts = {};
        pixels.forEach(pixel => {
          const key = pixel.join(',');
          colorCounts[key] = (colorCounts[key] || 0) + 1;
        });
        
        const dominantKey = Object.keys(colorCounts).reduce((a, b) => 
          colorCounts[a] > colorCounts[b] ? a : b
        );
        
        return { dominant: dominantKey.split(',').map(Number) };
      });

    // Convert to hex
    const hex = dominant
      .map(c => c.toString(16).padStart(2, '0'))
      .join('');
    
    return `#${hex}`;
  } catch (error) {
    console.error('Dominant color extraction error:', error);
    return null;
  }
}

// Validate image
export async function validateImage(buffer) {
  try {
    const image = sharp(buffer);
    const metadata = await image.metadata();

    if (!metadata.width || !metadata.height) {
      throw new Error('Invalid image dimensions');
    }

    if (metadata.width > 5000 || metadata.height > 5000) {
      throw new Error('Image dimensions too large');
    }

    if (metadata.size > 10 * 1024 * 1024) {
      throw new Error('Image size exceeds 10MB limit');
    }

    return {
      width: metadata.width,
      height: metadata.height,
      format: metadata.format,
      size: buffer.length,
      hasAlpha: metadata.hasAlpha || false,
      isAnimated: metadata.pages > 1 || false
    };
  } catch (error) {
    throw new Error(`Image validation failed: ${error.message}`);
  }
}