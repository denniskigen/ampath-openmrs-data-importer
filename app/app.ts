import loadPatientData from './load-patient-data';
import ConnectionManager from './connection-manager';
const cm = ConnectionManager.getInstance();

console.log('Starting application..');

async function start() {
    const con = await cm.getConnectionKenyaemr();
    const patient = await loadPatientData(3067,con);
    console.log('patient', patient);
}

start();