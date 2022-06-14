import express from "express";
import cors from "cors";
import fs from "fs";
import { isEmail } from "./utils/formatChecking.js";
import jwt from "jsonwebtoken";
const app = express();
app.use(cors());
app.use(express.json());
//puxando nosso banco de dados do json
let database = JSON.parse(fs.readFileSync("database.json", "utf-8"));

//login route
//--> oque são os req e res?
app.post("/login", (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    res.status(400).send("email and password are required");
  }
  //checar se o email é valido
  const user = database.users.find((user) => user.email === email);
  if (!user) {
    return res.status(400).json({ error: "User not found" });
  }
  //checar se a senha está correta
  if (user.password !== password) {
    return res.status(400).json({ error: "Password does not match" });
  }
  //gerar o token
  //passar de forma rapida pelo jwt, ja que eles ainda vão aprender sobre
  const token = jwt.sign({ id: user.id }, "secret");
  //retornar o token
  return res.json({
    user: {
      id: user.id,
      email: user.email,
    },
    token,
  });
});

//signUp route
app.post("/signup", (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    res.status(400).send("email and password are required");
    return;
  }
  if (!isEmail(email)) {
    res.status(400).send("email is invalid");
    return;
  }
  if (database.users.find((user) => user.email === email)) {
    res.status(400).send("email already in use");
    return;
  }
  database.users.push({
    id: database.users.length + 1,
    password,
    email,
  });

  fs.writeFileSync("database.json", JSON.stringify(database));
  res.send("User created");
});

//adicionar uma musica ao db
app.post("/upload", (req, res) => {
  //checar se o usuario esta logado, estou passando o token pelo body para simplificar o processo
  const { token } = req.body;
  const { id } = jwt.verify(token, "secret");
  if (!token || !id) {
    res.status(400).send("You must be logged in, to upload a song");
    return;
  }
  const { title, artist, url } = req.body;
  if (!title || !artist || !url) {
    res.status(400).send("title, artist and url are required");
    return;
  }
  database.music.push({
    id: database.music.length + 1,
    title,
    artist,
    url,
  });
  fs.writeFileSync("database.json", JSON.stringify(database));
  res.send("Music uploaded");
});
//adicionar uma musica a um album
app.post("/append", (req, res) => {
    //checar se o usuario esta logado, estou passando o token pelo body para simplificar o processo
  const { token } = req.body;
  const { id } = jwt.verify(token, "secret");
  if (!token || !id) {
    res.status(400).send("You must be logged in, to append a song to an album");
    return;
  }
  const { musicId, albumId } = req.body;
  if (!musicId || !albumId) {
    res.status(400).send("musicId and albumId are required");
    return;
  }
  const music = database.music.find((music) => music.id == musicId);
  const album = database.album.find((album) => album.id == albumId);
  if (!music || !album) {
    res.status(400).send("music and/or album not found");
    return;
  }
  album.music.push(musicId);
  fs.writeFileSync("database.json", JSON.stringify(database));
  res.send("Music appended");
});
//retornar todas as musicas de um album
app.get("/album/:id", (req, res) => {
  const { id } = req.params;
  const album = database.album.find((album) => album.id == id);
  console.log(album.music);
  const music = database.music.filter((music) => {
    console.log(music.id);
    return album.music.includes(music.id);
  });
  console.log(music);
  if (!music) {
    res.status(400).send("no music found");
    return;
  }
  res.json(music);
});
//create an album
app.post("/album", (req, res) => {
  const { title, artist } = req.body;
  if (!title || !artist) {
    res.status(400).send("title and artist are required");
    return;
  }
  database.album.push({
    id: database.album.length + 1,
    title,
    artist,
    music: [],
  });
  fs.writeFileSync("database.json", JSON.stringify(database));
  res.send("Album created");
});

//server listening to
app.listen(4000, () => {
  console.log("server listening on http://localhost:4000");
});
