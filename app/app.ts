import transferPatientToAmrs from "./patients/copy-over-patient";

console.log('Starting application..');

async function start() {
    await transferPatientToAmrs(3066)
}

start();