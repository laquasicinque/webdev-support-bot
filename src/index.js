require('dotenv').config();
// eslint-disable-next-line no-unused-vars
const { Client, Message } = require('discord.js');
const { providers, KEYWORD_REGEXP } = require('./utils/urlTools');

const help = require('./utils/help');

// commands begin here
const handleMDNQuery = require('./commands/mdn');
const handleNPMQuery = require('./commands/npm');
const handleComposerQuery = require('./commands/composer');
const handleCanIUseQuery = require('./commands/caniuse');

const client = new Client();

client.on('ready', () => {
  console.log(`Logged in as ${client.user.tag}!`);
});

client.once('ready', async () => {
  client.user.setActivity(`@${client.user.username} --help`);

  try {
    await client.user.setAvatar('./logo.png');
  } catch (error) {}
});

// { mdn: 'mdn', /* etc */ }
const keywords = Object.keys(providers).reduce((carry, keyword) => {
  carry[keyword] = keyword;
  return carry;
}, {});

const trimCleanContent = (provider, cleanContent) =>
  cleanContent.substr(keywords[provider].length + 2);

/**
 *
 * @param {Message} msg
 */
const handleMessage = async msg => {
  const { cleanContent } = msg;

  if (
    msg.mentions.users.find(
      ({ username }) => username === client.user.username,
    ) &&
    cleanContent.indexOf('--help') > -1
  ) {
    const prefix = 'try one of these:\n';

    await msg.reply(prefix + Object.values(help).join('\n'));
    return;
  }

  // bail if no keyword was found
  if (!cleanContent.startsWith('!') || !KEYWORD_REGEXP.test(cleanContent)) {
    return;
  }

  const keyword = cleanContent.split(' ', 1)[0].substr(1);

  switch (keyword) {
    case keywords.mdn:
      await handleMDNQuery(msg, trimCleanContent('mdn', cleanContent));
      return;
    case keywords.caniuse:
      await handleCanIUseQuery(msg, trimCleanContent('caniuse', cleanContent));
      return;
    case keywords.npm:
      await handleNPMQuery(msg, trimCleanContent('npm', cleanContent));
      return;
    case keywords.composer:
      await handleComposerQuery(
        msg,
        trimCleanContent('composer', cleanContent),
      );

      return;
    default:
      throw new Error('classic "shouldnt be here" scenario');
  }
};

client.on('message', handleMessage);

try {
  client.login(
    process.env.NODE_ENV !== 'production'
      ? process.env.DUMMY_TOKEN
      : process.env.DISCORD_TOKEN,
  );
} catch (error) {
  console.error('Invalid token.');
}
