"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const config_1 = require("./config");
const fs_1 = require("fs");
const papaparse_1 = require("papaparse");
const logFile = () => fs_1.readFileSync(config_1.LOG_FILE, 'utf-8');
exports.lastPgUpdateTime = () => {
    let output;
    papaparse_1.parse(logFile(), { header: true, complete: (result) => result.data.length === 1 ? output = null : output = result.data[result.data.length - 2].TxsUploadedTime });
    return output;
};
const badLogFile = () => fs_1.readFileSync(config_1.BAD_LOG_FILE, 'utf-8');
exports.badLog = () => {
    let output;
    papaparse_1.parse(badLogFile(), { header: true, complete: (result) => result.data.length === 1 ? output = null : (result.data.pop(), output = result.data) });
    return output;
};
exports.writeLog = (TxsLastTransfer) => {
    const file2append = fs_1.openSync(config_1.LOG_FILE, 'a');
    fs_1.appendFileSync(file2append, `${TxsLastTransfer},${new Date().toISOString()} \n`, 'utf-8');
    fs_1.closeSync(file2append);
};
exports.writeBadLog = (TxsID, ErrorMsg) => {
    const file2append = fs_1.openSync(config_1.BAD_LOG_FILE, 'a');
    fs_1.appendFileSync(file2append, `${TxsID},${ErrorMsg},${new Date().toISOString()}\n`, 'utf-8');
    fs_1.closeSync(file2append);
};
exports.writeIdLog = (ID) => {
    const file2append = fs_1.openSync(config_1.INSERTED_PG_ID, 'a');
    fs_1.appendFileSync(file2append, `${ID}\n`, 'utf-8');
    fs_1.closeSync(file2append);
};
exports.resetBadLog = () => {
    const file2reset = fs_1.openSync(config_1.BAD_LOG_FILE, 'w');
    fs_1.writeFileSync(file2reset, 'TxsbadLogID,Message,PgInsertDate\n', 'utf-8');
    fs_1.closeSync(file2reset);
};
//# sourceMappingURL=csv.js.map