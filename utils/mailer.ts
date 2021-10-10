import { createTransport, Transporter } from 'nodemailer';
import { AUTH_INFO, RECEIVERS, MUSTACHE_HTML } from './config'
import { render } from 'mustache';
import { badLog } from './csv'

type TwoTableCountObj = {
    pgCount: number;
    mongoCount: number;
}

const transporter: Transporter = createTransport({
    service: 'gmail',
    auth: AUTH_INFO
});

const mailOptions = (latestUploadedDate: string, { pgCount, mongoCount }: TwoTableCountObj) => {
    return {
        from: ` "Mongo2Pg" <${AUTH_INFO.user}>`,
        to: RECEIVERS,
        subject: 'mongo2pg error occur',
        html: render(MUSTACHE_HTML, { latestUploadedDate, pgCount, mongoCount, badLog })
    }
}

export const sendMail = (inputDate: string, twoTableCountObj: TwoTableCountObj) => transporter.sendMail(mailOptions(inputDate, twoTableCountObj))