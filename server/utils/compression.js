const sharp = require('sharp');
const ffmpeg = require('fluent-ffmpeg');
const ffmpegStatic = require('ffmpeg-static');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// Set ffmpeg path
ffmpeg.setFfmpegPath(ffmpegStatic);

/**
 * Compresses base64 encoded media depending on its type
 * @param {String} base64Data - The original base64 payload
 * @param {String} mediaType - 'image' or 'audio'
 * @returns {Promise<String>} - The compressed base64 payload
 */
async function compressMediaPayload(base64Data, mediaType) {
  try {
    if (!base64Data) return base64Data;

    // Extract the pure base64 data (remove data:image/png;base64, etc.)
    const matches = base64Data.match(/^data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+);base64,(.+)$/);
    if (!matches || matches.length !== 3) return base64Data;

    const mimeType = matches[1];
    const base64String = matches[2];
    const buffer = Buffer.from(base64String, 'base64');

    if (mediaType === 'image') {
      // Compress Image using sharp
      const compressedBuffer = await sharp(buffer)
        .resize({ width: 1280, withoutEnlargement: true }) // Downscale if too large
        .webp({ quality: 80 }) // Convert to webp with 80% quality
        .toBuffer();
        
      return `data:image/webp;base64,${compressedBuffer.toString('base64')}`;

    } else if (mediaType === 'audio') {
      // Compress Audio using ffmpeg
      return new Promise((resolve, reject) => {
        const tempId = crypto.randomBytes(16).toString('hex');
        const tempInput = path.join(__dirname, `../temp_${tempId}.webm`);
        const tempOutput = path.join(__dirname, `../temp_${tempId}.mp3`);

        // Write temp buffer to file (ffmpeg needs file input)
        fs.writeFileSync(tempInput, buffer);

        ffmpeg(tempInput)
          .audioBitrate('32k') // Highly compressed for voice notes
          .toFormat('mp3')
          .on('end', () => {
            const compressedBuffer = fs.readFileSync(tempOutput);
            const finalBase64 = `data:audio/mp3;base64,${compressedBuffer.toString('base64')}`;
            
            // Cleanup
            fs.unlinkSync(tempInput);
            fs.unlinkSync(tempOutput);
            
            resolve(finalBase64);
          })
          .on('error', (err) => {
            console.error("FFMPEG Compression Error:", err);
            // Cleanup on error
            if (fs.existsSync(tempInput)) fs.unlinkSync(tempInput);
            if (fs.existsSync(tempOutput)) fs.unlinkSync(tempOutput);
            resolve(base64Data); // Fallback to original
          })
          .save(tempOutput);
      });
    }

    return base64Data;
  } catch (error) {
    console.error("Compression Engine Error:", error);
    return base64Data; // Return original if compression fails
  }
}

module.exports = {
  compressMediaPayload
};
