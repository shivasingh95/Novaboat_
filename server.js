import express from "express";
import axios from "axios";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { db } from "./firebase.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

// ----------------- AUTH ROUTES -----------------

app.post("/api/signup", async (req,res)=>{
  const { username, email, password } = req.body;
  const hashed = await bcrypt.hash(password, 10);
  try{
    await db.collection("users").doc(email).set({ username, email, password: hashed, chatHistory: [] });
    res.json({ message: "Signup successful" });
  }catch(e){
    res.status(400).json({ error: e.message });
  }
});

app.post("/api/login", async (req,res)=>{
  const { email, password } = req.body;
  const doc = await db.collection("users").doc(email).get();
  if(!doc.exists) return res.status(404).json({ error: "User not found" });
  const user = doc.data();
  const match = await bcrypt.compare(password, user.password);
  if(!match) return res.status(401).json({ error: "Wrong password" });
  const token = jwt.sign({ email }, process.env.JWT_SECRET, { expiresIn: "7d" });
  res.json({ token, username: user.username, chatHistory: user.chatHistory });
});

// ----------------- CHAT ROUTE -----------------

app.post("/api/chat", async (req,res)=>{
  const { message, email } = req.body;
  try{
    const response = await axios.post(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        model: "meta-llama/llama-3.1-8b-instruct",
        messages: [{ role: "user", content: message }]
      },
      {
        headers: {
          "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
          "Content-Type": "application/json"
        }
      }
    );

    const botReply = response.data.choices[0].message.content;

    // Save chat to Firebase
    const userRef = db.collection("users").doc(email);
    const doc = await userRef.get();
    if(doc.exists){
      const chatHistory = doc.data().chatHistory || [];
      chatHistory.push({ message, role: "user", timestamp: new Date() });
      chatHistory.push({ message: botReply, role: "bot", timestamp: new Date() });
      await userRef.update({ chatHistory });
    }

    res.json({ reply: botReply });
  }catch(err){
    res.json({ reply: "Error: " + err.message });
  }
});

// ----------------- START SERVER -----------------

app.listen(PORT, ()=> console.log(`NovaBoat running at http://localhost:${PORT}`));
