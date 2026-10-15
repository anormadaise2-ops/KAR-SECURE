const extract = require("extract-zip");

async function main() {
    console.log("Archive :", process.env.ELECTRON_TEST_ZIP);
    console.log("Destination :", process.env.ELECTRON_TEST_OUT);

    await extract(process.env.ELECTRON_TEST_ZIP, {
        dir: process.env.ELECTRON_TEST_OUT
    });

    console.log("Extraction terminee.");
}

main().catch(error => {
    console.error("ERREUR EXTRACTION :", error);
    process.exitCode = 1;
});
