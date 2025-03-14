const { workerData, parentPort } = require('worker_threads');
const ffmpeg = require('fluent-ffmpeg');

const { imageFile, audioFile, outputFile } = workerData;

function getAudioDuration(audioPath) {
    return new Promise((resolve, reject) => {
        ffmpeg.ffprobe(audioPath, (err, metadata) => {
            if (err) return reject(err);
            resolve(metadata.format.duration);
        });
    });
}

async function createVideo(imageFile, audioFile, outputFile) {
    console.log({ imageFile, audioFile, outputFile });

    try {
        const audioDuration = await getAudioDuration(audioFile);
        console.log(`Audio duration: ${audioDuration} seconds`);

        ffmpeg()
            .input(imageFile)                     // Input ảnh
            // .inputOptions('-loop 1')             // Lặp ảnh vô hạn
            .loop(Math.ceil(audioDuration))           // Lặp ảnh vô hạn
            .input(audioFile)                    // Input âm thanh
            .outputOptions([
                '-c:v libx264',       // Mã hóa video bằng x264
                '-tune stillimage',   // Tối ưu hóa cho ảnh tĩnh
                '-c:a aac',          // Mã hóa âm thanh AAC
                '-b:a 192k',         // Bitrate âm thanh
                '-pix_fmt yuv420p',  // Định dạng pixel phù hợp với trình phát video
                '-shortest'          // Dừng video khi âm thanh kết thúc
            ])
            .on('start', () => {
                console.log('Bắt đầu tạo video...');
            })
            .on('progress', (progress) => {
                console.log(`Processing: ${progress.frames} frames`);
            })
            .on('error', (err) => {
                console.error('Lỗi:', err.message);
                parentPort?.postMessage({ status: 'error', message: err.message });
            })
            .on('end', () => {
                console.log('Tạo video hoàn tất!');
                parentPort?.postMessage({ status: 'done', outputFile });
            })
            .save(outputFile);
    } catch (err) {
        console.error('Lỗi:', err.message);
        parentPort?.postMessage({ status: 'error', message: err.message });
    }
}

createVideo(imageFile, audioFile, outputFile);