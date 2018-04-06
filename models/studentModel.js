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
          if (homework.beginDate <= date && homework.endDate >= date) {
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
          } else {
            reject();
          }
        }).catch((error) => {
          reject(error);
        });
      });
    }
  };
};
