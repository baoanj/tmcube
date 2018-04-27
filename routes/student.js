const express = require('express');
const debug = require('debug')('tmcube:student');
const router = express.Router();
const multer = require('multer');
const upload = multer({ dest: 'data/' });
const validate = require('../utils/validate');
const reSend = require('../utils/reSend');

module.exports = (db) => {
  const studentManager = require('../models/studentModel')(db);
  const generalManager = require('../models/generalModel')(db);

  router.all('*', async (req, res, next) => {
		try {
      if (req.session.loginUser) {
  			next();
  		} else {
        throw '未登录';
  		}
    } catch(error) {
      reSend.error(res, error);
    }
	});

  router.post('/enterClass', async (req, res, next) => {
    try {
      const { classId, password } = req.body;

      if (req.session.loginUser.classIds.includes(classId)) throw '你已添加此班级，无需重复添加';

      await studentManager.findClass(classId, password);
      const classIds = ([classId]).concat(req.session.loginUser.classIds);
      await generalManager.updateUserClassIds(req.session.loginUser._id, classIds);
      await studentManager.updateClassUserIds(req.session.loginUser._id, classId);
      req.session.loginUser.classIds = classIds;
      reSend.success(res, {});
    } catch(error) {
      reSend.error(res, error);
    }
  });

  router.post('/submitHw/:classId/:createDate', upload.array('files', 10), async (req, res, next) => {
    try{
      const { classId, createDate } = req.params;
      const { answer } = req.body;

      if (!req.session.loginUser.classIds.includes(classId)) throw '权限不足';

      const files = req.files.map((item) => ({
        name: item.originalname,
        filename: item.filename
      }));
      await studentManager.updateHwSubs(
        req.session.loginUser._id,
        req.session.loginUser.name,
        req.session.loginUser.stuId,
        req.session.loginUser.email,
        classId,
        createDate,
        answer,
        files,
        Date.now() + ''
      );
      reSend.success(res, {});
    } catch(error) {
      reSend.error(res, error);
    }
  });

  router.put('/editHwSub/:classId/:createDate', upload.array('files', 10), async (req, res, next) => {
    try {
      const { classId, createDate } = req.params;
      const { answer, existFiles } = req.body;

      if (!req.session.loginUser.classIds.includes(classId)) throw '权限不足';

      const files = JSON.parse(existFiles).concat(req.files.map((item) => ({
        name: item.originalname,
        filename: item.filename
      })));
      await studentManager.editHwSub(
        req.session.loginUser._id,
        classId,
        createDate,
        answer,
        files,
        Date.now() + ''
      );
      reSend.success(res, {});
    } catch(error) {
      reSend.error(res, error);
    }
  });

  router.put('/deleteHwSub/:classId/:createDate', async (req, res, next) => {
    try {
      const { classId, createDate } = req.params;
      const classIds = req.session.loginUser.classIds;

      if (!req.session.loginUser.classIds.includes(classId)) throw '权限不足';

      await studentManager.deleteHwSub(req.session.loginUser._id, classId, createDate);
      reSend.success(res, {});
    } catch(error) {
      reSend.error(res, error);
    }
  });

  router.put('/editUserMsg', async (req, res, next) => {
    try {
      const { name, stuId } = req.body;

      if (!name || !stuId) throw '填写的信息有误';

      await studentManager.updateUserMsg(req.session.loginUser._id, name, stuId);
      req.session.loginUser.name = name;
      req.session.loginUser.stuId = stuId;
      reSend.success(res, {});
    } catch(error) {
      reSend.error(res, error);
    }
  });

  router.put('/updateHwDraft/:classId/:createDate', upload.array('files', 10),
    async (req, res, next) => {
    try {
      const { classId, createDate } = req.params;
      const { answer, existFiles } = req.body;

      if (!req.session.loginUser.classIds.includes(classId)) throw '权限不足';

      const files = JSON.parse(existFiles).concat(req.files.map((item) => ({
        name: item.originalname,
        filename: item.filename
      })));
      await studentManager.updateHwDraft(
        req.session.loginUser._id,
        classId,
        createDate,
        answer,
        files
      );
      reSend.success(res, {});
    } catch(error) {
      reSend.error(res, error);
    }
  });

  return router;
}
