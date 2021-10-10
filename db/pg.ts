import { Pool, QueryResult } from 'pg';
import { PG_CONNECT_CONFIG, TABLE_MAPPING, OBJECT_VALUE } from '../utils/config'
import { lastPgUpdateTime } from '../utils/csv';
import { OTHER_TABLES, TABLE_CLONE_CONFIG } from '../utils/config';

export const pgClientConnect: Pool = new Pool(PG_CONNECT_CONFIG)
export const pgClose = (pool: Pool): Promise<void> => pool.end()

export const otherTableInit = async (pool: Pool, tableName: any): Promise<QueryResult> => {
    await pool.query(`CREATE TABLE IF NOT EXISTS "${tableName}" ( ${TABLE_MAPPING["default"]})`)
    return  pool.query(`TRUNCATE TABLE ${tableName}`)
}
export const tableInit = async (pool: Pool, tableName: any): Promise<void> => {
    await pool.query(`CREATE TABLE IF NOT EXISTS "${tableName}" ( ${TABLE_MAPPING["default"]})`)
    await pool.query(`CREATE INDEX IF NOT EXISTS txsTimeIndex ON "transactions"("transactionTime")`)
}

export const txsTableInit = async (pool: Pool): Promise<void> => {
    for(const collection of TABLE_CLONE_CONFIG){
        if (collection.mode == "delta") {
            await pool.query(`CREATE TABLE IF NOT EXISTS "${collection.from_mongo_collection}" (${TABLE_MAPPING['default']})`)
            await pool.query(`CREATE INDEX IF NOT EXISTS uploadedTime ON "${collection.from_mongo_collection}"("mongo_doc_update_time")`)
        }
    }
    // await pool.query(`CREATE INDEX IF NOT EXISTS txsTimeIndex ON "transactions"("transactionTime")`)
}

export const insertRecord = (pool: Pool, record: any, tableName: string): Promise<QueryResult> => {
    const id = `${record['_id'].toString()}`
    let re = `${JSON.stringify(record)}`
    let newRecord = re.replace(/(['])/g, "''")
    const updateTime = new Date().toISOString()
    return pool.query(`INSERT INTO "${tableName}" (_id, mongo_doc, mongo_doc_update_time, record_update_time) VALUES ('${id}', '${newRecord}', '${updateTime}', '${updateTime}')`)
}

const updateTime = new Date().toISOString()
// export const insertTableRecord = (pool: Pool, record: any, tableName: string): Promise<any> => {
export const insertTableRecord = async (pool: Pool, record: any, tableName: string, updateField: string, latestTime: any): Promise<any> => {
    // const latestTime = await pgGetTime(pool, tableName)
    const id = `${record['_id'].toString()}`
    let re = `${JSON.stringify(record)}`
    let newRecord = re.replace(/(['])/g, "''").replace(/\0[\s\S]*$/g,'').replace(/\u0000/g,'').replace(/\\u0000/g,'')
    const mongoUpdateTime = record[updateField].toISOString()

    // console.log(`Inserting id: ${id}`)
    if (latestTime == null || latestTime == undefined) {
        return pool.query(`INSERT INTO "${tableName}" (_id, mongo_doc, mongo_doc_update_time, record_update_time) VALUES ('${id}', '${newRecord}', '${mongoUpdateTime}', '${updateTime}') ON CONFLICT (_id) DO NOTHING `)
    }

    if (record[updateField].getTime() > latestTime.getTime()) {
        // console.log(latestTime.getTime(), record[updateField].getTime())
        // console.log(2, id,  mongoUpdateTime, updateTime)
        return pool.query(`INSERT INTO "${tableName}" (_id, mongo_doc, mongo_doc_update_time, record_update_time) VALUES ('${id}', '${newRecord}', '${mongoUpdateTime}', '${updateTime}')  ON CONFLICT (_id) DO NOTHING `)
    }
}
export const pgGetTime = async (pool: Pool, tableName: string): Promise<any> => await pool.query(`SELECT MAX(mongo_doc_update_time) FROM "${tableName}"; `).then(res => res.rows[0].max)
const pgCountNumber = async (pool: Pool, tableName: string): Promise<number> => await pool.query(`SELECT COUNT(*) FROM "${tableName}"; `).then(res => { return res.rows[0].count})
// export const pgTotalCount = async (pool: Pool, collection: any): Promise<number> => await pgGetTime(pool, collection.from_mongo_collection) !== null ? pool.query(`SELECT COUNT(1) FROM "${collection.from_mongo_collection}" WHERE "mongo_doc_update_time" < '${await pgGetTime(pool, collection.from_mongo_collection)}'`).then(res => res.rows[0].count) : Promise.resolve(0)
export const pgTotalCount = async (pool: Pool, collection: any): Promise<number> => await pgGetTime(pool, collection.from_mongo_collection) !== null ? pgCountNumber(pool, collection.from_mongo_collection) : Promise.resolve(0)
               
export const pgRecordMaxDate = (pool: Pool):Promise<string> => pool.query('SELECT MAX("uploadedTime") FROM "transactions" ').then(res => res.rows[0].max.toISOString())
pgTotalCount