import { Person, Patient, Address, PersonName, PersonAttribute, PatientIdentifier } from "./tables.types";

export type PatientData = {
    person: Person;
    patient: Patient;
    address: Address;
    names: PersonName[];
    attributes: PersonAttribute[];
    identifiers: PatientIdentifier[];
}