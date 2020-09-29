import chalk from "chalk";
import moment from "moment";
import ora from "ora";

import ConnectionManager from "../connection-manager";
import loadPatientData from "../patients/load-patient-data";
import patientSearch from "./patient-search";
import fetchKenyaEmrPersonIDs from "./load-kenya-emr-personIds";
import exportRecurrentPatients from "./export-recurrent-patients";
import { PatientComparator } from "../types/patient.types";

const connection = ConnectionManager.getInstance();

init();

async function init() {
  const noOfPatients = 25;
  const data = await checkForDuplicatePatients(noOfPatients);
  const output = flatten(data);
  exportDuplicatesData(output);
}

async function checkForDuplicatePatients(patientCount: number) {
  const patients = await fetchKenyaEmrPersonIDs(patientCount);
  // const patients = [{ patient_id: 445 }];
  const patientIds = patients.map((patient) => patient.patient_id);
  let patientList: any[] = [];

  console.log("Patient IDs loaded: ", patientIds);
  console.log("");
  for (const [index, id] of patientIds.entries()) {
    const NS_PER_SEC = 1e9;
    const time = process.hrtime();
    let spinner: ora.Ora = ora(
      `Searching for possible duplicates using patient ID ${chalk.bold.green(
        id
      )} ` + chalk`({blue ${index + 1} of ${patientIds.length}}) \n`
    ).start();
    let list: PatientComparator[] = await checkForExistingPatients(id);
    const diff = process.hrtime(time);
    const timeInSecs = (diff[0] * NS_PER_SEC + diff[1]) / NS_PER_SEC;
    spinner.succeed(
      `Check completed for ID ${chalk.green(id)} ` +
        chalk`({cyan Time: ${timeInSecs.toFixed(2)}s})`
    );
    spinner.info(
      `${
        list.length
          ? chalk.bold.red(list.length)
          : chalk.bold.green(list.length)
      } ${list.length === 1 ? "duplicate" : "duplicates"} found\n`
    );
    if (list.length) {
      console.log(chalk.bold.red(`${JSON.stringify(list, undefined, 2)}\n`));
    }
    patientList.push(list);
  }
  return patientList;
}

async function checkForExistingPatients(
  id: number
): Promise<PatientComparator[]> {
  let patientListWithoutDuplicates: PatientComparator[] = [];
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

    let combinedPatientList: Array<PatientComparator> = patientList.map(
      (patient) => {
        return {
          amrsNames: patient.person?.display,
          amrsPersonUuid: patient.person?.uuid,
          amrsIdentifiers: getCommaSeparatedIdentifiers(
            getIdentifiers(patient.identifiers)
          ),
          kenyaEMRPersonId: id,
          kenyaEMRIdentifiers: getCommaSeparatedIdentifiers(
            getIdentifiers(identifiers)
          ),
          kenyaEMRNames: flattenName(getNames(names)),
        };
      }
    );

    patientListWithoutDuplicates = combinedPatientList.filter(
      (patient, index, patientList) =>
        getIndexOfPatient(patientList, patient) === index
    );
  }
  return patientListWithoutDuplicates;
}

async function loadData(patient_id: number) {
  const kenyaEmrConnection = await connection.getConnectionKenyaemr();

  try {
    return await loadPatientData(patient_id, kenyaEmrConnection);
  } catch (e) {
    console.error("Error loading patient data: ", e);
  }
}

async function getPatients(names: PatientName[]) {
  let results: any[] = [];
  names.map((name) => {
    const { family_name, middle_name, given_name } = name;
    results.push(fetchPatient(family_name));
    results.push(fetchPatient(middle_name));
    results.push(fetchPatient(given_name));
  });
  return Promise.all(results);
}

async function fetchPatient(name: string) {
  return new Promise((resolve, reject) => {
    patientSearch(name)
      .then((patient) => {
        resolve(patient.results);
      })
      .catch((error) => {
        console.log(`Error fetching patient named '${name}': `, error);
        reject(error);
      });
  });
}

async function getPatientIdentifiers(identifiers: Identifier[]) {
  return identifiers.map((identifier) => constructCCCIdentifier(identifier));
}

async function exportDuplicatesData(data: any[]) {
  if (Array.isArray(data) && data.length) {
    let spinner: ora.Ora = ora(
      chalk.blue(`Writing duplicates to CSV file`)
    ).start();
    exportRecurrentPatients(data).then(
      (success) => {
        spinner.succeed(
          `Data successfully exported to ${chalk.bold.red(
            "./metadata/possible-existing-patients.csv"
          )}`
        );
        console.log("");
        console.log(chalk.bold.gray("Completed all operations."));
      },
      (fail) => spinner.fail(`Failed to export CSV: ${fail}`)
    );
  }
}

const calculateAge = (birthdate: Date): number => {
  return moment().diff(birthdate, "years");
};

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
    (p) => p.amrsPersonUuid === patient.amrsPersonUuid
  );
};

const getIdentifiers = (identifiers: Array<any>): Array<string> => {
  let identifierList: Array<string> = [];
  identifiers.forEach((identifier) => {
    identifierList.push(identifier.identifier);
  });
  return identifierList;
};

const getCommaSeparatedIdentifiers = (identifiers: Array<string>): string => {
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

// type OpenMRSMetadata = {
//   changed_by: number | null;
//   date_created: Date;
//   date_changed: Date | null;
//   date_voided: Date | null;
//   voided: number;
//   voided_by: number | null;
//   void_reason: string | null;
//   uuid: string;
// };
