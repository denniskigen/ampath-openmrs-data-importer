import { Person, Patient, Address, PersonName, PersonAttribute, PatientIdentifier, Obs, Visit, Order } from "../tables.types";

export type PatientData = {
    person: Person;
    patient: Patient;
    address: Address;
    names: PersonName[];
    attributes: PersonAttribute[];
    identifiers: PatientIdentifier[];
    obs: Obs[];
    orders: Order[];
    visits:Visit[];
}