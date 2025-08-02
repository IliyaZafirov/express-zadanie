require("dotenv").config();
console.log(process.env.NODE_ENV);

const { client } = require("./config/db-config");

const express = require("express");
const app = express();
const PORT = process.env.PORT;
const loggedIn = require("./controllers/loggedIn");
const helmet = require("helmet");

app.set("trust proxy", 1); // важно за secure cookies през proxy

const cookie = require("cookie-parser");
app.use(cookie());

const cors = require("cors");
app.use(
  cors({
    origin: "https://next-zadanie.vercel.app",
    credentials: true,
  })
);

app.use(helmet.frameguard({ action: "deny" }));
app.use(helmet.noSniff());

app.use(express.urlencoded({ extended: false }));
app.use(express.json());

// Routes
app.use("/", require("./controllers/pages"));
app.use("/auth", require("./controllers/auth")); // без loggedIn тук

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
