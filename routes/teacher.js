const express = require('express');
const debug = require('debug')('tmcube:teacher');
const multer = require('multer');
const upload = multer({ dest: 'data/' });
const router = express.Router();

module.exports = (db) => {
  const teacherManager = require('../models/teacherModel')(db);
  const generalManager = require('../models/generalModel')(db);

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
      const classIds = ([classId]).concat(req.session.loginUser.classIds);
      generalManager.updateUserClassIds(req.session.loginUser._id, classIds).then(() => {
        req.session.loginUser.classIds = classIds;
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

  router.put('/editClass/:classId', (req, res, next) => {
    const { classId } = req.params;
    const { name, teacherName, password, message } = req.body;
    teacherManager.updateClassMsg(classId, name, teacherName, password, message)
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
            error: '修改失败'
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
    if (beginDate && endDate && +beginDate > +endDate) {
      res.send({
        stats: 0,
        data: {
          error: '时间区间错误'
        }
      });
      return;
    }

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

  router.put('/editHw/:classId/:createDate',
    upload.array('files', 10), (req, res, next) => {
    try {
      const { classId, createDate } = req.params;
      const { beginDate, endDate, title, description, existFiles } = req.body;
      const files = JSON.parse(existFiles).concat(req.files.map((item) => ({
        name: item.originalname,
        filename: item.filename
      })));
      if (beginDate && endDate && +beginDate > +endDate) {
        res.send({
          stats: 0,
          data: {
            error: '时间区间错误'
          }
        });
        return;
      }

      teacherManager.updateHomework(classId, createDate, beginDate, endDate, title, description, files)
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
              error: '修改失败'
            }
          });
        });
    } catch(error) {
      debug(error);
      res.send({
        stats: 0,
        data: {
          error: '修改失败'
        }
      });
    }
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
    const { title, existFiles, uploadDate } = req.body;
    const files = JSON.parse(existFiles).concat(req.files.map((item) => ({
      name: item.originalname,
      filename: item.filename
    })));
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

  router.put('/updateCourseware/:classId/:uploadDate',
    upload.array('files', 10), (req, res, next) => {
    try {
      const { classId, uploadDate } = req.params;
      const { title, existFiles } = req.body;
      const files = JSON.parse(existFiles).concat(req.files.map((item) => ({
        name: item.originalname,
        filename: item.filename
      })));
      teacherManager.updateCourseware(classId, title, uploadDate, files)
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
      res.send({
        stats: 0,
        data: {
          error: '上传失败'
        }
      });
    }
  });

  router.put('/deleteCourseware/:classId/:uploadDate', (req, res, next) => {
    try {
      const { classId, uploadDate } = req.params;
      teacherManager.deleteCourseware(classId, uploadDate)
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
              error: '删除失败'
            }
          });
        });
    } catch(error) {
      debug(error);
      res.send({
        stats: 0,
        data: {
          error: '删除失败'
        }
      });
    }
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
      res.send({
        stats: 0,
        data: {
          error: '上传失败'
        }
      });
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
              error: '删除失败'
            }
          });
        });
    } catch(error) {
      debug(error);
      res.send({
        stats: 0,
        data: {
          error: '删除失败'
        }
      });
    }
  });

  router.get('/getStuSubs', (req, res, next) => {
    const { classId, userId } = req.query;
    const classIds = req.session.loginUser.classIds;
    if (!classIds.includes(classId)) {
      res.send({
        stats: 0,
        data: {
          error: '权限不足'
        }
      });
    } else {
      teacherManager.findStuSubs(
        classId,
        userId
      ).then((result) => {
        res.send({
          stats: 1,
          data: {
            subs: result
          }
        });
      }, (error) => {
        debug(error);
        res.send({
          stats: 0,
          data: {
            error: '获取数据失败'
          }
        });
      });
    }
  });

  router.put('/updateClassTas/:classId', (req, res, next) => {
    try {
      const { classId } = req.params;
      const { tas } = req.body;
      teacherManager.updateClassTas(classId, tas)
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
    } catch(error) {
      debug(error);
      res.send({
        stats: 0,
        data: {
          error: '服务器出错'
        }
      });
    }
  });

  return router;
}
