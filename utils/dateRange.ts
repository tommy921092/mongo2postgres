import { lastPgUpdateTime } from './csv'
import { MongoClient } from 'mongodb';
import { MONGO_DB } from './config';

export const mongoTxsBridgingDate = (client: MongoClient, collectionName: string, date: Date): Promise<string> => client.db(MONGO_DB).collection(collectionName).find({ "uploadedTime": { $gt: date } }).sort({ "uploadedTime": 1 }).limit(1).toArray().then(res => {
        if (res.length == 0) {
            return "end"
        } else {
            return res[0]["uploadedTime"].toISOString()
        }
    })
export const mongoDataCountWithinDateRange = (client: MongoClient, collectionName: string, date: Date, date2: Date): Promise<number> => client.db(MONGO_DB).collection(`${collectionName}`).find({ "uploadedTime": { $gt: date, $lte: date2 } }).count()
export const mongoDataCountWithoutDateRange = (client: MongoClient,collectionName: string, date: Date): Promise<number> => client.db(MONGO_DB).collection(collectionName).find({ "uploadedTime": { $gt: date } }).count()

export const checkDateRangeData = async (mongoClient: MongoClient, collection: any, dateToFetch: string): Promise<string> => {
    // console.log(33, collection.from_mongo_collection, new Date(dateToFetch), new Date(new Date(dateToFetch).setDate(new Date(dateToFetch).getDate() + 10)))
    return await mongoDataCountWithinDateRange(mongoClient, collection.from_mongo_collection, new Date(dateToFetch), new Date(new Date(dateToFetch).setDate(new Date(dateToFetch).getDate() + 10))) > 0 ?
        dateToFetch : 
        (await mongoTxsBridgingDate(mongoClient, collection.from_mongo_collection, new Date(dateToFetch)))
}

export const genDateRange = (lastTxsMaxDate: string) => {
    lastTxsMaxDate === null ? lastTxsMaxDate = '2016-02-11 16:30:26.013Z' : null
    const dateToFetch: Date = new Date(lastTxsMaxDate);
    const dateToFetchClone: Date = new Date(dateToFetch)
    const dateBefore: Date = new Date(dateToFetch.setDate(dateToFetch.getDate() - 1))
    const dateAfter10Days: Date = new Date(dateToFetchClone.setDate(dateToFetchClone.getDate() + 5))
    console.log(` date before: ${dateBefore}, date After: ${dateAfter10Days}`);
    return { dateBefore, dateAfter10Days }
}