const express = require("express");
const axios = require("axios");

const app = express();

app.use(express.json());

const CHANNEL_ACCESS_TOKEN =
  process.env.CHANNEL_ACCESS_TOKEN;

// 偵測中文
function isChinese(text) {
  return /[\u4e00-\u9fa5]/.test(text);
}

// 偵測泰文
function isThai(text) {
  return /[\u0E00-\u0E7F]/.test(text);
}

// 免費 Google 翻譯
async function translateText(text, from, to) {

  try {

    const url =
      `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${from}&tl=${to}&dt=t&q=${encodeURIComponent(text)}`;

    const response = await axios.get(url);

    return response.data[0]
      .map(item => item[0])
      .join("");

  } catch (error) {

    console.error("翻譯失敗:", error.message);

    return "翻譯失敗";

  }

}

app.post("/webhook", async (req, res) => {

  try {

    const event = req.body.events[0];

    if (
      !event ||
      event.type !== "message" ||
      event.message.type !== "text"
    ) {
      return res.sendStatus(200);
    }

    const userMessage = event.message.text;

    console.log("收到訊息:", userMessage);

    let translatedText = "";

    // 中文 → 泰文
    if (isChinese(userMessage)) {

      translatedText =
        await translateText(
          userMessage,
          "zh-TW",
          "th"
        );

    }

    // 泰文 → 中文
    else if (isThai(userMessage)) {

      translatedText =
        await translateText(
          userMessage,
          "th",
          "zh-TW"
        );

    }

    // 其他
    else {

      translatedText =
        "請輸入中文或泰文";

    }

    // LINE 回覆
    await axios.post(
      "https://api.line.me/v2/bot/message/reply",
      {
        replyToken: event.replyToken,
        messages: [
          {
            type: "text",
            text: translatedText
          }
        ]
      },
      {
        headers: {
          Authorization:
            `Bearer ${CHANNEL_ACCESS_TOKEN}`,
          "Content-Type":
            "application/json"
        }
      }
    );

    console.log("成功回覆");

    res.sendStatus(200);

  } catch (error) {

    console.error(
      "LINE錯誤:",
      error.response?.data ||
      error.message
    );

    res.sendStatus(500);

  }

});

app.get("/", (req, res) => {

  res.send("Thai Translate Bot 運作中");

});

const PORT =
  process.env.PORT || 3000;

app.listen(PORT, () => {

  console.log(
    `Server running on port ${PORT}`
  );

});
