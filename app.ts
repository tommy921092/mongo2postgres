import { mongoCount, mongoCollectionFindFull, mongoClientConnect, mongoTransaction, mongoClose, flatternAndReformOBJ, mongoTxsMaxDate, mongoCollectionFindAll, mongoTotalCountWithDate,  mongoAllCount, mongoCollections } from './db/mongo'
import { pgGetTime, pgClientConnect, pgClose, insertRecord, insertTableRecord, txsTableInit, tableInit, otherTableInit, pgTotalCount, pgRecordMaxDate } from './db/pg'
import { writeLog, lastPgUpdateTime, writeBadLog, writeIdLog, resetBadLog } from './utils/csv'
import { MongoClient, FilterQuery } from 'mongodb';
import { Pool, QueryResult } from 'pg';
import { checkDateRangeData, genDateRange, mongoDataCountWithoutDateRange } from './utils/dateRange';
import { OTHER_TABLES, TABLE_CLONE_CONFIG } from './utils/config'
import { sendMail } from './utils/mailer'
var schedule = require('node-schedule');

async function main(mongoClient: MongoClient, pgClient: Pool, dateBefore: Date, dateAfter10Days: Date) {
    const start = Date.now()

    // Fetch Data From MongoDB
    const mongoTxsWithSpare = await mongoTransaction(mongoClient, dateBefore, dateAfter10Days)

    // txs transformation
    const txs = mongoTxsWithSpare.map(tx => flatternAndReformOBJ(tx))
    const maxDate = await mongoTxsMaxDate(mongoClient, dateBefore, dateAfter10Days)
    console.log(`Finish Fetch Data From MongoDB ${Date.now() - start} ms`)

    // Insert Data To PG
    await txsTableInit(pgClient)
    let txsTotalyNewJobsCount: number = 0
    let txsInsertPg: number = 0
    const txsJobs: Array<Promise<any>> = txs.map((record) => insertRecord(pgClient, record, 'transactions').then((res) => res.rowCount > 0 ? (txsTotalyNewJobsCount += 1, txsInsertPg += 1, writeIdLog(record['_id'])) : txsInsertPg += 1).catch(err => writeBadLog(record['_id'], err.message)))
    await Promise.all(txsJobs)
    txsInsertPg === mongoTxsWithSpare.length ? console.log(`Partial Job Done ${Date.now() - start} ms`) : console.log(`Something went wrong!!! pgInsertedCount : ${txsInsertPg} mongoFetchCount : ${mongoTxsWithSpare.length}`)

    // Write Log
    const maxDateLog = maxDate.toISOString()
    txsTotalyNewJobsCount > 0 && console.log('is new txs insert', txsTotalyNewJobsCount > 0)
    txsInsertPg === mongoTxsWithSpare.length && txsTotalyNewJobsCount > 0 && writeLog(maxDateLog)
}

// const otherTableData = async (pgClient: Pool, mongoClient: MongoClient, collectionName: string): Promise<Array<any>> => {
const otherTableData = async (pgClient: Pool, mongoClient: MongoClient, collection: any): Promise<any> => {
    if (collection.mode == "full") {
        console.log(collection.from_mongo_collection)
        await otherTableInit(pgClient, collection.to_pgsql_table)
        const records: FilterQuery<any> = await mongoCollectionFindFull(mongoClient, collection.from_mongo_collection)
        return records
    }
}

const otherTableInsert = (pgClient: Pool, record: any, tableName: string): Promise<QueryResult> => insertRecord(pgClient, record, tableName)

const tableInsert = (pgClient: Pool, record: any, tableName: string, updateField: string, latestTime: any): Promise<QueryResult> => insertTableRecord(pgClient, record, tableName, updateField, latestTime)

const mongoAndPgRowCompare = async (collection: any, pgClient: Pool, mongoClient: MongoClient, action: string): Promise<{ shouldDo: boolean, pgCount: number, mongoCount: number }> => {
    // let time = await pgGetTime(pgClient, collection.from_mongo_collection)
    // console.log(collection, time)
    let pgCount = await pgTotalCount(pgClient, collection)

    let mgCount = action === 'checkAnyUpdate' ? await mongoCount(mongoClient, collection) : await mongoTotalCountWithDate(mongoClient, collection)
    console.log(`number of data in pg: ${Number(pgCount)}, number of data in mongo: ${mgCount}`)
    return Number(pgCount) === mgCount ? { shouldDo: false, pgCount, mongoCount:mgCount } : { shouldDo: true, pgCount, mongoCount:mgCount }
}

const pgTableAndLogCompare = async(pool: Pool):Promise<boolean> => await pgRecordMaxDate(pool) === lastPgUpdateTime()

let firstRun = false

async function loop4Postgres() {
    try {
        const mongoClient: MongoClient = await mongoClientConnect
        const pgClient: Pool = pgClientConnect

        // mongoInsert(mongoClient)
        const otherTables = async () => {
        	for(const collection of TABLE_CLONE_CONFIG){
                if (collection.mode == "full") {
                    console.log(`get new updates ======${collection.from_mongo_collection}=====> `)

                    const records = await otherTableData(pgClient, mongoClient, collection)
                    await Promise.all(records.map(innerRecord => otherTableInsert(pgClient, innerRecord, collection.to_pgsql_table)))
                console.log(`${collection.to_pgsql_table} is up to date: ${new Date().toDateString()}`)
                } 
            }
        }
        await otherTables()

        await txsTableInit(pgClient)

        for(const collection of TABLE_CLONE_CONFIG){
            if (collection.mode == "delta") {
                let { shouldDo: shouldRun } = await mongoAndPgRowCompare(collection, pgClient, mongoClient, 'checkAnyUpdate')
                console.log(`get new updates ======${collection.from_mongo_collection} table=====> `,shouldRun)

                while (shouldRun) {
                    let time = await pgGetTime(pgClient, collection.from_mongo_collection)
                    const dateShouldBeFetch: string = await checkDateRangeData(mongoClient, collection, time)
                    if (dateShouldBeFetch == "end") {
                        shouldRun = false
                    }
                    const { dateBefore, dateAfter10Days } = genDateRange(dateShouldBeFetch)
                    console.log(`${collection.to_pgsql_table} Table, getting data from (${dateBefore}) to (${dateAfter10Days})`)

                    const records: FilterQuery<any> = await mongoCollectionFindAll(mongoClient, collection.from_mongo_collection, dateBefore, dateAfter10Days)
                    let latestTime = await pgGetTime(pgClient, collection.from_mongo_collection)
                    await Promise.all(records.map(innerRecord => tableInsert(pgClient, innerRecord, collection.from_mongo_collection, collection.mongo_doc_update_field, latestTime)))

                    let { shouldDo: shouldStart } = await mongoAndPgRowCompare(collection, pgClient, mongoClient, 'checkAnyUpdate')
                    time = await pgGetTime(pgClient, collection.from_mongo_collection)
                    let newTime =  new Date().getTime()
                    if (dateAfter10Days.getTime() > newTime || !shouldStart) {
                        shouldRun = false
                    }
                }
                console.log(`${collection.to_pgsql_table} is up to date: ${new Date().toDateString()}`)
            }
        }
        await mongoClose(mongoClient)
        await pgClose(pgClient)
        firstRun = true
    } catch (err) {
        console.log("catch")
        console.error(err)
    }
}
console.log("firstRun: ", firstRun)
loop4Postgres()

schedule.scheduleJob('0 0 * * *', () => {
    if (firstRun) {
        console.log('Restart Mongo2Postgres');
        loop4Postgres()
    }
})

