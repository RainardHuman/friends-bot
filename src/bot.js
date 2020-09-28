const dot = require('dotenv').config();
const { Client, MessageEmbed , GuildEmoji, Emoji} = require('discord.js');
const client = new Client;
const PREFIX = '$';
const date = new Date();
let Notes = [];
const fs = require('fs');
const hello = require('./response.js');
let val = hello.Hello();
console.log(val);

// Load History Data
LoadJson();

// Start up log
console.log(
    'started:' + date.getDay() + ' ' + date.getMonth() +
    '\ntoken: ' + process.env.DISCORD_BOT_TOKEN
);

// Log logged in & ready
client.on('ready', () => {
    console.log(`status: ${client.user.tag} logged in successfully`);
});

// Welcome message

client.on("guildMemberAdd" ,(message, member) => {
    message.send(Responses.welcome.new + message.user.username + '.');
});

// Start listening for messages
client.on('message', (message) => {
    // ignore bot messages
    if (message.author.bot) return;

    // variable declaration
    const user = message.mentions.users.first();
    let member = null;

    // user details
    if (user) {
        member = message.guild.member(user);
    }

    if (message.content.includes('fuck')) {
        message.react('👍');
    }

    let images = [
        'https://i.redd.it/bxdphtdcemx11.jpg',
        'https://content.eroticbeauties.net/content/metart_8c8baf918dffb/cropped/1/lorena-garcia-nude-art_mainthumb_vertical.jpg',
        'https://content.eroticbeauties.net/content/playboyplus_85da7df4b87e2/cropped/1/playboy-scene-katrine-pirs_mainthumb_vertical@2x.jpg',
        'https://content.eroticbeauties.net/content/playboyplus_656abef503f83/cropped/1/playboy-model-mel-green_mainthumb_horizontal@2x.jpg',
        'https://content.eroticbeauties.net/content/stasyq_5004a0db7c0d9/cropped/1/evelynq-nude-art-erotica_mainthumb_horizontal@2x.jpg',
        'https://content.eroticbeauties.net/content/playboyplus_1c8d4724ebff5/cropped/1/playboy-model-jessica-lawson_mainthumb_horizontal@2x.jpg',
    ]
    if (message.content === 'send nudes') {
        message.reply(images[Math.floor(Math.random() * images.length)]);
    }


    // function name
    if (message.content.startsWith(PREFIX)) {
        // set command and args
        const [CMD_NAME, ...args] = message.content
            .trim()
            .substring(PREFIX.length)
            .split(/\s+/);

        // Command kick
        if (CMD_NAME === 'kick') {
            if (args[0]) {
                if (member) {
                    member
                        .kick(`kicked by user ${message.author}`)
                        .then(() => {
                            message.reply(`${user} ` + Responses.kick.success);
                        })
                        .catch(err => {
                            message.reply(Responses.kick.failed);
                            console.log(err);
                        });
                } else {
                    message.reply(Responses.kick.no_channel);
                }
            } else {
                message.reply(Responses.kick.no_mention);
            }
        }

        // Command note
        else if (CMD_NAME === 'note') {

            // TODO add check if sentence has "," otherwise dont accept message throw error
            // function add
            if (args[0] === 'add') {
                let checkValue = 0;
                if (Notes.length > 0) {
                    let temp = Notes.filter(item => { return item.title === args[1] && item.author.id === message.author.id});
                    checkValue = temp.length;
                }



                // TODO add to mongoDB time sensitive
                if (checkValue === 0) {
                    let note = {
                        author: message.author,
                        title: args[1].trim(),
                        message: message.content.split(',')[1]
                    }
                    Notes.push(
                        {...note, dateTime: new Date().getDate()}
                    );
                    WriteJson(Notes);
                } else {
                    message.reply(Responses.note.add.duplicate);
                }
            }

            // function view
            if (args[0] === 'view') {
                let retrievedNotes = [];

                // view individual by author by title
                if (args[1]) {
                    retrievedNotes = Notes.filter(note => {
                        return note['title'] === args[1] && note.author.id === message.author.id;
                    });
                    if (retrievedNotes.length > 0) {
                        SendMessageEmbedded(message, retrievedNotes[0].title, retrievedNotes[0].message, 'info');
                    } else {
                        message.reply(Responses.note.view.not_found);
                    }
                }

                // view all by author
                else {
                    retrievedNotes = Notes.filter(note => {
                        return note['author']['id'] === message.author.id;
                    });
                    if (retrievedNotes.length > 0) {
                        let titleList = '';
                        let num = 0;
                        const title = message.author.username + '\'s Notes';
                        retrievedNotes.forEach(note => {
                            num++;
                            titleList += String(num) + '. '+ note.title + '\n';
                        });
                        SendMessageEmbedded(message, title, titleList, 'info');
                    } else {
                        message.reply(Responses.note.view.zero);
                    }
                }
            }

            if (args[0] === 'delete') {
                if (args[1]){
                    let index = -1;
                    index = Notes.findIndex(note => note.title === args[1] && note.author.id === message.author.id);
                    if (index > -1) {
                        Notes.splice(index,1);
                        WriteJson(Notes);
                    } else {
                        message.reply(Responses.note.delete.zero);
                    }
                } else {
                    message.reply(Responses.note.delete.no_parm);
                }
            }
        }

        // Help Menu
        if (CMD_NAME === 'help') {
            SendMessageEmbedded(message, 'Help Menu', Responses.help.menu);
        }
    }
});


// Bot log-in
client.login(process.env.DISCORD_BOT_TOKEN)
    .catch(err => {
        console.log(err);
    });

const Responses  = {
    kick: {
        no_mention: 'You didn\'t mention the user to kick!',
        no_channel: 'That user isn\'t in this channel!',
        failed: 'I was unable to kick the member',
        success:' is gone, don\'t stress.',
    },
    note: {
        add: {
            duplicate: 'A note with that name already exist!',
        },
        view: {
            not_found: 'No such title found, please use \'$note help\' for support ',
            zero: 'No notes found, please use \'$note help\' for support ',
        },
        delete: {
            no_parm: 'No note name given to delete, please use \'$note help\' for support ',
            zero: 'No notes found to delete, please use \'$note help\' for support ',
        }
    },
    welcome: {
        new: 'Welcome to the Friends Server feel free to make it your own space! Enjoy,',
    },
    help: {
        menu:
        '1. Notes \n' +
        '2. Kick  \n' +
        '3. About \n' +
        '4. :poop: \n' +
        '5. :pray: \n'
    }
}

function SendMessageEmbedded(message ,noteTitle, noteMessage, type) {
    let color = null;
    switch(type) {
        case 'info': color = 0x00ffff; break;
        case 'warning': color = 0xff8000; break;
        case 'error': color = 0xff0080; break;
        case 'success': color = 0x00ff00; break;
        default: color = 0x00ffff;
    }

    const embed = new MessageEmbed()
        .setTitle(noteTitle)
        .setColor(color)
        .setDescription(noteMessage);
    message.reply(embed);
}

function WriteJson(notes) {
    console.log(notes);
    fs.writeFile('Notes.json', JSON.stringify( {notes: notes}), err => {
        if (err)
            console.log(err);
    });
}

function LoadJson() {
    console.log()
    fs.readFile('Notes.json',(err, data) => {
        if (data){
            Notes = JSON.parse(data.toString())['notes'];
        }
        else {
            console.log(err);
            WriteJson([]);
        }

    })
}

