import ConnectionManager from './connection-manager';
import savePatientData from './save-new-patient';
import loadPatientData, { loadPatientDataByUuid } from './load-patient-data';
const CM = ConnectionManager.getInstance();

export default async function transferPatientToAmrs(personId: number) {
    const kenyaEmrCon = await CM.getConnectionKenyaemr();
    const patient = await loadPatientData(personId, kenyaEmrCon);
    console.log('patient', patient);
    let amrsCon = await CM.getConnectionAmrs();
    amrsCon = await CM.startTransaction(amrsCon);
    await savePatientData(patient, amrsCon);
    const saved = await loadPatientDataByUuid(patient.person.uuid, amrsCon);
    console.log('saved patient', saved);
    await CM.rollbackTransaction(amrsCon);
    const rollBack = await loadPatientDataByUuid(patient.person.uuid, amrsCon);
    console.log('rollback patient', rollBack);
}