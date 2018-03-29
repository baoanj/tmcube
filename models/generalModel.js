const bcrypt = require('bcrypt');

const saltRounds = 2;

module.exports = (db) => {
  const collection = db.collection('users');
  const collection2 = db.collection('classes');

  return {
    insertUser(name, stuId, email, password, role) {
      return new Promise((resolve, reject) => {
        bcrypt.hash(password, saltRounds).then((hash) => {
          collection.insert({
            name,
            stuId,
            email,
            password: hash,
            role,
            classIds: []
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
    },

    findClasses(classIds) {
      const queryIds = classIds.map((item) => ({ classId: item }));
      return new Promise((resolve, reject) => {
        collection2.find({ $or: queryIds }).toArray().then((docs) => {
        	resolve(docs.map((item) => ({
            classId: item.classId,
            name: item.name,
            teacherName: item.teacherName,
            password: item.password,
            amountOfStus: item.userIds.length,
            anountOfHws: item.homeworks.length
          })));
        }).catch((error) => {
          reject(error);
        });
      });
    }
  };
};
