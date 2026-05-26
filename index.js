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

      console.log("收到訊息:", text);

      let translatedText = "";

      // 中文 → 泰文
      if (/[\u4e00-\u9fff]/.test(text)) {
        translatedText = await translateText(
          text,
          "zh-TW",
          "th"
        );
      }

      // 泰文 → 中文
      else if (/[\u0E00-\u0E7F]/.test(text)) {
        translatedText = await translateText(
          text,
          "th",
          "zh-TW"
        );
      }

      else {
        translatedText = "請輸入中文或泰文";
      }

      await client.replyMessage(event.replyToken, {
        type: "text",
        text: translatedText,
      });

      console.log("成功回覆:", translatedText);
    }

    res.sendStatus(200);

  } catch (err) {
    console.error(err);
    res.sendStatus(500);
  }
});

async function translateText(text, source, target) {
  try {

    const apiKey = process.env.GOOGLE_API_KEY;

    const response = await axios.post(
      `https://translation.googleapis.com/language/translate/v2?key=${apiKey}`,
      {
        q: text,
        source: source,
        target: target,
        format: "text",
      }
    );

    return response.data.data.translations[0].translatedText;

  } catch (error) {

    console.error(
      "翻譯錯誤:",
      error.response?.data || error.message
    );

    return "翻譯失敗";
  }
}

app.get("/", (req, res) => {
  res.send("Thai Translate Bot Running");
});

const PORT = process.env.PORT || 10000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
