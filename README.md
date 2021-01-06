[![Discord](https://img.shields.io/badge/Chat-Discord-blue.svg)](https://discord.gg/JQeVxbQT5G)
# SPAMBot
A farming bot for Minecraft thanks to [mineflayer](https://github.com/PrismarineJS/mineflayer) that picks up wheat/carrot/potatoes, replants them and deposits all items in a nearby chest. Mainly for Windows, not tested on other OS.

Written in Node.js

[Link](https://drmoraschi.github.io/FarmerBot/) to the page of this project.

<img alt="logo" src="https://github.com/DrMoraschi/FarmerBot/raw/master/images/projectlogo.jpg" height="200" />

## Features

 * Supports up to 1.16.3.
 * Can pick up wheat, carrots and potatoes.
 * Can deposit items in a nearby chest.
 * Discord Bot Support. Bot can be controlled with a Discord Bot.
 * Custom timeouts in `config.json`.
 * Reconnect ability in case it's kicked form the server.
 * Cracked mode support.

## Install

 1. Make sure you have installed **Node** on your PC, once you have installed it, you can proceed to the next step. You can download Node [here](https://nodejs.org/).
 1. Create a folder somewhere in you PC.
 2. Extract the downloaded .zip in the folder, there should be a folder named SPAMBot-master, take the files and paste them where you want, like a folder.
 3. Now, open the command prompt (press WIN + R, it should open a window, type in "cmd" and hit ENTER).
 4. Navigate to the folder where you put the files (Example: type "cd C:\Users\DrMoraschi\Desktop\BotFolder" and hit ENTER).
 5. Now where are going to install **Mineflayer** and the other dependencies, type:
	
	`npm install`
    
    this will install all dependencies that are necessary.

 6. If you want your own custom phrases, you can just edit the file `config.json`.
 7. Now that all the things have been installed, the bot is ready to farm.
 
## How to Use
 1. Before starting the bot, please set up a Discord Bot and take a look at config.json, the options are:
 	* "server" : Options of the server.
    * "host" : Host of the server.
  * "farmer" : Options of the farming bot.
    * "bot" : Options of the bot.
      * "username" : Username of the bot. Default is "Farmer". If the server is premium, it's the email.
      * "password" : Password of the account. If the server is cracked, you can leave it as null.
    * "discord" : Options of the Discord Bot.
      * "token" : Token of the Discord Bot.
      * "channelID" : ID of the channel where the messages will be sent.
      * "embedColorHex" : A Hex Color for the bot's embeds.
      * "changeAvatar" : true/false. When the bot starts, it will attempt to change the avatar to a Player Head. If you try to change it too often, it will crash and tell you to wait a bit before changing it again. I reccomend leaving it as false.
      * "prefix" : Prefix for the bot's commands.
    * "options" : Misc options.
      * "cropType" : wheat/carrots/potatoes. Which crop to farm. Choose from one of these 3.
      * "debug" : true/false. Some extra information in the log if true.
      * "searchOptions" : Some options that the bot uses when it searches for crops and chests.
        * "searchCropRadius" : Radius around the bot to search the specified crop.
        * "searchChestRadius" : Radius around the bot to search a chest.
      * "timeouts" : Some timeouts to customize the speed. All of them have to be in milliseconds.
        * "timeoutOnCollect" : The bot will wait this period of time before searching another crop block.
        * "timeoutOnChest" : The bot will wait this period of time before depositing another item in the chest.
        * "timeoutOnDeposit" : The bot will wait this period of time before it goes back to farming after it deposits all items in the chest.
        * "timeoutEquipErr" : If the bot can't equip an item in his hand, it will wait this period of time before trying again.
        * "timeoutResultErr" : If the bot can't find a crop nearby, it will wait this period of time before trying again.
        * "timeoutDepositErr" : If the bot can't deposit an item in the chest, it will wait this period of time before trying again.
 2. In your Command Line, repeat number 4 from "Install"; navigate to the folder where the files are located.
 3. To start the bot, just type in:
	
	```node SPAM.js```

 4. Once you've written all, hit ENTER and watch as the bot connects to the server.
 
 ## Commands
 All these commands must be sent in the specified channel in Discord.
 * [prefix]farm: makes the bot start/resume the farming process.
 * [prefix]stop: makes the bot stop/pause.
 * [prefix]list: the bot's inventory is sent to the channel.
 * [prefix]deposit: stops the bot and makes it deliver the items to the nearest chest.
 * [prefix]exit: stops all.
 
 #### WARNING
 
  I am not responsible of any consequences that this bot may cause, when you download it, it's up to you and to be responsible of your own actions.
  
  Thank you.
