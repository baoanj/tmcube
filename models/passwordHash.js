const crypto = require('crypto');
const secret = 'sysu';

module.exports = password => crypto.createHmac('sha256', secret).update(password).digest('hex');
