const { parentPort, workerData } = require('worker_threads');
const ffmpeg = require('fluent-ffmpeg');
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

const { image, audioList, name } = workerData;

async function createVideo(image, audioList, name) {
    const slugText = slugify(name);
    const output = path.join('video_files', `${slugText}.mp4`);

    console.log({
        image, audioList, name, output
    })

    const ffmpegCommand = ffmpeg();
    ffmpegCommand.input(image).loop(1).inputFormat('image2');

    // Tính toán delay của từng audio
    let filterComplex = '';
    let inputs = '';
    let delay = 0;
    const delays = await Promise.all(audioList.map(audio => getAudioDuration(audio)));

    audioList.forEach((audio, index) => {
        ffmpegCommand.input(audio);
        inputs += `[${index + 1}:a]adelay=${delay}|${delay}[a${index}];`;
        delay += 3000 + delays[index];
    });

    // Ghép tất cả âm thanh vào với khoảng nghỉ 3s giữa các đoạn
    filterComplex = `${inputs}${audioList.map((_, i) => `[a${i}]`).join('')}concat=n=${audioList.length}:v=0:a=1[aout]`;

    ffmpeg()
        .input(image)
        .loop(audioDuration)
        .input(audioFile)
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
            console.log("🚀 ~ .on ~ progress:", progress)
            console.log(`Processing: ${progress.percent}% done`);
        })
        .on('error', (err) => {
            console.error('Lỗi:', err.message);
        })
        .on('end', () => {
            console.log('Tạo video hoàn tất!');
        })
        .save(outputFile);

    return new Promise((resolve, reject) => {
        ffmpegCommand
            .complexFilter(filterComplex)
            .output(output)
            .videoCodec('libx264')
            .audioCodec('aac')
            .format('mp4')
            .on('end', () => {
                parentPort.postMessage(`✅ Video tạo xong: ${output}`);
                resolve();
            })
            .on('error', (err) => {
                parentPort.postMessage(`❌ Lỗi khi tạo video ${output}: ${err.message}`);
                reject(err);
            })
            .run();
    });
}

// Hàm lấy thời gian của file âm thanh
function getAudioDuration(filePath) {
    return new Promise((resolve, reject) => {
        ffmpeg.ffprobe(filePath, (err, metadata) => {
            if (err) return reject(err);
            resolve(metadata.format.duration * 1000); // Convert to ms
        });
    });
}

createVideo(image, audioList, name).catch(console.log);
