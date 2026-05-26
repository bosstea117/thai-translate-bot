const express = require("express");
const line = require("@line/bot-sdk");
const axios = require("axios");

const app = express();

const config = {
  channelAccessToken: process.env.CHANNEL_ACCESS_TOKEN,
  channelSecret: process.env.CHANNEL_SECRET,
};

const client = new line.Client(config);

// LINE Webhook
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

      let result = "";

      // 中文 → 泰文
      if (/[\u4e00-\u9fa5]/.test(text)) {

        result = await translateText(
          text,
          "zh",
          "th"
        );

      }

      // 泰文 → 中文
      else if (/[\u0E00-\u0E7F]/.test(text)) {

        result = await translateText(
          text,
          "th",
          "zh"
        );

      }

      // 非中泰文
      else {

        result = "請輸入中文或泰文";

      }

      if (!result || result.trim() === "") {
        result = "翻譯失敗";
      }

      await client.replyMessage(
        event.replyToken,
        {
          type: "text",
          text: result
        }
      );

      console.log("成功回覆:", result);

    }

    res.sendStatus(200);

  } catch (err) {

    console.log("LINE錯誤:", err);

    res.sendStatus(500);

  }
});

// LibreTranslate
async function translateText(text, source, target) {

  try {

    const response = await axios.post(
      "https://translate.terraprint.co/translate",
      {
        q: text,
        source: source,
        target: target,
        format: "text"
      },
      {
        headers: {
          "Content-Type": "application/json"
        }
      }
    );

    return response.data.translatedText;

  } catch (error) {

    console.log("翻譯錯誤:", error.message);

    return "翻譯失敗";

  }
}

// 首頁
app.get("/", (req, res) => {
  res.send("ThaiTranslateBot Running");
});

// 啟動
const PORT = process.env.PORT || 10000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
