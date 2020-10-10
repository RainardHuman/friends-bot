require('dotenv').config();
const { Client, MessageEmbed } = require('discord.js');
const client = new Client;
const PREFIX = '$';
const date = new Date();
let Notes = [];
const fs = require('fs');
const fetch = require('node-fetch');

// Load History Data
LoadJson();


async function getPorn() {
    const skip = Math.floor(Math.random() * 50) * 20;
    const random = Math.floor(Math.random() * 20);

    let response = await fetch("https://www.pornpics.com/getnext.php?type=popular&limit=" + 20 + "&offset=" + skip, {
        "headers": {
            "accept": "application/json, text/javascript, */*; q=0.01",
            "accept-language": "en-US,en;q=0.9",
            "sec-fetch-dest": "empty",
            "sec-fetch-mode": "cors",
            "sec-fetch-site": "same-origin",
            "x-requested-with": "XMLHttpRequest"
        },
        "referrer": "https://www.pornpics.com/popular/",
        "referrerPolicy": "unsafe-url",
        "body": null,
        "method": "GET",
        "mode": "cors",
        "credentials": "include"
    });

    if (response.ok) {
        const x = await response.json();
        return x[random]['t_url_460'];
    } else {
        alert("HTTP-Error: " + response.status);
    }
}




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


    if (message.content === 'send nudes') {
        getPorn().then(url => {
            message.reply(url);
        })
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
                        message: args.slice(2).join(' ')
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
                    if (args[1] === "all"){
                        Notes = [];
                        message.reply(Responses.note.delete.all);
                    } else {
                        index = Notes.findIndex(note => note.title === args[1] && note.author.id === message.author.id);
                        if (index > -1) {
                            Notes.splice(index,1);
                            WriteJson(Notes);
                        } else {
                            message.reply(Responses.note.delete.zero);
                        }
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
            all: 'All notes have been deleted ',
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

