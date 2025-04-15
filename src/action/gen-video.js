const { slugify } = require('../helper/slugify');
const path = require('path');
const fs = require('fs');
const Bluebird = require('bluebird');
const { ensureDirectoryExists } = require('../helper/file');
const { createVideoFromImageAndAudio } = require('../helper/create-video');

// eslint-disable-next-line no-undef
const jsonDir = path.join(__dirname, '../../files/json_files');


const handler = async (fileNames) => {
    console.log({adu: true})
    // eslint-disable-next-line no-undef
    const videoDir = path.join(__dirname, '../../files/video_files');

    await Bluebird.mapSeries(fileNames, async (fileName) => {
        const slugifyFileName = `${slugify(fileName)}.json`;
        const jsonFilePath = path.join(jsonDir, slugifyFileName);

        if (!fs.existsSync(jsonFilePath)) {
            console.log(`JSON file not found: ${jsonFilePath}`);
            return;
        }

        // Load JSON data that now includes audio paths from handler function
        const jsonData = require(jsonFilePath);
        if (!Array.isArray(jsonData) || !jsonData.length) {
            console.log(`Error processing file: ${fileName} (invalid data)`);
            return;
        }

        // Create directory for videos
        const fileFilePath = path.join(videoDir, slugify(fileName));
        ensureDirectoryExists(fileFilePath);

        // Process each item to create videos
        const updatedJsonData = await Bluebird.mapSeries(jsonData, async (item) => {
            const { english, audio: audioFile, thumbnail: imageFile, error } = item;

            if (error) {
                console.log(`[GEN_VIDEO] Skipping video creation for "${english}" due to previous error`);
                return item
            }

            // Skip if audio doesn't exist or if there was an error
            if (!audioFile || !imageFile) {
                console.log(`[GEN_VIDEO] Skipping video creation for "${english}" due to missing audio or missing thumbnail`);
                return {
                    ...item,
                    error: `[GEN_AUDIO] missing audio or missing thumbnail`
                }
            }

            try {
                if (!fs.existsSync(audioFile)) {
                    throw new Error(`Audio file not found: ${audioFile}`);
                }

                if (!fs.existsSync(imageFile)) {
                    throw new Error(`Thumbnail file not found: ${imageFile}`);
                }

                const outputFile = path.join(fileFilePath, `${slugify(english)}.mp4`);

                if (fs.existsSync(outputFile)) {
                    fs.unlinkSync(outputFile);
                }

                // Generate video by combining image and audio
                await createVideoFromImageAndAudio({
                    audioFile,
                    imageFile,
                    outputFile
                });

                return {
                    ...item,
                    video: outputFile
                };
            } catch (error) {
                return {
                    ...item,
                    error: `[GEN_AUDIO] ${error.message}`
                };
            }
        });

        // Save updated JSON data with video paths
        await fs.promises.writeFile(
            jsonFilePath,
            JSON.stringify(updatedJsonData, null, 4),
            'utf-8'
        );
    });

    console.log(`[Video Generation Completed Successfully]`);
    // eslint-disable-next-line no-undef
    process.exit(1)
};

// Example usage
handler(['Do you want to']).catch(console.log);