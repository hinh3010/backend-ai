const fs = require('fs');
const path = require('path');
const { slugify } = require('../helper/slugify');
const Bluebird = require('bluebird');

// eslint-disable-next-line no-undef
const textDir = path.join(__dirname, '../../files/txt_files');
// eslint-disable-next-line no-undef
const jsonDir = path.join(__dirname, '../../files/json_files');
// eslint-disable-next-line no-undef
const imageDir = path.join(__dirname, '../../files/image_files');

async function convertTextToJson(fileNames) {
    await Bluebird.mapSeries(fileNames, async fileName => {
        const textPath = path.join(textDir, `${slugify(fileName)}.txt`);

        fs.readFile(textPath, 'utf8', (err, data) => {
            if (err) {
                console.error(`Error reading the file ${fileName}:`, err);
                return;
            }

            const lines = data.trim().split('\n');
            const jsonResult = lines.map((line, index) => {
                const imagePath = path.join(imageDir, `${slugify(fileName)}/${index + 1}.jpg`);
                const [id, subject, english, phonetic, vietnamese] = line.split('\t');

                return {
                    id: parseInt(id),
                    english: english,
                    phonetic: phonetic,
                    vietnamese: vietnamese,
                    subject: subject,
                    thumbnail: imagePath
                };
            });

            const jsonFileName = `${slugify(fileName)}.json`;
            const jsonFilePath = path.join(jsonDir, jsonFileName);

            fs.writeFile(jsonFilePath, JSON.stringify(jsonResult, null, 4), err => {
                if (err) {
                    console.error(`Error writing the file ${jsonFileName}:`, err);
                    return;
                }
                console.log(`Data from ${fileName} has been converted and saved to ${jsonFileName}`);
            });
        });
    })

    console.log(`[Successfully]`)
}

const fileNames = ['Do you want to'];
convertTextToJson(fileNames);