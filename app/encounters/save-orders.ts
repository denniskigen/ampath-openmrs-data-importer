import ConnectionManager from "../connection-manager";
import UserMapper from "../users/user-map";
import ConceptMapper, { ConceptMap, FoundConcept } from "../concept-map";
import { Connection } from "mysql";
import { Order } from "../tables.types";
import { PatientData } from "../patients/patient-data";
import toInsertSql from "../prepare-insert-sql";
import { InsertedMap } from "../inserted-map";

const CM = ConnectionManager.getInstance();

export default async function insertPatientOrders(ordersToInsert: Order[], patient: PatientData, insertMap:InsertedMap, connection:Connection) {
    await ConceptMapper.instance.initialize();
    await UserMapper.instance.initialize();
    let orders = prepareOrders(ordersToInsert, ConceptMapper.instance);
    // console.log(insertMap);
    await saveObs(orders,ordersToInsert,insertMap.patient,insertMap.encounters, connection);
}

export type ObsMap = {
    [kenyaEmrObsId:number]:number
};

export async function saveObs(mappedOrders: Order[], sourceOrders:Order[], newPatientId:number, encounterMap:any, providerMap:any, connection:Connection) {
    let obsMap:ObsMap = {};
    let skippedObsCount = 0;
    for(var i = 0; i < mappedOrders.length; i++) {
        if(mappedOrders[i].comment_to_fulfiller === 'invalid') {
            // skip it
            console.warn('skipping obs for concept: ', sourceOrders[i].concept_id);
            skippedObsCount++;
            continue;
        }
        const sql = toOrdersInsertStatement(mappedOrders[i], sourceOrders[i], newPatientId, UserMapper.instance.userMap, encounterMap);
        // console.log('sql', sql);
        const results = await CM.query(sql, connection); // TODO save once encounters are ready
        obsMap[sourceOrders[i].order_id] = results.insertId;
    }
    console.log('Skipped obs count ' + skippedObsCount + '/' + sourceOrders.length);
    return obsMap;
}

export function toOrdersInsertStatement(order: Order, sourceObs:Order, newPatientId:number, userMap:any, encounterMap:any) {
    let replaceColumns = {
        'creator': userMap[sourceObs.creator],
        'voided_by': userMap[sourceObs.voided_by],
        'order':
        'patient_id': newPatientId,
        'encounter_id': encounterMap[sourceObs.encounter_id] || null,
        'previous_order_id': null, //TODO replace with previous_version
    };
    return toInsertSql(order, ['order_id', ], 'obs', replaceColumns);
}

export function prepareOrders(ordersToInsert: Order[], conceptMap: ConceptMapper): Order[] {
    // replace concept ids with maps and convert to destination concept values
    // if a missing concept map or unknown data type concept is detected, then throw error
    let orders:Order[] = ordersToInsert.map<Order>((o,i,A):Order=>{
        let newOrder:Order = Object.assign({},o);
        try { // TODO, to remove this before moving running in production
            assertObsConceptsAreMapped(o, conceptMap.conceptMap);
            mapOrderConcept(newOrder,o, conceptMap.conceptMap);
            mapOrderReasonConcept(newOrder,o, conceptMap.conceptMap);
        } catch (err) {
            newOrder.comment_to_fulfiller = 'invalid';
        }
        return newOrder;
    });

    return orders;
}

export function assertObsConceptsAreMapped(order:Order, conceptMap: ConceptMap) {
    if(!conceptMap[order.concept_id]) {
        throw new Error('Unmapped concept detected. Concept ID: ' + order.concept_id);
    }

    if(order.order_reason && !conceptMap[order.order_reason]) {
        throw new Error('Unmapped concept detected. Concept ID: ' + order.order_reason);
    }
}

export function mapOrderConcept(newOrder:Order, sourceOrder:Order,  conceptMap: ConceptMap) {
    newOrder.concept_id = parseInt(conceptMap[sourceOrder.concept_id].amrs_id);
}

export function mapOrderReasonConcept(newOrder:Order, sourceOrder:Order,  conceptMap: ConceptMap) {
    newOrder.concept_id = parseInt(conceptMap[sourceOrder.concept_id].amrs_id);
}
