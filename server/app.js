const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const session = require('express-session');
const mysql = require('mysql2');

const indexRouter = require('./routes/index');
const usersRouter = require('./routes/users');
const ajaxRouter = require('./routes/ajax');

const app = express();

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.use(session({
    secret: 'asd65a4s6d45 oogabooga topSecret superdupa das6d465as4d6as',
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false }
}), function (req, res, next) {
    if (req.session.initialisedSession === undefined) {
        req.session.initialisedSession = true;
        // Set default values.
        req.session.colors = {
            c1: '#B5C0D0',
            c2: '#CCD3CA',
            c3: '#fffcf5',
            c4: '#e3e6f0',
            text: '#000000'
        };
        req.session.userID = -1;
        req.session.isAdmin = 0;
        req.session.currentGroupID = -1;
        req.session.username = 'Guest';
    }
    next();
});

const dbConnectionPool = mysql.createPool({
    host: 'localhost',
    database: 'dabase'
});

app.use(function (req, res, next) {
    req.pool = dbConnectionPool;
    next();
});

app.use(express.static(path.join(__dirname, 'public')));

app.use('/ajax', ajaxRouter);
app.use('/users', usersRouter);
app.use('/', indexRouter);

module.exports = app;
