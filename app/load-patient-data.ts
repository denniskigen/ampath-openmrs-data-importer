import ConnectionManager from "./connection-manager";
import { Connection } from "mysql";
const con = ConnectionManager.getInstance();

export type PatientData = {
    person: Person
}

export type Person = {
    uuid: any;
    gender: any;
    birthdate: any;
    birthdate_estimated: any;
    birthtime: any;
    dead: any;
    death_date: any;
    deathdate_estimated: any;
    cause_of_death: any;
    creator: any;
    date_created: any;
    changed_by: any;
    date_changed: any;
    voided: any;
    voided_by: any;
    date_voided: any;
    void_reason: any;
    person_id: any;
}

export default async function loadPatientData(patientId: number, connection:Connection) {
    let person: Person = await fetchPerson(patientId, connection);
    let results: PatientData = {
        person: person
    };
    return results;
}

export async function fetchPerson(personId: number, connection: Connection) {
    const sql = `select * from person where person_id= ${personId}`;
    let results: Person[] = await con.query(sql, connection);
    return results[0];
}
