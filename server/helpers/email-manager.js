const nodemailer = require('nodemailer');

class EmailManager {
  constructor() {
  }

  async sendMail(mailOptions, email = global.CONFIG.mailServer.to, bcc = global.CONFIG.mailServer.bcc) {
    let sendEMail, smtpConfiguration, emailTransporter, emailObj;
    mailOptions.from = global.CONFIG.mailServer.from;
    mailOptions.to = email;
    mailOptions.bcc = bcc;
    console.info(' mailOptions.to', mailOptions.to);
    console.info('mailOptions.bcc', mailOptions.bcc);
    smtpConfiguration = {
      host: global.CONFIG.mailServer.host,
      port: global.CONFIG.mailServer.port,
      secure: global.CONFIG.mailServer.secure,
      debug: global.CONFIG.mailServer.debug,
      auth: {
        user: global.CONFIG.mailServer.username,
        pass: global.CONFIG.mailServer.password
      }
    };
    emailTransporter = await nodemailer.createTransport(smtpConfiguration);
    try {
      let mailResponse = await emailTransporter.sendMail(mailOptions);
      console.info('mailResponse : ', mailResponse);
      return mailResponse;
    } catch (mailError) {
      console.info('mailError : ', mailError);
      throw mailError;
    }
  }

}

module.exports = EmailManager;
