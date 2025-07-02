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

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
    console.log(`API Documentation available at http://localhost:${PORT}/api-docs`);
});

db.initDB();