const express = require('express');
const debug = require('debug')('tmcube:general');
const svgCaptcha = require('../utils/svg-captcha');
const router = express.Router();
const sendEmail = require('../utils/sendEmail');
const validate = require('../utils/validate');
const reSend = require('../utils/reSend');

module.exports = (db) => {
  const generalManager = require('../models/generalModel')(db);

  router.post('/regist', async (req, res, next) => {
    try {
      const { name, stuId, email, password, role, captcha, host } = req.body;

      if (captcha.toUpperCase() !== req.session.captcha.toUpperCase()) throw '验证码错误';
      if (!validate.validEmail(email) || !validate.validPassword2(password) || !name ||
        (role === 'student' && !stuId) || (role !== 'student' && role !== 'teacher')) {
        throw '填写的信息有误';
      }

      await generalManager.checkEmailNotExist(email);
      await generalManager.insertUser(name, stuId, email, password, role);
      const result = await generalManager.addValidateEmail(email);
      await sendEmail(
        email,
        '【邮箱激活】高校教学管理系统',
        `请复制此链接在浏览器窗口打开：${host}/activate/${result.ops[0]._id}`
      );
      reSend.success(res, {});
    } catch(error) {
      reSend.error(res, error);
    }
  });

  router.post('/sendEmail', async (req, res, next) => {
    try {
      const { email, host } = req.body;

      const activateId = await generalManager.findValidateId(email);
      if (activateId === null) throw '无法激活';
      await sendEmail(
        email,
        '【邮箱激活】高校教学管理系统',
        `请复制此链接在浏览器窗口打开：${host}/activate/${activateId}`
      );
      reSend.success(res, {});
    } catch(error) {
      reSend.error(res, error);
    }
  });

  router.put('/activateEmail/:activateId', async (req, res, next) => {
    try {
      const { activateId } = req.params;

      if (!validate.validUniqueId(activateId)) throw '无效链接';

      const email = await generalManager.findValidateEmail(activateId);
      if (email === null) throw '无效链接';
      await generalManager.updateUserActivation(email);
      reSend.success(res, {});
    } catch(error) {
      reSend.error(res, error);
    }
  });

  router.post('/checkEmail', async (req, res, next) => {
    try {
      await generalManager.checkEmailNotExist(req.body.email);
      reSend.success(res, {});
    } catch(error) {
      reSend.error(res, error);
    }
  });

  router.post('/login', async (req, res, next) => {
    try {
      const { email, password, captcha } = req.body;

      if (captcha.toUpperCase() !== req.session.captcha.toUpperCase()) throw '验证码错误';
      if (!validate.validEmail(email)) throw '邮箱格式错误';

      const user = await generalManager.checkLogin(email, password);
      req.session.regenerate((err) => {
        if (err) {
          throw new Error('req.session.regenerate err');
        } else {
          req.session.loginUser = user;
          reSend.success(res, {});
        }
      });
    } catch(error) {
      reSend.error(res, error);
    }
  });

  router.get('/getCaptcha', async (req, res, next) => {
    try {
      const captcha = svgCaptcha.create();
      req.session.captcha = captcha.text;
      reSend.success(res, {
        captcha: captcha.data
      });
    } catch(error) {
      reSend.error(res, error);
    }
  });

  router.post('/checkCaptcha', async (req, res, next) => {
    try {
      if (req.body.captcha.toUpperCase() === req.session.captcha.toUpperCase()) {
        reSend.success(res, {});
      } else {
        throw '验证码错误';
      }
    } catch(error) {
      reSend.error(res, error);
    }
  });

  router.post('/forgotPass', async (req, res, next) => {
    try {
      const { email, captcha, host } = req.body;

      if (captcha.toUpperCase() !== req.session.captcha.toUpperCase()) throw '验证码错误';

      await generalManager.checkEmailExist(email);
      const result = await generalManager.addForgotPass(email);
      await sendEmail(
        email,
        '【重置密码】高校教学管理系统',
        `请复制此链接(10分钟内有效)在浏览器窗口打开：${host}/reset/${result.ops[0]._id}`
      );
      reSend.success(res, {});
    } catch(error) {
      reSend.error(res, error);
    }
  });

  router.post('/checkReset/:resetId', async (req, res, next) => {
    try {
      const { resetId } = req.params;

      if (!validate.validUniqueId(resetId)) throw '无效链接';

      const data = await generalManager.findForgotPass(resetId);
      if (!data) throw '无效链接';
      if (data.expiredDate < Date.now()) throw '该链接已失效';
      reSend.success(res, {});
    } catch(error) {
      reSend.error(res, error);
    }
  });

  router.post('/resetPass/:resetId', async (req, res, next) => {
    try {
      const { password } = req.body;
      const { resetId } = req.params;

      if (!validate.validUniqueId(resetId)) throw '无效链接';
      if (!validate.validPassword2(password)) throw '密码格式错误';

      const data = await generalManager.findForgotPass(resetId);
      if (!data) throw '无效链接';
      if (data.expiredDate < Date.now()) throw '该链接已失效';
      await generalManager.updateUserPassword(data.email, password);
      reSend.success(res, {});
    } catch(error) {
      reSend.error(res, error);
    }
  });

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

  router.get('/getClasses', async (req, res, next) => {
    try {
      const classIds = req.session.loginUser.classIds;
      if (classIds.length === 0) {
        reSend.success(res, {
          classes: [],
          classIds: []
        });
      } else {
        const result = await generalManager.findClasses(classIds);
        reSend.success(res, {
          classes: result,
          classIds
        });
      }
    } catch(error) {
      reSend.error(res, error);
    }
  });

  router.put('/moveClasses', async (req, res, next) => {
    try {
      const { classIds } = req.body;

      await generalManager.updateUserClassIds(req.session.loginUser._id, classIds);
      req.session.loginUser.classIds = classIds;
      reSend.success(res, {});
    } catch(error) {
      reSend.error(res, error);
    }
  });

  router.get('/getHws', async (req, res, next) => {
    try {
      const { classId } = req.query;
      const classIds = req.session.loginUser.classIds;
      if (!classIds.includes(classId)) throw '权限不足';
      const result = await generalManager.findClass(classId, req.session.loginUser);
      reSend.success(res, {
        class: result
      });
    } catch(error) {
      reSend.error(res, error);
    }
  });

  router.get('/getSubs', async (req, res, next) => {
    try {
      const { classId, createDate } = req.query;
      const classIds = req.session.loginUser.classIds;
      if (!classIds.includes(classId)) throw '权限不足';
      const result = await generalManager.findHw(
        classId,
        createDate,
        req.session.loginUser
      );
      reSend.success(res, {
        homework: result
      });
    } catch(error) {
      reSend.error(res, error);
    }
  });

  router.get('/profile', async (req, res, next) => {
    reSend.success(res, {
      profile: {
        name: req.session.loginUser.name,
        stuId: req.session.loginUser.stuId,
        email: req.session.loginUser.email,
        role: req.session.loginUser.role
      }
    });
  });

  router.post('/logout', async (req, res, next) => {
    try {
      req.session.destroy((err) => {
        if (err) throw new Error('req.session.destroy err');
        reSend.success(res, {});
      });
    } catch(error) {
      reSend.error(res, error);
    }
  });

  router.get('/download/:filename/:name', async (req, res, next) => {
    const { filename, name } = req.params;
    res.download(`data/${filename}`, name);
  });

  return router;
}
