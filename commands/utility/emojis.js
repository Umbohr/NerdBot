const { SlashCommandBuilder } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("emojis")
    .setDescription("Replies with the artist that made the emoji")
    .addStringOption((option) =>
      option.setName("emojis").setDescription("Returns the artists that made the emojis")
    )
    .addStringOption((option) =>
      option.setName("by").setDescription("Returns all the emojis made by given artist")
    )
    .addStringOption(option =>
			option.setName('option')
				.setDescription('Can return special commands')
				.addChoices(
					{ name: 'All', value: 'all' },
					{ name: 'Orphans', value: 'orphans' },
					{ name: 'Attributed', value: 'attributed' },
		))
    .addBooleanOption((option) =>
      option.setName("private").setDescription("Only you will see the reply")
    ),

    
  async execute(interaction, client) {
    await interaction.deferReply({ephemeral: interaction.options.getBoolean('private')});
    let response = '';
    const array = [];
    const orphans = [];
    const artistOption = interaction.options.getString('by');

    if (artistOption) {
      const listOfEmojis = interaction.guild.emojis.cache.map(x=> '<:'+x.name+':'+x.id+'>');
      const targetArtist = emojiDictionnary.find(x =>  x.artist === artistOption);
      if (!targetArtist) return interaction.editReply('No emojis were made by ' + artistOption +', smh');
      const temp = emojiDictionnary.find(x =>  x.artist === artistOption).emojis;
      const a = temp.map((x)=> {
        return listOfEmojis.find(e => e.includes(x))
      })
      array.push({artist: artistOption, emojiCodes: a});
    }
    const specialCommand = interaction.options.getString('option');
    if(specialCommand === 'all') {
      const listOfEmojis = interaction.guild.emojis.cache.map(x=> '<:'+x.name+':'+x.id+'>');
      pushArtistsAndOrphans(array, orphans, listOfEmojis);
    } else if (specialCommand === 'orphans') {
      const listOfEmojis = interaction.guild.emojis.cache.map(x=> '<:'+x.name+':'+x.id+'>');
      for (const emojiCode of listOfEmojis) {
        const artist = findArtist(emojiCode);
        if (!artist) {
          orphans.push(emojiCode);
        }
      }
    } else if (specialCommand === 'attributed') {
      const listOfEmojis = interaction.guild.emojis.cache.map(x=> '<:'+x.name+':'+x.id+'>');
      for (const emojiCode of listOfEmojis) {
        const artist = findArtist(emojiCode);
        if (artist) {
          pushEmojiAndArtis(array, artist, emojiCode);
        }
      }
    } else if (!artistOption) {
      const emotes = (str) => str.match(/<a?:.+?:\d{18,19}>|\p{Extended_Pictographic}/gu);
      const emojis = emotes(interaction.options.getString('emoji'));
      if (!emojis || emojis.length === 0) {
        return interaction.reply({content: 'You didn\'t fed me any emojis'});
      }
  
      if (emojis === null) return interaction.reply({content: 'Unexpected error, sorry'});
      pushArtistsAndOrphans(array, orphans, emojis);
    } 
    
    array.forEach(x=> {
      if (x.emojiCodes.length > 1) {
        response = response.concat(x.emojiCodes.toString() + ' were made by ' + x.artist + '\n');
      } else {
        response = response.concat(x.emojiCodes.toString() + ' was made by ' + x.artist + '\n');
      }
    });
    if(orphans && orphans.length > 0) {
      response = response.concat(orphans.toString() + ' is or are not associated with any artists yet. if you know who made it, please tell us! \n');
    }
    if (response.length> 1999) {
      var parts = response.match(/[\s\S]{1,2000}$/gm);
      await interaction.editReply({content: parts[0], allowed_mentions: {"parse": []}});
      parts.forEach((element, index) => {
        if(index === 0) return;
        interaction.followUp({content: element, allowed_mentions: {"parse": []}});
      });
    } else {
      interaction.editReply({content: response, allowed_mentions: {"parse": []}});
    }
  },
};


function pushArtistsAndOrphans(array, orphans, listOfEmojis) {
  for (const emojiCode of listOfEmojis) {
    const artist = findArtist(emojiCode);
    if (artist) {
      pushEmojiAndArtis(array, artist, emojiCode);
    } else {
      orphans.push(emojiCode)
    }
  }
}

function pushEmojiAndArtis(array, artist, emojiCode) {
  const isAlreadyPresent = array.find(x=> x.artist === artist);
  if(isAlreadyPresent) {
    isAlreadyPresent.emojiCodes.push(emojiCode);
  } else {
    array.push({artist, emojiCodes: [emojiCode]})
  }
}

function findArtist(emojiCode) {
  let artist;
  const parsedCode = emojiCode.replace(/[^0-9]/g, '');
  emojiDictionnary.forEach(x => {
    const isPresent = x.emojis.indexOf(parsedCode);
    if (isPresent !== -1) {
      artist= x.artist;
      return;
    } 
  });
  return artist;
}

const emojiDictionnary = [
  { artist: 'Squirrelsquid', emojis: ['1157669606283030639', '999083778599301301'] },
  { artist: 'skamocore', emojis: ['1039676852232519822'] },
  { artist: 'binderbear', emojis: ['913187763828957234'] },
  { artist: 'trigonomicon', emojis: ['1016863209732440094', '1077601862712299590', '1288830262289104989'] },
  { artist: 'Christoballs', emojis: ['912993484552675368', '912673879024078920','1009489473823846492', '827440731953954878', '1288826053996843039', '1288826053996843039', '1288826053996843039', '914165372243042304'] },
  { artist: 'shm31', emojis: ['964825227689336912','930837358230786129','953089376517251112','923152940343119922','1002156147781927002', '964825227689336912', '930836031408832512', '930808521619034132'] },
  {
    artist: 'trawlixn',
    emojis: ['1000811149543092264', '1261627289612058656', '971681421863292958'],
  },
  { artist: 'Nightmare', emojis: ['913814493442744350','971786113230462997', '1288826053996843039', '913814143809777674', '913814143855919144', '913814143822360617', '913814143851696178'] },
  { artist: 'Sarahboev', emojis: ['964154624695214142'] },
  { artist: 'AshuraAlchemist', emojis: ['840976331663343617'] },
  { artist: 'Harmonica!', emojis: ['891792250185601025'] },
  { artist: 'DamianR', emojis: ['1121295707756826644', '1121296025714446366'] },
  { artist: 'Mirre', emojis: ['913109567754371104', '1049977007066320937'] },
  { artist: 'gawrone', emojis: ['1093484038808936548'] },
  {
    artist: 'jinn',
    emojis: ['827440732201680956', '827440732117794836', '827440731857354773',
      '827440731810562059', '827440732017000448', '827440731756429353',
      '827440731857092659', '827440732092366868', '827440731604910110',
      '827440732071264256', '827440732217671750', '827440732083716096',
      '827440732054093844', '827440732071526410', '827440732032860190',
      '827440732049637396', '827440731684864002', '827440732092497940',
      '827440731882651689', '827440732087386152', '827440732204695572',
      '827440732373647361', '827440732095774730', '827440731878195242',
      '827440732201680956', '827440732105080842', '827449801838690315', 
      '827449801792421919', '827449801498165270', '827449801792028742',
      '827449801750347797', '827449801456615436', '827449801876045824',
      '827449801796091904', '827449802035822602', '827449801813262336',
      '827449801901342730', '827449801813655552', '827449801813262357',
      '827449801876307978', '827449801784164363', '827449801951936533',
      '827449801951936533', '827449801573400577'
    ],
  }
];
