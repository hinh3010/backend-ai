const fs = require('fs');
const path = require('path');
const { slugify } = require('../helper/slugify');
const Bluebird = require('bluebird');
const { toTTSWithGG } = require('../helper/tts');
const { mergeAudioFiles } = require('../helper/merge_mp3');
const _ = require('lodash');
const { ensureDirectoryExists } = require('../helper/file');

// eslint-disable-next-line no-undef
const audioDir = path.join(__dirname, '../../files/audio_files');
// eslint-disable-next-line no-undef
const jsonDir = path.join(__dirname, '../../files/json_files');

const appendAudioFiles = async (fileName, fileData) => {
    const fileFilePath = path.join(audioDir, slugify(fileName));

    ensureDirectoryExists(fileFilePath);

    return await Bluebird.mapSeries(fileData, async (item) => {
        const { english, vietnamese, id } = item;
        console.log(`[GEN_AUDIO] id: ${id}`)

        const mp3Files = await generateTTSFiles({ english, vietnamese });

        try {
            const mergedAudioFile = path.join(fileFilePath, `${slugify(english)}_merge.mp3`);
            await mergeAudioFiles({
                inputFiles: mp3Files,
                outputFile: mergedAudioFile,
            });

            if (!fs.existsSync(mergedAudioFile)) {
                throw new Error(`Merged audio file does not exist: ${mergedAudioFile}`);
            }
            console.log(`[GEN_AUDIO] Merged audio file: ${mergedAudioFile}`);

            return {
                ...item,
                audio: mergedAudioFile
            }
        } catch (error) {
            return {
                ...item,
                error: `[GEN_AUDIO] ${error.message}`
            }
        } finally {
            cleanupFiles(mp3Files);
        }
    });
};

// const generateTTSFiles = async ({ english, vietnamese }) => {
//     const outputFolder = path.join(fileFilePath, `${slugify(english)}`);
//     const voices = [
//         { name: "en-US-ChristopherNeural", rate: "+0%", suffix: "en_male_normal", text: english },
//         { name: "en-US-MichelleNeural", rate: "+0%", suffix: "en_female_normal", text: english },
//         { name: "vi-VN-HoaiMyNeural", rate: "+0%", suffix: "vn_female_normal", text: vietnamese },
//     ];

//     const result = await Bluebird.mapSeries(voices, async voice => toTTSWithMsEdge(voice, outputFolder));
//     console.log("🚀 ~ generateTTSFiles ~ result:", result)
//     return result
// };

const generateTTSFiles = async ({ english, vietnamese }) => {
    return Promise.all([
        toTTSWithGG({ text: english, lang: 'en' }),
        toTTSWithGG({ text: vietnamese, lang: 'vi' })
    ]);
};

const cleanupFiles = (files) => {
    _.forEach(files, (file) => {
        if (fs.existsSync(file)) {
            fs.unlinkSync(file);
        }
    });
};

const handler = async (fileNames) => {
    await Bluebird.mapSeries(fileNames, async (fileName) => {
        const slugifyFileName = `${slugify(fileName)}.json`;
        const jsonFilePath = path.join(jsonDir, slugifyFileName);

        if (!fs.existsSync(jsonFilePath)) {
            console.log(`JSON file not found: ${jsonFilePath}`);
            return;
        }

        const jsonData = require(jsonFilePath);
        if (!Array.isArray(jsonData) || !jsonData.length) {
            console.log(`Error processing file: ${fileName} (invalid data)`);
            return;
        }

        const newJsonData = await appendAudioFiles(fileName, jsonData);

        await fs.promises.writeFile(
            jsonFilePath,
            JSON.stringify(newJsonData, null, 4),
            'utf-8'
        );
    });

    console.log(`[Successfully]`);
};

handler(['Do you want to']);
