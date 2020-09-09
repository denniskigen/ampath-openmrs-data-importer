import ConnectionManager from "../connection-manager";
import { Connection } from "mysql";
import { User, UserRole } from "../tables.types";
const con = ConnectionManager.getInstance();

export type UserData = {
    user: User;
    roles: UserRole;
};


export default async function loadUserData(userId: number, connection: Connection) {
    let user = await fetchUser(userId, connection);
    let userRole = await fetchUserRole(userId, connection);
    let results: UserData = {
        user: user,
        roles: userRole
    };
    return results;
}

export async function fetchUser(userId: number, connection: any) {
    const sql = `select * from users where user_id= ${userId}`;
    let results: User[] = await con.query(sql, connection);
    return results[0];
}

export async function fetchUserRole(userId: number, connection: any) {
    const sql = `select * from user_role where user_id= ${userId}`;
    let results: UserRole[] = await con.query(sql, connection);
    return results[0];
}
export async function loadUserDataByUuid(userUuid: string, connection:Connection) {
    const userId = await fetchUserByUuid(userUuid, connection);
    return await loadUserData(userId, connection);
}