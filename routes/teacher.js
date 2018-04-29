const express = require('express');
const debug = require('debug')('tmcube:teacher');
const multer = require('multer');
const validate = require('../utils/validate');
const reSend = require('../utils/reSend');

const upload = multer({ dest: 'data/' });
const router = express.Router();

module.exports = (db) => {
  const teacherManager = require('../models/teacherModel')(db); // eslint-disable-line
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

  router.post('/addClass', async (req, res) => {
    try {
      const {
        classId, name, teacherName, password, message,
      } = req.body;

      if (!validate.validClassId(classId) || !validate.validClassName(name) ||
        !validate.validClassPass(password)) {
        throw '填写的信息有误'; // eslint-disable-line
      }

      await teacherManager.insertClass(classId, name, teacherName, password, message);
      const classIds = ([classId]).concat(req.session.loginUser.classIds);
      await generalManager.updateUserClassIds(req.session.loginUser._id, classIds); // eslint-disable-line
      req.session.loginUser.classIds = classIds;
      reSend.success(res, {});
    } catch (error) {
      reSend.error(res, debug, error);
    }
  });

  router.put('/editClass/:classId', async (req, res) => {
    try {
      const { classId } = req.params;
      const {
        name, teacherName, password, message,
      } = req.body;

      if (!validate.validClassName(name) || !validate.validClassPass(password)) {
        throw '填写的信息有误'; // eslint-disable-line
      }

      await teacherManager.updateClassMsg(classId, name, teacherName, password, message);
      reSend.success(res, {});
    } catch (error) {
      reSend.error(res, debug, error);
    }
  });

  router.post('/checkClassIdUnique', async (req, res) => {
    try {
      const { classId } = req.body;

      await teacherManager.checkClassIdUnique(classId);
      reSend.success(res, {});
    } catch (error) {
      reSend.error(res, debug, error);
    }
  });

  router.post('/addHw/:classId', upload.array('files', 10), async (req, res) => {
    try {
      const { classId } = req.params;
      const {
        beginDate, endDate, title, description,
      } = req.body;

      if (!validate.validHwTitle(title)) throw '填写的信息有误'; // eslint-disable-line
      if (beginDate && endDate && +beginDate > +endDate) throw '时间区间错误'; // eslint-disable-line

      const files = req.files.map(item => ({
        name: item.originalname,
        filename: item.filename,
      }));
      await teacherManager.updateClassHws(
        classId, `${Date.now()}`, beginDate,
        endDate, title, description, files,
      );
      reSend.success(res, {});
    } catch (error) {
      reSend.error(res, debug, error);
    }
  });

  router.put(
    '/editHw/:classId/:createDate',
    upload.array('files', 10), async (req, res) => {
      try {
        const { classId, createDate } = req.params;
        const {
          beginDate, endDate, title, description, existFiles,
        } = req.body;

        if (!validate.validHwTitle(title)) throw '填写的信息有误'; // eslint-disable-line
        if (beginDate && endDate && +beginDate > +endDate) throw '时间区间错误'; // eslint-disable-line

        const files = JSON.parse(existFiles).concat(req.files.map(item => ({
          name: item.originalname,
          filename: item.filename,
        })));
        await teacherManager.updateHomework(
          classId, createDate, beginDate,
          endDate, title, description, files,
        );
        reSend.success(res, {});
      } catch (error) {
        reSend.error(res, debug, error);
      }
    },
  );

  router.put('/feedbackHw/:classId/:createDate/:userId', async (req, res) => {
    try {
      const { classId, createDate, userId } = req.params;
      const { feedback } = req.body;

      await teacherManager.updateSubFeedback(classId, createDate, userId, feedback);
      reSend.success(res, {});
    } catch (error) {
      reSend.error(res, debug, error);
    }
  });

  router.post(
    '/uploadCourseware/:classId',
    upload.array('files', 10), async (req, res) => {
      try {
        const { classId } = req.params;
        const { title, existFiles } = req.body;

        const files = JSON.parse(existFiles).concat(req.files.map(item => ({
          name: item.originalname,
          filename: item.filename,
        })));
        await teacherManager.uploadClassCourseware(classId, title, `${Date.now()}`, files);
        reSend.success(res, {});
      } catch (error) {
        reSend.error(res, debug, error);
      }
    },
  );

  router.put(
    '/updateCourseware/:classId/:uploadDate',
    upload.array('files', 10), async (req, res) => {
      try {
        const { classId, uploadDate } = req.params;
        const { title, existFiles } = req.body;

        const files = JSON.parse(existFiles).concat(req.files.map(item => ({
          name: item.originalname,
          filename: item.filename,
        })));
        await teacherManager.updateCourseware(classId, title, uploadDate, files);
        reSend.success(res, {});
      } catch (error) {
        reSend.error(res, debug, error);
      }
    },
  );

  router.put('/deleteCourseware/:classId/:uploadDate', async (req, res) => {
    try {
      const { classId, uploadDate } = req.params;

      await teacherManager.deleteCourseware(classId, uploadDate);
      reSend.success(res, {});
    } catch (error) {
      reSend.error(res, debug, error);
    }
  });

  router.post(
    '/uploadHwAnswer/:classId/:createDate',
    upload.array('files', 10), async (req, res) => {
      try {
        const { classId, createDate } = req.params;
        const { answer, existFiles } = req.body;

        const files = JSON.parse(existFiles).concat(req.files.map(item => ({
          name: item.originalname,
          filename: item.filename,
        })));
        await teacherManager.uploadHwAnswer(classId, createDate, answer, files);
        reSend.success(res, {});
      } catch (error) {
        reSend.error(res, debug, error);
      }
    },
  );

  router.put('/deleteHwAnswer/:classId/:createDate', async (req, res) => {
    try {
      const { classId, createDate } = req.params;

      await teacherManager.deleteHwAnswer(classId, createDate);
      reSend.success(res, {});
    } catch (error) {
      reSend.error(res, debug, error);
    }
  });

  router.get('/getStuSubs', async (req, res) => {
    try {
      const { classId, userId } = req.query;

      if (!req.session.loginUser.classIds.includes(classId)) throw '权限不足'; // eslint-disable-line

      const result = await teacherManager.findStuSubs(
        classId,
        userId,
      );
      reSend.success(res, {
        subs: result,
      });
    } catch (error) {
      reSend.error(res, debug, error);
    }
  });

  router.put('/updateClassTas/:classId', async (req, res) => {
    try {
      const { classId } = req.params;
      const { tas } = req.body;

      if (!validate.isArray(tas)) throw '数据错误'; // eslint-disable-line

      await teacherManager.updateClassTas(classId, tas);
      reSend.success(res, {});
    } catch (error) {
      reSend.error(res, debug, error);
    }
  });

  return router;
};
