const Ffmpeg = require("fluent-ffmpeg");
const fs = require('fs');
const path = require('path');

// eslint-disable-next-line no-undef
const libDir = path.join(__dirname, '../../files/lib');

function genSilence(ms = 2) {
    if (!fs.existsSync(libDir)) {
        fs.mkdirSync(libDir, { recursive: true });
        console.log(`Created directory: ${libDir}`);
    }
    const fileName = `silence_${ms}s.mp3`
    const silenceFile = path.join(libDir, fileName)
    return new Promise((resolve) => {
        if (fs.existsSync(silenceFile)) {
            console.log(`File ${fileName} đã tồn tại, không cần tạo mới.`);
            return resolve()
        }

        Ffmpeg()
            .input('anullsrc=r=44100:cl=stereo')
            .inputFormat('lavfi')
            .duration(ms) // 3s
            .format('mp3')
            .on('end', () => {
                console.log(`File ${fileName} created successfully.`);
                resolve()
            })
            .save(silenceFile);
    });
}

genSilence(1)
    .then(() => console.log('Silence generation complete'))
    .catch(err => console.error('Failed to generate silence:', err));