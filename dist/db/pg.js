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
const pg_1 = require("pg");
const config_1 = require("../utils/config");
const config_2 = require("../utils/config");
exports.pgClientConnect = new pg_1.Pool(config_1.PG_CONNECT_CONFIG);
exports.pgClose = (pool) => pool.end();
exports.otherTableInit = (pool, tableName) => __awaiter(this, void 0, void 0, function* () {
    yield pool.query(`CREATE TABLE IF NOT EXISTS "${tableName}" ( ${config_1.TABLE_MAPPING["default"]})`);
    return pool.query(`TRUNCATE TABLE ${tableName}`);
});
exports.tableInit = (pool, tableName) => __awaiter(this, void 0, void 0, function* () {
    yield pool.query(`CREATE TABLE IF NOT EXISTS "${tableName}" ( ${config_1.TABLE_MAPPING["default"]})`);
    yield pool.query(`CREATE INDEX IF NOT EXISTS txsTimeIndex ON "transactions"("transactionTime")`);
});
exports.txsTableInit = (pool) => __awaiter(this, void 0, void 0, function* () {
    for (const collection of config_2.TABLE_CLONE_CONFIG) {
        if (collection.mode == "delta") {
            yield pool.query(`CREATE TABLE IF NOT EXISTS "${collection.from_mongo_collection}" (${config_1.TABLE_MAPPING['default']})`);
            yield pool.query(`CREATE INDEX IF NOT EXISTS uploadedTime ON "${collection.from_mongo_collection}"("mongo_doc_update_time")`);
        }
    }
});
exports.insertRecord = (pool, record, tableName) => {
    const id = `${record['_id'].toString()}`;
    let re = `${JSON.stringify(record)}`;
    let newRecord = re.replace(/(['])/g, "''");
    const updateTime = new Date().toISOString();
    return pool.query(`INSERT INTO "${tableName}" (_id, mongo_doc, mongo_doc_update_time, record_update_time) VALUES ('${id}', '${newRecord}', '${updateTime}', '${updateTime}')`);
};
const updateTime = new Date().toISOString();
exports.insertTableRecord = (pool, record, tableName, updateField, latestTime) => __awaiter(this, void 0, void 0, function* () {
    const id = `${record['_id'].toString()}`;
    let re = `${JSON.stringify(record)}`;
    let newRecord = re.replace(/(['])/g, "''").replace(/\0[\s\S]*$/g, '').replace(/\u0000/g, '').replace(/\\u0000/g, '');
    const mongoUpdateTime = record[updateField].toISOString();
    if (latestTime == null || latestTime == undefined) {
        return pool.query(`INSERT INTO "${tableName}" (_id, mongo_doc, mongo_doc_update_time, record_update_time) VALUES ('${id}', '${newRecord}', '${mongoUpdateTime}', '${updateTime}') ON CONFLICT (_id) DO NOTHING `);
    }
    if (record[updateField].getTime() > latestTime.getTime()) {
        return pool.query(`INSERT INTO "${tableName}" (_id, mongo_doc, mongo_doc_update_time, record_update_time) VALUES ('${id}', '${newRecord}', '${mongoUpdateTime}', '${updateTime}')  ON CONFLICT (_id) DO NOTHING `);
    }
});
exports.pgGetTime = (pool, tableName) => __awaiter(this, void 0, void 0, function* () { return yield pool.query(`SELECT MAX(mongo_doc_update_time) FROM "${tableName}"; `).then(res => res.rows[0].max); });
const pgCountNumber = (pool, tableName) => __awaiter(this, void 0, void 0, function* () { return yield pool.query(`SELECT COUNT(*) FROM "${tableName}"; `).then(res => { return res.rows[0].count; }); });
exports.pgTotalCount = (pool, collection) => __awaiter(this, void 0, void 0, function* () { return (yield exports.pgGetTime(pool, collection.from_mongo_collection)) !== null ? pgCountNumber(pool, collection.from_mongo_collection) : Promise.resolve(0); });
exports.pgRecordMaxDate = (pool) => pool.query('SELECT MAX("uploadedTime") FROM "transactions" ').then(res => res.rows[0].max.toISOString());
exports.pgTotalCount;
//# sourceMappingURL=pg.js.map