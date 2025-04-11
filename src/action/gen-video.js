const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);

// Function to generate video from image and audio
const generateVideo = async (imagePath, audioPath, outputPath) => {
    try {
        // Command to combine image and audio into a video using ffmpeg
        const command = `ffmpeg -loop 1 -i "${imagePath}" -i "${audioPath}" -c:v libx264 -tune stillimage -c:a aac -b:a 192k -pix_fmt yuv420p -shortest "${outputPath}"`;

        await execPromise(command);
        console.log(`Video created successfully: ${outputPath}`);
        return outputPath;
    } catch (error) {
        console.error(`Error generating video: ${error.message}`);
        throw error;
    }
};

// Main handler2 function
const handler2 = async (fileNames) => {
    // Assuming images are stored in a directory structure similar to audio
    // eslint-disable-next-line no-undef
    const imageDir = path.join(__dirname, '../../files/image_files');
    // eslint-disable-next-line no-undef
    const videoDir = path.join(__dirname, '../../files/video_files');

    ensureDirectoryExists(videoDir);

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
            const { english, audio, image } = item;

            // Skip if audio doesn't exist or if there was an error
            if (!audio || item.error) {
                console.log(`Skipping video creation for "${english}" due to missing audio or previous error`);
                return item;
            }

            try {
                // Construct image path (assuming similar structure to audio)
                // You might need to adjust this based on your actual image storage structure
                const imagePath = image || path.join(imageDir, slugify(fileName), `${slugify(english)}.jpg`);

                if (!fs.existsSync(imagePath)) {
                    throw new Error(`Image file not found: ${imagePath}`);
                }

                // Create output path for video
                const videoOutputPath = path.join(fileFilePath, `${slugify(english)}.mp4`);

                // Generate video by combining image and audio
                await generateVideo(imagePath, audio, videoOutputPath);

                return {
                    ...item,
                    video: videoOutputPath
                };
            } catch (error) {
                return {
                    ...item,
                    error: item.error ? `${item.error}, [VIDEO] ${error.message}` : `[VIDEO] ${error.message}`
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
};

// Example usage
// handler2(['Do you want to']);