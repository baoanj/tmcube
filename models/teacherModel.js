const ObjectID = require('mongodb').ObjectID;
const fileSystem = require('./fileSystem');

module.exports = (db) => {
  const collection = db.collection('classes');
  const collection2 = db.collection('users');

  return {
    insertClass(classId, name, teacherName, password, message) {
      return new Promise((resolve, reject) => {
        collection.insert({
          classId,
          name,
          teacherName,
          password,
          message,
          homeworks: [],
          userIds: [],
          coursewares: []
        }).then((result) => {
          resolve(result)
        }).catch((error) => {
          debug(error);
          reject(error);
        });
      });
    },

    checkClassIdUnique(classId) {
      return new Promise((resolve, reject) => {
        collection.findOne({ classId }).then((doc) => {
        	if (doc) reject();
          else resolve();
        }).catch((error) => {
          debug(error);
          reject(error);
        });
      });
    },

    updateUserClassIds(_id, classId) {
      return new Promise((resolve, reject) => {
        collection2.updateOne(
          { _id: ObjectID(_id) },
          { $push: { classIds: classId } }
        ).then(() => {
          resolve();
        }).catch((error) => {
          debug(error);
          reject(error);
        });
      });
    },

    updateClassHws(classId, createDate, beginDate, endDate, title, description, files) {
      return new Promise((resolve, reject) => {
        collection.updateOne(
          { classId },
          { $push: { homeworks: {
            createDate,
            beginDate,
            endDate,
            title,
            description,
            files,
            submissions: [],
            hwAnswer: {
              answer: '',
              files: []
            }
          } } }
        ).then(() => {
          resolve();
        }).catch((error) => {
          debug(error);
          reject(error);
        });
      });
    },

    updateSubFeedback(classId, createDate, userId, feedback) {
      return new Promise((resolve, reject) => {
        collection.updateOne(
          { classId },
          { $set: {
            'homeworks.$[hw].submissions.$[sub].feedback': feedback,
            'homeworks.$[hw].submissions.$[sub].checked': true
          } },
          { arrayFilters: [ { 'hw.createDate': createDate }, { 'sub.userId': userId } ] }
        ).then(() => {
          resolve();
        }).catch((error) => {
          debug(error);
          reject(error);
        });
      });
    },

    uploadClassCourseware(classId, title, uploadDate, files) {
      return new Promise((resolve, reject) => {
        collection.updateOne(
          { classId },
          { $push: { coursewares: {
            title,
            uploadDate,
            files,
          } } }
        ).then(() => {
          resolve();
        }).catch((error) => {
          debug(error);
          reject(error);
        });
      });
    },

    uploadHwAnswer(classId, createDate, answer, files) {
      return new Promise((resolve, reject) => {
        collection.updateOne(
          { classId },
          { $set: { 'homeworks.$[hw].hwAnswer': {
            answer,
            files
          } } },
          { arrayFilters: [ { 'hw.createDate': createDate } ] }
        ).then(() => {
          resolve();
        }).catch((error) => {
          debug(error);
          reject(error);
        });
      });
    },

    deleteHwAnswer(classId, createDate) {
      return new Promise((resolve, reject) => {
        collection.findOne({ classId }).then((doc) => {
          const homework = doc.homeworks.find(item => item.createDate === createDate);
          const files = homework.hwAnswer.files;
          fileSystem.deleteFiles(files).then(() => {
            collection.updateOne(
              { classId },
              { $set: { 'homeworks.$[hw].hwAnswer': {
                answer: '',
                files: []
              } } },
              { arrayFilters: [ { 'hw.createDate': createDate } ] }
            ).then(() => {
              resolve();
            });
          });
        }).catch((error) => {
          debug(error);
          reject(error);
        });
      });
    }
  };
};
