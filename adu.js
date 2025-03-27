const { default: axios } = require("axios");

const API_URL = 'http://localhost:13000/products/products-v2.json/?search=hawaii';
const TOTAL_REQUESTS = 1000;
const DURATION_SECONDS = 60;
const MAX_CONCURRENT_REQUESTS = 20;


async function sendRequest(index) {
    console.log(`#${index}`)
    setTimeout(async () => {
        const startTime = Date.now();
        try {
            const response = await axios.get(API_URL);
            console.log(`#${index} ✅ Success | Status: ${response.status} | Time: ${Date.now() - startTime}ms`);
        } catch (error) {
            console.error(`#${index} ❌ Failed | Error: ${error.message}`);
        }
    }, 0);
}

async function runRequests() {
    const startTime = new Date().toISOString(); // Lấy thời gian bắt đầu

    const interval = (DURATION_SECONDS * 1000) / TOTAL_REQUESTS;
    const pLimit = (await import("p-limit")).default;
    const limit = pLimit(MAX_CONCURRENT_REQUESTS); 

    const requests = Array.from({ length: TOTAL_REQUESTS }, (_, i) =>
        new Promise(resolve => setTimeout(() => resolve(limit(() => sendRequest(i + 1))), i * interval))
    );

    await Promise.all(requests);
    const endTime = new Date().toISOString(); // Lấy thời gian kết thúc

    console.log(`🕒 Start Time: ${startTime}`);
    console.log(`🕒 End Time: ${endTime}`);
    console.log('✅ All requests completed!');
}

runRequests();
