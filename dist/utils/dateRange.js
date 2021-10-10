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
const config_1 = require("./config");
exports.mongoTxsBridgingDate = (client, collectionName, date) => client.db(config_1.MONGO_DB).collection(collectionName).find({ "uploadedTime": { $gt: date } }).sort({ "uploadedTime": 1 }).limit(1).toArray().then(res => {
    if (res.length == 0) {
        return "end";
    }
    else {
        return res[0]["uploadedTime"].toISOString();
    }
});
exports.mongoDataCountWithinDateRange = (client, collectionName, date, date2) => client.db(config_1.MONGO_DB).collection(`${collectionName}`).find({ "uploadedTime": { $gt: date, $lte: date2 } }).count();
exports.mongoDataCountWithoutDateRange = (client, collectionName, date) => client.db(config_1.MONGO_DB).collection(collectionName).find({ "uploadedTime": { $gt: date } }).count();
exports.checkDateRangeData = (mongoClient, collection, dateToFetch) => __awaiter(this, void 0, void 0, function* () {
    return (yield exports.mongoDataCountWithinDateRange(mongoClient, collection.from_mongo_collection, new Date(dateToFetch), new Date(new Date(dateToFetch).setDate(new Date(dateToFetch).getDate() + 10)))) > 0 ?
        dateToFetch :
        (yield exports.mongoTxsBridgingDate(mongoClient, collection.from_mongo_collection, new Date(dateToFetch)));
});
exports.genDateRange = (lastTxsMaxDate) => {
    lastTxsMaxDate === null ? lastTxsMaxDate = '2016-02-11 16:30:26.013Z' : null;
    const dateToFetch = new Date(lastTxsMaxDate);
    const dateToFetchClone = new Date(dateToFetch);
    const dateBefore = new Date(dateToFetch.setDate(dateToFetch.getDate() - 1));
    const dateAfter10Days = new Date(dateToFetchClone.setDate(dateToFetchClone.getDate() + 5));
    console.log(` date before: ${dateBefore}, date After: ${dateAfter10Days}`);
    return { dateBefore, dateAfter10Days };
};
//# sourceMappingURL=dateRange.js.map