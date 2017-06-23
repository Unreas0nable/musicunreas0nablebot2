/*eslint-disable no-undef */
var fs = require('fs');
var colors = require('colors-cli');
var Configuration = require('./config.json');

module.exports = function (App, Config, voiceConnections) {

	return {
		/**
		 * Find a server ID from the channelID of the message
		 * @param {Number} channelID The ID of the channel of the message
		 * @return {String} serverID Return the server ID
		 */
		findServerFromChannelID: function (channelID) {

			var serverFound = false;
			var server = null;
			var serverList = App.servers;
			for (var s in serverList) {
				if(!serverFound) {
					for (var channel in serverList[s].channels) {
						if(channelID == channel) {
							server = serverList[s].id;
							serverFound = true;
							return server;
						}
					}
				} else {
					return false;
				}
			}

		},

		listServers: function () {

			var serverList = App.servers;
			for(var s in serverList) {
				console.log('[' + colors.blue('Init') + '] [' + colors.red('Servers')
				+ '] In server ' + colors.green(serverList[s].name) + ' [' + colors.red(serverList[s].id) + ']');
			}

		},

		/**
		 * Checks if the user has a blocked role
		 * @param {Number} userID The ID of the user calling the command
		 * @param {Number} channelID The ID of the channel of the message
		 */
		userBlocked: function(userID, channelID){
			var server = this.findServerFromChannelID(channelID);
			var blocked = false;
			if(server){
				var rolesID = App.servers[server].members[userID].roles;
				for (var v of rolesID){
					if(App.servers[server].roles[v].name) {
						if(App.servers[server].roles[v].name.toLowerCase() === Configuration.blockedRole.toLowerCase()){
							blocked = true;
						}
					}
					
				}
			}
			return blocked;
		},

		/**
		 * Play a specific sound from a file list
		 * @param {Number} channelID The ID of the channel of the message
		 * @param {String} argument The command argument containing the file name
		 * @param {Number} userID The ID of the user calling the command
		 */
		sbox: function (channelID, argument, userID) {

			argument = argument || null;
			var sounds = [];
			var soundsDisplay = 'Available sounds in the Soundbox : \n';
			var server = this.findServerFromChannelID(channelID);
			var mp3Regex = new RegExp('[a-zA-Z0-9]*.mp3');
			fs.readdirSync(Config.sboxPath).forEach(function(file){
				if(mp3Regex.test(file)) {
					var currentFile = file.replace('.mp3', '');
					sounds.push(currentFile);
				}
			});
			if(argument === null){
				sounds.forEach(function(sound){
					soundsDisplay += ' - **' + sound + '**\n';
				});
				App.sendMessage({
					to : channelID,
					message : soundsDisplay
				});
			} else {
				if(server in voiceConnections && voiceConnections[server].connected){
					App.getAudioContext({ channel: App.servers[server].members[userID].voice_channel_id, stereo: true}, function(stream) {
						stream.playAudioFile(Config.sboxPath + argument +  '.mp3');
					});
				}
			}

		}


	};

};
