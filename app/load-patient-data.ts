import ConnectionManager from "./connection-manager";
import { Connection } from "mysql";
const con = ConnectionManager.getInstance();

export type PatientData = {
    person: Person;
    patient: Patient;
    address: Address;
    names: PersonName[];
    attributes: PersonAttribute[];
    identifiers: PatientIdentifier[];
};

export type Person = {
    person_id: number;
    uuid: string;
    gender: string;
    birthdate: string;
    birthdate_estimated: number;
    birthtime: string;
    dead: number;
    death_date: string;
    deathdate_estimated: number;
    cause_of_death: any;
    creator: number;
    date_created: string;
    changed_by: number;
    date_changed: string;
    voided: number;
    voided_by: number;
    date_voided: string;
    void_reason: string;
};

export type Patient = {
    patient_id: number;
    creator: number;
    date_created: string,
    changed_by: number,
    date_changed: string,
    voided: number,
    voided_by: number,
    date_voided: string,
    void_reason: string
};

export type Address = {
    person_address_id: number;
    person_id: number;
    preferred: number;
    address1: string;
    address2: string;
    city_village: string;
    state_province: string;
    postal_code: string;
    country: string;
    latitude: string;
    longitude: string;
    start_date: string;
    end_date: string;
    creator: number;
    date_created: string;
    voided: number;
    voided_by: number;
    date_voided: string;
    void_reason: string;
    county_district: string;
    address3: string;
    address4: string;
    address5: string;
    address6: string;
    date_changed: string;
    changed_by: number;
    uuid: string;
};

export type PersonName = {
    person_name_id: number;
    preferred: number;
    person_id: number;
    prefix: any;
    given_name: string;
    middle_name: string;
    family_name_prefix: any;
    family_name: string;
    family_name2: string;
    family_name_suffix: any;
    degree: any;
    creator: number;
    date_created: string;
    voided: number;
    voided_by: number;
    date_voided: string;
    void_reason: string;
    changed_by: number;
    date_changed: string;
    uuid: string;
};

export type PersonAttribute = {
    person_attribute_id: number;
    person_id: number;
    value: string;
    person_attribute_type_id: number;
    creator: number;
    date_created: string;
    changed_by: number;
    date_changed: string;
    voided: number;
    voided_by: number;
    date_voided: string;
    void_reason: string;
    uuid: string;
};

export type PatientIdentifier = {
    patient_identifier_id: number;
    patient_id: number;
    identifier: string;
    identifier_type: number;
    preferred: number;
    location_id: number;
    creator: number;
    date_created: string;
    date_changed: string;
    changed_by: number;
    voided: number;
    voided_by: number;
    date_voided: string;
    void_reason: string;
    uuid: string;
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
