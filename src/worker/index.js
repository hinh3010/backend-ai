const { workerData, parentPort } = require('worker_threads');
const ffmpeg = require('fluent-ffmpeg');
const fs = require('fs');
const path = require('path');
const { toTTS } = require('../helper/tts');
const { mergeAudioFiles } = require('../helper/merge_mp3');
const { slugify } = require('../helper/slugify');

async function processItem(data) {
    const { item, audioDir, imageDir, videoDir, libDir } = data;
    console.log({ audioDir, imageDir, videoDir, libDir })
    const { english, vietnamese, subject, thumbnail } = item;

    try {
        parentPort.postMessage(`⏳ Đang tạo file âm thanh cho "${english}"...`);
        const [subjectFile, englishFile, vietnameseFile] = await Promise.all([
            toTTS(subject, 'en'),
            toTTS(english, 'en'),
            toTTS(vietnamese, 'vi'),
        ]);

        parentPort.postMessage(`⏳ Đang ghép file âm thanh cho "${english}"...`);
        const mergedAudioFile = path.join(audioDir, `${slugify(english)}_merge.mp3`);
        await mergeAudioFiles({
            inputFiles: [subjectFile, englishFile, vietnameseFile],
            outputFile: mergedAudioFile,
            silenceFile: path.join(libDir, 'silence.mp3')
        });

        if (!fs.existsSync(mergedAudioFile)) {
            throw new Error(`File âm thanh đã merge không tồn tại: ${mergedAudioFile}`);
        }

        parentPort.postMessage(`⏳ Đang tạo video cho "${english}"...`);
        const imageFile = path.join(imageDir, thumbnail);
        const outputFile = path.join(videoDir, `${slugify(english)}_merge.mp4`);

        await createVideoFromImageAndAudio(imageFile, mergedAudioFile, outputFile);

        parentPort.postMessage(`✅ Đã hoàn thành xử lý cho "${english}"`);
        return { success: true, english };
    } catch (error) {
        parentPort.postMessage(`❌ Lỗi khi xử lý "${english}": ${error.message}`);
        return { success: false, english, error: error.message };
    }
}

function createVideoFromImageAndAudio(imageFile, audioFile, outputFile) {
    return new Promise((resolve, reject) => {
        ffmpeg()
            .input(imageFile)
            .inputOptions(['-loop', '1'])
            .input(audioFile)
            .outputOptions([
                '-c:v', 'libx264',
                '-tune', 'stillimage',
                '-c:a', 'aac',
                '-b:a', '192k',
                '-pix_fmt', 'yuv420p',
                '-shortest'
            ])
            .output(outputFile)
            .on('progress', (progress) => {
                console.log(`Processing: ${progress.frames} frames`);
            })
            .on('error', (err) => {
                reject(new Error(`FFmpeg lỗi: ${err.message}`));
            })
            .on('end', () => {
                parentPort.postMessage(`✅ Đã tạo video: ${outputFile}`);
                resolve();
            })
            .run();
    });
}

processItem(workerData)
    .then(result => {
        parentPort.postMessage({ type: 'result', result });
    })
    .catch(error => {
        parentPort.postMessage({ type: 'error', error: error.message });
    })