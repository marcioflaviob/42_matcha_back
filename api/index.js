const express = require('express');
const cors = require('cors');
const routes = require('../routes');
const app = express();
const PORT = process.env.PORT || 3000;
const { setupSocketServer } = require('../utils/WebSocket');
const http = require('http');

const corsOptions = {
    origin: function (origin, callback) {
        const allowedOrigins = (process.env.FRONTEND_URL).split(',');
        if (!origin || allowedOrigins.indexOf(origin) !== -1 || allowedOrigins.includes('*')) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
    optionsSuccessStatus: 204
};

app.use(cors(corsOptions));

app.use(express.json());

app.use('', routes);

const server = http.createServer(app);

const io = setupSocketServer(server);

app.set('io', io);

server.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});

module.exports = app;