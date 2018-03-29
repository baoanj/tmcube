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
    }
  };
};
