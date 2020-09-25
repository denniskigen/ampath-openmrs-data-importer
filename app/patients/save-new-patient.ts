import { Connection } from "mysql";
import { Person, Patient } from "../tables.types";
import { PatientData } from "./patient-data";
import ConnectionManager from "../connection-manager";
import UserMapper from "../users/user-map";
import toInsertSql from "../prepare-insert-sql";

const CM = ConnectionManager.getInstance();

export default async function savePatientData(patient: PatientData, connection: Connection) {
    await UserMapper.instance.initialize();
    return savePerson(patient, connection, UserMapper.instance.userMap);
}

export async function savePerson(patient: PatientData, connection: Connection, userMap?: any) {
    let replaceColumns = {};
    if (userMap) {
        replaceColumns = {
            creator: userMap[patient.person.creator],
            changed_by: userMap[patient.person.changed_by],
            voided_by: userMap[patient.person.voided_by]
        };
    }

    await CM.query(toPersonInsertStatement(patient.person, replaceColumns), connection);

}

export function toPersonInsertStatement(person: Person, replaceColumns?: any) {
    return toInsertSql(person, ['person_id'], 'person', replaceColumns);
}

export async function savePatient(patient: PatientData, personId: number, connection: Connection) {
    // console.log("user person id", personId);
    const userMap = UserMapper.instance.userMap;
    let replaceColumns = {};
    if (userMap) {
        replaceColumns = {
            creator: userMap[patient.person.creator],
            changed_by: userMap[patient.person.changed_by],
            voided_by: userMap[patient.person.voided_by],
            patient_id: personId
        };
    }

    await CM.query(toPatientInsertStatement(patient.patient, replaceColumns), connection);

}

export function toPatientInsertStatement(patient: Patient, replaceColumns?: any) {
    return toInsertSql(patient, [''], 'patient', replaceColumns);
}
