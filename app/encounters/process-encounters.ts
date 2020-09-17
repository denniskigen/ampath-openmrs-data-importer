import transferEncounterToAmrs from "./copy-over-encounter";


console.log('Starting application..');

async function start() {
    await transferEncounterToAmrs(3067)
}

start();