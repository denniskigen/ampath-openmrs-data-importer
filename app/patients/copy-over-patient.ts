import ConnectionManager from '../connection-manager';
import savePatientData, { savePatient } from './save-new-patient';
import loadPatientData, { loadPatientDataByUuid } from './load-patient-data';
import saveVisitData from '../visits/save-visit-data';
import { InsertedMap } from '../inserted-map';
import insertPatientObs from '../encounters/save-obs';
import saveProviderData, { saveProvider } from '../providers/save-provider-data';
const CM = ConnectionManager.getInstance();

export default async function transferPatientToAmrs(personId: number) {
    const kenyaEmrCon = await CM.getConnectionKenyaemr();
    const patient = await loadPatientData(personId, kenyaEmrCon);
    await CM.commitTransaction(kenyaEmrCon);
    console.log('patient', patient);
    let amrsCon = await CM.getConnectionAmrs();
    amrsCon = await CM.startTransaction(amrsCon);
    try {
        await savePatientData(patient, amrsCon);
        let saved = await loadPatientDataByUuid(patient.person.uuid, amrsCon);

        await savePatient(patient, saved.person.person_id, amrsCon)
        let insertMap: InsertedMap = {
            patient: saved.person.person_id,
            visits: {},
            encounters: {},
            obs: {}
        };
        await saveVisitData(patient, insertMap, kenyaEmrCon, amrsCon);
        await insertPatientObs(patient.obs, patient,insertMap,amrsCon);
        saved = await loadPatientDataByUuid(patient.person.uuid, amrsCon);

        // console.log('saved patient', saved);
        await saveProviderData(patient.provider,insertMap, kenyaEmrCon, amrsCon);
        saved = await loadPatientDataByUuid(patient.person.uuid, amrsCon);
        console.log('saved patient', saved);
        await CM.rollbackTransaction(amrsCon);
    } catch (er) {
        console.error('Error saving patient:', er);
        await CM.rollbackTransaction(amrsCon);
    }

}