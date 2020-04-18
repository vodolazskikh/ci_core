const express = require("express");
const app = express();
const axios = require("axios");
const https = require("https");
let { agents, builds } = require("./state");
const { port, apiToken, apiBaseUrl } = require("./server-conf.json");

const agent = new https.Agent({ rejectUnauthorized: false });
const axiosInstance = axios.create({ httpsAgent: agent });

app.get("/", function (req, res) {
  res.send("Билд сервер работает");
});

app.get("/notify-agent", function (req, res) {
  const { host, port } = req.query;
  // На одном хосте+порте может быть ТОЛЬКО ОДИН агент
  const id = `${host}_${port}`;
  // Регистрируем агент - запишем его в стейте
  agents[id] = { id, port, host };
  console.log(`Зарегистрирован билд ${id}`);
  // В ответ отправим список билдов
  res.send(builds);
});

app.get("/notify-build-result", function (req, res) {
  const { id, status, log } = req.query;
  // Обновим состояние билда на билд сервере
  builds[id].status = status;
  console.log(log);
});

app.get("/kill-agent", function (req, res) {
  const { host, port } = req.query;
  const id = `${host}_${port}`;
  agents[id] = undefined;
  res.send(`Агент ${id} уничтожен`);
});

// Раз в минуту опрашиваем апи на предмет наличия билдов
setTimeout(() =>
  axiosInstance
    .get(`${apiBaseUrl}build/list?limit=25`, {
      headers: { Authorization: `Bearer ${apiToken}` },
    })
    .then((response) => {
      // Выполняя getBuilds - положим в стейт информацию о билдах, которые там хранятся
      builds = response.data.data;
    })
    .catch((error) => console.error(error))
),
  60000;

app.listen(port);
