"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongodb_1 = require("mongodb");
const config_1 = require("../utils/config");
const csv_1 = require("../utils/csv");
exports.mongoClientConnect = new Promise((resolve, reject) => mongodb_1.MongoClient.connect(config_1.MONGO_URLs, {
    useNewUrlParser: true,
    poolSize: 10,
    native_parser: true,
    useUnifiedTopology: true,
}).then(client => resolve(client)).catch((err) => reject(err)));
exports.mongoCollectionFindFull = (client, collectionName) => client.db(config_1.MONGO_DB).collection(collectionName).find({}).toArray();
exports.mongoCollectionFindAll = (client, collectionName, date, date2) => { return client.db(config_1.MONGO_DB).collection(collectionName).find({ "uploadedTime": { $gte: date, $lte: date2 } }).toArray(); };
exports.mongoTransaction = (client, date, date2) => client.db(config_1.MONGO_DB).collection('transactions').find({ "uploadedTime": { $gte: date, $lte: date2 } }).sort({ "uploadedTime": 1 }).toArray();
exports.mongoTxsMaxDate = (client, date, date2) => client.db(config_1.MONGO_DB).collection('transactions').aggregate([
    { $match: { "uploadedTime": { $gte: date, $lte: date2 } } },
    { $group: { _id: 'returnMaxDate', maxDate: { $max: "$uploadedTime" } } }
]).toArray().then(res => res[0].maxDate);
exports.mongoTotalCountWithDate = (client, collection) => {
    let filerParams;
    csv_1.lastPgUpdateTime() !== null ? filerParams = { "uploadedTime": { $lt: new Date(csv_1.lastPgUpdateTime()) } } : {};
    return client.db(config_1.MONGO_DB).collection(collection).find(filerParams).count();
};
exports.mongoCollections = (client) => client.db(config_1.MONGO_DB).listCollections().toArray();
exports.mongoAllCount = (client) => client.db(config_1.MONGO_DB).collection('transactions').countDocuments();
exports.mongoCount = (client, collection) => client.db(config_1.MONGO_DB).collection(collection.from_mongo_collection).countDocuments();
exports.mongoAllTxsId = (client) => client.db(config_1.MONGO_DB).collection('transactions').find({}).project({ _id: 1 }).toArray().then(res => res.map(item => item._id));
exports.mongoClose = (client) => client.close();
exports.flatternAndReformOBJ = (obj) => {
    let output = {};
    Object.keys(obj).forEach(key => {
        if (typeof obj[key] !== 'object') {
            typeof obj[key] === 'string' ?
                obj[key].includes('�') ? output[key] = '' :
                    output[key] = obj[key].replace(/\0/g, '').trim() :
                output[key] = obj[key];
        }
        else {
            if (obj[key] instanceof Array) {
                if (key === 'products' || key === 'stores' || key === 'paymentMethods' || key === 'octUploadedTime') {
                    output[key] = obj[key].map(item => item.toString());
                }
                else {
                    output[key] = obj[key].map(innerItem => exports.flatternAndReformOBJ(innerItem));
                }
            }
            else if (key === '_id' || key === 'vendor' || key === 'created_by') {
                obj[key] !== null ? output[key] = obj[key].toString() : output[key] = null;
            }
            else if (key === 'others') {
                obj[key] !== null ? output[key] = exports.flatternAndReformOBJ(obj[key]) : output[key] = null;
            }
            else {
                output[key] = obj[key];
            }
        }
    });
    return output;
};
//# sourceMappingURL=mongo.js.map