const readCsv = require('./read-csv');

export default class ConceptMap {
    private static _instance: ConceptMap;
    private _conceptMap:any;

    private mappedConceptsPath = 'metadata/found.csv';

    private constructor() {
    }
    static get instance(): ConceptMap {
        if (!ConceptMap._instance) {
            ConceptMap._instance = new ConceptMap();
        }
        return ConceptMap._instance;
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

    get conceptMap(): any {
        return this._conceptMap;
    }
}