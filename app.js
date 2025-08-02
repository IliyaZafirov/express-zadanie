require("dotenv").config();
console.log(process.env.NODE_ENV);

const { client } = require("./config/db-config");

const express = require("express");
const app = express();
const PORT = process.env.PORT;
const loggedIn = require("./controllers/loggedIn");
const helmet = require("helmet");

app.set("trust proxy", true);

// Middleware
const cookie = require("cookie-parser");
app.use(cookie());
const cors = require("cors");

app.use(helmet.frameguard({ action: "deny" }));
app.use(helmet.noSniff());

// CORS middleware
app.use(
  cors({
    origin: "https://next-zadanie.vercel.app",
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "X-CSRF-Token",
      "X-Requested-With",
      "Accept",
      "Accept-Version",
      "Content-Length",
      "Content-MD5",
      "Date",
      "X-Api-Version",
    ],
  })
);
// Body parsers
app.use(express.urlencoded({ extended: false }));
app.use(express.json());

// Routes
//app.all("*", loggedIn); // ??????????????????
app.use("/", require("./controllers/pages"));
app.use("/auth", require("./controllers/auth"));

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
