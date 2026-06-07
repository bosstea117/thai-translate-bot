const express = require("express");
const line = require("@line/bot-sdk");
const axios = require("axios");
const admin = require("firebase-admin");

admin.initializeApp({
  credential: admin.credential.cert({
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n"),
  }),
});

const db = admin.firestore();
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

      console.log("========來源開始========");
      console.log(JSON.stringify(event.source, null, 2));
      console.log("========來源結束========");

      if (
        event.type !== "message" ||
        event.message.type !== "text"
      ) {
        continue;
      }

      const text = event.message.text;

      console.log("收到訊息:", text);

      let translatedText = "";
      // ===== 管理員核准群組 =====
if (text.startsWith("核准 ")) {

  const groupId = text.replace("核准 ", "").trim();

  const adminDoc = await db
    .collection("adminUsers")
    .doc(event.source.userId)
    .get();

  if (!adminDoc.exists) {

    await client.replyMessage(event.replyToken, {
      type: "text",
      text: "你不是管理員"
    });

    continue;
  }

  const pendingDoc = await db
  .collection("pendingGroups")
  .doc(groupId)
  .get();

const pendingData = pendingDoc.data();
  await db.collection("authorizedGroups")
    .doc(groupId)
    .set({
      enabled: true,
      groupName: pendingData.groupName || "未命名",
      createdAt: Date.now()
    });

  await db.collection("pendingGroups")
    .doc(groupId)
    .delete()
    .catch(() => {});

  await client.replyMessage(event.replyToken, {
    type: "text",
    text: `群組已核准：${groupId}`
  });

  continue;
}
// ===== 管理員停權群組 =====
if (text.startsWith("停權")) {

  const groupId = text.replace("停權", "").trim();

  const adminDoc = await db
    .collection("adminUsers")
    .doc(event.source.userId)
    .get();

  if (!adminDoc.exists) {

    await client.replyMessage(event.replyToken, {
      type: "text",
      text: "你不是管理員"
    });

    continue;
  }

  const groupDoc = await db
    .collection("authorizedGroups")
    .doc(groupId)
    .get();

  if (!groupDoc.exists) {

    await client.replyMessage(event.replyToken, {
      type: "text",
      text: "找不到此授權群組"
    });

    continue;
  }

  await db.collection("authorizedGroups")
    .doc(groupId)
    .delete();

  await client.replyMessage(event.replyToken, {
    type: "text",
    text: "✅ 已取消授權\n\n群組ID：\n" + groupId
  });

  continue;
}
// ===== 授權列表 =====
if (text === "授權列表") {

  const adminDoc = await db
    .collection("adminUsers")
    .doc(event.source.userId)
    .get();

  if (!adminDoc.exists) {

    await client.replyMessage(event.replyToken, {
      type: "text",
      text: "你不是管理員"
    });

    continue;
  }

  const snapshot = await db
    .collection("authorizedGroups")
    .get();

  if (snapshot.empty) {

    await client.replyMessage(event.replyToken, {
      type: "text",
      text: "目前沒有已授權群組"
    });

    continue;
  }

  let result = "📋 已授權群組列表\n\n";

  snapshot.forEach(doc => {

    const data = doc.data();

    result +=
      `群組名稱：${data.groupName || "未命名"}\n` +
      `群組ID：${doc.id}\n\n`;

  });

  await client.replyMessage(event.replyToken, {
    type: "text",
    text: result
  });

  continue;
}
      // ===== 申請授權 =====
if (text === "申請授權") {

  if (event.source.type !== "group") {

    await client.replyMessage(event.replyToken, {
      type: "text",
      text: "請把機器人加入群組後，在群組內輸入『申請授權』"
    });

    continue;
  }
const groupSummary = await client.getGroupSummary(
  event.source.groupId
);
  
  await db.collection("pendingGroups")
    .doc(event.source.groupId)
    .set({
      enabled: true,
      groupName: groupSummary.groupName,
      createdAt: Date.now()
    });
  await client.pushMessage(
    "U0041633fe62e42700eda563015b6ae54",
    {
      type: "text",
      text:
       "🔔 新的授權申請\n\n" +
"群組名稱：\n" +
groupSummary.groupName +
"\n\n群組ID：\n" +
event.source.groupId +
"\n\n核准請輸入：\n核准 " +
event.source.groupId
  }
);

  await client.replyMessage(event.replyToken, {
    type: "text",
    text: "已送出授權申請，等待管理員審核"
  });

  continue;
}
 // ===== 禁止私聊 =====
// ===== 禁止一般人私聊 =====
if (event.source.type !== "group") {

  const adminDoc = await db
    .collection("adminUsers")
    .doc(event.source.userId)
    .get();

  if (!adminDoc.exists) {

    await client.replyMessage(event.replyToken, {
      type: "text",
      text: "此機器人僅限已授權群組使用，請將機器人加入群組後輸入「申請授權」。"
    });

    continue;
  }
}
// ===== 群組授權檢查 =====
if (event.source.type === "group") {

  const groupDoc = await db
    .collection("authorizedGroups")
    .doc(event.source.groupId)
    .get();

  if (!groupDoc.exists) {

    await client.replyMessage(event.replyToken, {
      type: "text",
      text: "此群組尚未授權，請輸入『申請授權』"
    });

    continue;
  }
}
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
