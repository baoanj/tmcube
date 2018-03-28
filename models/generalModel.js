const bcrypt = require('bcrypt');
const debug = require('debug')('tmcube:general:model');

const saltRounds = 2;

module.exports = (db) => {
  const collection = db.collection('users');

  return {
    insertUser(name, stuId, email, password, role) {
      return new Promise((resolve, reject) => {
        bcrypt.hash(password, saltRounds).then((hash) => {
          collection.insert({
            name,
            stuId,
            email,
            password: hash,
            role
          }).then((result) => resolve(result), (error) => reject(error));
        }, () => reject());
      });
    },

    checkEmailExist(email) {
      return new Promise((resolve, reject) => {
        collection.findOne({ email })
          .then((result) => {
            if (result) reject();
            else resolve();
          }, () => reject());
      });
    },

    checkLogin(email, password) {
      return new Promise((resolve, reject) => {
        collection.findOne({ email }).then((doc) => {
          bcrypt.compare(password, doc.password).then((res) => {
            if (res) resolve(doc);
            else reject('密码错误');
          });
        }).catch(() => { reject('登录失败'); });
      });
    }
  };
};
