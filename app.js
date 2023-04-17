const express = require("express");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");
const bcrypt = require("bcrypt");
const databasePath = path.join(__dirname, "userData.db");

const app = express();

app.use(express.json());

let db = null;

const initializeDbAndServer = async () => {
  try {
    db = await open({
      filename: databasePath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () =>
      console.log("Server Running at http://localhost:3000/")
    );
  } catch (error) {
    console.log(`DB Error: ${error.message}`);
    process.exit(1);
  }
};

initializeDbAndServer();

app.post("/register/", async (req, res) => {
  const { username, name, password, gender, location } = req.body;
  const hashedPassword = await bcrypt.hash(password, 10);
  const query = `select * from user where username = "${username}";`;
  const response = await db.get(query);
  console.log(password.length);
  if (response === undefined) {
    if (password.length < 5) {
      res.status(400);
      res.send("Password is too short");
    } else {
      const newQuery = `insert into user(username,name,password,gender,location) values("${username}","${name}","${hashedPassword}","${gender}","${location}");`;
      const newResponse = await db.run(newQuery);
      res.status(200);
      res.send("User created successfully");
    }
  } else {
    res.status(400);
    res.send("User already exists");
  }
});

// login

app.post("/login/", async (req, res) => {
  const { username, password } = req.body;
  const query = `select * from user where username = "${username}";`;
  const response = await db.get(query);
  if (response === undefined) {
    res.status(400);
    res.send("Invalid user");
  } else {
    const authenticatedUser = await bcrypt.compare(password, response.password);
    if (authenticatedUser) {
      res.status(200);
      res.send("Login success!");
    } else {
      res.status(400);
      res.send("Invalid password");
    }
  }
});

app.put("/change-password", async (req, res) => {
  const { username, oldPassword, newPassword } = req.body;
  const query = `select * from user where username = "${username}";`;
  const response = await db.get(query);
  const authenticatedPassword = await bcrypt.compare(
    oldPassword,
    response.password
  );

  if (authenticatedPassword === true) {
    if (newPassword.length < 5) {
      res.status(400);
      res.send("Password is too short");
    } else {
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      const newQuery = `update user set password = "${hashedPassword}";`;
      await db.run(newQuery);
      res.status(200);
      res.send("Password updated");
    }
  } else if (authenticatedPassword === false) {
    res.status(400);
    res.send("Invalid current password");
  }
});

module.exports = app;
