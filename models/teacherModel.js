const ObjectID = require('mongodb').ObjectID;

module.exports = (db) => {
  const collection = db.collection('classes');
  const collection2 = db.collection('users');

  return {
    insertClass(classId, name, teacherName, password) {
      return new Promise((resolve, reject) => {
        collection.insert({
          classId,
          name,
          teacherName,
          password,
          homeworks: [],
          userIds: []
        }).then((result) => resolve(result), (error) => reject(error));
      });
    },

    checkClassIdUnique(classId) {
      return new Promise((resolve, reject) => {
        collection.findOne({ classId }).then((doc) => {
        	if (doc) reject();
          else resolve();
        }).catch(() => {
          reject();
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
          reject(error)
        });
      });
    }
  };
};
