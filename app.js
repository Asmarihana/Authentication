const express = require("express");
const path = require("path");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const app = express();
app.use(express.json());
const bcrypt = require("bcrypt");
const dbPath = path.join(__dirname, "userData.db");
let db = null;

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server Running at http://localhost:3000/");
    });
  } catch (e) {
    console.log(`DB Error: ${e.message}`);
    process.exit(1);
  }
};

initializeDBAndServer();
///API1
app.post("/register", async (request, response) => {
  const { username, name, password, gender, location } = request.body;
  const hashedPassword = await bcrypt.hash(request.body.password, 10);
  const checkTheUsername = `
            SELECT *
            FROM user
            WHERE username = '${username}';`;
  const userData = await db.get(checkTheUsername);
  if (userData === undefined) {
    const postNewUserQuery = `
            INSERT INTO
            user (username,name,password,gender,location)
            VALUES (
                '${username}',
                '${name}',
                '${hashedPassword}',
                '${gender}',
                '${location}'
            );`;
    console.log(password);
    if (password.length < 5) {
      response.status(400);
      response.send("Password is too short");
    } else {
      const newUserDetails = await db.run(postNewUserQuery);
      response.status(200);
      response.send("User created successfully");
    }
  } else {
    response.status(400);
    response.send("User already exists");
  }
});
///API2

app.post("/login", async (request, response) => {
  const { username, password } = request.body;
  const selectUserQuery = `SELECT * FROM user WHERE username='${username}'`;
  const dbUser = await db.get(selectUserQuery);
  if (dbUser === undefined) {
    response.status(400);
    response.send("Invalid user");
  } else {
    const passwordMatch = await bcrypt.compare(password, dbUser.password);
    if (passwordMatch === true) {
      response.status(200);
      response.send("Login success!");
    } else {
      response.status(400);
      response.send("Invalid password");
    }
  }
});
///API3
app.put("/change-password", async (request, response) => {
  const { username, oldPassword, newPassword } = request.body;
  const selectQuery = `SELECT * FROM user WHERE username='${username}'`;
  const dbUser = await db.get(selectQuery);
  if (dbUser === undefined) {
    response.status(400);
    response.send("User not registered");
  } else {
    const passwordMatch = await bcrypt.compare(oldPassword, dbUser.password);
    if (passwordMatch === true) {
      const newPasswordCheck = newPassword.length;
      if (newPasswordCheck < 5) {
        response.status(400);
        response.send("Password is too short");
      } else {
        const encryptedPassword = await bcrypt.hash(newPassword, 10);
        const updateQuery = `
      UPDATE user 
       SET  newPassword='${encryptedPassword}'
       WHERE username='${username}'`;
        await db.run(updateQuery);
        response.send("Password updated");
      }
    } else {
      response.status(400);
      response.send("Invalid current password");
    }
  }
});
module.exports = app;
