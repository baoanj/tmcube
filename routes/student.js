const express = require('express');
const debug = require('debug')('tmcube:student');
const router = express.Router();

module.exports = (db) => {
  const studentManager = require('../models/studentModel')(db);
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

  router.post('/enterClass', (req, res, next) => {
    const { classId, password } = req.body;
    if (req.session.loginUser.classIds.includes(classId)) {
      res.send({
        stats: 0,
        data: {
          error: '你已添加此班级，无需重复添加'
        }
      });
      return;
    }
    studentManager.findClass(classId, password).then(() => {
      teacherManager.updateUserClassIds(req.session.loginUser._id, classId).then(() => {
        studentManager.updateClassUserIds(req.session.loginUser._id, classId).then(() => {
          req.session.loginUser.classIds.push(classId);
          res.send({
            stats: 1,
            data: {}
          });
        });
      }).catch((error) => {
        debug(error);
        res.send({
          stats: 0,
          data: {
            error: '添加失败'
          }
        });
      });
    }).catch((error) => {
      debug(error);
      res.send({
        stats: 0,
        data: {
          error: '密码错误'
        }
      });
    });
  });

  router.post('/submitHw/:classId/:createDate', (req, res, next) => {
    const { classId, createDate } = req.params;
    const { answer, file, date } = req.body;
    const classIds = req.session.loginUser.classIds;
    if (!classIds.includes(classId)) {
      res.send({
        stats: 0,
        data: {
          error: '权限不足'
        }
      });
    } else {
      studentManager.updateHwSubs(
        req.session.loginUser._id,
        req.session.loginUser.name,
        req.session.loginUser.stuId,
        req.session.loginUser.email,
        classId,
        +createDate,
        answer,
        file,
        date
      ).then(() => {
        res.send({
          stats: 1,
          data: {}
        });
      }).catch((error) => {
        debug(error);
        res.send({
          stats: 0,
          data: {
            error: '提交失败'
          }
        });
      });
    }
  });

  return router;
}
