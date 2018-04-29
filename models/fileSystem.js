const fs = require('fs');

module.exports = {
  deleteFiles(files) {
    return new Promise((resolve, reject) => {
      try {
        for (let i = 0; i < files.length; i += 1) {
          const filepath = `data/${files[i].filename}`;
          if (fs.existsSync(filepath)) {
            fs.unlinkSync(filepath);
          }
        }
        resolve();
      } catch (error) {
        reject(error);
      }
    });
  },

  getDeleteFiles(existFiles, newFiles) {
    const deleteFiles = [];
    for (let i = 0; i < existFiles.length; i += 1) {
      if (!newFiles.find(item => item.filename === existFiles[i].filename)) {
        deleteFiles.push(existFiles[i]);
      }
    }
    return deleteFiles;
  },
};
