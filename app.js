const createError = require('http-errors');
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const debug = require('debug')('tmcube:app');
const session = require('express-session');
const MongoStore = require('connect-mongo')(session);

module.exports = (db) => {
  const generalRouter = require('./routes/general')(db);
  const teacherRouter = require('./routes/teacher')(db);
  const studentRouter = require('./routes/student')(db);

  const app = express();

  app.use(logger('dev'));
  app.use(express.json());
  app.use(express.urlencoded({ extended: false }));
  app.use(cookieParser());

  app.use(session({
    secret: 'tmcu be',
    store: new MongoStore({
      url: 'mongodb://localhost:27017/tmcu',
      ttl: 14 * 24 * 60 * 60 // = 14 days. Default
    }),
    resave: false,
    saveUninitialized: false,
    cookie: {
      maxAge: 60 * 60 * 1000
    }
  }));

  app.use('/api/general', generalRouter);
  app.use('/api/teacher', teacherRouter);
  app.use('/api/student', studentRouter);

  // catch 404 and forward to error handler
  app.use(function(req, res, next) {
    next(createError(404));
  });

  // error handler
  app.use(function(err, req, res, next) {
    // set locals, only providing error in development
    res.locals.message = err.message;
    res.locals.error = req.app.get('env') === 'development' ? err : {};

    // render the error page
    res.status(err.status || 500);
    res.send('error');
  });

  return app;
}
