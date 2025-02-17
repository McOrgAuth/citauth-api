const nodemailer = require('nodemailer');
const Logger = require('./Logger');

class Mailer {
    options = {};
    logger = undefined;
    constructor(logger, host, port, user, pass) {
        this.options = {
            host: host,
            port: port,
            secure: false,
            requireTLS: true,
            tls: {
                rejectUnAuthorized: true,
                minVersion: "TLSv1.2"
            },
            auth: {
                user: user,
                pass: pass
            }
        };
        this.logger = logger;
    }

    send(mail) {
        try {
            const transport = nodemailer.createTransport(this.options);
            this.logger.log("Email is being sent");
            transport.sendMail(mail);
        } catch(err) {
            this.logger.error(err);
        }
    }

    mail_register_succeeded(from, to, preregid) {
        const html = 
        "<h3>CITAUTH-SYSTEM</h3><br>"+
        "CITAUTH-SYSTEMの仮登録を以下のリンクから完了してください。リンクは発行後15分間有効です。<br>"+
        `<b><a href="https://citauth.chosuichi.com/confirm.php?preregid=${preregid}">click here</a></b><br>`+
        "本メールは、CITAUTHシステムへの仮登録の際に入力されたメールアドレス宛に自動送信しております。お心当たりがない場合は破棄ください。<br>"+
        "----------<br>"+
        "CITAUTH: https://citauth.chosuichi.com";
        return {
            from: from,
            to: to,
            subject: "CITAUTH: メールアドレスの確認",
            html: html
        }
    }

    mail_register_failed(from, to) {
        const html =
        "<h3>CITAUTH-SYSTEM</h3><br>"+
        "仮登録申請を受付いたしましたが、あなたのメールアドレスはすでに本システムに登録されています。<br>"+
        "本メールは、CITAUTHシステムへの仮登録申請の際に入力されたメールアドレス宛に自動送信しております。お心当たりがない場合は破棄ください。<br>"+
        "----------<br>"+
        "CITAUTH: https://citauth.chosuichi.com";
        return {
            from: from,
            to: to,
            subject: "CITAUTH: すでに登録されています",
            html: html
        }
    }

    mail_predelete_succeeded(from, to, predelid) {
        const html = 
        "<h3>CITAUTH-SYSTEM</h3><br>"+
        "CITAUTH-SYSTEMは登録削除申請を受け付けました。以下のリンクから完了してください。リンクは発行後15分間有効です。<br>"+
        `<b><a href="https://citauth.chosuichi.com/confirm.php?predelid=${predelid}">click here</a></b><br>`+
        "本メールは、CITAUTHシステムへの登録削除申請の際に入力されたメールアドレス宛に自動送信しております。お心当たりがない場合はご連絡ください。<br>"+
        "----------<br>"+
        "CITAUTH: https://citauth.chosuichi.com";
        return {
            from: from,
            to: to,
            subject: "CITAUTH: 登録削除申請を受付しました",
            html: html
        }
    }

    mail_predelete_failed(from, to) {
        const html = 
        "<h3>CITAUTH-SYSTEM</h3><br>"+
        "CITAUTH-SYSTEMは登録削除申請を受付いたしましたが、本システム上ではユーザデータが見つかりませんでした。<br>"+
        "本メールは、CITAUTHシステムへの登録削除申請の際に入力されたメールアドレス宛に自動送信しております。お心当たりがない場合はご連絡ください。<br>"+
        "----------<br>"+
        "CITAUTH: https://citauth.chosuichi.com";
        return {
            from: from,
            to: to,
            subject: "CITAUTH: 登録削除申請を受付しました",
            html: html
        }
    }

    mail_delete_completed(from, to) {
        const html = 
        "<h3>CITAUTH-SYSTEM</h3><br>"+
        "登録削除処理に成功しました。"+
        "----------<br>"+
        "CITAUTH: https://citauth.chosuichi.com";
        return {
            from: from,
            to: to,
            subject: "CITAUTH: 登録削除完了いたしました",
            html: html
        }
    }
    
}

module.exports = Mailer;