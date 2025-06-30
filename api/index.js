const db = require('../config/db.js');
const express = require('express');
const cors = require('cors');
const routes = require('../routes.js');
const app = express();
const PORT = process.env.PORT || 3000;
const passport = require('../utils/PassportSetup.js');
const errorHandler = require('../utils/ErrorHandler.js');

app.set('trust proxy', true);

const corsOptions = {
    origin: true,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
    optionsSuccessStatus: 204
};

app.use(cors(corsOptions));

app.use(express.json());

app.use(express.urlencoded({ extended: true }));

app.use(passport.initialize());

app.use('', routes);

app.use(errorHandler);

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});

db.initDB();