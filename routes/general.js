const express = require('express');
const debug = require('debug')('tmcube:general');
const svgCaptcha = require('../utils/svg-captcha');
const router = express.Router();
const sendEmail = require('../utils/sendEmail');
const validate = require('../utils/validate');

module.exports = (db) => {
  const generalManager = require('../models/generalModel')(db);

  router.post('/regist', (req, res, next) => {
    const { name, stuId, email, password, role, captcha, host } = req.body;

    if (captcha.toUpperCase() !== req.session.captcha.toUpperCase()) {
      res.send({
        stats: 0,
        data: {
          error: '验证码错误'
        },
      });
      return;
    }

    if (!validate.validEmail(email) || !validate.validPassword2(password) || !name ||
      (role === 'student' && !stuId) || (role !== 'student' && role !== 'teacher')) {
      res.send({
        stats: 0,
        data: {
          error: '填写的信息有误'
        },
      });
      return;
    }

    generalManager.checkEmailExist(email).then(() => {
      generalManager.insertUser(name, stuId, email, password, role).then(() => {
        generalManager.addValidateEmail(email).then((result) => {
          sendEmail(
            email,
            '【邮箱激活】高校教学管理系统',
            `请复制此链接在浏览器窗口打开：${host}/activate/${result.ops[0]._id}`
          ).then(() => {
            res.send({
              stats: 1,
              data: {}
            });
          }).catch((error) => {
            debug(error);
            res.send({
              stats: 1,
              data: {}
            });
          });
        }).catch((error) => {
          debug(error);
          res.send({
            stats: 1,
            data: {}
          });
        });
      }, (error) => {
        debug(error);
        res.send({
          stats: 0,
          data: {
            error: '注册失败'
          }
        });
      });
    }, () => {
      res.send({
        stats: 0,
        data: {
          error: '邮箱已注册'
        }
      });
    });
  });

  router.post('/sendEmail', (req, res, next) => {
    const { email, host } = req.body;

    generalManager.findValidateId(email).then((activateId) => {
      sendEmail(
        email,
        '【邮箱激活】高校教学管理系统',
        `请复制此链接在浏览器窗口打开：${host}/activate/${activateId}`
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
            error: '邮件发送失败'
          }
        });
      });
    }, (error) => {
      debug(error);
      res.send({
        stats: 0,
        data: {
          error: '系统出错，请联系管理员'
        }
      });
    });
  });

  router.put('/activateEmail/:activateId', (req, res, next) => {
    const { activateId } = req.params;

    if (!/^[a-f0-9]{24}$/.test(activateId)) {
      res.send({
        stats: 0,
        data: {
          error: '无效链接'
        }
      });
      return;
    }

    generalManager.findValidateEmail(activateId).then((email) => {
      generalManager.updateUserActivation(email).then(() => {
        res.send({
          stats: 1,
          data: {}
        });
      }).catch((error) => {
        debug(error);
        res.send({
          stats: 0,
          data: {
            error: '激活失败'
          }
        });
      })
    }, (error) => {
      debug(error);
      res.send({
        stats: 0,
        data: {
          error: '无效的激活'
        }
      });
    });
  });

  router.post('/checkEmail', (req, res, next) => {
    generalManager.checkEmailExist(req.body.email).then(() => {
      res.send({
        stats: 1,
        data: {}
      });
    }, () => {
      res.send({
        stats: 0,
        data: {
          error: '邮箱已注册'
        }
      });
    });
  });

  router.post('/login', (req, res, next) => {
    const { email, password, captcha } = req.body;

    if (captcha.toUpperCase() !== req.session.captcha.toUpperCase()) {
      res.send({
        stats: 0,
        data: {
          error: '验证码错误'
        },
      });
      return;
    }

    if (!validate.validEmail(email)) {
      res.send({
        stats: 0,
        data: {
          error: '邮箱格式错误'
        },
      });
      return;
    }

    generalManager.checkLogin(email, password).then((user) => {
      req.session.regenerate((err) => {
        if (err) {
          res.send({
            stats: 0,
            data: {
              error: '登录失败'
            },
          });
        } else {
          req.session.loginUser = user;
          res.send({
            stats: 1,
            data: {},
          });
        }
      });
    }, (error) => {
      res.send({
        stats: 0,
        data: {
          error
        },
      });
    });
  });

  router.get('/getCaptcha', (req, res, next) => {
    const captcha = svgCaptcha.create();
    req.session.captcha = captcha.text;
    res.send({
      stats: 1,
      data: {
        captcha: captcha.data
      }
    });
  });

  router.post('/checkCaptcha', (req, res, next) => {
    if (req.body.captcha.toUpperCase() === req.session.captcha.toUpperCase()) {
      res.send({
        stats: 1,
        data: {}
      });
    } else {
      res.send({
        stats: 0,
        data: {
          error: '验证码错误'
        }
      });
    }
  });

  router.post('/forgotPass', (req, res, next) => {
    const { email, captcha, host } = req.body;

    if (captcha.toUpperCase() !== req.session.captcha.toUpperCase()) {
      res.send({
        stats: 0,
        data: {
          error: '验证码错误'
        },
      });
      return;
    }

    generalManager.checkEmailExist(email).then(() => {
      res.send({
        stats: 0,
        data: {
          error: '邮箱未注册'
        }
      });
    }, () => {
      generalManager.addForgotPass(email).then((result) => {
        sendEmail(
          email,
          '【重置密码】高校教学管理系统',
          `请复制此链接(10分钟内有效)在浏览器窗口打开：${host}/reset/${result.ops[0]._id}`
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
              error: '邮件发送失败'
            }
          });
        });
      }).catch((error) => {
        debug(error);
        res.send({
          stats: 0,
          data: {
            error: '服务器出毛病了'
          }
        });
      });
    });
  });

  router.post('/checkReset/:resetId', (req, res, next) => {
    const { resetId } = req.params;

    if (!/^[a-f0-9]{24}$/.test(resetId)) {
      res.send({
        stats: 0,
        data: {
          error: '无效链接'
        }
      });
      return;
    }

    generalManager.findForgotPass(resetId).then((data) => {
      if (!data) {
        res.send({
          stats: 0,
          data: {
            error: '无效链接'
          }
        });
      } else if (data.expiredDate < Date.now()) {
        res.send({
          stats: 0,
          data: {
            error: '该链接已失效'
          }
        });
      } else {
        res.send({
          stats: 1,
          data: {}
        });
      }
    }).catch((error) => {
      debug(error);
      res.send({
        stats: 0,
        data: {
          error: '服务器出毛病了'
        }
      });
    });
  });

  router.post('/resetPass/:resetId', (req, res, next) => {
    const { password } = req.body;
    const { resetId } = req.params;

    if (!/^[a-f0-9]{24}$/.test(resetId)) {
      res.send({
        stats: 0,
        data: {
          error: '无效链接'
        }
      });
      return;
    }

    generalManager.findForgotPass(resetId).then((data) => {
      if (!data) {
        res.send({
          stats: 0,
          data: {
            error: '无效链接'
          }
        });
      } else if (data.expiredDate < Date.now()) {
        res.send({
          stats: 0,
          data: {
            error: '该链接已失效'
          }
        });
      } else {
        generalManager.updateUserPassword(data.email, password).then(() => {
          res.send({
            stats: 1,
            data: {}
          });
        }).catch((error) => {
          debug(error);
          res.send({
            stats: 0,
            data: {
              error: '重置失败'
            }
          });
        });
      }
    }).catch((error) => {
      debug(error);
      res.send({
        stats: 0,
        data: {
          error: '服务器出毛病了'
        }
      });
    });
  });

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

  router.get('/getClasses', (req, res, next) => {
    const classIds = req.session.loginUser.classIds;
    if (classIds.length === 0) {
      res.send({
        stats: 1,
        data: {
          classes: [],
          classIds: []
        }
      });
    } else {
      generalManager.findClasses(classIds).then((result) => {
        res.send({
          stats: 1,
          data: {
            classes: result,
            classIds
          }
        });
      }, (error) => {
        debug(error);
        res.send({
          stats: 0,
          data: {
            error: '获取班级数据失败'
          }
        });
      });
    }
  });

  router.put('/moveClasses', (req, res, next) => {
    const { classIds } = req.body;
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
          error: '移动失败'
        }
      });
    });
  });

  router.get('/getHws', (req, res, next) => {
    const { classId } = req.query;
    const classIds = req.session.loginUser.classIds;
    if (!classIds.includes(classId)) {
      res.send({
        stats: 0,
        data: {
          error: '权限不足'
        }
      });
    } else {
      generalManager.findClass(classId, req.session.loginUser).then((result) => {
        res.send({
          stats: 1,
          data: {
            class: result
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

  router.get('/getSubs', (req, res, next) => {
    const { classId, createDate } = req.query;
    const classIds = req.session.loginUser.classIds;
    if (!classIds.includes(classId)) {
      res.send({
        stats: 0,
        data: {
          error: '权限不足'
        }
      });
    } else {
      generalManager.findHw(
        classId,
        createDate,
        req.session.loginUser
      ).then((result) => {
        res.send({
          stats: 1,
          data: {
            homework: result
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

  router.get('/profile', (req, res, next) => {
    res.send({
      stats: 1,
      data: {
        profile: {
          name: req.session.loginUser.name,
          stuId: req.session.loginUser.stuId,
          email: req.session.loginUser.email,
          role: req.session.loginUser.role
        }
      }
    });
  });

  router.post('/logout', (req, res, next) => {
    req.session.destroy((err) => {
      if (err) {
        res.send({
          stats: 0,
          data: {
            error: '退出失败'
          }
        });
      } else {
        res.send({
          stats: 1,
          data: {}
        });
      }
    });
  });

  router.get('/download/:filename/:name', (req, res, next) => {
    const { filename, name } = req.params;
    res.download(`data/${filename}`, name);
  });

  return router;
}
