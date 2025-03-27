const { MsEdgeTTS, OUTPUT_FORMAT } = require("msedge-tts");

(async () => {
    const tts = new MsEdgeTTS();
    await tts.setMetadata("en-US-AriaNeural", OUTPUT_FORMAT.AUDIO_24KHZ_96KBITRATE_MONO_MP3);
    const filePath = await tts.toFile("./files", "Chỉnh sửa move_database để xử lý dump file của shared DB cluster");
    console.log("🚀 ~ filePath:", filePath)
    // eslint-disable-next-line no-undef
    process.exit()
})()