const debug = require('debug')('tmcube:general:model');
const ObjectID = require('mongodb').ObjectID;
const passwordHash = require('./passwordHash');

module.exports = (db) => {
  const collection = db.collection('users');
  const collection2 = db.collection('classes');

  return {
    insertUser(name, stuId, email, password, role) {
      return new Promise((resolve, reject) => {
        const hash = passwordHash(password);
        collection.insert({
          name,
          stuId,
          email,
          password: hash,
          role,
          classIds: []
        }).then((result) => resolve(result), (error) => reject(error));
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
          const hash = passwordHash(password);
          if (hash === doc.password) resolve(doc);
          else reject('密码错误');
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

    updateUserClassIds(_id, classIds) {
      return new Promise((resolve, reject) => {
        collection.updateOne(
          { _id: ObjectID(_id) },
          { $set: { classIds } }
        ).then(() => {
          resolve();
        }).catch((error) => {
          debug(error);
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
                classId: doc.classId,
                name: doc.name,
                teacherName: doc.teacherName,
                password: doc.password,
                message: doc.message,
                students,
                homeworks,
                coursewares: doc.coursewares
              });
            });
          } else {
            resolve({
              classId: doc.classId,
              name: doc.name,
              teacherName: doc.teacherName,
              password: doc.password,
              message: doc.message,
              students: [],
              homeworks,
              coursewares: doc.coursewares
            });
          }
        }).catch((error) => {
          reject(error);
        });
      });
    },

    findHw(classId, createDate, role, userId) {
      return new Promise((resolve, reject) => {
        collection2.findOne({ classId }).then((doc) => {
        	const homework = doc.homeworks.find((item) => item.createDate == createDate);
          if (role === 'teacher') {
            resolve(homework);
          } else {
            resolve({
              createDate: homework.createDate,
              beginDate: homework.beginDate,
              endDate: homework.endDate,
              title: homework.title,
              description: homework.description,
              files: homework.files,
              hwAnswer: homework.hwAnswer,
              submissions: homework.submissions.filter((item) =>
                item.userId === userId)
            });
          }
        }).catch((error) => {
          reject(error);
        });
      });
    }
  };
};
