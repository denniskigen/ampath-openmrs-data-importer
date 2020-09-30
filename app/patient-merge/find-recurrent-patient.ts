import chalk from "chalk";
import moment from "moment";
import ora from "ora";
import { Connection } from "mysql";

import ConnectionManager from "../connection-manager";
import {
  fetchPerson,
  fetchPersonNames,
  fetchPersonIdentifiers,
} from "../patients/load-patient-data";
import patientSearch from "./patient-search";
import fetchKenyaEmrPersonIDs from "./load-kenya-emr-personIds";
import exportRecurrentPatients from "./export-recurrent-patients";
import { PatientComparator } from "../types/patient.types";
import { PatientIdentifier, Person, PersonName } from "../tables.types";

const NANOSECS_PER_SEC = 1e9;
const connection = ConnectionManager.getInstance();

init();

async function init() {
  const noOfPatients = 1;
  const startTime = startTimer();
  const data = await checkForDuplicatePatients(noOfPatients);
  const output = flatten(data);
  await exportDuplicatesData(output);
  const elapsedTime = startTimer(startTime);
  console.log(
    chalk.bold.gray(`\nCompleted all operations in ${formatTime(elapsedTime)}s`)
  );
  connection.closeAllConnections();
}

async function checkForDuplicatePatients(
  patientCount: number
): Promise<Array<Array<PatientComparator>>> {
  const patients = await fetchKenyaEmrPersonIDs(patientCount);

  const patientIds = patients.map((patient) => patient.patient_id);
  let patientList: Array<Array<PatientComparator>> = [];

  console.log("Patient IDs loaded: ", patientIds);
  console.log("");
  for (const [index, id] of patientIds.entries()) {
    const startTime = startTimer();
    let spinner: ora.Ora = ora(
      `Searching for possible duplicates using patient ID ${chalk.bold.green(
        id
      )} ` + chalk`({yellow ${index + 1} of ${patientIds.length}}) \n`
    ).start();
    let list: PatientComparator[] = await checkPatientIdAgainstExistingPatients(
      id
    );
    const elapsedTime = startTimer(startTime);
    spinner.succeed(
      `Check completed for ID ${chalk.green(id)} ` +
        chalk`({cyan Time: ${formatTime(elapsedTime)}s})`
    );
    spinner.info(
      `${
        list.length
          ? chalk.bold.red(list.length)
          : chalk.bold.green(list.length)
      } possible ${list.length === 1 ? "duplicate" : "duplicates"} found\n`
    );
    if (list.length) {
      console.log(chalk.bold.red(`${JSON.stringify(list, undefined, 2)}\n`));
    }
    patientList.push(list);
  }
  return patientList;
}

async function checkPatientIdAgainstExistingPatients(
  id: number
): Promise<Array<PatientComparator>> {
  let patientListWithoutDuplicates: Array<PatientComparator> = [];
  const patientData = await loadData(id);

  if (patientData && Object.keys(patientData).length) {
    const {
      person: { birthdate, gender },
      identifiers,
      names,
    } = patientData;
    const age = calculateAge(birthdate);
    // getPatientsByName returns a nested array from resolving promises
    const [patients] = await getPatientsByName(names);
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

async function loadData(patientId: number) {
  const kenyaEmrConnection = await connection.getConnectionKenyaemr();

  try {
    return await loadPatientData(patientId, kenyaEmrConnection);
  } catch (e) {
    console.error("Error loading patient data: ", e);
  }
}

async function loadPatientData(id: number, connection: Connection) {
  let person: Person = await fetchPerson(id, connection);
  let names: PersonName[] = await fetchPersonNames(id, connection);
  let identifiers: PatientIdentifier[] = await fetchPersonIdentifiers(
    id,
    connection
  );
  let results = {
    person,
    names,
    identifiers,
  };
  connection.destroy();
  return results;
}

async function getPatientsByName(names: PersonName[]) {
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
      .then(({ results }: { results: PatientResponse }) => {
        resolve(results);
      })
      .catch((error) => {
        console.log(`Error fetching patient named '${name}': `, error);
        reject(error);
      });
  });
}

async function getPatientIdentifiers(identifiers: PatientIdentifier[]) {
  return identifiers.map((identifier) =>
    constructCCCIdentifierIfPresent(identifier)
  );
}

async function exportDuplicatesData(data: any[]) {
  if (Array.isArray(data) && data.length) {
    let spinner: ora.Ora = ora(
      chalk.blue(
        `Writing ${chalk.bold(data.length)} possible ${
          data.length === 1 ? "duplicate" : "duplicates"
        } to CSV file`
      )
    ).start();
    exportRecurrentPatients(data).then(
      (success) => {
        spinner.succeed(
          `Data successfully exported to ${chalk.bold.red(
            "./metadata/possible-existing-patients.csv"
          )}`
        );
      },
      (fail) => spinner.fail(`Failed to export CSV: ${fail}`)
    );
  }
}

function startTimer(diff?: [number, number]) {
  if (diff) {
    return process.hrtime(diff);
  }
  return process.hrtime();
}

const formatTime = (diff: [number, number]): string => {
  const nanosecondsElapsed =
    (diff[0] * NANOSECS_PER_SEC + diff[1]) / NANOSECS_PER_SEC;
  return nanosecondsElapsed.toFixed(2);
};

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

const constructCCCIdentifierIfPresent = (identifier: any) => {
  if (identifier.identifier_type === 5) {
    const ident = identifier.identifier;
    return ident.slice(0, 5) + "-" + ident.slice(ident.length - 5);
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

type PatientResponse = {
  display: string;
  uuid: string;
  identifiers: PatientIdentifier[];
  person: Person;
};
