const express = require("express");
const app = express();
const axios = require("axios");
const https = require("https");
const { exec } = require("child_process");

const { port, serverHost, serverPort } = require("./agent-conf.json");

const agent = new https.Agent({ rejectUnauthorized: false });
const axiosInstance = axios.create({ httpsAgent: agent });

// При запуске дергаем ручку /notify-agent для регистрации агента в сервере
axiosInstance
  .get(
    `http://${serverHost}:${serverPort}/notify-agent?host=${serverHost}&port=${port}`
  )
  .then((response) => {
    console.log("response", response.data);
  })
  .catch((err) => console.log("Ошибка", err));

app.get("/", function (req, res) {
  res.send("Билд агент работает");
});

app.get("/build", function (req, res) {
  const { id, repoUrl, hash, command } = req.query;
  // Выполняем команду для билда
  exec([command], (err, stdout) => {
    if (err) {
      console.log("err", err);
    }
    if (stdout) {
      const status = "success";
      axiosInstance
        .get(
          `http://${serverHost}:${serverPort}/notify-build-result?id=${id}&status=${status}&log=${data}`
        )
        .then((response) => {
          console.log("Статус билда обновлен");
        })
        .catch(() => res.sendStatus(500));
    }
  });

  res.send(`Сборка ${id} запущена`);
});

// При отключении агента - сходим в сервер и уничтожим агент
process.on("exit", () => {
  axiosInstance
    .get(
      `http://${serverHost}:${serverPort}/kill-agent?host=${serverHost}&port=${port}`
    )
    .then((response) => {
      console.log(response);
    })
    .catch((err) => console.log("Ошибка", err));
});

app.listen(port);
