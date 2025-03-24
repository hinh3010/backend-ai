const fs = require('fs');
const path = require('path');
const { slugify } = require('../helper/slugify');

// eslint-disable-next-line no-undef
const textDir = path.join(__dirname, '../../files/txt_files');
// eslint-disable-next-line no-undef
const jsonDir = path.join(__dirname, '../../files/json_files');
// eslint-disable-next-line no-undef
const imageDir = path.join(__dirname, '../../files/image_files');

function convertTextToJson(fileNames) {
    fileNames.forEach(fileName => {
        const textPath = path.join(textDir, `${slugify(fileName)}.txt`);

        fs.readFile(textPath, 'utf8', (err, data) => {
            if (err) {
                console.error(`Error reading the file ${fileName}:`, err);
                return;
            }

            const lines = data.trim().split('\n');
            const jsonResult = lines.map(line => {
                const [id, english, phonetic, vietnamese] = line.split('\t');
                return {
                    id: parseInt(id),
                    english: english,
                    phonetic: phonetic,
                    vietnamese: vietnamese,
                    subject: fileName,
                    thumbnail: null
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
    });
}

const fileNames = ['Do you want to'];
convertTextToJson(fileNames);