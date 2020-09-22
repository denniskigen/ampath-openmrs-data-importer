// sets up the user map between kenyaemr and amrs

import ConnectionManager from "../connection-manager";
import { fetchUsers } from "./load-user-data";

export default class UserMap {
    private static _instance: UserMap;
    private _userMap: any;
    private constructor() {
    }
    static get instance(): UserMap {
        if (!UserMap._instance) {
            UserMap._instance = new UserMap();
        }
        return UserMap._instance;
    }

    async initialize() {
        const CM = ConnectionManager.getInstance();
        let kenyaEmrCon = await CM.getConnectionKenyaemr();
        let amrsCon = await CM.getConnectionAmrs();
        // load user mapping here
        this._userMap = [];
        const loadKemrUsers = await fetchUsers(kenyaEmrCon);
        const loadAmrsUsers = await fetchUsers(amrsCon);
        for (const kusers of loadKemrUsers) {
            let amrsUserID = loadAmrsUsers.find(user => user.uuid === kusers.uuid)?.user_id;
            let kemrUserId = kusers.user_id;
            this._userMap.push({ kemrUserId, amrsUserID })
        }
        console.log("User Map", this._userMap);
    }

    get userMap(): any {
        return this._userMap;
    }
}