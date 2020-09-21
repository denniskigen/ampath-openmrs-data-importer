import ConnectionManager from '../connection-manager';
import savePatientData, { savePatient } from './save-new-patient';
import loadPatientData, { loadPatientDataByUuid } from './load-patient-data';
import saveVisitData from '../visits/save-visit-data';
import { InsertedMap } from '../inserted-map';
const CM = ConnectionManager.getInstance();

export default async function transferPatientToAmrs(personId: number) {
    const kenyaEmrCon = await CM.getConnectionKenyaemr();
    const patient = await loadPatientData(personId, kenyaEmrCon);

    let amrsCon = await CM.getConnectionAmrs();
    amrsCon = await CM.startTransaction(amrsCon);
    try {
        await savePatientData(patient, amrsCon);
        let saved = await loadPatientDataByUuid(patient.person.uuid, amrsCon);

        await savePatient(patient, saved.person.person_id, amrsCon)
        let insertMap: InsertedMap = {
            patient: saved.person.person_id,
            visits: {},
            encounters: {}
        };
        await saveVisitData(patient, insertMap, kenyaEmrCon, amrsCon);
        saved = await loadPatientDataByUuid(patient.person.uuid, amrsCon);

        console.log('saved patient', saved);
        await CM.rollbackTransaction(amrsCon);
        const rollBack = await loadPatientDataByUuid(patient.person.uuid, amrsCon);
        console.log('rollback patient', rollBack);
    } catch (er) {
        console.error('Error saving patient:', er);
        await CM.rollbackTransaction(amrsCon);
    }

}