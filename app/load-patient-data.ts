import ConnectionManager from "./connection-manager";
import { Connection } from "mysql";
import { Person, Patient, Address, PersonName, PersonAttribute, PatientIdentifier } from "./tables.types";
const con = ConnectionManager.getInstance();

export type PatientData = {
    person: Person;
    patient: Patient;
    address: Address;
    names: PersonName[];
    attributes: PersonAttribute[];
    identifiers: PatientIdentifier[];
};



export default async function loadPatientData(patientId: number, connection:Connection) {
    let person = await fetchPerson(patientId, connection);
    let patient = await fetchPatient(patientId, connection);
    let address = await fetchAddress(patientId, connection);
    let names = await fetchPersonNames(patientId, connection);
    let attributes = await fetchPersonAttributes(patientId, connection);
    let identifiers = await fetchPersonIdentifiers(patientId, connection);
    let results: PatientData = {
        person: person,
        patient: patient,
        address: address,
        names: names,
        attributes: attributes,
        identifiers:identifiers
    };
    return results;
}

export async function fetchPerson(personId: number, connection: Connection) {
    const sql = `select * from person where person_id= ${personId}`;
    let results: Person[] = await con.query(sql, connection);
    return results[0];
}

export async function fetchPatient(personId: number, connection: Connection) {
    const sql = `select * from patient where patient_id= ${personId}`;
    let results: Patient[] = await con.query(sql, connection);
    return results[0];
}

export async function fetchAddress(personId: number, connection: Connection) {
    const sql = `select * from person_address where person_id= ${personId}`;
    let results: Address[] = await con.query(sql, connection);
    return results[0];
}

export async function fetchPersonNames(personId: number, connection: Connection) {
    const sql = `select * from person_name where person_id= ${personId}`;
    let results: PersonName[] = await con.query(sql, connection);
    return results;
}

export async function fetchPersonAttributes(personId: number, connection: Connection) {
    const sql = `select * from person_attribute where person_id= ${personId}`;
    let results: PersonAttribute[] = await con.query(sql, connection);
    return results;
}

export async function fetchPersonIdentifiers(personId: number, connection: Connection) {
    const sql = `select * from patient_identifier where patient_id= ${personId}`;
    let results: PatientIdentifier[] = await con.query(sql, connection);
    return results;
}
