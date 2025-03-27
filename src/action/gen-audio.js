const fs = require('fs');
const path = require('path');
const { slugify } = require('../helper/slugify');
const Bluebird = require('bluebird');
const { toTTSAdvanced } = require('../helper/tts');
const { mergeAudioFiles } = require('../helper/merge_mp3');
const _ = require('lodash');

// eslint-disable-next-line no-undef
const audioDir = path.join(__dirname, '../../files/audio_files');
// eslint-disable-next-line no-undef
const libDir = path.join(__dirname, '../../files/lib');
// eslint-disable-next-line no-undef
const jsonDir = path.join(__dirname, '../../files/json_files');

const ensureDirectoryExists = (dirPath) => {
    if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
    }
};

const processAudioFiles = async (fileName, fileData) => {
    const fileFilePath = path.join(audioDir, slugify(fileName));
    ensureDirectoryExists(fileFilePath);

    await Bluebird.mapSeries(fileData, async (item) => {
        const { english, vietnamese } = item;
        const mp3Files = await generateTTSFiles(english, vietnamese);

        try {
            const mergedAudioFile = path.join(fileFilePath, `${slugify(english)}_merge.mp3`);
            await mergeAudioFiles({
                inputFiles: mp3Files,
                outputFile: mergedAudioFile,
                silenceFile: path.join(libDir, 'silence_3s.mp3')
            });

            if (!fs.existsSync(mergedAudioFile)) {
                throw new Error(`Merged audio file does not exist: ${mergedAudioFile}`);
            }
            console.log(`Merged audio file: ${mergedAudioFile}`);
        } catch (error) {
            console.log({ error: error.message });
            throw error;
        } finally {
            cleanupFiles(mp3Files);
        }
    });
};

const generateTTSFiles = async (english, vietnamese) => {
    return Promise.all([
        toTTSAdvanced({ text: english, lang: 'en' }),
        toTTSAdvanced({ text: vietnamese, lang: 'vi' })
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

        const fileData = require(jsonFilePath);
        if (!Array.isArray(fileData) || !fileData.length) {
            console.log(`Error processing file: ${fileName} (invalid data)`);
            return;
        }

        await processAudioFiles(fileName, fileData);
    });

    console.log(`[Successfully]`);
};

handler(['Do you want to']);
