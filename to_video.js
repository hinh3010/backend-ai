const ffmpeg = require('fluent-ffmpeg');
const path = require('path');

// Đường dẫn đến file ảnh và file âm thanh
const imageFile = path.join(__dirname, 'image_files/1.png');
const audioFile = path.join(__dirname, 'output.mp3')
const outputFile = path.join(__dirname, 'output.mp4');

// Hàm lấy thời lượng file âm thanh
function getAudioDuration(audioPath) {
    return new Promise((resolve, reject) => {
        ffmpeg.ffprobe(audioPath, (err, metadata) => {
            if (err) return reject(err);
            resolve(metadata.format.duration);
        });
    });
}


// Hàm tạo video từ ảnh và âm thanh
async function createVideoFromImageAndAudio() {
    const audioDuration = await getAudioDuration(audioFile);
    console.log(`Thời lượng file âm thanh: ${audioDuration} giây`);

    ffmpeg()
        .input(imageFile)
        .loop(Math.ceil(audioDuration))
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
            console.log(`Processing: ${progress.currentFps}% done`);
        })
        .on('error', (err) => {
            console.error('Lỗi:', err.message);
        })
        .on('end', () => {
            console.log('Tạo video hoàn tất!');
        })
        .save(outputFile);
}

// Chạy hàm
createVideoFromImageAndAudio();
