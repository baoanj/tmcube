const debug = require('debug')('tmcube:general:model');
const ObjectID = require('mongodb').ObjectID;
const passwordHash = require('./passwordHash');

module.exports = (db) => {
  const collection = db.collection('users');
  const collection2 = db.collection('classes');
  const collection3 = db.collection('forgots');
  const collection4 = db.collection('validates');

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
          classIds: [],
          taClassIds: [],
          validate: false
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
          if (!doc.validate) reject('邮箱未激活')
          else if (hash !== doc.password) reject('密码错误');
          else resolve(doc);
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
          reject(error);
        });
      });
    },

    updateUserActivation(email) {
      return new Promise((resolve, reject) => {
        collection.updateOne(
          { email },
          { $set: { validate: true } }
        ).then(() => {
          resolve();
        }).catch((error) => {
          reject(error);
        });
      });
    },

    findClass(classId, user) {
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
            	const students = user.role === 'student' ?
                [{
                  name: user.name,
                  stuId: user.stuId,
                  email: user.email,
                  userId: user._id
                }] :
                docs.map((item) => {
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
    },

    addForgotPass(email) {
      return new Promise((resolve, reject) => {
        collection3.insert({
          email,
          expiredDate: Date.now() + 10 * 60 * 1000
        }).then((result) => resolve(result), (error) => reject(error));
      });
    },

    findForgotPass(resetId) {
      return new Promise((resolve, reject) => {
        if (!/^[a-f0-9]{24}$/.test(resetId)) {
          reject(new Error('Argument passed in must be a string of 24 hex characters'));
        } else {
          collection3.findOne({ _id: ObjectID(resetId) })
            .then((doc) => resolve(doc), (error) => reject(error));
        }
      });
    },

    updateUserPassword(email, password) {
      const hash = passwordHash(password);
      return new Promise((resolve, reject) => {
        collection.updateOne({ email }, { $set: { password: hash }})
          .then(() => resolve(), (error) => reject(error));
      });
    },

    addValidateEmail(email) {
      return new Promise((resolve, reject) => {
        collection4.insert({
          email
        }).then((result) => resolve(result), (error) => reject(error));
      });
    },

    findValidateEmail(activateId) {
      return new Promise((resolve, reject) => {
        if (!/^[a-f0-9]{24}$/.test(activateId)) {
          reject(new Error('Argument passed in must be a string of 24 hex characters'));
        } else {
          collection4.findOne({ _id: ObjectID(activateId) })
            .then((doc) => {
              if (!doc) reject()
              else resolve(doc.email);
            })
            .catch((error) => {
              reject(error);
            });
        }
      });
    },

    findValidateId(email) {
      return new Promise((resolve, reject) => {
        collection4.findOne({ email })
        .then((doc) => {
          if (!doc) reject()
          else resolve(doc._id);
        })
        .catch((error) => {
          reject(error);
        });
      });
    }
  };
};
