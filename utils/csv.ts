import { LOG_FILE, BAD_LOG_FILE, INSERTED_PG_ID } from './config';
import { appendFileSync, readFileSync, openSync, closeSync, writeFileSync } from 'fs';
import { parse } from 'papaparse'

const logFile = () => readFileSync(LOG_FILE, 'utf-8')
export const lastPgUpdateTime = (): string => {
    let output;
    parse(logFile(), { header: true, complete: (result) => result.data.length === 1 ? output = null : output = result.data[result.data.length - 2].TxsUploadedTime })
    return output
}

const badLogFile = () => readFileSync(BAD_LOG_FILE, 'utf-8')
export const badLog = (): string => {
    let output;
    parse(badLogFile(), { header: true, complete: (result) => result.data.length === 1 ? output = null : (result.data.pop(), output = result.data) })
    return output
}

export const writeLog = (TxsLastTransfer: string): void => {
    const file2append = openSync(LOG_FILE, 'a')
    appendFileSync(file2append, `${TxsLastTransfer},${new Date().toISOString()} \n`, 'utf-8')
    closeSync(file2append)
}

export const writeBadLog = (TxsID: string, ErrorMsg: string): void => {
    const file2append = openSync(BAD_LOG_FILE, 'a')
    appendFileSync(file2append, `${TxsID},${ErrorMsg},${new Date().toISOString()}\n`, 'utf-8')
    closeSync(file2append)
}

export const writeIdLog = (ID: string): void => {
    const file2append =  openSync(INSERTED_PG_ID, 'a')
    appendFileSync(file2append, `${ID}\n`, 'utf-8')
    closeSync(file2append)
}

export const resetBadLog = (): void => {
    const file2reset = openSync(BAD_LOG_FILE, 'w')
    writeFileSync(file2reset, 'TxsbadLogID,Message,PgInsertDate\n', 'utf-8')
    closeSync(file2reset)
}
