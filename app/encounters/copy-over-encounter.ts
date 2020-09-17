import ConnectionManager from '../connection-manager';
import loadencounters, { fetchEncounterType, fetchEncounterTypeByUuid } from './load-encounters';

const CM = ConnectionManager.getInstance();

export default async function transferEncounterToAmrs(personId: number) {
    const locationId= ""; //Kapenguria location id
    const kenyaEmrCon = await CM.getConnectionKenyaemr();
    const encounter = await loadencounters(personId, kenyaEmrCon);
    console.log('encounter', encounter);
    let amrsCon = await CM.getConnectionAmrs();
    const encounterType = await fetchEncounterType(encounter.encounters[0].encounter_type, kenyaEmrCon);
    const amrsEncounterType = await fetchEncounterTypeByUuid(encounterType, amrsCon)
    console.log("the encounter type is", amrsEncounterType);
}