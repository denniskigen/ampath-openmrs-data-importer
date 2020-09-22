import ConnectionManager from "../connection-manager";
import UserMap from "../users/user-map";
import ConceptMapper, { ConceptMap, FoundConcept } from "../concept-map";
import { Connection } from "mysql";
import { Obs } from "../tables.types";
import { PatientData } from "../patients/patient-data";
import toInsertSql from "../prepare-insert-sql";

const CM = ConnectionManager.getInstance();

export default async function insertPatientObs(obsToInsert: Obs[], patient: PatientData, newPatientId:number, encounterMap:any, connection:Connection) {
    await ConceptMapper.instance.initialize();
    await UserMap.instance.initialize();
    let obs = prepareObs(obsToInsert, ConceptMapper.instance);
    await saveObs(obs,obsToInsert,newPatientId,encounterMap, connection);
}

export type ObsMap = {
    [kenyaEmrObsId:number]:number
};

export async function saveObs(mappedObs: Obs[], sourceObs:Obs[], newPatientId:number, encounterMap:any, connection:Connection) {
    let obsMap:ObsMap = {};
    for(var i = 0; i < mappedObs.length; i++) {
        if(mappedObs[i].comments === 'invalid') {
            // skip it
            continue;
        }
        const sql = toObsInsertStatement(mappedObs[i], sourceObs[i], newPatientId, UserMap.instance.userMap, encounterMap);
        console.log('sql', sql);
        // const results = await CM.query(sql, connection); // Try to save once encounters are ready
        // obsMap[sourceObs[i].obs_id] = results.insertId;
    }

    return obsMap;
}

export function toObsInsertStatement(obs: Obs, sourceObs:Obs, newPatientId:number, userMap:any, encounterMap:any) {
    let replaceColumns = {
        'creator': userMap[sourceObs.creator],
        'voided_by': userMap[sourceObs.voided_by],
        'person_id': newPatientId,
        'encounter_id': encounterMap[sourceObs.encounter_id],
        'location_id': 1, //TODO replace with kapenguria location id,
        'order_id': null, //TODO replace with order map,
        'status': 'FINAL'

    };
    return toInsertSql(obs, ['obs_id', 'value_boolean'], 'obs', replaceColumns);
}



export function prepareObs(obsToInsert: Obs[], conceptMap: ConceptMapper): Obs[] {
    // replace concept ids with maps and convert to destination concept values
    // if a missing concept map or unknown data type concept is detected, then throw error
    let obs:Obs[] = obsToInsert.map<Obs>((o,i,A):Obs=>{
        assertObsConceptsAreMapped(o, conceptMap.conceptMap);
        let newObs:Obs = Object.assign({},o);
        try { // TODO, to remove this before moving running in production
            mapObsConcept(newObs,o, conceptMap.conceptMap);
            mapObsValue(newObs,o, conceptMap.conceptMap);
        } catch (err) {
            newObs.comments = 'invalid';
        }
        return o;
    });

    return obs;
}

export function assertObsConceptsAreMapped(obs:Obs, conceptMap: ConceptMap) {
    if(!conceptMap[obs.concept_id]) {
        throw new Error('Unmapped concept detected. Concept ID: ' + obs.concept_id);
    }

    if(obs.value_coded && !conceptMap[obs.value_coded]) {
        throw new Error('Unmapped concept detected. Concept ID: ' + obs.value_coded);
    }
}

export function mapObsConcept(newObs:Obs, sourceObs:Obs,  conceptMap: ConceptMap) {
    newObs.concept_id = conceptMap[sourceObs.concept_id].amrs_id;
}

export function mapObsValue(newObs:Obs, sourceObs:Obs,  conceptMap: ConceptMap) {
    let foundConcept =  conceptMap[sourceObs.concept_id];
    if(areDatatypeEquivalent(foundConcept)) {
        mapMatchingTypeObsValue(newObs,sourceObs,conceptMap);
    } else {
        throw new Error('conflicting data types detected. Details: ' + foundConcept);
    }
}

export function areDatatypeEquivalent(foundConcept:FoundConcept): boolean {
    if(foundConcept.datatype === foundConcept.amrs_datatype) {
        return true;
    }

    if(foundConcept.datatype === 'Datetime' && foundConcept.amrs_datatype === 'Date') {
        return true;
    }

    if(foundConcept.datatype === 'Date' && foundConcept.amrs_datatype === 'Datetime') {
        return true;
    }

    return false;
}

function mapMatchingTypeObsValue(newObs:Obs, sourceObs:Obs,  conceptMap: ConceptMap) {
    if(sourceObs.value_coded) {
        newObs.value_coded = conceptMap[sourceObs.value_coded].amrs_id;
    }
}
