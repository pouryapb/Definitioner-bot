import express from 'express';
import { Telegraf } from 'telegraf';
import { message } from 'telegraf/filters';
import { escapers } from '@telegraf/entity';

const token = process.env.BOT_TOKEN;
const port = process.env.PORT || 3000;

if (token === undefined) {
  throw new Error('BOT_TOKEN must be provided!');
}

const bot = new Telegraf(token);
const app = express();

app.use(await bot.createWebhook({ domain: process.env.VERCEL_URL }));

app.get('/', (_, res) => res.send('Hello World!'));

const fetchResult = async (query) => {
  if (!query) return null;
  try {
    const response = await fetch(
      `https://api.dictionaryapi.dev/api/v2/entries/en/${query}`
    );
    const result = await response.json();
    if (!Array.isArray(result)) return null;
    return result;
  } catch (error) {
    console.log(error);
    return null;
  }
};

/**
 *
 * @param {import('./types').WordDefinition} wordDefinition
 */
const getWordDefiniton = (wordDefinition) => {
  const parts = [];
  for (const meaning of wordDefinition.meanings) {
    const part = getPartOfSpeachDefinitions(meaning);
    parts.push(part);
  }
  return parts;
};

/**
 *
 * @param {import('./types').WordDefinition} wordDefinition
 */
const getWordDefinitonForInlineQuery = (wordDefinition) => {
  const parts = [];
  for (const meaning of wordDefinition.meanings) {
    const part = `${escapers.MarkdownV2(meaning.partOfSpeech)}`;
    const meanings = getMeaningDefinitions(meaning.definitions, true);
    parts.push({
      part,
      meanings,
    });
  }
  return parts;
};

/**
 *
 * @param {import('./types').Meaning} meaning
 */
const getPartOfSpeachDefinitions = (meaning) => {
  const part = `*_${escapers.MarkdownV2(meaning.partOfSpeech)}_*\n`;
  const meanings = getMeaningDefinitions(meaning.definitions).join('\n\n');
  return part + meanings;
};

/**
 *
 * @param {import('./types').Definition[]} meaningDefinitions
 */
const getMeaningDefinitions = (meaningDefinitions, noNums = false) => {
  return meaningDefinitions.map((v, i) => {
    let res = '';
    if (meaningDefinitions.length > 1 && !noNums) res += `${i + 1}\\. `;
    res += escapers.MarkdownV2(v.definition);
    if (v.example) res += `\n>${escapers.MarkdownV2(v.example)}`;
    if (v.synonyms.length > 0)
      res += `\n\n*Synonyms:* ${escapers.MarkdownV2(v.synonyms.join(', '))}`;
    return res;
  });
};

/**
 *
 * @param {import('./types').WordDefinition[]} definitions
 */
const getMessageBodies = (definitions) => {
  const res = [];
  for (const definition of definitions) {
    const def = getWordDefiniton(definition).join('\n\n');
    res.push(
      `*${escapers.MarkdownV2(definition.word)}*\n${
        definition.phonetic &&
        '_' + escapers.MarkdownV2(definition.phonetic) + '_'
      }\n\n${def}`
    );
  }
  return res;
};

/**
 *
 * @param {import('./types').WordDefinition[]} definitions
 */
const getInlineQueryResults = (definitions) => {
  const res = [];
  for (const definition of definitions) {
    const defs = getWordDefinitonForInlineQuery(definition);
    res.push({
      header: `*${escapers.MarkdownV2(definition.word)}*\n${
        definition.phonetic
          ? '_' + escapers.MarkdownV2(definition.phonetic) + '_'
          : ''
      }`,
      defs,
    });
  }
  return res;
};

bot.on(message('text'), async (ctx) => {
  const word = ctx.message.text;
  /**
   * @type {import('./types').WordDefinition[] | null}
   */
  const result = await fetchResult(word);
  if (!result) return ctx.reply('Sorry, word not found.');
  const res = getMessageBodies(result);
  for (const text of res) {
    await ctx.replyWithMarkdownV2(text);
  }
});

bot.on('inline_query', async (ctx) => {
  const word = ctx.inlineQuery.query;
  /**
   * @type {import('./types').WordDefinition[] | null}
   */
  const result = await fetchResult(word);
  if (!result) return ctx.answerInlineQuery([]);
  const res = getInlineQueryResults(result);

  /**
   * @type {import('telegraf/typings/core/types/typegram').InlineQueryResult[]}
   */
  const answers = [];
  for (let i = 0; i < res.length; i++) {
    const wordDef = res[i];
    for (let j = 0; j < wordDef.defs.length; j++) {
      const def = wordDef.defs[j];
      for (let k = 0; k < def.meanings.length; k++) {
        const partMeaning = def.meanings[k];
        answers.push({
          id: `${i}${j}${k}`,
          type: 'article',
          title: def.part,
          description: partMeaning,
          input_message_content: {
            message_text: `${wordDef.header}\n\n*_${def.part}_*\n${partMeaning}`,
            parse_mode: 'MarkdownV2',
          },
        });
      }
    }
  }
  return ctx.answerInlineQuery(answers);
});

app.listen(port, () => {
  console.log(`app listening on port ${port}!`);
});

export default app;
