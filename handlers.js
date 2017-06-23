const request = require('request');
const colors = require('colors-cli');

module.exports = function (App, lib, voiceConnections, config, ytdl, fs, voiceQueue) {

	return {

		self: false,

	    init: function(){
	        self = this;
	    },
		/**
		 * Handle the voice connection
		 * @param {Number} channelID The ID of the text channel of the command
		 * @param {Number} userID The ID of the user using the command
		 */
		voiceConnectionHandler: function (channelID, userID) {

			var server = lib.findServerFromChannelID(channelID);
			if (server) {
				voiceConnections[server] = {
					'connected': true,
					'server': server,
					'isPlaying': false,
					'voiceChannel': App.servers[server].members[userID].voice_channel_id
				};
				App.joinVoiceChannel(App.servers[server].members[userID].voice_channel_id);
				console.log('[' + colors.red('Voice') + '] Connecting to voice channel ' +
				colors.green(App.servers[server].members[userID].voice_channel_id) + ' on server ' + colors.green(server));
				this.debug(voiceConnections);
			}

		},


		/**
		 * Handle the voice disconnection
		 * @param {Number} channelID The ID of the text channel of the command
		 */
		voiceDisconnectHandler: function (channelID) {

			var server = lib.findServerFromChannelID(channelID);
			if (server in voiceConnections && voiceConnections[server].connected) {
				App.leaveVoiceChannel(voiceConnections[server].voiceChannel);
				voiceConnections[server].connected = false;
				console.log('[' + colors.red('Voice') + '] Disconnecting from voice channel ' +
				colors.green(voiceConnections[server].voiceChannel) + ' on server ' + colors.green(server));
				this.debug(voiceConnections);
			}

		},


		/**
		 * Handle audio playing
		 * @param {String} file The link to the file to play
		 * @param {Number} userID The ID of the user using the command
		 * @param {Number} channelID The ID of the text channel of the command
		 */
		playAudioFileHandler: function (file, userID, channelID, rawEvent) {

			var server = lib.findServerFromChannelID(channelID);
			var server = lib.findServerFromChannelID(channelID);
			if(voiceConnections[server].isPlaying) {
				App.sendMessage({
					to: channelID,
					message: ':information_source: The music has been added to the queue.'
				});
				if(!voiceQueue[server]) {
					voiceQueue[server] = []
				}
				voiceQueue[server].push({
					platform: 'web',
					link: url,
					userID: userID,
					channelID: channelID,
					rawEvent: rawEvent
				});
				console.log('[' + colors.green('Queue') + '] ', voiceQueue);
				this.debug(voiceConnections);
				return;
			}
			if(server in voiceConnections && voiceConnections[server].connected) {
				
				App.getAudioContext({ channel: voiceConnections[server].voiceChannel, stereo: true}, function(stream) {
					stream.server = server;
					stream.playAudioFile(file);
					stream.once('fileEnd', function() { 
						voiceConnections[server].isPlaying = false;
						self.queueHandler(stream.server);
					});
				});
				voiceConnections[server].isPlaying = true;
				console.log('[' + colors.red('Audio stream') + '] Playing ' + colors.green(file) + ' on voice channel '
				+ voiceConnections[server].voiceChannel);
                App.deleteMessage({
					channel: channelID,
					messageID: rawEvent.d.id
				});
                App.sendMessage({
                    to: channelID,
                    message: ':play_pause: Playing **' + file + '** from the web.'
                });
				this.debug(voiceConnections);
			}

		},

		/**
		 * Handle audio skip
		 * @param {Number} channelID The ID of the text channel of the command
		 */
		skipAudioFileHandler: function (channelID, rawEvent, userID) {

			var server = lib.findServerFromChannelID(channelID);
			if(server in voiceConnections && voiceConnections[server].connected) {
				App.getAudioContext({ channel: voiceConnections[server].voiceChannel, stereo: true}, function (stream) {
					stream.stopAudioFile();
				});
				App.deleteMessage({
					channel: channelID,
					messageID: rawEvent.d.id
				});
				App.sendMessage({
					to: channelID,
					message: ':stop_button: Skipped by <@' + userID + '>.'
				});
				this.debug(voiceConnections);
			}

		},

		stopAudioFileHandler: function (channelID, rawEvent, userID) {
			var server = lib.findServerFromChannelID(channelID);
			console.log('[' + colors.red('Voice') + '] Stopping all songs in channel ' + channelID + ' on server ' + server);
			if(server in voiceConnections && voiceConnections[server].connected) {
				if(server in voiceQueue && voiceQueue[server][0]) {
					delete voiceQueue[server];
				}
				App.getAudioContext({ channel : voiceConnections[server].voiceChannel, stereo: true}, function (stream) {
					stream.stopAudioFile();
				});
				App.sendMessage({
					to: channelID,
					message: ':stop_button: Stopped by <@' + userID + '>.'
				});
			}
		},

		soundcloudHandler: function (url, userID, channelID, rawEvent) {

			url = url === undefined ? undefined : url.split('\n')[0];
			var server = lib.findServerFromChannelID(channelID);
			if(voiceConnections[server].isPlaying) {
				App.sendMessage({
					to: channelID,
					message: ':information_source: The music has been added to the queue.'
				});
				if(!voiceQueue[server]) {
					voiceQueue[server] = []
				}
				voiceQueue[server].push({
					platform: 'soundcloud',
					link: url,
					userID: userID,
					channelID: channelID,
					rawEvent: rawEvent
				});
				console.log('[' + colors.green('Queue') + '] ', voiceQueue);
				this.debug(voiceConnections);
				return;
			}
			if(url){
				request.get('https://api.soundcloud.com/resolve?url=' + url + '&client_id=' + config.scKey, function(err, res, body) {
					var data = JSON.parse(body);
					var title = data.title;
					var surl = data.stream_url + '?client_id=' + config.scKey;
					if(data.stream_url) {
						request.get({
							followAllRedirects: true,
							url: surl
						}, function(err, res) {
							if(res.statusCode != undefined && res.statusCode == 200) {
								if(server in voiceConnections && voiceConnections[server].connected) {
									App.getAudioContext({ channel: voiceConnections[server].voiceChannel, stereo: true}, function(stream) {
										stream.server = server;
										stream.playAudioFile(surl);
										stream.once('fileEnd', function() { 
											voiceConnections[stream.server].isPlaying = false;
											self.queueHandler(stream.server);
										});
									});
									voiceConnections[server].isPlaying = true;
									console.log('[' + colors.x201('Soundcloud') + '] Playing ' + colors.green(title) + ' (' + url + ') on voice channel '
									+ voiceConnections[server].voiceChannel);
									this.debug(voiceConnections);
									App.deleteMessage({
										channel: channelID,
										messageID: rawEvent.d.id
									});
									App.sendMessage({
										to: channelID,
										message: ':play_pause: Playing **' + title + '** from Soundcloud.'
									});
								}
							}
						});
					}

				});
			}
		},

		youtubeHandler: function (url, userID, channelID, rawEvent) {
            var server = lib.findServerFromChannelID(channelID);
			if(voiceConnections[server].isPlaying) {
				App.sendMessage({
					to: channelID,
					message: ':information_source: The music has been added to the queue.'
				});
				if(!voiceQueue[server]) {
					voiceQueue[server] = []
				}
				voiceQueue[server].push({
					platform: 'youtube',
					link: url,
					userID: userID,
					channelID: channelID,
					rawEvent: rawEvent
				});
				console.log('[' + colors.green('Queue') + '] ', voiceQueue);
				this.debug(voiceConnections);
				return;
			}
            if(server in voiceConnections && voiceConnections[server].connected) {
                url = url === undefined ? undefined : url.split('\n')[0];
                var videoID = url.substr(url.lastIndexOf('/') + 1).replace("watch?v=", "");
                var fullURL = "http://youtube.com/watch?v="+videoID;
                var audioURL = "";
                var foundURL = false;
                request.post({url:'https://www.sonyoutube.com/api/get-informations-link', form: {link:fullURL}}, function(err,httpResponse,body){
                    body = JSON.parse(body);
                    if(body.informations === null){
                        App.sendMessage({
                            to: channelID,
                            message: ':x: Error: This link was not found on Youtube.'
                        });
                        return;
                    }
                    ytdl.getInfo(fullURL, {filter: "audioonly"}, function(err, info){
                    	if(info && info.formats) {
                    		for (var f of info.formats){
	                            if(f.type.indexOf("audio/mp4") != -1){
	                                audioURL = f.url;
	                                foundURL = true;
	                                break;
	                            }
                        	}
                    	}
                        
                        
                        if(!foundURL){
                            App.sendMessage({
                                to: channelID,
                                message: ':x: Error: The format of this video is not recognised.'
                            });
                            return;
                        }
                        App.getAudioContext({ channel: voiceConnections[server].voiceChannel, stereo: true}, function(stream) {
                            stream.playAudioFile(audioURL);
                            stream.server = server;
							stream.once('fileEnd', function() { 
								voiceConnections[stream.server].isPlaying = false;
								self.queueHandler(stream.server);
							});
                        });
                        voiceConnections[server].isPlaying = true;
                        var duration = Math.floor(body.informations.duration / 60);
                        if(duration < 1){
                            duration = "Less than 1"
                        }
                        App.deleteMessage({
                            channel: channelID,
                            messageID: rawEvent.d.id
                        });
                        App.sendMessage({
                            to: channelID,
                            message: ':play_pause: Playing **' + body.informations.fulltitle +
                            '** from Youtube. \n(Length: '+ duration +' min) '+body.informations.thumbnail.replace("maxres", "")
                        });
                        console.log('[' + colors.x201('Youtube') + '] Playing ' + colors.green(body.informations.fulltitle) + ' (' + url + ') on voice channel '
						+ voiceConnections[server].voiceChannel);
                    });
                });
                this.debug(voiceConnections);
            }
		},

		queueHandler: function (serverId) {
			console.log('[' + colors.green('Queue') + '] ', voiceQueue);
			if (voiceQueue[serverId] && voiceQueue[serverId][0]) {
				if(voiceQueue[serverId][0].platform === 'soundcloud') {
					this.soundcloudHandler(voiceQueue[serverId][0].link, voiceQueue[serverId][0].userID, voiceQueue[serverId][0].channelID, voiceQueue[serverId][0].rawEvent);
				} else if (voiceQueue[serverId][0].platform === 'youtube') {
					this.youtubeHandler(voiceQueue[serverId][0].link, voiceQueue[serverId][0].userID, voiceQueue[serverId][0].channelID, voiceQueue[serverId][0].rawEvent);
				} else if (voiceQueue[serverId][0].platform === 'web') {
					this.playAudioFileHandler(voiceQueue[serverId][0].link, voiceQueue[serverId][0].userID, voiceQueue[serverId][0].channelID, voiceQueue[serverId][0].rawEvent);
				}
				delete voiceQueue[serverId].splice(0,1);
 			}
		},

		debug: function (voiceConnections) {
			console.log('[' + colors.blue('Debug') + '] [' + colors.red('voiceConnections') + '] ', voiceConnections);
		}
	};
};
