const gTTS = require('gtts');
const fs = require('fs').promises;
const path = require('path');

function slugify(text) {
    return text
        .toString()
        .toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/[^\w\-]+/g, '')
        .replace(/\-\-+/g, '-')
        .trim();
}

exports.toTTS = async (text, lang = 'en') => {
    const dir = path.join(__dirname, 'audio_files');

    try {
        await fs.mkdir(dir, { recursive: true });

        const slugifiedText = slugify(text);
        const uniqueFileName = `${slugifiedText}.mp3`;
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
