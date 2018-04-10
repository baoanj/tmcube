const debug = require('debug')('tmcube:student:model');
const ObjectID = require('mongodb').ObjectID;
const fileSystem = require('./fileSystem');

module.exports = (db) => {
  const collection = db.collection('classes');
  const collection2 = db.collection('users');

  return {
    findClass(classId, password) {
      return new Promise((resolve, reject) => {
        collection.findOne({ classId, password }).then((doc) => {
        	if (doc) resolve();
          else reject();
        }).catch((error) => {
          reject(error);
        });
      });
    },

    updateClassUserIds(userId, classId) {
      return new Promise((resolve, reject) => {
        collection.updateOne(
          { classId },
          { $push: { userIds: userId } }
        ).then(() => {
          resolve();
        }).catch((error) => {
          reject(error)
        });
      });
    },

    updateHwSubs(userId, stuName, stuId, email, classId, createDate, answer, files, date) {
      return new Promise((resolve, reject) => {
        collection.findOne({ classId }).then((doc) => {
        	const homework = doc.homeworks.find((item) => item.createDate === createDate);
          collection.updateOne(
            { classId },
            { $push: { 'homeworks.$[hw].submissions': {
              userId,
              stuName,
              stuId,
              email,
              date,
              answer,
              files,
              checked: false,
              feedback: ''
            } } },
            { arrayFilters: [{ 'hw.createDate': createDate }] }
          ).then(() => {
            resolve();
          });
        }).catch((error) => {
          reject(error);
        });
      });
    },

    editHwSub(userId, classId, createDate, answer, files, date) {
      return new Promise((resolve, reject) => {
        collection.findOne({ classId }).then((doc) => {
        	const homework = doc.homeworks.find((item) => item.createDate === createDate);
          let submission = null;
          for (let i = 0; i < homework.submissions.length; i++) {
            if (homework.submissions[i].userId === userId) {
              submission = homework.submissions[i];
              break;
            }
          }
          const delFiles = submission ? fileSystem.getDeleteFiles(submission.files, files) : [];
          fileSystem.deleteFiles(delFiles).then(() => {
            collection.updateOne(
              { classId },
              { $set: {
                'homeworks.$[hw].submissions.$[sub].date': date,
                'homeworks.$[hw].submissions.$[sub].answer': answer,
                'homeworks.$[hw].submissions.$[sub].files': files
              } },
              { arrayFilters: [{ 'hw.createDate': createDate }, { 'sub.userId': userId }] }
            ).then(() => {
              resolve();
            }).catch((error) => {
              debug(error);
              reject(error);
            });
          }).catch((error) => {
            debug(error);
            reject(error);
          });
        }).catch((error) => {
          debug(error);
          reject(error);
        });
      });
    },

    deleteHwSub(userId, classId, createDate) {
      return new Promise((resolve, reject) => {
        collection.findOne({ classId }).then((doc) => {
        	const homework = doc.homeworks.find((item) => item.createDate === createDate);
          let submission = null;
          for (let i = 0; i < homework.submissions.length; i++) {
            if (homework.submissions[i].userId === userId) {
              submission = homework.submissions[i];
              break;
            }
          }
          fileSystem.deleteFiles(submission ? submission.files : []).then(() => {
            collection.updateOne(
              { classId },
              { $pull: { 'homeworks.$[hw].submissions': { userId } } },
              { arrayFilters: [{ 'hw.createDate': createDate }] }
            ).then(() => {
              resolve();
            }).catch((error) => {
              debug(error);
              reject(error);
            });
          }).catch((error) => {
            debug(error);
            reject(error);
          });
        }).catch((error) => {
          debug(error);
          reject(error);
        });
      });
    },

    updateUserMsg(_id, name, stuId) {
      return new Promise((resolve, reject) => {
        collection2.updateOne(
          { _id: ObjectID(_id) },
          { $set: { name, stuId } }
        ).then(() => {
          resolve();
        }).catch((error) => {
          reject(error)
        });
      });
    },
  };
};
