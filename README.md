## Music Bot

![Version](https://img.shields.io/badge/version-0.7.0-blue.svg)
![Build](https://img.shields.io/badge/build-stable-brightgreen.svg)
[![Discord](https://discordapp.com/api/guilds/81812480254291968/widget.png?style=shield)](https://discord.gg/aVzVzZM)
[![Add to your server](http://imgh.us/add_6.svg)](https://discordapp.com/oauth2/authorize?&client_id=170107889489281024&scope=bot&permissions=0)

### Installation

The bot is really simple to install, just follow this steps.

+ Clone the repository
+ Open the repository
+ Install the dependencies
```cmd 
npm install
````
+ Configurate your bot, rename the config.json.dist as config.json and enter the your informations in the fields.
```json
{
	"token" : "USER_TOKEN", 
	"sboxPath" : "SBOX_PATH_TO_FILES",
	"commandChar" : "COMMAND_CHAR"
}
```
**token** : The token is a unique key that allow you to connect your bot account to the Discord servers. To get one you must go to the [discord developper site](https://discordapp.com/developers/applications/me) and register a new application.

![Create Application](http://i.imgur.com/2MZBEqp.png)
On this screen, click on "New Application"

![Create Application Next](http://i.imgur.com/JygNCUx.png)
Enter a name and a description, and even an avatar if you want, then click on "Create Application"

![Make a Bot Account](http://i.imgur.com/eSZDtqp.png)
This should apear on your screen. At this point, you just have to click on the "Create a Bot User" button and confirm the action

![Get to the token](http://i.imgur.com/Fh3K0cm.png)
Finally you should have this screen. The last thing you must do is copy and paste the **Token** value in the config.json file, in the field token.

**sboxPath** : This is the path on your computer/server where you will store the sound files for the soundbox.

**commandChar** : This is the character you want to use as a prefix for you commands. (Exemple : if commandChar is **!** you'll have to write **!help** to use the help command)

+ Launch the bot 
```cmd
node app.js
```