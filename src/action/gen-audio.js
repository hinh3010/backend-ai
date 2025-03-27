const fs = require('fs');
const path = require('path');
const { slugify } = require('../helper/slugify');
const Bluebird = require('bluebird');
const { toTTS } = require('../helper/tts');
const { mergeAudioFiles } = require('../helper/merge_mp3');

// eslint-disable-next-line no-undef
const audioDir = path.join(__dirname, '../../files/audio_files');
// eslint-disable-next-line no-undef
const libDir = path.join(__dirname, '../../files/lib');
// eslint-disable-next-line no-undef
const jsonDir = path.join(__dirname, '../../files/json_files');

const handler = async (fileNames) => {
    await Bluebird.mapSeries(fileNames, async fileName => {
        const jsonFileName = `${slugify(fileName)}.json`;
        const jsonFilePath = path.join(jsonDir, jsonFileName);
        const data = require(jsonFilePath);

        await Bluebird.mapSeries(data, async item => {
            const { english, vietnamese } = item

            const mp3Files = await Promise.all([
                toTTS(english, 'en'),
                toTTS(vietnamese, 'vi'),
            ]);

            const mergedAudioFile = path.join(audioDir, `${slugify(english)}_merge.mp3`);

            await mergeAudioFiles({
                inputFiles: mp3Files,
                outputFile: mergedAudioFile,
                silenceFile: path.join(libDir, 'silence_3s.mp3')
            });


            if (!fs.existsSync(mergedAudioFile)) {
                throw new Error(`Merged audio file does not exist: ${mergedAudioFile}`);
            }

            mp3Files.forEach(file => {
                if (fs.existsSync(file)) {
                    fs.unlinkSync(file);
                }
            });

            console.log(`Merged audio file: ${mergedAudioFile}`);
            throw new Error(`Merged audio file: ${mergedAudioFile}`);
        })
    })

    console.log(`[Successfully]`)
}

handler(['Do you want to'])