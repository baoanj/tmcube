const fs = require('fs');

module.exports = {
  deleteFiles(files) {
    return new Promise((resolve, reject) => {
      try {
        for (let i = 0; i < files.length; i++) {
          const filepath = `data/${files[i].filename}`;
          if (fs.existsSync(filepath)) {
            fs.unlinkSync(filepath);
          }
        }
        resolve();
      } catch(error) {
        reject(error);
      }
    });
  }
};
