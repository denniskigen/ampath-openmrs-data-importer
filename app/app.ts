import transferPatientToAmrs from "./copy-over-patient";


console.log('Starting application..');

async function start() {
    await transferPatientToAmrs(3067)
}

start();