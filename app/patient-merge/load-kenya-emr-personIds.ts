import ConnectionManager from "../connection-manager";

const connection = ConnectionManager.getInstance();

type PatientId = {
  patient_id: number;
};

export default async function fetchKenyaEmrPersonIDs(limit: number) {
  const kenyaEmrConnection = await connection.getConnectionKenyaemr();
  const sql = `select patient_id from kenya_emr.patient limit ${limit}`;
  let ids: PatientId[] = await connection.query(sql, kenyaEmrConnection);
  return ids;
}
