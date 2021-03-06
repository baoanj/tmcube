const fileSystem = require('./fileSystem');

module.exports = (db) => {
  const collection = db.collection('classes');

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
          coursewares: [],
          tas: [],
        }).then(() => {
          resolve();
        }).catch((error) => {
          reject(error);
        });
      });
    },

    updateClassMsg(classId, name, teacherName, password, message) {
      return new Promise((resolve, reject) => {
        collection.updateOne(
          { classId },
          {
            $set: {
              name, teacherName, password, message,
            },
          },
        ).then(() => {
          resolve();
        }).catch((error) => {
          reject(error);
        });
      });
    },

    checkClassIdUnique(classId) {
      return new Promise((resolve, reject) => {
        collection.findOne({ classId }).then((doc) => {
        	if (doc) reject('此Id已存在'); // eslint-disable-line
          else resolve();
        }).catch((error) => {
          reject(error);
        });
      });
    },

    updateClassHws(classId, createDate, beginDate, endDate, title, description, files) {
      return new Promise((resolve, reject) => {
        collection.updateOne(
          { classId },
          {
            $push: {
              homeworks: {
                createDate,
                beginDate,
                endDate,
                title,
                description,
                files,
                submissions: [],
                hwAnswer: {
                  answer: '',
                  files: [],
                },
                drafts: {},
              },
            },
          },
        ).then(() => {
          resolve();
        }).catch((error) => {
          reject(error);
        });
      });
    },

    updateHomework(classId, createDate, beginDate, endDate, title, description, files) {
      return new Promise(async (resolve, reject) => {
        try {
          const doc = await collection.findOne({ classId });
          const homework = doc.homeworks.find(item => item.createDate === createDate);
          const delFiles = fileSystem.getDeleteFiles(homework.files, files);
          await fileSystem.deleteFiles(delFiles);
          await collection.updateOne(
            { classId },
            {
              $set: {
                'homeworks.$[hw].beginDate': beginDate,
                'homeworks.$[hw].endDate': endDate,
                'homeworks.$[hw].title': title,
                'homeworks.$[hw].description': description,
                'homeworks.$[hw].files': files,
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

    updateSubFeedback(classId, createDate, userId, feedback) {
      return new Promise((resolve, reject) => {
        collection.updateOne(
          { classId },
          {
            $set: {
              'homeworks.$[hw].submissions.$[sub].feedback': feedback,
              'homeworks.$[hw].submissions.$[sub].checked': true,
            },
          },
          { arrayFilters: [{ 'hw.createDate': createDate }, { 'sub.userId': userId }] },
        ).then(() => {
          resolve();
        }).catch((error) => {
          reject(error);
        });
      });
    },

    uploadClassCourseware(classId, title, uploadDate, files) {
      return new Promise((resolve, reject) => {
        collection.updateOne(
          { classId },
          {
            $push: {
              coursewares: {
                title,
                uploadDate,
                files,
              },
            },
          },
        ).then(() => {
          resolve();
        }).catch((error) => {
          reject(error);
        });
      });
    },

    updateCourseware(classId, title, uploadDate, files) {
      return new Promise(async (resolve, reject) => {
        try {
          const doc = await collection.findOne({ classId });
          const courseware = doc.coursewares.find(item => item.uploadDate === uploadDate);
          const delFiles = fileSystem.getDeleteFiles(courseware.files, files);
          await fileSystem.deleteFiles(delFiles);
          await collection.updateOne(
            { classId },
            {
              $set: {
                'coursewares.$[cw].title': title,
                'coursewares.$[cw].files': files,
              },
            },
            { arrayFilters: [{ 'cw.uploadDate': uploadDate }] },
          );
          resolve();
        } catch (error) {
          reject(error);
        }
      });
    },

    deleteCourseware(classId, uploadDate) {
      return new Promise(async (resolve, reject) => {
        try {
          const doc = await collection.findOne({ classId });
          const courseware = doc.coursewares.find(item => item.uploadDate === uploadDate);
          const { files } = courseware;
          await fileSystem.deleteFiles(files);
          await collection.updateOne(
            { classId },
            { $pull: { coursewares: { uploadDate } } },
          );
          resolve();
        } catch (error) {
          reject(error);
        }
      });
    },

    uploadHwAnswer(classId, createDate, answer, files) {
      return new Promise(async (resolve, reject) => {
        try {
          const doc = await collection.findOne({ classId });
          const homework = doc.homeworks.find(item => item.createDate === createDate);
          const delFiles = fileSystem.getDeleteFiles(homework.hwAnswer.files, files);
          await fileSystem.deleteFiles(delFiles);
          await collection.updateOne(
            { classId },
            {
              $set: {
                'homeworks.$[hw].hwAnswer': {
                  answer,
                  files,
                },
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

    deleteHwAnswer(classId, createDate) {
      return new Promise((resolve, reject) => {
        collection.findOne({ classId }).then((doc) => {
          const homework = doc.homeworks.find(item => item.createDate === createDate);
          const { files } = homework.hwAnswer;
          fileSystem.deleteFiles(files).then(() => {
            collection.updateOne(
              { classId },
              {
                $set: {
                  'homeworks.$[hw].hwAnswer': {
                    answer: '',
                    files: [],
                  },
                },
              },
              { arrayFilters: [{ 'hw.createDate': createDate }] },
            ).then(() => {
              resolve();
            });
          });
        }).catch((error) => {
          reject(error);
        });
      });
    },

    findStuSubs(classId, userId) {
      return new Promise((resolve, reject) => {
        collection.findOne({ classId }).then((doc) => {
          const result = [];
          for (let i = 0; i < doc.homeworks.length; i += 1) {
            let j;
            for (j = 0; j < doc.homeworks[i].submissions.length; j += 1) {
              if (doc.homeworks[i].submissions[j].userId === userId) {
                result.push({
                  commit: true,
                  date: doc.homeworks[i].submissions[j].date,
                  checked: doc.homeworks[i].submissions[j].checked,
                  feedback: doc.homeworks[i].submissions[j].feedback,
                  answer: doc.homeworks[i].submissions[j].answer,
                  files: doc.homeworks[i].submissions[j].files,
                  hwTitle: doc.homeworks[i].title,
                });
                break;
              }
            }
            if (j === doc.homeworks[i].submissions.length) {
              result.push({
                commit: false,
                hwTitle: doc.homeworks[i].title,
              });
            }
          }
          resolve(result);
        }).catch((error) => {
          reject(error);
        });
      });
    },

    updateClassTas(classId, tas) {
      return new Promise((resolve, reject) => {
        collection.updateOne(
          { classId },
          { $set: { tas } },
        ).then(() => {
          resolve();
        }).catch((error) => {
          reject(error);
        });
      });
    },
  };
};
