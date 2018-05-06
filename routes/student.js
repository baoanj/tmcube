const express = require('express');
const debug = require('debug')('tmcube:student');
const multer = require('multer');
const reSend = require('../utils/reSend');

const upload = multer({
  dest: 'data/',
  limits: {
    fileSize: 10 * 1024 * 1024,
  },
});
const router = express.Router();

module.exports = (db) => {
  const studentManager = require('../models/studentModel')(db); // eslint-disable-line
  const generalManager = require('../models/generalModel')(db); // eslint-disable-line

  router.all('*', async (req, res, next) => {
    try {
      if (req.session.loginUser) {
        next();
      } else {
        throw '未登录'; // eslint-disable-line
      }
    } catch (error) {
      reSend.error(res, debug, error);
    }
  });

  router.post('/enterClass', async (req, res) => {
    try {
      const { classId, password } = req.body;

      if (req.session.loginUser.classIds.includes(classId)) throw '你已添加此班级，无需重复添加'; // eslint-disable-line

      await studentManager.findClass(classId, password);
      const classIds = ([classId]).concat(req.session.loginUser.classIds);
      await generalManager.updateUserClassIds(req.session.loginUser._id, classIds); // eslint-disable-line
      await studentManager.updateClassUserIds(req.session.loginUser._id, classId); // eslint-disable-line
      req.session.loginUser.classIds = classIds;
      reSend.success(res, {});
    } catch (error) {
      reSend.error(res, debug, error);
    }
  });

  router.post('/submitHw/:classId/:createDate', upload.array('files', 10), async (req, res) => {
    try {
      const { classId, createDate } = req.params;
      const { answer } = req.body;

      if (!req.session.loginUser.classIds.includes(classId)) throw '权限不足'; // eslint-disable-line

      const files = req.files.map(item => ({
        name: item.originalname,
        filename: item.filename,
      }));
      await studentManager.updateHwSubs(
        req.session.loginUser._id, // eslint-disable-line
        req.session.loginUser.name,
        req.session.loginUser.stuId,
        req.session.loginUser.email,
        classId,
        createDate,
        answer,
        files,
        `${Date.now()}`,
      );
      reSend.success(res, {});
    } catch (error) {
      reSend.error(res, debug, error);
    }
  });

  router.put('/editHwSub/:classId/:createDate', upload.array('files', 10), async (req, res) => {
    try {
      const { classId, createDate } = req.params;
      const { answer, existFiles } = req.body;

      if (!req.session.loginUser.classIds.includes(classId)) throw '权限不足'; // eslint-disable-line

      const files = JSON.parse(existFiles).concat(req.files.map(item => ({
        name: item.originalname,
        filename: item.filename,
      })));
      await studentManager.editHwSub(
        req.session.loginUser._id, // eslint-disable-line
        classId,
        createDate,
        answer,
        files,
        `${Date.now()}`,
      );
      reSend.success(res, {});
    } catch (error) {
      reSend.error(res, debug, error);
    }
  });

  router.put('/deleteHwSub/:classId/:createDate', async (req, res) => {
    try {
      const { classId, createDate } = req.params;

      if (!req.session.loginUser.classIds.includes(classId)) throw '权限不足'; // eslint-disable-line

      await studentManager.deleteHwSub(req.session.loginUser._id, classId, createDate); // eslint-disable-line
      reSend.success(res, {});
    } catch (error) {
      reSend.error(res, debug, error);
    }
  });

  router.put('/editUserMsg', async (req, res) => {
    try {
      const { name, stuId } = req.body;

      if (!name || !stuId) throw '填写的信息有误'; // eslint-disable-line

      await studentManager.updateUserMsg(req.session.loginUser._id, name, stuId); // eslint-disable-line
      req.session.loginUser.name = name;
      req.session.loginUser.stuId = stuId;
      reSend.success(res, {});
    } catch (error) {
      reSend.error(res, debug, error);
    }
  });

  router.put(
    '/updateHwDraft/:classId/:createDate', upload.array('files', 10),
    async (req, res) => {
      try {
        const { classId, createDate } = req.params;
        const { answer, existFiles } = req.body;

        if (!req.session.loginUser.classIds.includes(classId)) throw '权限不足'; // eslint-disable-line

        const files = JSON.parse(existFiles).concat(req.files.map(item => ({
          name: item.originalname,
          filename: item.filename,
        })));
        await studentManager.updateHwDraft(
          req.session.loginUser._id, // eslint-disable-line
          classId,
          createDate,
          answer,
          files,
        );
        reSend.success(res, {});
      } catch (error) {
        reSend.error(res, debug, error);
      }
    },
  );

  return router;
};
