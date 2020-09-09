import ConnectionManager from '../connection-manager';
//import savePatientData from './save-user-data';
import  loadUserData from './load-user-data';
const CM = ConnectionManager.getInstance();

export default async function transferUserToAmrs(personId: number) {
    const kenyaEmrCon = await CM.getConnectionKenyaemr();
    const userData = await loadUserData(personId, kenyaEmrCon);
    console.log('user', user);
    let amrsCon = await CM.getConnectionAmrs();
    amrsCon = await CM.startTransaction(amrsCon);
    await saveUserData(user, amrsCon);
    const saved = await loadUserDataByUuid(userData.user, amrsCon);
    console.log('saved user', saved);
    await CM.rollbackTransaction(amrsCon);
    const rollBack = await loadUserDataByUuid(userData.user, amrsCon);
    console.log('rollback patient', rollBack);
}