require("dotenv").config();
console.log(process.env.NODE_ENV);

const { client } = require("./config/db-config");

const express = require("express");
const app = express();
const PORT = process.env.PORT;
const loggedIn = require("./controllers/loggedIn");

app.set("trust proxy", true); //

// Middleware
const cookie = require("cookie-parser");
app.use(cookie());
const cors = require("cors");

// CORS middleware
// ...

// Body parsers
app.use(express.urlencoded({ extended: false }));
app.use(express.json());

// Routes
//app.all("*", loggedIn); // ??????????????????
app.use("/", require("./controllers/pages"));
app.use("/auth", loggedIn, require("./controllers/auth"));

client.connect((err) => {
  if (err) {
    console.log(err);
    process.exit(0);
  }
  console.log("Database connected");
});

try {
  app.listen(PORT, () => console.log(`Listening on port ${PORT}`));
} catch (error) {
  console.error(`Starting the server error: ${error}`);
}
