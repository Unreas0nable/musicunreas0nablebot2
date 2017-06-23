'use strict';
const Discord = require('discord.io');
const Configuration = require('./config.json');
const App = new Discord({
	token: Configuration.token
});
const colors = require('colors-cli');
var ytdl = require('ytdl-core');
const fs = require('fs');

const Package = require('./package.json');
var voiceConnections = {};
var voiceQueue = {};
const lib = require('./lib')(App, Configuration, voiceConnections);
const handlers = require('./handlers')(App, lib, voiceConnections, Configuration, ytdl, fs, voiceQueue);
handlers.init();
var soundcloudRegex = new RegExp('http(s|):\/\/(api\.|www\.|m\.|)soundcloud\.com\/[0-9a-zA-Z-]*\/[0-9a-zA-Z-]*');
var youtubeRegex = new RegExp('http(s|):\/\/(api\.|www\.|m\.|)(youtube|youtu)\.(com|be)\/(watch\?v=|).[0-9a-zA-Z-]*');

function CommandListener (command, userID, channelID, rawEvent){
	if(command.charAt(0) == Configuration.commandChar){
		var splitCommands = command.split(' ');
		var commandName = splitCommands[0];
		var commandArgument = splitCommands[1];
		if(commandName === Configuration.commandChar + 'connect') {
			handlers.voiceConnectionHandler(channelID, userID);
		} else if(commandName === Configuration.commandChar + 'disconnect') {
			handlers.voiceDisconnectHandler(channelID);
		} else if(commandName === Configuration.commandChar + 'play'){
			if(soundcloudRegex.test(commandArgument)) {
				handlers.soundcloudHandler(commandArgument, userID, channelID, rawEvent);
			}else if(youtubeRegex.test(commandArgument)) {
				handlers.youtubeHandler(commandArgument, userID, channelID, rawEvent);
			} else {
				handlers.playAudioFileHandler(commandArgument, userID, channelID, rawEvent);
			}
		} else if(commandName === Configuration.commandChar + 'stop'){
			handlers.stopAudioFileHandler(channelID, rawEvent, userID);
		} else if(commandName === Configuration.commandChar + 'help'){
			App.sendMessage({
				to : channelID,
				message : 'Check your messages, help is on the way !'
			});
			App.createDMChannel(userID, function(response) {
				App.sendMessage({
					to : response.id,
					message : ':information_source: Music Bot v' + Package.version + '\n' + Configuration.help
				});
			});
			
		} else if(commandName === Configuration.commandChar + 'invite'){
			App.sendMessage({
				to : channelID,
				message : ':link: Invite me to your server with this link: \n' + Configuration.inviteLink
			});
		} else if(commandName === Configuration.commandChar + 'sbox'){
			lib.sbox(channelID, commandArgument, userID);
		} else if(commandName === Configuration.commandChar + 'yt') {
			handlers.youtubeHandler(commandArgument, userID, channelID, rawEvent);
		} else if(commandName === Configuration.commandChar + 'skip') {
			handlers.skipAudioFileHandler(channelID, rawEvent, userID);
		}
	}
}

App.on('message', function(user, userID, channelID, message, rawEvent){
	if(lib.userBlocked(userID, channelID)){
		return;
	}
	CommandListener(message, userID, channelID, rawEvent);
	// console.log('[' + colors.red('Message') + '] [' + colors.green(user) + '] ' + message);
});

App.on('ready', function(){
	console.log('Discord Bot ' + colors.red('v' + Package.version + '-dev'));
	console.log('Using char : ' + colors.red(Configuration.commandChar));
	lib.listServers();
});

App.on('disconnected', function(){
	App.connect();
});

process.on('SIGINT', function () {
	App.disconnect();
	console.log('\nShutting down');
	process.exit(2);
});

process.on('exit', function (){
	App.disconnect();
	console.log('Goodbye !');
});

App.connect();
