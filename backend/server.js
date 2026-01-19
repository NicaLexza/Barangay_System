const express = require("express");
const mysql2 = require("mysql2");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const cors = require("cors");

require("dotenv").config();
const app = express();

app.use(express.json());
app.use(cors());


const db = mysql2.createPool(
  {
      host:"localhost",
      user:"root",
      password:"",
      database:"barangay",
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0
  });

  db.getConnection(
    (err, connection) =>{
      if(err){
        console.log("Database connection failed", err);
      }
      else{
        console.log("Connected to MySQL Database");
        connection.release();
      }
    } 
  );

  //Login

  app.post("/login", (req, res) =>{
    const {username, password} = req.body;

    if (!username || !password){
      return res.status(400).json({ message:"All fields are required"});
    }

    const sql = "SELECT * FROM users WHERE Username = ?";
    db.query(sql, [username], async (err, results) => {
      if(err || results.length === 0){
        return res.status(400).json({message:"Invalid username or password"});
      }
      
      const user = results[0];
      // Compare plain text password (since DB stores plain text)
      const isMatch = password === user.Password;

      if(!isMatch){
        return res.status(400).json({message: "Invalid username or password"});
      }

      const token = jwt.sign({ id: user.User_id, username: user.Username}, process.env.JWT_SECRET, { expiresIn:"1h"});
      res.json({message:"Login successful", token, username: user.Username, role: user.Role});
    });
  }); 


  app.listen(5000, ()=>{
    console.log("Server running on port 5000")
  });

  