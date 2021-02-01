const express = require("express");
const app = express();
// const owlbot = require("owlbot-js");
const { Telegraf } = require("telegraf");

const wordsApi = require("./wordsApi");
const token = process.env.BOT_TOKEN;
// const owl_token = process.env.OWL_TOKEN;
const url = process.env.URL + "secret-path";
const port = process.env.PORT || 3000;

if (token === undefined) {
  throw new Error("BOT_TOKEN must be provided!");
}

const bot = new Telegraf(token);
// const client = owlbot(owl_token);

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
  //   client
  //     .define(ctx.inlineQuery.query)
  //     .then((def) => {
  //       const text = `${"*_" + def.word + "_*"} ${
  //         def.definitions[0].emoji ? def.definitions[0].emoji : ""
  //       }
  // ${def.pronunciation ? "_pronunciation_: " + def.pronunciation + "\n" : ""}
  // ${def.definitions[0].definition}
  // ${
  //   def.definitions[0].example
  //     ? '\n_eg_: "' + def.definitions[0].example + '"'
  //     : ""
  // }`;
  //       const result = [
  //         {
  //           type: "article",
  //           id: 0,
  //           title: def.word,
  //           description: def.definitions[0].definition,
  //           message_text: text.replace(
  //             /[\-\[\]\/\{\}\(\)\+\?\.\\\^\$\|\!\>\<]/g,
  //             "\\$&"
  //           ),
  //           thumb_url: def.definitions[0].image_url,
  //           parse_mode: "MarkdownV2",
  //         },
  //       ];
  //       ctx.answerInlineQuery(result);
  //     })
  //     .catch((err) => {
  //       console.log(err);
  //       ctx.answerInlineQuery([]);
  //     });

  const word = ctx.inlineQuery.query;
  const defs = wordsApi(word);
  console.log(defs);
  if (defs === null) {
    ctx.answerInlineQuery([]);
  } else {
    const text = defs.results.map((info, index) => {
      const examples = info.examples
        ? null
        : info.examples.map((eg) => {
            return `\"${eg}\"`;
          });
      return `_${info.partOfSpeech}_\ndefinition: \"${info.definition}${
        examples ? '\n"eg:\n' + examples.join("\n") : ""
      }${info.synonyms ? "\n\n _Synonyms_: " + info.synonyms.join(", ") : ""}`;
    });

    const result = [
      {
        type: "article",
        id: 0,
        title: defs.word,
        description: defs.results[0].definition,
        message_text:
          `*${defs.word}\npronunciation: ${defs.pronunciation.all}\n*` +
          text
            .replace(/[\-\[\]\/\{\}\(\)\+\?\.\\\^\$\|\!\>\<]/g, "\\$&")
            .join("\n\n\n"),
        parse_mode: "MarkdownV2",
      },
    ];
    ctx.answerInlineQuery(result);
  }
});
// bot.launch();

// Enable graceful stop
process.once("SIGINT", () => bot.stop("SIGINT"));
process.once("SIGTERM", () => bot.stop("SIGTERM"));

console.log("Bot it up!!");
