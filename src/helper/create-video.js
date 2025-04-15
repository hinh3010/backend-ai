// const Ffmpeg = require("fluent-ffmpeg");

// function createVideoFromImageAndAudio({ imageFile, audioFile, outputFile }) {
//     return new Promise((resolve, reject) => {
//         Ffmpeg()
//             .input(imageFile)
//             .inputOptions(['-loop', '1'])
//             .input(audioFile)
//             .outputOptions([
//                 '-c:v', 'libx264',
//                 '-tune', 'stillimage',
//                 '-c:a', 'aac',
//                 '-b:a', '192k',
//                 '-pix_fmt', 'yuv420p',
//                 '-shortest'
//             ])
//             .output(outputFile)
//             .on('progress', (progress) => {
//                 console.log(`Processing: ${progress.frames} frames`);
//             })
//             .on('error', (err) => {
//                 reject(new Error(`FFmpeg error: ${err.message}`));
//             })
//             .on('end', () => {
//                 resolve();
//             })
//             .run();
//     });
// }

// module.exports = {
//     createVideoFromImageAndAudio
// }

const Ffmpeg = require("fluent-ffmpeg");
const util = require("util");

// Convert ffprobe to promise-based function
const ffprobeAsync = util.promisify((file, cb) => Ffmpeg.ffprobe(file, cb));

async function createVideoFromImageAndAudio({ imageFile, audioFile, outputFile }) {
    // Get metadata to determine audio duration
    const metadata = await ffprobeAsync(audioFile);

    // Get duration and round up to the nearest second
    const duration = Math.ceil(metadata.format.duration);
    console.log(`Detected audio duration: ${metadata.format.duration} seconds, rounded up to: ${duration} seconds`);
    console.log({
        imageFile, audioFile, outputFile
    })

    // Create the video with the exact duration
    return new Promise((resolve, reject) => {
        Ffmpeg()
            .input(imageFile)
            .inputOptions(['-loop', '1'])
            .input(audioFile)
            .outputOptions([
                '-c:v', 'libx264',
                '-tune', 'stillimage',
                '-c:a', 'aac',
                '-b:a', '192k',
                '-pix_fmt', 'yuv420p',
                '-t', duration.toString()  // Set the rounded up duration
            ])
            .output(outputFile)
            .on('progress', (progress) => {
                console.log(`Processing: ${progress.frames} frames`);
            })
            .on('error', (err) => {
                reject(new Error(`FFmpeg error: ${err.message}`));
            })
            .on('end', () => {
                resolve();
            })
            .run();
    });
}

module.exports = {
    createVideoFromImageAndAudio
}