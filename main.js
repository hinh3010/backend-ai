const { Worker } = require('worker_threads');
const fs = require('fs');
const path = require('path');
const { toTTS } = require('./src/tts');

const config = require('./config.json');
const { mergeAudioFiles } = require('./src/merge_mp3');
const { slugify } = require('./src/slugify');

(async () => {
    // eslint-disable-next-line no-undef
    const audioDir = path.join(__dirname, 'audio_files');
    // eslint-disable-next-line no-undef
    const imageDir = path.join(__dirname, 'image_files')
    // eslint-disable-next-line no-undef
    const videoDir = path.join(__dirname, 'video_files')

    fs.mkdirSync(audioDir, { recursive: true })
    fs.mkdirSync(videoDir, { recursive: true })
    fs.mkdirSync(imageDir, { recursive: true })
    
    for (const item of config) {
        const { english, vietnamese, subject, thumbnail } = item

        // Tạo file âm thanh
        const [subjectFile, englishFile, vietnameseFile] = await Promise.all([
            toTTS(subject, 'en'),
            toTTS(english, 'en'),
            toTTS(vietnamese, 'vi'),
        ])

        // Merge file âm thanh
        await mergeAudioFiles({
            inputFiles: [subjectFile, englishFile, vietnameseFile],
            outputFile: path.join(audioDir, `${slugify(english)}_merge.mp3`),
            silenceFile: path.join(audioDir, 'silence.mp3')
        })

        // Tạo worker thread để xử lý video
        const worker = new Worker('./worker.js', {
            workerData: { 
                imageFile: path.join(imageDir, thumbnail), 
                audioFile: path.join(audioDir, `${slugify(english)}_merge.mp3`), 
                outputFile: path.join(videoDir, `${slugify(english)}_merge.mp4`)
            }
        });

        worker.on('message', (msg) => console.log(msg));
        worker.on('error', (err) => console.error('❌ Worker lỗi:', err));
        worker.on('exit', (code) => {
            if (code !== 0) console.error(`⚠️ Worker dừng với mã lỗi ${code}`);
        });
    }
})()
