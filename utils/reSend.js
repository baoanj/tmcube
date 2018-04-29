module.exports = {
  success(res, data) {
    res.send({
      stats: 1,
      data,
    });
  },
  error(res, debug, error) {
    if (typeof error === 'string') {
      res.send({
        stats: 0,
        data: {
          error,
        },
      });
    } else {
      debug(error);
      res.send({
        stats: 0,
        data: {
          error: '服务器错误',
        },
      });
    }
  },
};
