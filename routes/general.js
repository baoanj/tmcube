const express = require('express');
const debug = require('debug')('tmcube:general');
const router = express.Router();

module.exports = (db) => {
  router.get('/:id', function(req, res, next) {
    res.send({
      stats: 1,
      data: req.params.id,
    });
  });

  router.post('/wechat', function(req, res, next) {
    res.send({
      stats: 1,
      data: req.body,
    });
  });

  return router;
}
