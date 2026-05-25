const express = require("express");
const line = require("@line/bot-sdk");
const axios = require("axios");

const app = express();

const config = {
  channelAccessToken: process.env.CHANNEL_ACCESS_TOKEN,
  channelSecret: process.env.CHANNEL_SECRET,
};

const client = new line.Client(config);

app.post("/webhook", line.middleware(config), async (req, res) => {

  try {

    const events = req.body.events;

    for (const event of events) {

      if (
        event.type !== "message" ||
        event.message.type !== "text"
      ) {
        continue;
      }

      const text = event.message.text;

      console.log("收到:", text);

      let result = "";

      // 中文 → 泰文
      if (/[\u4e00-\u9fa5]/.test(text)) {

        result = await googleTranslate(text, "zh-TW", "th");

      }

      // 泰文 → 中文
      else if (/[\u0E00-\u0E7F]/.test(text)) {

        result = await googleTranslate(text, "th", "zh-TW");

      }

      else {

        result = "請輸入中文或泰文";

      }

      if (!result || result.trim() === "") {
        result = "翻譯失敗";
      }

      await client.replyMessage(event.replyToken, {
        type: "text",
        text: result,
      });

      console.log("回覆:", result);
    }

    res.sendStatus(200);

  } catch (err) {

    console.log(err);

    res.sendStatus(500);
  }
});

// Google翻譯
async function googleTranslate(text, from, to) {

  try {

    const url =
      `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${from}&tl=${to}&dt=t&q=${encodeURIComponent(text)}`;

    const response = await axios.get(url);

    return response.data[0][0][0];

  } catch (error) {

    console.log(error);

    return "翻譯失敗";
  }
}

app.get("/", (req, res) => {
  res.send("Bot running");
});

const PORT = process.env.PORT || 10000;

app.listen(PORT, () => {
  console.log("Server running on port " + PORT);
});
