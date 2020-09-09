import mysql, { Connection } from "mysql";
import { Person, Patient, Address, PersonName, PersonAttribute, PatientIdentifier } from "./tables.types";
import { PatientData } from "./patient-data";
import ConnectionManager from "./connection-manager";
const CM = ConnectionManager.getInstance();

export default async function savePatientData(patient: PatientData, connection:Connection) {
    return savePerson(patient, connection);
}

export async function savePerson(patient: PatientData, connection:Connection) {
    await CM.query(toPersonInsertStatement(patient.person), connection);
}

export function toPersonInsertStatement(person: Person, replaceColumns?:any) {
    return toInsertSql(person, ['person_id'], 'person');
}

export function toInsertSql(obj:any, excludeColumns:string[], table:string) {
    let set:any = {};
    for(let o in obj) {
        if(excludeColumns.includes(o)) {
            continue;
        }
        set[o] = obj[o];
    }
    const sql = mysql.format(`INSERT INTO ${table} SET ?`,[set]);
    console.log('SQL::: ', sql);
    return sql;
}