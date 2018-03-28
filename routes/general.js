const express = require('express');
const debug = require('debug')('tmcube:general');
const router = express.Router();

module.exports = (db) => {
  const generalManager = require('../models/generalModel')(db);

  router.post('/regist', (req, res, next) => {
    const { name, stuId, email, password, role } = req.body;

    generalManager.checkEmailExist(email).then(() => {
      generalManager.insertUser(name, stuId, email, password, role).then(() => {
        res.send({
          stats: 1,
          data: {},
        });
      }, () => {
        res.send({
          stats: 0,
          data: {
            error: '注册失败'
          },
        });
      });
    }, () => {
      res.send({
        stats: 0,
        data: {
          error: '邮箱已注册'
        },
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
    const { email, password } = req.body;

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

  });

  router.get('/profile', (req, res, next) => {
    res.send({
      stats: 1,
      data: {
        profile: {
          name: req.session.loginUser.name,
          stuId: req.session.loginUser.stuId,
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

  return router;
}
