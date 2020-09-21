import ConnectionManager from "../connection-manager";
// import UserMap from "../users/user-map";
// import ConceptMap from "../concept-map";
import { Connection } from "mysql";
import { Obs } from "../tables.types";

const CM = ConnectionManager.getInstance();

export default async function loadPatientObs(personId: number, connection: Connection) {
    // await ConceptMap.instance.initialize();
    const sql = `select * from obs where person_id = ${personId} order by obs_group_id asc`;
    let results: Obs[] = await CM.query(sql, connection);
    return results;
}
