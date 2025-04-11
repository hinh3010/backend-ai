const gTTS = require('gtts');
const path = require('path');
const { slugify } = require('./slugify');
const { MsEdgeTTS, OUTPUT_FORMAT } = require('msedge-tts');
const fs = require('fs');

exports.toTTSWithGG = async ({ text, lang = 'en' }) => {
    try {
        const slugText = slugify(text);
        const uniqueFileName = `${slugText}.mp3`;
        const filePath = path.join('files/draft_files', uniqueFileName);

        const speech = new gTTS(text, lang);

        await new Promise((resolve, reject) => {
            speech.save(filePath, (err) => {
                if (err) reject(err);
                else resolve();
            });
        });

        console.log('Đã tạo file âm thanh thành công:', filePath);
        return filePath;
    } catch (error) {
        console.error('Có lỗi xảy ra:', error);
        throw error;
    }
}

/**
 * Converts text to speech using Microsoft Edge TTS
 * @param {object} voice Voice parameters
 * @param {'en-US-ChristopherNeural'| 'en-US-MichelleNeural' | 'vi-VN-HoaiMyNeural' | string} voice.name Voice name
 * @param {string} voice.rate Speech rate ('default', '50%', etc.)
 * @param {string} voice.suffix File suffix
 * @param {string} voice.text Text to convert to speech
 * @param {string} outputFolder Folder to save the output file
 * @returns {Promise<string>} Path to the generated audio file
 */
exports.toTTSWithMsEdge = async (voice, outputFolder = 'files/draft_files') => {
    /*
    en-US-AriaNeural (female)
    en-US-AnaNeural (female)
    en-US-ChristopherNeural (male)
    en-US-JennyNeural (female)
    en-US-MichelleNeural (female)
    
    vi-VN-HoaiMyNeural (Giọng nữ)
    vi-VN-NamMinhNeural (Giọng nam)
    */

    const tts = new MsEdgeTTS();
    const segmentPath = path.join(outputFolder, `${voice.suffix}.mp3`);
    await tts.setMetadata(voice.name, OUTPUT_FORMAT.AUDIO_24KHZ_96KBITRATE_MONO_MP3);
    const { audioFilePath } = await tts.toFile(outputFolder, voice.text, { rate: voice.rate });

    if (audioFilePath !== segmentPath) {
        await fs.promises.rename(audioFilePath, segmentPath);
    }

    return segmentPath;
}