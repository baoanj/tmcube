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

  return router;
}
