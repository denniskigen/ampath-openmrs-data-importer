// sets up the user map between kenyaemr and amrs

import ConnectionManager from "../connection-manager";
import { fetchProviders } from "./load-provider-data";


export default class ProviderMap {
    private static _instance: ProviderMap;
    private _providerMap: any;
    private constructor() {
    }
    static get instance(): ProviderMap {
        if (!ProviderMap._instance) {
            ProviderMap._instance = new ProviderMap();
        }
        return ProviderMap._instance;
    }

    async initialize() {
        const CM = ConnectionManager.getInstance();
        let kenyaEmrCon = await CM.getConnectionKenyaemr();
        let amrsCon = await CM.getConnectionAmrs();
        // load provider mapping here
        this._providerMap = [];
        const loadKemrProviders = await fetchProviders(kenyaEmrCon);
        const loadAmrsProviders = await fetchProviders(amrsCon);
        for (const kusers of loadKemrProviders) {
            let amrsUserID = loadAmrsProviders.find(user => user.uuid === kusers.uuid)?.provider_id;
            let kemrUserId = kusers.provider_id;
            this.providerMap.push({ kemrUserId, amrsUserID })
        }
        console.log("Provider Map", this._providerMap);
    }

    get providerMap(): any {
        return this._providerMap;
    }
}