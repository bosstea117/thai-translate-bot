const express = require("express");

const app = express();

app.use(express.json());

app.post("/webhook", (req, res) => {
  const message = req.body.events?.[0]?.message?.text;

  console.log("收到訊息:", message);

  res.sendStatus(200);
});

app.get("/", (req, res) => {
  res.send("Thai Translate Bot 運作中");
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
