import express from "express";
import path from "path";

import createRoutes from "./routes.js";

const app = express();
const __dirname = path.resolve();
const port = process.env.PORT || 80;

createRoutes(app, __dirname);

app.listen(port, () => {
    console.clear();
    console.log(`Server is up on port: ${port}!`);
})