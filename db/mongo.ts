import { MongoClient, FilterQuery, ObjectId, ObjectID } from 'mongodb';
import { MONGO_URLs, MONGO_DB } from '../utils/config'
import { lastPgUpdateTime } from '../utils/csv';

export const mongoClientConnect: Promise<MongoClient> = new Promise((resolve, reject) => MongoClient.connect(MONGO_URLs, { 
    useNewUrlParser: true,
    poolSize: 10,
    native_parser: true,
    useUnifiedTopology: true,
    }).then(client => resolve(client)).catch((err) => reject(err)))
// export const mongoCollectionFindAll = (client: MongoClient, collectionName: string): Promise<FilterQuery<any>> => client.db(MONGO_DB).collection(collectionName).find({"_id": new ObjectId("5b0e24bdb641d913f5db7d75")}).toArray()
export const mongoCollectionFindFull = (client: MongoClient, collectionName: string): Promise<FilterQuery<any>> => client.db(MONGO_DB).collection(collectionName).find({}).toArray()
export const mongoCollectionFindAll = (client: MongoClient, collectionName: string, date: Date, date2: Date): Promise<FilterQuery<any>> => {return client.db(MONGO_DB).collection(collectionName).find({"uploadedTime": { $gte: date, $lte: date2 } }).toArray()}
export const mongoTransaction = (client: MongoClient, date: Date, date2: Date): Promise<FilterQuery<any>> => client.db(MONGO_DB).collection('transactions').find({ "uploadedTime": { $gte: date, $lte: date2 } }).sort({ "uploadedTime": 1 }).toArray()
export const mongoTxsMaxDate = (client: MongoClient, date: Date, date2: Date): Promise<Date> => client.db(MONGO_DB).collection('transactions').aggregate([
    { $match: { "uploadedTime": { $gte: date, $lte: date2 } } },
    { $group: { _id: 'returnMaxDate', maxDate: { $max: "$uploadedTime" } } }
]).toArray().then(res => res[0].maxDate)
export const mongoTotalCountWithDate = (client: MongoClient, collection: string): Promise<number> => {
    let filerParams: any;
    lastPgUpdateTime() !== null ? filerParams = { "uploadedTime": { $lt: new Date(lastPgUpdateTime()) } } : {}
    return client.db(MONGO_DB).collection(collection).find(filerParams).count()
}
export const mongoCollections = (client: MongoClient): Promise<any> => client.db(MONGO_DB).listCollections().toArray()
export const mongoAllCount = (client: MongoClient): Promise<number> => client.db(MONGO_DB).collection('transactions').countDocuments()
export const mongoCount = (client: MongoClient, collection: any): Promise<number> => client.db(MONGO_DB).collection(collection.from_mongo_collection).countDocuments()
export const mongoAllTxsId = (client: MongoClient): Promise<Array<string>> => client.db(MONGO_DB).collection('transactions').find({}).project({ _id: 1 }).toArray().then(res => res.map(item => item._id))
export const mongoClose = (client: MongoClient): Promise<void> => client.close()


export const flatternAndReformOBJ = (obj: any) => {
    let output = {}
    Object.keys(obj).forEach(key => {
        if (typeof obj[key] !== 'object') {
            typeof obj[key] === 'string' ?
                obj[key].includes('�') ? output[key] = '' :
                    output[key] = obj[key].replace(/\0/g, '').trim() :
                output[key] = obj[key]
        } else {
            if (obj[key] instanceof Array) {
                if (key === 'products' || key === 'stores' || key === 'paymentMethods' || key === 'octUploadedTime') {
                    output[key] = obj[key].map(item => item.toString())
                } else {
                    output[key] = obj[key].map(innerItem => flatternAndReformOBJ(innerItem))
                }
            } else if (key === '_id' || key === 'vendor' || key === 'created_by') {
                obj[key] !== null ? output[key] = obj[key].toString() : output[key] = null
            } else if (key === 'others') {
                obj[key] !== null ? output[key] = flatternAndReformOBJ(obj[key]) : output[key] = null
            } else {
                output[key] = obj[key]
            }
        }
    })
    return output
}
