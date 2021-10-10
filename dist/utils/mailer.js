"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const nodemailer_1 = require("nodemailer");
const config_1 = require("./config");
const mustache_1 = require("mustache");
const csv_1 = require("./csv");
const transporter = nodemailer_1.createTransport({
    service: 'gmail',
    auth: config_1.AUTH_INFO
});
const mailOptions = (latestUploadedDate, { pgCount, mongoCount }) => {
    return {
        from: ` "Mongo2Pg" <${config_1.AUTH_INFO.user}>`,
        to: config_1.RECEIVERS,
        subject: 'mongo2pg error occur',
        html: mustache_1.render(config_1.MUSTACHE_HTML, { latestUploadedDate, pgCount, mongoCount, badLog: csv_1.badLog })
    };
};
exports.sendMail = (inputDate, twoTableCountObj) => transporter.sendMail(mailOptions(inputDate, twoTableCountObj));
//# sourceMappingURL=mailer.js.map