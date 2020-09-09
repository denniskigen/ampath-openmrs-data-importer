// sets up the user map between kenyaemr and amrs

export default class UserMap {
    private static _instance: UserMap;
    private _userMap:any;
    private constructor() {
    }
    static get instance(): UserMap {
        if (!UserMap._instance) {
            UserMap._instance = new UserMap();
        }
        return UserMap._instance;
    }

    async initialize() {
        // load user mapping here
        this._userMap = {
            40: 1,
            33: 2
        };
    }

    get userMap(): any {
        return this._userMap;
    }
}