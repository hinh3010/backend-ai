const ffmpeg = require('fluent-ffmpeg');
const path = require('path');

// Đường dẫn đến các file MP3
const inputFiles = [
    path.join(__dirname, 'audio_files/bn-c-mun-n-chi-khng.mp3'),
    path.join(__dirname, 'audio_files/do-you-want-to-come-over.mp3'),
    path.join(__dirname, 'audio_files/do-you-want-to.mp3')
];

// File đầu ra
const outputFile = 'output.mp3';

// Hàm để thêm silence (khoảng lặng) 2 giây
function addSilence() {
    return new Promise((resolve) => {
        ffmpeg()
            .input('anullsrc=r=44100:cl=stereo') // Tạo nguồn âm thanh lặng
            .inputFormat('lavfi')
            .duration(2) // 2 giây
            .format('mp3')
            .on('end', resolve)
            .save('silence.mp3');
    });
}

// Hàm merge files
async function mergeAudioFiles() {
    try {
        // Tạo file silence trước
        await addSilence();

        // Tạo command ffmpeg
        const command = ffmpeg();

        // Thêm từng file input và silence xen kẽ
        inputFiles.forEach((file, index) => {
            command.input(file);
            // Thêm silence sau mỗi file trừ file cuối cùng
            if (index < inputFiles.length - 1) {
                command.input('silence.mp3');
            }
        });

        // Merge các file
        command
            .complexFilter([
                {
                    filter: 'concat',
                    options: {
                        n: inputFiles.length * 2 - 1, // Số segment (file + silence)
                        v: 0, // Không có video
                        a: 1  // Có audio
                    },
                    outputs: 'output'
                }
            ])
            .outputOptions('-map', '[output]')
            .on('start', () => {
                console.log('Bắt đầu merge files...');
            })
            .on('progress', (progress) => {
                console.log(`Processing: ${progress.percent}% done`);
            })
            .on('error', (err) => {
                console.error('Lỗi:', err.message);
            })
            .on('end', () => {
                console.log('Merge hoàn tất!');
                // Xóa file silence tạm thời
                require('fs').unlinkSync('silence.mp3');
            })
            .save(outputFile);

    } catch (error) {
        console.error('Lỗi:', error);
    }
}

// Chạy hàm
mergeAudioFiles();