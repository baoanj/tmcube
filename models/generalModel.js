const { ObjectID } = require('mongodb');
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
          validate: false,
        }).then(() => resolve(), error => reject(error));
      });
    },

    checkEmailExist(email) {
      return new Promise((resolve, reject) => {
        collection.findOne({ email })
          .then((result) => {
            if (result) resolve();
            else reject('邮箱未注册'); // eslint-disable-line
          }, error => reject(error));
      });
    },

    checkEmailNotExist(email) {
      return new Promise((resolve, reject) => {
        collection.findOne({ email })
          .then((result) => {
            if (result) reject('邮箱已注册'); // eslint-disable-line
            else resolve();
          }, error => reject(error));
      });
    },

    checkLogin(email, password) {
      return new Promise((resolve, reject) => {
        collection.findOne({ email }).then((doc) => {
          const hash = passwordHash(password);
          if (!doc.validate) reject('邮箱未激活') // eslint-disable-line
          else if (hash !== doc.password) reject('密码错误'); // eslint-disable-line
          else resolve(doc);
        }).catch((error) => { reject(error); });
      });
    },

    findClasses(classIds) {
      const queryIds = classIds.map(item => ({ classId: item }));
      return new Promise((resolve, reject) => {
        collection2.find({ $or: queryIds }).toArray().then((docs) => {
          resolve(docs.map(item => ({
            classId: item.classId,
            name: item.name,
            teacherName: item.teacherName,
            password: item.password,
            amountOfStus: item.userIds.length,
            anountOfHws: item.homeworks.length,
            tas: item.tas,
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
          { $set: { classIds } },
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
          { $set: { validate: true } },
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
            let submit = false;
            let checked = false;
            for (let i = 0; i < item.submissions.length; i += 1) {
              if (item.submissions[i].userId === user._id) { // eslint-disable-line
                submit = true;
                ({ checked } = item.submissions[i].checked);
                break;
              }
            }
            return {
              createDate: item.createDate,
              beginDate: item.beginDate,
              endDate: item.endDate,
              title: item.title,
              amountOfSubs: item.submissions.length,
              submit,
              checked,
            };
          });
          let isTA = false;
          for (let i = 0; i < doc.tas.length; i += 1) {
            if (doc.tas[i].email === user.email) {
              isTA = true;
              break;
            }
          }
          if (doc.userIds.length) {
            const userIds = doc.userIds.map(item => ({ _id: ObjectID(item) }));
            collection.find({ $or: userIds }).toArray().then((docs) => {
              const students = (user.role === 'student' && !isTA) ?
                [{
                  name: user.name,
                  stuId: user.stuId,
                  email: user.email,
                  userId: user._id, // eslint-disable-line
                }] :
                docs.map(item => ({
                  name: item.name,
                  stuId: item.stuId,
                  email: item.email,
                  userId: item._id, // eslint-disable-line
                }));
              resolve({
                classId: doc.classId,
                name: doc.name,
                teacherName: doc.teacherName,
                password: doc.password,
                message: doc.message,
                students,
                homeworks,
                coursewares: doc.coursewares,
                tas: doc.tas,
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
              coursewares: doc.coursewares,
              tas: doc.tas,
            });
          }
        }).catch((error) => {
          reject(error);
        });
      });
    },

    findHw(classId, createDate, user) {
      return new Promise((resolve, reject) => {
        collection2.findOne({ classId }).then((doc) => {
          const homework = doc.homeworks.find(item => item.createDate === createDate);
          let isTA = false;
          for (let i = 0; i < doc.tas.length; i += 1) {
            if (doc.tas[i].email === user.email) {
              isTA = true;
              break;
            }
          }
          if (user.role === 'teacher' || isTA) {
            resolve({
              createDate: homework.createDate,
              beginDate: homework.beginDate,
              endDate: homework.endDate,
              title: homework.title,
              description: homework.description,
              files: homework.files,
              hwAnswer: homework.hwAnswer,
              submissions: homework.submissions,
              tas: doc.tas,
            });
          } else {
            resolve({
              createDate: homework.createDate,
              beginDate: homework.beginDate,
              endDate: homework.endDate,
              title: homework.title,
              description: homework.description,
              files: homework.files,
              hwAnswer: homework.hwAnswer,
              submissions: homework.submissions.filter(item =>
                item.userId === user._id), // eslint-disable-line
              tas: doc.tas,
              draft: homework.drafts[user._id], // eslint-disable-line
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
          expiredDate: Date.now() + (10 * 60 * 1000),
        }).then(result => resolve(result), error => reject(error));
      });
    },

    findForgotPass(resetId) {
      return new Promise((resolve, reject) => {
        collection3.findOne({ _id: ObjectID(resetId) })
          .then(doc => resolve(doc), error => reject(error));
      });
    },

    updateUserPassword(email, password) {
      const hash = passwordHash(password);
      return new Promise((resolve, reject) => {
        collection.updateOne({ email }, { $set: { password: hash } })
          .then(() => resolve(), error => reject(error));
      });
    },

    addActivateEmail(email) {
      return new Promise((resolve, reject) => {
        collection4.insert({
          email,
        }).then(result => resolve(result), error => reject(error));
      });
    },

    findActivateEmail(activateId) {
      return new Promise((resolve, reject) => {
        collection4.findOne({ _id: ObjectID(activateId) })
          .then((doc) => {
            resolve(doc.email);
          })
          .catch((error) => {
            reject(error);
          });
      });
    },

    findActivateId(email) {
      return new Promise((resolve, reject) => {
        collection4.findOne({ email })
          .then((doc) => {
            resolve(doc._id); // eslint-disable-line
          })
          .catch((error) => {
            reject(error);
          });
      });
    },
  };
};
