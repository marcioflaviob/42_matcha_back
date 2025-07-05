const db = require('../config/db.js');
const express = require('express');
const cors = require('cors');
const routes = require('../routes.js');
const app = express();
const PORT = process.env.PORT || 3000;
const passport = require('../utils/PassportSetup.js');
const errorHandler = require('../utils/ErrorHandler.js');
const swaggerUi = require('swagger-ui-express');
const swaggerSpecs = require('../swagger.js');
const fs = require('fs');
const https = require('https');
const path = require('path');

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

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpecs, {
    explorer: true,
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: "Matcha API Documentation"
}));

app.use('', routes);

app.use(errorHandler);

const useHttps = process.env.USE_HTTPS;
if (useHttps && useHttps == 'true') {
    const certPath = path.join(__dirname, '../cert/cert.pem');
    const keyPath = path.join(__dirname, '../cert/key.pem');
    const httpsOptions = {
        key: fs.readFileSync(keyPath),
        cert: fs.readFileSync(certPath)
    };
    https.createServer(httpsOptions, app).listen(PORT, () => {
        console.log(`HTTPS Server is running on https://localhost:${PORT}`);
        console.log(`API Documentation available at https://localhost:${PORT}/api-docs`);
    });
} else {
    app.listen(PORT, () => {
        console.log(`Server is running on http://localhost:${PORT}`);
        console.log(`API Documentation available at http://localhost:${PORT}/api-docs`);
    });
}

db.initDB();