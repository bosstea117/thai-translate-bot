const express = require("express");
const line = require("@line/bot-sdk");
const axios = require("axios");

const app = express();

const config = {
  channelAccessToken: process.env.CHANNEL_ACCESS_TOKEN,
  channelSecret: process.env.CHANNEL_SECRET,
};

const client = new line.Client(config);

// Webhook
app.post("/webhook", line.middleware(config), async (req, res) => {

  try {

    const events = req.body.events;

    for (const event of events) {

      // 只處理文字訊息
      if (
        event.type !== "message" ||
        event.message.type !== "text"
      ) {
        continue;
      }

      const userText = event.message.text;

      console.log("收到訊息:", userText);

      let translatedText = "";

      // 中文 → 泰文
      if (isChinese(userText)) {

        translatedText = await translateText(
          userText,
          "zh-TW",
          "th"
        );

      }

      // 泰文 → 中文
      else if (isThai(userText)) {

        translatedText = await translateText(
          userText,
          "th",
          "zh-TW"
        );

      }

      // 其他語言
      else {

        translatedText = "請輸入中文或泰文";

      }

      // 防止空白訊息
      if (
        !translatedText ||
        translatedText.trim() === ""
      ) {
        continue;
      }

      // 回覆訊息
      await client.replyMessage(
        event.replyToken,
        {
          type: "text",
          text: translatedText,
        }
      );

      console.log("成功回覆:", translatedText);
    }

    res.sendStatus(200);

  } catch (err) {

    console.error(
      "LINE錯誤:",
      err.response?.data || err.message
    );

    res.sendStatus(500);
  }
});

// 判斷中文
function isChinese(text) {

  return /[\u4e00-\u9fa5]/.test(text);

}

// 判斷泰文
function isThai(text) {

  return /[\u0E00-\u0E7F]/.test(text);

}

// Google 免費翻譯
async function translateText(text, from, to) {

  try {

    const url =
      `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${from}&tl=${to}&dt=t&q=${encodeURIComponent(text)}`;

    const response = await axios.get(url);

    return response.data[0][0][0];

  } catch (error) {

    console.error(
      "翻譯失敗:",
      error.response?.data || error.message
    );

    return "翻譯失敗";
  }
}

// 首頁
app.get("/", (req, res) => {

  res.send("Thai Translate Bot is running!");

});

// 啟動 server
const PORT = process.env.PORT || 10000;

app.listen(PORT, () => {

  console.log(`Server running on port ${PORT}`);

});
