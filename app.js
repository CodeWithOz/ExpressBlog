const createError = require('http-errors');
const express = require('express');
const logger = require('morgan');
const path = require('path');
const okta = require('@okta/okta-sdk-nodejs');
const session = require('express-session');
const ExpressOIDC = require('@okta/oidc-middleware').ExpressOIDC;

const { client_secret, session_secret } = require('./apiKeys');

const blogRouter = require('./routes/blog');
const usersRouter = require('./routes/users');

const app = express();
const client = new okta.Client({
  orgUrl: 'https://dev-431001.okta.com',
  token: '00Nui1O_QJeUqLWGXHcpiDJkVdyV8c3hGSqTOamAjk'
});

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

// Middleware
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'public')));

const oidc = new ExpressOIDC({
  issuer: 'https://dev-431001.okta.com/oauth2/default',
  client_id: '0oacf8iavPMGwTWS1356',
  client_secret,
  redirect_uri: 'http://localhost:3000/users/callback',
  scope: 'openid profile',
  routes: {
    login: {
      path: '/users/login'
    },
    callback: {
      path: '/users/callback',
      defaultRedirect: '/dashboard'
    }
  }
});

app.use(
  session({
    secret: session_secret,
    resave: true,
    saveUninitialized: false
  })
);

app.use(oidc.router);

app.use((req, res, next) => {
  if (!req.userinfo) {
    return next();
  }

  client.getUser(req.userinfo.sub).then(user => {
    req.user = user;
    res.locals.user = user;
    next();
  });
});

// Routes
app.use('/', blogRouter);
app.use('/users', usersRouter);

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
  res.render('error');
});

module.exports = app;
