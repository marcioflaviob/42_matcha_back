const express = require('express');
const cors = require('cors');
const routes = require('../routes');
const app = express();
const PORT = process.env.PORT || 3000;

const corsOptions = {
    origin: true,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
    optionsSuccessStatus: 204
};

app.use(cors(corsOptions));

app.use(express.json());

app.use(express.urlencoded({ extended: true }));
 
app.use('', routes);

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});