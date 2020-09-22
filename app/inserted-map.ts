export type InsertedMap = {
    patient: number;
    visits: {
        [kenyaEmrId:number]:number;
    }
    encounters: {
        [kenyaEmrId:number]:number;
    }
};