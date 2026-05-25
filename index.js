const express = require("express");
const axios = require("axios");

const app = express();

app.use(express.json());

const CHANNEL_ACCESS_TOKEN = process.env.CHANNEL_ACCESS_TOKEN;

app.post("/webhook", async (req, res) => {
  try {
    const event = req.body.events[0];

    console.log("完整資料:", JSON.stringify(req.body));

    if (!event) {
      return res.sendStatus(200);
    }

    const userMessage = event.message.text;

    console.log("收到訊息:", userMessage);

    await axios.post(
      "https://api.line.me/v2/bot/message/reply",
      {
        replyToken: event.replyToken,
        messages: [
          {
            type: "text",
            text: `你剛剛說：${userMessage}`,
          },
        ],
      },
      {
        headers: {
          Authorization: `Bearer ${CHANNEL_ACCESS_TOKEN}`,
          "Content-Type": "application/json",
        },
      }
    );

    console.log("成功回覆");

    res.sendStatus(200);
  } catch (error) {
    console.log("LINE錯誤:", error.response?.data || error.message);
    res.sendStatus(500);
  }
});

app.get("/", (req, res) => {
  res.send("Bot running");
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
