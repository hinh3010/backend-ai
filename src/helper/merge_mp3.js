const ffmpeg = require('fluent-ffmpeg');
const fs = require('fs');

function addSilence(silenceFile) {
    return new Promise((resolve) => {
        if (fs.existsSync(silenceFile)) {
            console.log('File silence đã tồn tại, không cần tạo mới.');
            return resolve()
        }
        ffmpeg()
            .input('anullsrc=r=44100:cl=stereo') // Tạo nguồn âm thanh lặng
            .inputFormat('lavfi')
            .duration(3) // 3s
            .format('mp3')
            .on('end', resolve)
            .save(silenceFile);
    });
}

// Merge files
exports.mergeAudioFiles = async ({ inputFiles, outputFile, silenceFile }) => {
    // Tạo file silence trước
    await addSilence(silenceFile);

    return new Promise((resolve, reject) => {
        // Tạo command ffmpeg
        const command = ffmpeg();

        // Thêm từng file input và silence xen kẽ
        inputFiles.forEach((file, index) => {
            command.input(file);
            // Thêm silence sau mỗi file trừ file cuối cùng
            if (index < inputFiles.length - 1) {
                command.input(silenceFile);
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
                reject(err);
            })
            .on('end', () => {
                console.log('Merge hoàn tất!');
                resolve(outputFile);
            })
            .save(outputFile);
    });
}
