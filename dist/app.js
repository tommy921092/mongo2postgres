"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongo_1 = require("./db/mongo");
const pg_1 = require("./db/pg");
const csv_1 = require("./utils/csv");
const dateRange_1 = require("./utils/dateRange");
const config_1 = require("./utils/config");
var schedule = require('node-schedule');
function main(mongoClient, pgClient, dateBefore, dateAfter10Days) {
    return __awaiter(this, void 0, void 0, function* () {
        const start = Date.now();
        const mongoTxsWithSpare = yield mongo_1.mongoTransaction(mongoClient, dateBefore, dateAfter10Days);
        const txs = mongoTxsWithSpare.map(tx => mongo_1.flatternAndReformOBJ(tx));
        const maxDate = yield mongo_1.mongoTxsMaxDate(mongoClient, dateBefore, dateAfter10Days);
        console.log(`Finish Fetch Data From MongoDB ${Date.now() - start} ms`);
        yield pg_1.txsTableInit(pgClient);
        let txsTotalyNewJobsCount = 0;
        let txsInsertPg = 0;
        const txsJobs = txs.map((record) => pg_1.insertRecord(pgClient, record, 'transactions').then((res) => res.rowCount > 0 ? (txsTotalyNewJobsCount += 1, txsInsertPg += 1, csv_1.writeIdLog(record['_id'])) : txsInsertPg += 1).catch(err => csv_1.writeBadLog(record['_id'], err.message)));
        yield Promise.all(txsJobs);
        txsInsertPg === mongoTxsWithSpare.length ? console.log(`Partial Job Done ${Date.now() - start} ms`) : console.log(`Something went wrong!!! pgInsertedCount : ${txsInsertPg} mongoFetchCount : ${mongoTxsWithSpare.length}`);
        const maxDateLog = maxDate.toISOString();
        txsTotalyNewJobsCount > 0 && console.log('is new txs insert', txsTotalyNewJobsCount > 0);
        txsInsertPg === mongoTxsWithSpare.length && txsTotalyNewJobsCount > 0 && csv_1.writeLog(maxDateLog);
    });
}
const otherTableData = (pgClient, mongoClient, collection) => __awaiter(this, void 0, void 0, function* () {
    if (collection.mode == "full") {
        console.log(collection.from_mongo_collection);
        yield pg_1.otherTableInit(pgClient, collection.to_pgsql_table);
        const records = yield mongo_1.mongoCollectionFindFull(mongoClient, collection.from_mongo_collection);
        return records;
    }
});
const otherTableInsert = (pgClient, record, tableName) => pg_1.insertRecord(pgClient, record, tableName);
const tableInsert = (pgClient, record, tableName, updateField, latestTime) => pg_1.insertTableRecord(pgClient, record, tableName, updateField, latestTime);
const mongoAndPgRowCompare = (collection, pgClient, mongoClient, action) => __awaiter(this, void 0, void 0, function* () {
    let pgCount = yield pg_1.pgTotalCount(pgClient, collection);
    let mgCount = action === 'checkAnyUpdate' ? yield mongo_1.mongoCount(mongoClient, collection) : yield mongo_1.mongoTotalCountWithDate(mongoClient, collection);
    console.log(`number of data in pg: ${Number(pgCount)}, number of data in mongo: ${mgCount}`);
    return Number(pgCount) === mgCount ? { shouldDo: false, pgCount, mongoCount: mgCount } : { shouldDo: true, pgCount, mongoCount: mgCount };
});
const pgTableAndLogCompare = (pool) => __awaiter(this, void 0, void 0, function* () { return (yield pg_1.pgRecordMaxDate(pool)) === csv_1.lastPgUpdateTime(); });
let firstRun = false;
function loop4Postgres() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const mongoClient = yield mongo_1.mongoClientConnect;
            const pgClient = pg_1.pgClientConnect;
            const otherTables = () => __awaiter(this, void 0, void 0, function* () {
                for (const collection of config_1.TABLE_CLONE_CONFIG) {
                    if (collection.mode == "full") {
                        console.log(`get new updates ======${collection.from_mongo_collection}=====> `);
                        const records = yield otherTableData(pgClient, mongoClient, collection);
                        yield Promise.all(records.map(innerRecord => otherTableInsert(pgClient, innerRecord, collection.to_pgsql_table)));
                        console.log(`${collection.to_pgsql_table} is up to date: ${new Date().toDateString()}`);
                    }
                }
            });
            yield otherTables();
            yield pg_1.txsTableInit(pgClient);
            for (const collection of config_1.TABLE_CLONE_CONFIG) {
                if (collection.mode == "delta") {
                    let { shouldDo: shouldRun } = yield mongoAndPgRowCompare(collection, pgClient, mongoClient, 'checkAnyUpdate');
                    console.log(`get new updates ======${collection.from_mongo_collection} table=====> `, shouldRun);
                    while (shouldRun) {
                        let time = yield pg_1.pgGetTime(pgClient, collection.from_mongo_collection);
                        const dateShouldBeFetch = yield dateRange_1.checkDateRangeData(mongoClient, collection, time);
                        if (dateShouldBeFetch == "end") {
                            shouldRun = false;
                        }
                        const { dateBefore, dateAfter10Days } = dateRange_1.genDateRange(dateShouldBeFetch);
                        console.log(`${collection.to_pgsql_table} Table, getting data from (${dateBefore}) to (${dateAfter10Days})`);
                        const records = yield mongo_1.mongoCollectionFindAll(mongoClient, collection.from_mongo_collection, dateBefore, dateAfter10Days);
                        let latestTime = yield pg_1.pgGetTime(pgClient, collection.from_mongo_collection);
                        yield Promise.all(records.map(innerRecord => tableInsert(pgClient, innerRecord, collection.from_mongo_collection, collection.mongo_doc_update_field, latestTime)));
                        let { shouldDo: shouldStart } = yield mongoAndPgRowCompare(collection, pgClient, mongoClient, 'checkAnyUpdate');
                        time = yield pg_1.pgGetTime(pgClient, collection.from_mongo_collection);
                        let newTime = new Date().getTime();
                        if (dateAfter10Days.getTime() > newTime || !shouldStart) {
                            shouldRun = false;
                        }
                    }
                    console.log(`${collection.to_pgsql_table} is up to date: ${new Date().toDateString()}`);
                }
            }
            yield mongo_1.mongoClose(mongoClient);
            yield pg_1.pgClose(pgClient);
            firstRun = true;
        }
        catch (err) {
            console.log("catch");
            console.error(err);
        }
    });
}
console.log("firstRun: ", firstRun);
loop4Postgres();
schedule.scheduleJob('0 0 * * *', () => {
    if (firstRun) {
        console.log('Restart Mongo2Postgres');
        loop4Postgres();
    }
});
//# sourceMappingURL=app.js.map