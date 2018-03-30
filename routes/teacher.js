const express = require('express');
const debug = require('debug')('tmcube:teacher');
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
    const { classId, name, teacherName, password } = req.body;
    teacherManager.insertClass(classId, name, teacherName, password).then(() => {
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

  router.post('/addHw/:classId', (req, res, next) => {
    const classId = req.params.classId;
    const { createDate, beginDate, endDate, title, description } = req.body;
    teacherManager.updateClassHws(classId, createDate, beginDate, endDate, title, description)
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

  return router;
}
