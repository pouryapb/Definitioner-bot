import fetch from "node-fetch";
import express from "express";
const app = express();
import { Telegraf } from "telegraf";

const token = process.env.BOT_TOKEN;
const url = process.env.URL + "secret-path";
const port = process.env.PORT || 3000;
// const owl_token = process.env.OWL_TOKEN;

if (token === undefined) {
  throw new Error("BOT_TOKEN must be provided!");
}

const bot = new Telegraf(token);

// Set telegram webhook
bot.telegram.setWebhook(url);

app.get("/", (req, res, next) => res.send("Hello World!"));

// Set the bot API endpoint
app.use(bot.webhookCallback("/secret-path"));

app.listen(port, () => {
  console.log(`app listening on port ${port}!`);
});

bot.start((ctx) => ctx.reply("Welcome"));
bot.help((ctx) => ctx.reply("Send me a sticker"));
bot.on("sticker", (ctx) => ctx.reply("👍"));
bot.hears("hi", (ctx) => ctx.reply("Hellow there!"));

bot.on("inline_query", (ctx) => {
  const word = ctx.inlineQuery.query;
  fetch(
    "https://www.wordsapi.com/mashape/words/" +
      word +
      "?when=2021-02-01T13:30:10.197Z&encrypted=8cfdb18be722919bea9007beec58bdb9aeb12d0931f690b8"
  )
    .then((res) => {
      if (res.status === 404) {
        return null;
      }
      return res.json();
    })
    .then((resBody) => {
      if (resBody === null) {
        ctx.answerInlineQuery([]);
      } else {
        const defs = resBody;
        const text = defs.results.map((info, index) => {
          const examples =
            info.examples === undefined
              ? null
              : info.examples.map((eg) => {
                  return `\"${eg}\"`;
                });
          return `_${info.partOfSpeech}_\n_*definition*_: \"${info.definition}${
            examples ? '"\n_*eg*_:\n' + examples.join("\n") : ""
          }${
            info.synonyms ? "\n_*Synonyms*_: " + info.synonyms.join(", ") : ""
          }`;
        });

        const result = [
          {
            type: "article",
            id: 0,
            title: defs.word,
            description: defs.results[0].definition,
            message_text: `*${defs.word}*${
              defs.pronunciation instanceof Object
                ? '\n_pronunciation_: "' + defs.pronunciation.all
                : defs.pronunciation === undefined
                ? ""
                : '\n_pronunciation_: "' + defs.pronunciation
            }\"\n\n${text
              .join("\n\n\n")
              .replace(/[\-\[\]\/\{\}\(\)\+\?\.\\\^\$\|\!\>\<]/g, "\\$&")}`,
            parse_mode: "MarkdownV2",
          },
        ];
        ctx.answerInlineQuery(result);
      }
    })
    .catch((err) => {
      console.log(err);
    });
});

// OWLBOT witch is not working on heroku
// bot.on("inline_query", (ctx) => {
//   const word = ctx.inlineQuery.query;
//   fetch("http://owlbot.info/api/v4/dictionary/" + word, {
//     method: "GET",
//     headers: {
//       Authorization: "Token " + owl_token,
//     },
//   })
//     .then((res) => {
//       console.log("RESSSSSSPONSEEEEEEE", res);
//       return res.json();
//     })
//     .then((resBody) => {
//       if (resBody.message !== undefined) {
//         ctx.answerInlineQuery([]);
//       } else {
//         const defs = resBody;
//         const emoji = defs.definitions
//           .map((info) => {
//             return info.emoji ? info.emoji : "";
//           })
//           .join();
//         const image = defs.definitions
//           .map((info) => {
//             return info.image_url ? info.image_url : "";
//           })
//           .join();
//         const text = defs.definitions.map((info, index) => {
//           return `_${info.type}_\n_*definition*_: \"${info.definition}${
//             info.example ? '"\n_*eg*_:\n' + info.example : ""
//           }`;
//         });

//         const result = [
//           {
//             type: "article",
//             id: 0,
//             title: defs.word,
//             description: defs.definitions[0].definition,
//             message_text: `*${defs.word}* ${emoji}${
//               '\n_pronunciation_: "' + defs.pronunciation
//             }\"\n\n${text
//               .join("\n\n\n")
//               .replace(/[\-\[\]\/\{\}\(\)\+\?\.\\\^\$\|\!\>\<]/g, "\\$&")}`,
//             thumb_url: image,
//             parse_mode: "MarkdownV2",
//           },
//         ];
//         ctx.answerInlineQuery(result);
//       }
//     })
//     .catch((err) => {
//       console.log(err);
//     });
// });

// bot.launch();

// Enable graceful stop
process.once("SIGINT", () => bot.stop("SIGINT"));
process.once("SIGTERM", () => bot.stop("SIGTERM"));

console.log("Bot it up!!");
