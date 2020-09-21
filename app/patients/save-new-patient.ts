import mysql, { Connection } from "mysql";
import { Person, Patient, Address, PersonName, PersonAttribute, PatientIdentifier } from "../tables.types";
import { PatientData } from "./patient-data";
import ConnectionManager from "../connection-manager";
import UserMap from "../users/user-map";
const CM = ConnectionManager.getInstance();

export default async function savePatientData(patient: PatientData, connection: Connection) {
    await UserMap.instance.initialize();
    return savePerson(patient, connection, UserMap.instance.userMap);
}

export async function savePerson(patient: PatientData, connection: Connection, userMap?: any) {
    let replaceColumns = {};
    if (userMap) {
        replaceColumns = {
            creator: userMap.find((user: { kemrUserId: number; }) => user.kemrUserId === patient.person.creator)?.amrsUserID,
            changed_by: userMap.find((user: { kemrUserId: number; }) => user.kemrUserId === patient.person.changed_by)?.amrsUserID,
            voided_by: userMap.find((user: { kemrUserId: number; }) => user.kemrUserId === patient.person.voided_by)?.amrsUserID,
        };
    }

    await CM.query(toPersonInsertStatement(patient.person, replaceColumns), connection);

}

export function toPersonInsertStatement(person: Person, replaceColumns?: any) {
    return toInsertSql(person, ['person_id'], 'person', replaceColumns);
}

export async function savePatient(patient: PatientData, personId: number, connection: Connection) {
    console.log("user person id", personId);
    const userMap = UserMap.instance.userMap;
    let replaceColumns = {};
    if (userMap) {
        replaceColumns = {
            creator: userMap.find((user: { kemrUserId: number; }) => user.kemrUserId === patient.patient.creator)?.amrsUserID,
            changed_by: userMap.find((user: { kemrUserId: number; }) => user.kemrUserId === patient.patient.changed_by)?.amrsUserID,
            voided_by: userMap.find((user: { kemrUserId: number; }) => user.kemrUserId === patient.patient.voided_by)?.amrsUserID,
            patient_id: personId
        };
    }

    await CM.query(toPatientInsertStatement(patient.patient, replaceColumns), connection);

}

export function toPatientInsertStatement(patient: Patient, replaceColumns?: any) {
    return toInsertSql(patient, [''], 'patient', replaceColumns);
}

export function toInsertSql(obj: any, excludeColumns: string[], table: string, replaceColumns?: any) {
    let set: any = {};
    for (let o in obj) {
        if (excludeColumns.includes(o)) {
            continue;
        }
        if (replaceColumns[o]) {
            set[o] = replaceColumns[o];
        } else {
            set[o] = obj[o];
        }
    }
    const sql = mysql.format(`INSERT INTO ${table} SET ?`, [set]);
    console.log('SQL::: ', sql);
    return sql;
}