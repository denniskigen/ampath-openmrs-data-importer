const readCsv = require('./read-csv');

export default class ConceptMapper {
    private static _instance: ConceptMapper;
    private _conceptMap?:ConceptMap;

    private mappedConceptsPath = 'metadata/found.csv';

    private constructor() {
    }
    static get instance(): ConceptMapper {
        if (!ConceptMapper._instance) {
            ConceptMapper._instance = new ConceptMapper();
        }
        return ConceptMapper._instance;
    }

    async initialize() {
        if(this._conceptMap) {
            return;
        }
        let concepts = await readCsv(this.mappedConceptsPath);
        // console.log('Mapped Concepts', concepts.grouped);
        let map:any = {};
        for(let o in concepts.grouped) {
            map[o] = concepts.grouped[o][0];
        }
        this._conceptMap = map;
        // console.log('Mapped Concepts', map);
    }

    get conceptMap(): ConceptMap {
        return this._conceptMap || {};
    }
}

export type FoundConcept = {
    concept_id:number;
    code: string;
    source: string;
    datatype: string;
    amrs_id: number;
    amrs_datatype: string;
}

export type ConceptMap = {
    [source_concept_id: number]: FoundConcept;
};