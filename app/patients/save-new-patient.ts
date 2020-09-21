import mysql, { Connection } from "mysql";
import { Person, Patient, Address, PersonName, PersonAttribute, PatientIdentifier } from "../tables.types";
import { PatientData } from "./patient-data";
import ConnectionManager from "../connection-manager";
import UserMap from "../users/user-map";
const CM = ConnectionManager.getInstance();

export default async function savePatientData(patient: PatientData, connection:Connection) {
    await UserMap.instance.initialize();
    return savePerson(patient, connection, UserMap.instance.userMap);
}

export async function savePerson(patient: PatientData, connection:Connection, userMap?:any) {
    console.log("MApe", userMap[patient.person.creator], patient)
    let replaceColumns = {};
    if(userMap){
         replaceColumns = {
            creator: userMap[patient.person.creator],
            changed_by: userMap[patient.person.changed_by],
            voided_by: userMap[patient.person.voided_by],
        };
    }
   
    await CM.query(toPersonInsertStatement(patient.person, replaceColumns), connection);
}

export function toPersonInsertStatement(person: Person, replaceColumns?:any) {
    return toInsertSql(person, ['person_id'], 'person', replaceColumns);
}

export function toInsertSql(obj:any, excludeColumns:string[], table:string, replaceColumns?:any) {
    let set:any = {};
    for(let o in obj) {
        if(excludeColumns.includes(o)) {
            continue;
        }
        if(replaceColumns[o]) {
            set[o] = replaceColumns[o];
        } else {
            set[o] = obj[o];
        }
    }
    const sql = mysql.format(`INSERT INTO ${table} SET ?`,[set]);
    console.log('SQL::: ', sql);
    return sql;
}