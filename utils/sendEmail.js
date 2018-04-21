const nodemailer = require('nodemailer');
const transport = require('../mail.config.js');

const transporter = nodemailer.createTransport(transport);

module.exports = (to, subject, text) =>
  new Promise((resolve, reject) => {
    transporter.sendMail({
      from: '高校教学管理系统<tmcu@baoanj.xyz>',
      to,
      subject,
      text
    }).then((info) => {
      resolve(info);
    }).catch((error) => {
      reject(error);
    });
  });
