import moment from "moment";

import ConnectionManager from "../connection-manager";
import loadPatientData from "../patients/load-patient-data";
import patientSearch from "./patient-search";
import fetchKenyaEmrPersonIDs from "./load-kenya-emr-personIds";
import exportRecurrentPatients from "./export-recurrent-patients";
import { PatientComparator } from "../types/patient.types";
import { Patient } from "../tables.types";

const connection = ConnectionManager.getInstance();

const loadData = async (patient_id: number) => {
  const kenyaEmrConnection = await connection.getConnectionKenyaemr();

  try {
    return await loadPatientData(patient_id, kenyaEmrConnection);
  } catch (e) {
    console.error("Error loading patient data: ", e);
  }
};

const fetchPatient = async (name: string): Promise<Array<any>> => {
  return new Promise((resolve, reject) => {
    patientSearch(name)
      .then((patients) => {
        resolve(patients.results);
      })
      .catch((err) => {
        console.log("Error fetching patient with name: " + name, err);
        reject(err);
      });
  });
};

const getPatients = async (names: PatientName[]) => {
  let results: any[] = [];
  names.map((name) => {
    const { family_name, middle_name, given_name } = name;
    results.push(fetchPatient(family_name));
    results.push(fetchPatient(middle_name));
    results.push(fetchPatient(given_name));
  });
  return Promise.all(results);
};

const getPatientIdentifiers = async (identifiers: Identifier[]) => {
  return identifiers.map((identifier) => constructCCCIdentifier(identifier));
};

const calculateAge = (birthdate: any): number => {
  return moment().diff(birthdate, "years");
};

const checkForExistingPatients = async (id: number) => {
  const patientData = await loadData(id);
  if (patientData && Object.keys(patientData).length) {
    const {
      person: { birthdate, gender },
      identifiers,
      names,
    } = patientData;
    const age = calculateAge(birthdate);
    const patients = flatten(await getPatients(names));
    const patientIdentifiers = await getPatientIdentifiers(identifiers);
    let patientList = [...patients, ...patientIdentifiers];

    // Remove duplicates
    patientList = patientList.reduce((unique, patient) => {
      return unique.includes(patient) ? unique : [...unique, patient];
    }, []);

    // Filter by gender and age
    patientList = patientList.filter((patient) => {
      if (patient.person && patient.person.birthdate) {
        const calculatedAge = calculateAge(patient.person?.birthdate);
        return patient.person.gender === gender && calculatedAge === age;
      }
    });

    patientList = filterByNames(patientList, names);

    let combinedPatientList: Array<any> = patientList.map((patient) => {
      return {
        amrsPersonUuid: patient.person.uuid,
        amrsIdentifiers: getIdentifersCommaSeparated(
          getIdentifiers(patient.identifiers)
        ),
        kenyaEMRPersonId: id,
        kenyaEMRIdentifiers: getIdentifersCommaSeparated(
          getIdentifiers(identifiers)
        ),
        kenyaEMRNames: flattenName(getNames(names)),
      };
    });

    const duplicateFreeCombinedPatientList = combinedPatientList.filter(
      (patient, index, patientList) =>
        getIndexOfPatient(patientList, patient) === index
    );
    console.table(duplicateFreeCombinedPatientList);
    return duplicateFreeCombinedPatientList;
  }
};

const findPossiblePatientMatch = async (patientCount: number) => {
  const patients = await fetchKenyaEmrPersonIDs(patientCount);
  const patientIds = patients.map((patient) => patient.patient_id);
  let list = [];
  for (const id of patientIds) {
    let arr_pl = await checkForExistingPatients(id);
    list.push(arr_pl);
  }
  return list;
};

const init = async () => {
  const data = await findPossiblePatientMatch(25);
  console.table(data);
  exportRecurrentPatients(data);
};

// Entrypoint
init();

const filterByNames = (
  patientList: Array<any>,
  names: Array<any>
): Array<any> => {
  const nameCollections: Array<string> = getNames(names);
  return patientList.filter((patient) => {
    return (
      nameCollections.filter((n) =>
        patient.person.display.toLowerCase().split(" ").includes(n)
      ).length >= 2
    );
  });
};

const getNames = (names: Array<any>): Array<string> => {
  let getNames: Array<string> = [];
  names.forEach((name: any) => {
    getNames.push(
      name.middle_name?.toLowerCase(),
      name.family_name?.toLowerCase(),
      name.given_name?.toLowerCase()
    );
  });
  let uniqueNames: Array<string> = [];
  getNames.forEach((name) => {
    if (!uniqueNames.includes(name)) {
      uniqueNames.push(name);
    }
  });
  return uniqueNames;
};

const constructCCCIdentifier = (identifier: any) => {
  if (identifier.identifier_type === 5) {
    let ident = identifier.identifier;
    return ident.slice(0, 5) + "-" + ident.slice(5);
  } else {
    return identifier.identifier;
  }
};

const getIndexOfPatient = (patientList: Array<any>, patient: any) => {
  return patientList.findIndex(
    (p) => p.Amrs_person_uuid === patient.Amrs_person_uuid
  );
};

const getIdentifiers = (identifiers: Array<any>): Array<string> => {
  let identifierList: Array<string> = [];
  identifiers.forEach((identifier) => {
    identifierList.push(identifier.identifier);
  });
  return identifierList;
};

const getIdentifersCommaSeparated = (identifiers: Array<string>): string => {
  return identifiers.join();
};

const flattenName = (names: Array<string>): string => {
  return names.join().replace(",", " ");
};

const flatten = (arr: any[]) => [].concat(...arr);

type Identifier = {
  patient_identifier_id: number;
  patient_id: number;
  identifier: number;
  identifier_type: number;
  preferred: number;
  location_id: number;
  creator: number;
  date_created: Date;
  date_changed: Date;
  changed_by: number;
  voided: number;
  voided_by: null;
  date_voided: null;
  void_reason: null;
  uuid: string;
};

type PatientName = {
  person_name_id: number;
  preferred: number;
  person_id: number;
  prefix: string | null;
  given_name: string;
  middle_name: string;
  family_name_prefix: string | null;
  family_name: string;
  family_name2: string | null;
  family_name_suffix: string | null;
  degree: string | null;
  creator: number;
  date_created: Date;
  voided: number;
  voided_by: number | null;
  date_voided: Date | null;
  void_reason: string | null;
  changed_by: number | null;
  date_changed: Date | null;
  uuid: string;
};

type OpenMRSMetadata = {
  changed_by: number | null;
  date_created: Date;
  date_changed: Date | null;
  date_voided: Date | null;
  voided: number;
  voided_by: number | null;
  void_reason: string | null;
  uuid: string;
};
