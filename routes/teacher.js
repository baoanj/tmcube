const express = require('express');
const debug = require('debug')('tmcube:teacher');
const multer = require('multer');
const upload = multer({ dest: 'data/' });
const router = express.Router();

module.exports = (db) => {
  const teacherManager = require('../models/teacherModel')(db);

  router.all('*', (req, res, next) => {
		if (req.session.loginUser) {
			next();
		} else {
			res.send({
        stats: 0,
        data: {
          error: '未登录'
        }
      });
		}
	});

  router.post('/addClass', (req, res, next) => {
    const { classId, name, teacherName, password, message } = req.body;
    teacherManager.insertClass(classId, name, teacherName, password, message).then(() => {
      teacherManager.updateUserClassIds(req.session.loginUser._id, classId).then(() => {
        req.session.loginUser.classIds.push(classId);
        res.send({
          stats: 1,
          data: {}
        });
      }).catch((error) => {
        debug(error);
        res.send({
          stats: 0,
          data: {
            error: '创建失败'
          }
        });
      });
    }).catch((error) => {
      debug(error);
      res.send({
        stats: 0,
        data: {
          error: '创建失败'
        }
      });
    });
  });

  router.post('/checkClassIdUnique', (req, res, next) => {
    const { classId } = req.body;
    teacherManager.checkClassIdUnique(classId).then(() => {
      res.send({
        stats: 1,
        data: {}
      });
    }).catch((error) => {
      res.send({
        stats: 0,
        data: {
          error: '此Id已存在'
        }
      });
    });
  });

  router.post('/addHw/:classId', upload.array('files', 10), (req, res, next) => {
    const classId = req.params.classId;
    const { createDate, beginDate, endDate, title, description } = req.body;
    const files = req.files.map((item) => ({
      name: item.originalname,
      filename: item.filename
    }));
    teacherManager.updateClassHws(classId, createDate, beginDate, endDate, title, description, files)
      .then(() => {
        res.send({
          stats: 1,
          data: {}
        });
      })
      .catch((error) => {
        debug(error);
        res.send({
          stats: 0,
          data: {
            error: '创建失败'
          }
        });
      });
  });

  router.put('/feedbackHw/:classId/:createDate/:userId', (req, res, next) => {
    const { classId, createDate, userId } = req.params;
    const { feedback } = req.body;
    teacherManager.updateSubFeedback(classId, createDate, userId, feedback)
      .then(() => {
        res.send({
          stats: 1,
          data: {}
        });
      })
      .catch((error) => {
        debug(error);
        res.send({
          stats: 0,
          data: {
            error: '提交失败'
          }
        });
      });
  });

  router.post('/uploadCourseware/:classId', upload.array('files', 10), (req, res, next) => {
    const { classId } = req.params;
    const { title, uploadDate } = req.body;
    const files = req.files.map((item) => ({
      name: item.originalname,
      filename: item.filename
    }));
    teacherManager.uploadClassCourseware(classId, title, uploadDate, files)
      .then(() => {
        res.send({
          stats: 1,
          data: {}
        });
      })
      .catch((error) => {
        debug(error);
        res.send({
          stats: 0,
          data: {
            error: '上传失败'
          }
        });
      });
  });

  router.post('/uploadHwAnswer/:classId/:createDate',
    upload.array('files', 10), (req, res, next) => {
    try {
      const { classId, createDate } = req.params;
      const { answer, existFiles } = req.body;
      const files = JSON.parse(existFiles).concat(req.files.map((item) => ({
        name: item.originalname,
        filename: item.filename
      })));
      teacherManager.uploadHwAnswer(classId, createDate, answer, files)
        .then(() => {
          res.send({
            stats: 1,
            data: {}
          });
        })
        .catch((error) => {
          debug(error);
          res.send({
            stats: 0,
            data: {
              error: '上传失败'
            }
          });
        });
    } catch(error) {
      debug(error);
    }
  });

  router.put('/deleteHwAnswer/:classId/:createDate', (req, res, next) => {
    try {
      const { classId, createDate } = req.params;
      teacherManager.deleteHwAnswer(classId, createDate)
        .then(() => {
          res.send({
            stats: 1,
            data: {}
          });
        })
        .catch((error) => {
          debug(error);
          res.send({
            stats: 0,
            data: {
              error: '上传失败'
            }
          });
        });
    } catch(error) {
      debug(error);
    }
  });

  return router;
}
