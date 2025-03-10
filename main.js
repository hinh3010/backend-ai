const { Worker } = require('worker_threads');
const fs = require('fs');
const path = require('path');
const { toTTS } = require('./tts');

const config = require('./config.json')

if (!fs.existsSync('video_files')) fs.mkdirSync('video_files');


(async () => {
    for (const item of config) {
        const { english, vietnamese, pronunciation, subject, thumbnail } = item

        // Tạo file âm thanh
        const [subjectFile, englishFile, vietnameseFile, pronunciationFile] = await Promise.all([
            toTTS(subject, 'en'),
            toTTS(english, 'en'),
            toTTS(vietnamese, 'vi'),
            toTTS(pronunciation, 'en'),
        ])

        const image = path.join(__dirname, 'image_files', thumbnail)

        // Tạo worker thread để xử lý video
        const worker = new Worker('./worker.js', {
            workerData: { image, audioList: [subjectFile, englishFile, vietnameseFile, pronunciationFile], name: english }
        });

        worker.on('message', (msg) => console.log(msg));
        worker.on('error', (err) => console.error('❌ Worker lỗi:', err));
        worker.on('exit', (code) => {
            if (code !== 0) console.error(`⚠️ Worker dừng với mã lỗi ${code}`);
        });
    }
})()
