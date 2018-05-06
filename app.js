const express = require('express');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const debug = require('debug')('tmcube:app');
const session = require('express-session');
const MongoStore = require('connect-mongo')(session);

module.exports = (db) => {
  const generalRouter = require('./routes/general')(db); // eslint-disable-line
  const teacherRouter = require('./routes/teacher')(db); // eslint-disable-line
  const studentRouter = require('./routes/student')(db); // eslint-disable-line

  const app = express();

  app.use(logger('dev'));
  app.use(express.json());
  app.use(express.urlencoded({ extended: false }));
  app.use(cookieParser());

  app.use(session({
    secret: 'tmcu be',
    store: new MongoStore({
      url: 'mongodb://localhost:27017/tmcu',
      ttl: 14 * 24 * 60 * 60, // = 14 days. Default
    }),
    resave: false,
    saveUninitialized: false,
    cookie: {
      maxAge: 24 * 60 * 60 * 1000,
    },
  }));

  app.use('/api/general', generalRouter);
  app.use('/api/teacher', teacherRouter);
  app.use('/api/student', studentRouter);

  // catch multer error
  app.use((err, req, res, next) => {
    debug(err);
    next();
  });

  // catch else routes and handle error
  app.use((req, res) => {
    res.status(400).send();
  });

  return app;
};
