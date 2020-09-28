import transferPatientToAmrs from "./patients/copy-over-patient";

console.log('Starting application..');

async function start() {
    await transferPatientToAmrs(4435);
    // await transferPatientToAmrs(3066);
    // await transferPatientToAmrs(22);
}

start();