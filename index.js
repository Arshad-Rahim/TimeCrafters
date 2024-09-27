const express = require('express');
const app = express();
const env = require('dotenv').config();
const db = require('../first project/config/db');
db();


app.listen(3000, ()=>console.log("Server is running"))