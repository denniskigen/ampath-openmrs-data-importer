import { Connection } from "mysql";
import ConnectionManager from "../connection-manager";
import { fetchPatient } from "../patients/load-patient-data";
import { Encounter } from "../tables.types";
const CM = ConnectionManager.getInstance();
export default async function loadencounters(patientId: number, connection:Connection){
    
const encounter = await fetchEncounter(patientId, connection);
//const encounterType = await fetchEncounter(patientId, connection);
const encounterData = {
    encounters:encounter
}

return encounterData;
}
export async function fetchEncounterTypeByUuid(uuid: string, connection: Connection) {
    const sql = `select encounter_type_id from encounter_type where uuid= '${uuid}'`;
    let results:string = await CM.query(sql, connection);
    console.log('encounters type with uuid', results);
    return  results;
}
export async function fetchEncounter(patientId: number, connection: Connection) {
    const sql = `select * from encounter where patient_id= '${patientId}'`;
    let results:Encounter[] = await CM.query(sql, connection);
    console.log('encounters with uuid', results);
    return  results;
}
export async function fetchEncounterType(encounterTypeId: number, connection: Connection) {
    const sql = `select uuid from encounter_type where encounter_type_id= '${encounterTypeId}'`;
    let results:any = await CM.query(sql, connection);
    console.log('encounter Type with id', results);
    return  results;
}