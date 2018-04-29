const { ObjectID } = require('mongodb').ObjectID;
const fileSystem = require('./fileSystem');

module.exports = (db) => {
  const collection = db.collection('classes');
  const collection2 = db.collection('users');

  return {
    findClass(classId, password) {
      return new Promise((resolve, reject) => {
        collection.findOne({ classId, password }).then((doc) => {
          if (doc) resolve();
          else reject('密码错误'); // eslint-disable-line
        }).catch((error) => {
          reject(error);
        });
      });
    },

    updateClassUserIds(userId, classId) {
      return new Promise((resolve, reject) => {
        collection.updateOne(
          { classId },
          { $push: { userIds: userId } },
        ).then(() => {
          resolve();
        }).catch((error) => {
          reject(error);
        });
      });
    },

    updateHwSubs(userId, stuName, stuId, email, classId, createDate, answer, files, date) {
      return new Promise((resolve, reject) => {
        collection.updateOne(
          { classId },
          {
            $push: {
              'homeworks.$[hw].submissions': {
                userId,
                stuName,
                stuId,
                email,
                date,
                answer,
                files,
                checked: false,
                feedback: '',
              },
            },
          },
          { arrayFilters: [{ 'hw.createDate': createDate }] },
        ).then(() => {
          resolve();
        }).catch((error) => {
          reject(error);
        });
      });
    },

    editHwSub(userId, classId, createDate, answer, files, date) {
      return new Promise(async (resolve, reject) => {
        try {
          const doc = await collection.findOne({ classId });
          const homework = doc.homeworks.find(item => item.createDate === createDate);
          let submission = null;
          for (let i = 0; i < homework.submissions.length; i += 1) {
            if (homework.submissions[i].userId === userId) {
              submission = homework.submissions[i];
              break;
            }
          }
          const delFiles = submission ? fileSystem.getDeleteFiles(submission.files, files) : [];
          await fileSystem.deleteFiles(delFiles);
          await collection.updateOne(
            { classId },
            {
              $set: {
                'homeworks.$[hw].submissions.$[sub].date': date,
                'homeworks.$[hw].submissions.$[sub].answer': answer,
                'homeworks.$[hw].submissions.$[sub].files': files,
              },
            },
            { arrayFilters: [{ 'hw.createDate': createDate }, { 'sub.userId': userId }] },
          );
          resolve();
        } catch (error) {
          reject(error);
        }
      });
    },

    deleteHwSub(userId, classId, createDate) {
      return new Promise(async (resolve, reject) => {
        try {
          const doc = await collection.findOne({ classId });
          const homework = doc.homeworks.find(item => item.createDate === createDate);
          let submission = null;
          for (let i = 0; i < homework.submissions.length; i += 1) {
            if (homework.submissions[i].userId === userId) {
              submission = homework.submissions[i];
              break;
            }
          }
          await fileSystem.deleteFiles(submission ? submission.files : []);
          await collection.updateOne(
            { classId },
            { $pull: { 'homeworks.$[hw].submissions': { userId } } },
            { arrayFilters: [{ 'hw.createDate': createDate }] },
          );
          resolve();
        } catch (error) {
          reject(error);
        }
      });
    },

    updateUserMsg(_id, name, stuId) {
      return new Promise((resolve, reject) => {
        collection2.updateOne(
          { _id: ObjectID(_id) },
          { $set: { name, stuId } },
        ).then(() => {
          resolve();
        }).catch((error) => {
          reject(error);
        });
      });
    },

    updateHwDraft(userId, classId, createDate, answer, files) {
      return new Promise(async (resolve, reject) => {
        try {
          const doc = await collection.findOne({ classId });
          const homework = doc.homeworks.find(item => item.createDate === createDate);
          const draft = homework.drafts[userId];
          const delFiles = draft ? fileSystem.getDeleteFiles(draft.files, files) : [];
          await fileSystem.deleteFiles(delFiles);
          await collection.updateOne(
            { classId },
            {
              $set: {
                [`homeworks.$[hw].drafts.${userId}.answer`]: answer,
                [`homeworks.$[hw].drafts.${userId}.files`]: files,
              },
            },
            { arrayFilters: [{ 'hw.createDate': createDate }] },
          );
          resolve();
        } catch (error) {
          reject(error);
        }
      });
    },
  };
};
