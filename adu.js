const ffmpeg = require('fluent-ffmpeg');
const path = require('path');

const image = path.join(__dirname, 'image_file/1.png');
const audio1 = path.join(__dirname, 'audio_files/bn-c-mun-n-chi-khng.mp3');
const audio2 = path.join(__dirname, 'audio_files/do-you-want-to-come-over.mp3');
const audio3 = path.join(__dirname, 'audio_files/do-you-want-to.mp3');

const outputVideo = 'output.mp4';

const mergedAudio = 'merged_audio.mp3';
ffmpeg()
    .input(audio1)
    .input(audio2)
    .input(audio3)
    .complexFilter([
        '[0:0][1:0]amix=inputs=2:duration=longest[a1]',
        '[a1][2:0]amix=inputs=2:duration=longest[audio]'
    ])
    .outputOptions('-map [audio]')
    .save(mergedAudio)
    .on('end', () => {
        console.log('Ghép âm thanh xong, tạo video...');

        // Tạo video từ ảnh và file âm thanh đã ghép
        ffmpeg()
            .input(image)
            .loop(10) // Lặp ảnh trong 10 giây (tùy chỉnh theo thời gian âm thanh)
            .input(mergedAudio)
            .outputOptions('-c:v libx264', '-tune stillimage', '-c:a aac', '-b:a 192k', '-pix_fmt yuv420p')
            .save(outputVideo)
            .on('end', () => console.log('Video đã tạo xong!'))
            .on('error', (err) => console.error('Lỗi:', err));
    })
    .on('error', (err) => console.error('Lỗi ghép âm thanh:', err));
