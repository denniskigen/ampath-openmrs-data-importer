const createCSVWriter = require("csv-writer").createObjectCsvWriter;

export default async function exportRecurrentPatients(data: Array<any>) {
  const csvWriter = createCSVWriter({
    path: "./metadata/possible-existing-patients.csv",
    header: [
      { id: "kenyaEMRPersonId", title: "KenyaEMR person ID" },
      { id: "kenyaEMRIdentifiers", title: "KenyaEMR identifiers" },
      { id: "kenyaEMRNames", title: "KenyaEMR names" },
      { id: "amrsPersonId", title: "AMRS person UUID" },
      { id: "amrsIdentifiers", title: "AMRS identifiers" },
      { id: "amrsNames", title: "AMRS names" },
    ],
  });
  csvWriter
    .writeRecords(data)
    .then(() => console.log("Data written to CSV file successfully"));
}
