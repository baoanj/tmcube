const bcrypt = require('bcrypt');
const ObjectID = require('mongodb').ObjectID;

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
    },

    findClass(classId) {
      return new Promise((resolve, reject) => {
        collection2.findOne({ classId }).then((doc) => {
        	const homeworks = doc.homeworks.map((item) => {
            return {
              createDate: item.createDate,
              beginDate: item.beginDate,
              endDate: item.endDate,
              title: item.title,
              description: item.description,
              amountOfSubs: item.submissions.length
            };
          });
          if (doc.userIds.length) {
            const userIds = doc.userIds.map((item) => ({ _id: ObjectID(item) }));
            collection.find({ $or: userIds }).toArray().then((docs) => {
            	const students = docs.map((item) => {
                return {
                  name: item.name,
                  stuId: item.stuId,
                  email: item.email,
                  userId: item._id
                }
              });
              resolve({
                name: doc.name,
                teacherName: doc.teacherName,
                password: doc.password,
                students,
                homeworks
              });
            });
          } else {
            resolve({
              name: doc.name,
              teacherName: doc.teacherName,
              password: doc.password,
              students: [],
              homeworks
            });
          }
        }).catch((error) => {
          reject(error);
        });
      });
    }
  };
};
