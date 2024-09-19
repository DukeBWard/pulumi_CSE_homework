'use strict';

const express = require('express');
const app = express();


const message = process.env.MESSAGE;
app.get('/', (req, res) => {
    res.send(`<h1>${message}</h1>`);
});

const port = process.env.PORT || 80;
app.listen(port, () => {
    console.log(`App listening on port ${port}`);
});

