const express = require('express');
const debug = require('debug')('tmcube:student');
const router = express.Router();

module.exports = (db) => {
  router.get('/:id', function(req, res, next) {
    res.send(req.params.id);
  });

  return router;
}
