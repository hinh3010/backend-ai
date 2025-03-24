const { Worker } = require('worker_threads');
const fs = require('fs');
const path = require('path');

const config = [
    {
        "english": "Do you want to come over?",
        "phonetic": "/du jə wɒnt tə kʌm ˈoʊvər/",
        "vietnamese": "Bạn có muốn đến chơi không?",
        "subject": "Do you want to",
        "thumbnail": "1.png"
    }
]

// Define directories for different file types
// eslint-disable-next-line no-undef
const audioDir = path.join(__dirname, '../../files/audio_files');
// eslint-disable-next-line no-undef
const imageDir = path.join(__dirname, '../../files/image_files');
// eslint-disable-next-line no-undef
const videoDir = path.join(__dirname, '../../files/video_files');
// eslint-disable-next-line no-undef
const libDir = path.join(__dirname, '../../files/lib');

fs.mkdirSync(audioDir, { recursive: true });
fs.mkdirSync(videoDir, { recursive: true });
fs.mkdirSync(imageDir, { recursive: true });

const MAX_WORKERS = 2;
let activeWorkers = 0;
const queue = [];

/**
 * Processes an item using a worker thread.
 * @param {Object} item - The item to be processed.
 * @param {string} item.english - The English name of the item.
 * @returns {Promise<any>} A promise that resolves when the worker finishes processing.
 */
function processItem(item) {
    return new Promise((resolve, reject) => {
        const worker = new Worker('./src/worker/gen-video.js', {
            workerData: {
                item,
                audioDir,
                imageDir,
                videoDir,
                libDir
            }
        });

        worker.on('message', (msg) => {
            if (typeof msg === 'string') {
                console.log(msg);
            } else if (msg.type === 'result') {
                resolve(msg.result);
            } else if (msg.type === 'error') {
                reject(new Error(msg.error));
            }
        });

        worker.on('error', (err) => {
            console.error(`❌ Worker encountered an error while processing "${item.english}":`, err);
            reject(err);
        });

        worker.on('exit', (code) => {
            activeWorkers--;
            if (code !== 0) {
                reject(new Error(`Worker exited with error code ${code}`));
            }
            processQueue();
        });
    });
}

/**
 * Processes the next item in the queue if there are available workers.
 */
function processQueue() {
    if (queue.length > 0 && activeWorkers < MAX_WORKERS) {
        const item = queue.shift();
        activeWorkers++;
        processItem(item)
            .then(result => {
                console.log(`✅ Successfully processed "${item.english}" | result: ${JSON.stringify(result)}`);
            })
            .catch(error => {
                console.error(`❌ Error processing "${item.english}":`, error);
            });
    }
}

/**
 * Initializes the processing of items from the configuration.
 */
(async () => {
    console.log(`🚀 Starting to process ${config.length} items...`);

    config.forEach(item => {
        queue.push(item);
    });

    for (let i = 0; i < Math.min(MAX_WORKERS, queue.length); i++) {
        processQueue();
    }
})();
