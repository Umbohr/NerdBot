const cron = require('cron');

//START BOT
const { Client, Events, GatewayIntentBits, Collection  } = require('discord.js');
const path = require('path');
require('dotenv').config();
const fs = require('fs');
const { getLastWeeklyChallengeUrl, getLastWeeklyChallengeVoteUrl } = require('./common/challengeUtils');

const client = new Client({ intents: [GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent, GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessageReactions] });
// register commands
client.commands = new Collection();
const foldersPath = path.join(__dirname, 'commands');
const commandFolders = fs.readdirSync(foldersPath);

for (const folder of commandFolders) {
	const commandsPath = path.join(foldersPath, folder);
	const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
	for (const file of commandFiles) {
		const filePath = path.join(commandsPath, file);
		const command = require(filePath);
		if ('data' in command && 'execute' in command) {
			client.commands.set(command.data.name, command);
		} else {
			console.log(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
		}
	}
}

client.login(process.env.TOKEN);

client.on('ready', () => {
  console.log('Ready!');
});

// Listen to commands
client.on(Events.InteractionCreate, async interaction => {
  // INPUT FOR CHAT
	if (interaction.isChatInputCommand()){
    const command = interaction.client.commands.get(interaction.commandName);

    if (!command) {
      console.error(`No command matching ${interaction.commandName} was found.`);
      return;
    }
  
    try {
      await command.execute(interaction);
    } catch (error) {
      console.error(error);
      if (interaction.replied || interaction.deferred) {
        await interaction.followUp({ content: 'There was an error while executing this command!', ephemeral: true });
      } else {
        await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
      }
    }
  }
  //CONTEXT MENU
	if (interaction.isContextMenuCommand()){
    if (interaction.user.bot) return;
    const context = client.commands.get(interaction.commandName) 
    if  (!context) {
      interaction.reply({
        ephemeral: true,
        content: "This command isn't real"
      })
    };
    try {
      context.execute(client, interaction);
    } catch (error) {
      console.log(error);
    }
  }
});

// Job to post weekly challenges every monday at 4pm
const weeklyChallenge = new cron.CronJob('0 16 * * Mon', ()=> {
  getLastWeeklyChallengeUrl().then(response => {
    postOnWeeklyChallengeChannel(response);
  });
});

function postOnWeeklyChallengeChannel(challengeUrl){
  const weeklyChallengeDiscordChannel = client.channels.cache.get('775792433005985835');
  const newChallengeMessage = "New challenge is up :";
  weeklyChallengeDiscordChannel.send(newChallengeMessage + challengeUrl);
  weeklyChallengeDiscordChannel.send("Submissions accepted until sunday 12pm PST!");
}

// starts the job
weeklyChallenge.start();

// Job to remind people to vote every sunday at 4pm
const weeklyChallengeVote = new cron.CronJob('0 16 * * Sun', ()=> {
  getLastWeeklyChallengeVoteUrl().then(response => {
    postVoteLinkOnWeeklyChallengeChannel(response);
  });
});

function postVoteLinkOnWeeklyChallengeChannel(voteUrl){
  const weeklyChallengeDiscordChannel = client.channels.cache.get('775792433005985835');
  const voteChallengeMessage = "Don't forget to vote for last week challenge entries!";
  weeklyChallengeDiscordChannel.send(voteChallengeMessage + voteUrl);
}

// starts the job
weeklyChallengeVote.start();