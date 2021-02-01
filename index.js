require("dotenv");
const owlbot = require("owlbot-js");
const client = owlbot(process.env.OWL_TOKEN);

const { Telegraf } = require("telegraf");
const bot = new Telegraf(process.env.BOT_TOKEN);

// TLS options
const tlsOptions = {
  key: fs.readFileSync("server-key.pem"),
  cert: fs.readFileSync("server-cert.pem"),
};

// Set telegram webhook
// The second argument is necessary only if the client uses a self-signed
// certificate. Including it for a verified certificate may cause things to break.
bot.telegram.setWebhook("https://server.tld:8443/secret-path");

// Start https webhook
bot.startWebhook("/secret-path", tlsOptions, 8443);

// Http webhook, for nginx/heroku users.
bot.startWebhook("/secret-path", null, 5000);

// const spellChecker = require("simple-spellchecker");
// const dictionary = spellChecker.getDictionarySync("en-US");
// const suggestions = dictionary.getSuggestions("ow");
// const result = suggestions.map(async (word) => {
//   const result = await client.define(word);
//   return result;
// });

bot.start((ctx) => ctx.reply("Welcome"));
bot.help((ctx) => ctx.reply("Send me a sticker"));
bot.on("sticker", (ctx) => ctx.reply("👍"));
bot.hears("hi", (ctx) => ctx.reply("Hellow there!"));

bot.on("inline_query", (ctx) => {
  client
    .define(ctx.inlineQuery.query)
    .then((def) => {
      const text = `${"*_" + def.word + "_*"} ${
        def.definitions[0].emoji ? def.definitions[0].emoji : ""
      }
${def.pronunciation ? "_pronunciation_: " + def.pronunciation + "\n" : ""}
${def.definitions[0].definition}
${
  def.definitions[0].example
    ? '\n_eg_: "' + def.definitions[0].example + '"'
    : ""
}`;
      const result = [
        {
          type: "article",
          id: 0,
          title: def.word,
          description: def.definitions[0].definition,
          message_text: text.replace(
            /[\-\[\]\/\{\}\(\)\+\?\.\\\^\$\|\!\>\<]/g,
            "\\$&"
          ),
          thumb_url: def.definitions[0].image_url,
          parse_mode: "MarkdownV2",
        },
      ];

      ctx.answerInlineQuery(result);
    })
    .catch((err) => {
      console.log(err);
      ctx.answerInlineQuery([]);
    });
});
bot.launch();

// Enable graceful stop
process.once("SIGINT", () => bot.stop("SIGINT"));
process.once("SIGTERM", () => bot.stop("SIGTERM"));

console.log("Bot it up!!");
