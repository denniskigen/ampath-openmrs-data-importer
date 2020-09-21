import ConnectionManager from "../connection-manager";
import UserMap from "../users/user-map";
import ConceptMap from "../concept-map";
import { Connection } from "mysql";

const CM = ConnectionManager.getInstance();

export default async function loadPatientObs(personId: number, connection: Connection) {
    await ConceptMap.instance.initialize();
}