const gTTS = require('gtts');
const path = require('path');
const { slugify } = require('./slugify');

exports.toTTS = async (text, lang = 'en') => {
    // eslint-disable-next-line no-undef
    const dir = path.join(__dirname, '../../files/audio_files');

    try {
        const slugText = slugify(text);
        const uniqueFileName = `${slugText}.mp3`;
        const filePath = path.join(dir, uniqueFileName);

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
};

exports.toTTSAdvanced = async ({ text, lang = 'en' }) => {
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