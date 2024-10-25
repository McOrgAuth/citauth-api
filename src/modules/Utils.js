class Utils {
    constructor() {

    }

    error_json(msg) {
        let error = {
            "error": msg
        };
        return error;
    }

    unixtime(date) {
        return Math.trunc(date / 1000);
    }
}

module.exports = Utils;