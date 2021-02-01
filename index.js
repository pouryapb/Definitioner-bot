const fetch = require("node-fetch");
const express = require("express");
const app = express();
const { Telegraf } = require("telegraf");

const token = process.env.BOT_TOKEN;
const url = process.env.URL + "secret-path";
const port = process.env.PORT || 3000;

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
            examples ? '\n"_*eg*_:\n' + examples.join("\n") : ""
          }\"${
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
              '\n_pronunciation_: "' +
              (!(defs.pronunciation instanceof Object)
                ? defs.pronunciation
                : defs.pronunciation.all)
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
// bot.launch();

// Enable graceful stop
process.once("SIGINT", () => bot.stop("SIGINT"));
process.once("SIGTERM", () => bot.stop("SIGTERM"));

console.log("Bot it up!!");
