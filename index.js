console.clear();

const { server, farmer } = require('./config.json');
const chalk = require('chalk');
const mineflayer = require('mineflayer');
const Discord = require('discord.js');
const Vec3 = require('vec3');
const { pathfinder } = require('mineflayer-pathfinder');
const Movements = require('mineflayer-pathfinder').Movements
const { GoalNear, GoalBlock, GoalGetToBlock } = require('mineflayer-pathfinder').goals

const prefix = farmer.discord.prefix

var crashBefore = false
var stopNow = false
var inventoryFullDontGo = false
var discordReadyOnce = false
var continueAfterDeposit = true

startUp();

function startUp()
{
    const client = new Discord.Client();
    client.login(farmer.discord.token);

    client.on('ready', () => {
        const channel = client.channels.cache.get(farmer.discord.channelID)

        console.log(chalk.blueBright(` Logged in. I'm `)+client.user.tag)
        createABot(channel);
    });

    function createABot(channel)
    {
        const bot = mineflayer.createBot({
            host: server.host,
            username: farmer.bot.username,
            password: farmer.bot.password,
        });
        
        bot.once('spawn', () => {
            
            if (discordReadyOnce === false) {
                channel.send(makeEmbed(bot, ` Started`))
            };
    
            discordReadyOnce = true

            const previousAvatarURL = client.user.avatarURL()
    
            if (farmer.discord.changeAvatar === true) {
                setInterval(() => {
                    client.user.setAvatar(`https://crafatar.com/renders/head/${bot.player.uuid}`)
                }, 1000);
            };
    
            if (crashBefore === true) {
                crashBefore = false
    
    
                setTimeout(() => {
                    findCrops();
                }, 1000);
            };
        
            bot.loadPlugin(pathfinder);
        
            const mcData = require('minecraft-data')(bot.version);
            const defaultMove = new Movements(bot, mcData);
            bot.pathfinder.setMovements(defaultMove);

            bot.pathfinder.movements.canJump = false
            bot.pathfinder.movements.blocksToAvoid.delete(mcData.blocksByName.wheat.id);
            bot.pathfinder.movements.blocksCantBreak.add(mcData.blocksByName.wheat.id);
        
            console.log(` ${chalk.underline.blueBright(`Spawned`)}`);
    
            bot.on('message', (msg) => {
                console.log(`   ${msg.toAnsi()}`);
            });

            client.on('message', (msg) => {
                if (msg.author.username === client.user.username) return
                switch (msg.content) {
                    case `${prefix}farm`:
                        channel.send(makeEmbed(bot, 'Farming'));
                        stopNow = false
    
                        checkChest();
                        break
                    case `${prefix}list`:
                        sayInventory(msg);
                        break
                    case `${prefix}deposit`:
                        channel.send(makeEmbed(bot, 'Going to deposit'));
                        stopNow = true
                        
                        continueAfterDeposit = false

                        setTimeout(() => {
                            findChest()    
                        }, 1000);
                        break
                    case `${prefix}stop`:
                        channel.send(makeEmbed(bot, 'Stopping'));
                        stopNow = true
                        break
                    case `${prefix}exit`:
                        channel.send(makeEmbed(bot, 'Stopping the bot'));
                        if (farmer.discord.changeAvatar === true) {
                            client.user.setAvatar(previousAvatarURL)   
                        };
                        stopNow = true
    
                        setTimeout(() => {
                            bot.quit();
                            process.exit();
                        }, 1000);
                        break
                };
            });
        
            async function findCrops()
            {
                if (bot.inventory.items().length !== 0) {
                    await placeSeedBefore()
                };

                await checkIfInventoryFull()
    
                if (inventoryFullDontGo === false) {
                    if (stopNow === true) return
    
                    if (farmer.options.debug) console.log('Changed to findCrops')
            
                    const cropBlock = bot.findBlock({
                        maxDistance: farmer.options.searchOptions.searchCropRadius,
                        matching: (block) => {
                            return block.type === mcData.blocksByName[farmer.options.cropType].id && block.metadata === 7
                        },
                    });
            
                    if (!cropBlock) {
                        console.log(chalk.redBright(` No ${farmer.options.cropType} in a radius of ${farmer.options.searchOptions.searchCropRadius} block(s)\n Trying again in ${farmer.options.timeouts.timeoutResultErr/1000} seconds`));
            
                        stopInterval = true

                        setTimeout(() => {
                            findCrops()
                        }, farmer.options.timeouts.timeoutResultErr);
                    } else if (cropBlock) {
                        if (cropBlock.type === mcData.blocksByName[farmer.options.cropType].id && cropBlock.metadata === 7) {
                            console.log(chalk.greenBright(` Block is a full-grown ${farmer.options.cropType} block\n Going to x: ${chalk.magentaBright(cropBlock.position.x)} y: ${chalk.magentaBright(cropBlock.position.y)} z: ${chalk.magentaBright(cropBlock.position.z)}`));
                
                            stopNow = false

                            goToFarmland(cropBlock);
                        } else {
                            console.log(chalk.redBright(` Block isn't a full-grown ${farmer.options.cropType} block\n Trying again in ${farmer.options.timeouts.timeoutResultErr/1000} seconds`));

                            stopInterval = true
            
                            setTimeout(() => {
                                findCrops()
                            }, farmer.options.timeouts.timeoutResultErr);
                        };
                    };
                }
            };
        
            async function goToFarmland(cropBlock)
            {
                if (farmer.options.debug) console.log('Changed to goToFarmland')
        
                setTimeout(() => {
                    bot.pathfinder.setGoal(new GoalBlock(cropBlock.position.x, cropBlock.position.y, cropBlock.position.z))
            
                    bot.on('goal_reached', () => {
                        console.log(chalk.greenBright(' Arrived at')+' wheat')
    
                        digWheat();
                        bot.removeAllListeners('goal_reached')
                    })
                }, 1);
            };
        
            function digWheat()
            {
                if (stopNow === true) return
    
                if (farmer.options.debug) console.log('Changed to digWheat')
    
                if (inventoryFullDontGo === false) {
                    const cropBlockNew = bot.findBlock({
                        maxDistance: farmer.options.searchOptions.searchCropRadius,
                        matching: (block) => {
                            return block.type === mcData.blocksByName[farmer.options.cropType].id && block.metadata === 7
                        },
                    });
            
                    bot.dig(cropBlockNew, true, (err) => {
                        if (err) {
                            console.log(chalk.redBright(` Couldn't dig block: `)+err);
                        } else {
                            console.log(chalk.greenBright(' Collected')+' block');
                            
                            bot.on('itemDrop', (entity) =>
                            {
                                bot.removeAllListeners('itemDrop');
                                bot.pathfinder.goto(new GoalBlock(entity.position.x, entity.position.y, entity.position.z), () =>
                                {
                                    null
                                });
                            });

                            bot.on('playerCollect', (collector, collected) => {
                                if (collector.username === bot.username) {
                                    if (collected.metadata[7].itemId === mcData.itemsByName[mcData.blockLoot[farmer.options.cropType].drops[1].item].id || collected.metadata[7].itemId === mcData.blocksByName[farmer.options.cropType].drops[0]) {
                                        bot.pathfinder.setGoal(null);
                                        setTimeout(() => {
                                            equipSeeds();      
                                        }, 1);

                                        bot.removeAllListeners('playerCollect');
                                    };
                                };
                            });
                        };
                    });
                };
            };

            function equipSeeds()
            {
                if (farmer.options.debug) console.log('Changed to equipSeeds')

                bot.equip(mcData.itemsByName[mcData.blockLoot[farmer.options.cropType].drops[1].item].id, 'hand', (err) => {
                    if (err) {
                        console.log(chalk.redBright(` Couldn't equip: `)+err+chalk.redBright(` Trying again in ${farmer.options.timeouts.timeoutEquipErr/1000} seconds`));
                        setTimeout(() => {
                            equipSeeds();
                        }, farmer.options.timeouts.timeoutEquipErr);
                    } else {
                        console.log(chalk.greenBright(' Equipped')+' seeds');
        
                        setTimeout(() => {
                            findCrops();
                        }, farmer.options.timeouts.timeoutOnCollect);
                    };
                });
            };
        
            function placeSeedBefore()
            {
                if (farmer.options.debug) console.log('Changed to placeSeedBefore')
    
                const emptyFarmland = bot.findBlock({
                    matching: mcData.blocksByName.farmland.id,
                    maxDistance: 2,
                });
        
                if (!emptyFarmland) return
                if (bot.blockAt(emptyFarmland.position.offset(0, 1, 0)).type === mcData.blocksByName.air.id) {
                    bot.placeBlock(emptyFarmland, new Vec3(0, 1, 0), () => {
                        console.log(chalk.greenBright(' Placed ')+'seeds'+chalk.greenBright(' in previous position'));
                    });
                };
            };
    
            function checkIfInventoryFull()
            {
                if (farmer.options.debug) console.log('Changed to checkIfInventoryFull')
    
                if (bot.inventory.items().length >= 20) {
                    stopNow = true
                    inventoryFullDontGo = true
    
                    findChest();
                };
            };
    
            function findChest()
            {
                if (farmer.options.debug) console.log('Changed to findChest')
    
                const chestBlock = bot.findBlock({
                    matching: (block) => {
                        return block.type === mcData.blocksByName.chest.id
                    },
                    maxDistance: farmer.options.searchOptions.searchChestRadius,
                });
    
                if (!chestBlock) {
                    console.log(chalk.redBright(` I don't see a chest to put my items in a radius of ${farmer.options.searchOptions.searchChestRadius} block(s)`));
                } else {
                    console.log(chalk.greenBright(` Going to chest`))
    
                    goToChest(chestBlock);
                };
            };
    
            function goToChest(chestBlock)
            {
                if (farmer.options.debug) console.log('Changed to goToChest')
    
                bot.pathfinder.setGoal(new GoalGetToBlock(chestBlock.position.x, chestBlock.position.y, chestBlock.position.z));
    
                bot.on('goal_reached', () => {
                    console.log(chalk.greenBright(` Arrived at chest`))

                    interactChest(chestBlock)
    
                    bot.removeAllListeners('goal_reached');
                });
            };
    
            function interactChest(chestBlock)
            {
                if (farmer.options.debug) console.log('Changed to interactChest');
    
                const chestInteracted = bot.openChest(chestBlock);
    
                chestInteracted.on('open', () => {
                    
                    depositAll(0);
    
                    function depositAll(i)
                    {
                        if (bot.inventory.items().length <= i) {
                            console.log(chalk.greenBright(' Deposited all items'));
                            chestInteracted.close();
    
                            inventoryFullDontGo = false
    

                            if (continueAfterDeposit === false) {
                                continueAfterDeposit = true
                            } else {
                                stopNow = false

                                setTimeout(() => {
                                    findCrops();    
                                }, farmer.options.timeouts.timeoutOnDeposit);
                            }
                        } else {
                            chestInteracted.deposit(bot.inventory.items()[i].type, null, bot.inventory.items()[i].count, (err) => {
                                if (err) {
                                    console.log(chalk.redBright(` Couldn't deposit. Trying again in ${farmer.options.timeouts.timeoutDepositErr/1000} seconds. `)+err);
    
                                    setTimeout(() => {
                                        depositAll(i);
                                    }, farmer.options.timeouts.timeoutDepositErr);
                                } else {
                                    setTimeout(() => {
                                        depositAll(i+1);
                                    }, farmer.options.timeouts.timeoutOnChest);
                                }
                            });
                        };
                    };
    
                    chestInteracted.removeAllListeners('open');
                });
            };
    
            function checkChest()
            {
                if (farmer.options.debug) console.log('Changed to checkChest')
    
                const chestBlock = bot.findBlock({
                    matching: (block) => {
                        return block.type === mcData.blocksByName.chest.id
                    },
                    maxDistance: farmer.options.searchOptions.searchChestRadius,
                });
    
                if (!chestBlock) {
                    console.log(chalk.redBright(` I don't see a chest to put my items in a radius of ${farmer.options.searchOptions.searchChestRadius} block(s)`));
                } else {
                    findCrops();
                };
            };
    
            function sayInventory(msg)
            {
                const items = bot.inventory.items()
    
                const itemList = items.map(itemToString).join('');
                if (itemList) {
                    const itemListEmbed = new Discord.MessageEmbed()
                    .setColor(farmer.discord.embedColorHex)
                    .setTitle(`${bot.username}'s Inventory`)
                    .setDescription(`${itemList}`)
                    .setFooter(`I have ${36 - bot.inventory.items().length} free slots`, `https://crafatar.com/renders/head/${bot.player.uuid}`);
    
                    channel.send(itemListEmbed);
                } else {
                    const itemListEmbedEmpty = new Discord.MessageEmbed()
                    .setColor(farmer.discord.embedColorHex)
                    .setTitle(`${bot.username}'s Inventory`)
                    .setDescription(`Inventory is empty`)
                    .setFooter(`I have ${36 - bot.inventory.items().length} free slots`, `https://crafatar.com/renders/head/${bot.player.uuid}`);
    
                    channel.send(itemListEmbedEmpty);
                };
        
                function itemToString(item)
                {
                    if (item) {
                        return `\n${item.displayName} x ${item.count}`;
                    } else {
                        return '(nothing)';
                    };
                };
            };
        });
    };

    function makeEmbed(bot, content)
    {
        const actionEmbed = new Discord.MessageEmbed()
        .setColor(farmer.discord.embedColorHex)
        .setTitle(`${bot.username} Status`)
        .setDescription(`-> ${content}`)
        .setFooter(`Players count: ${Object.keys(bot.players).length}`, `https://crafatar.com/renders/head/${bot.player.uuid}`);

        return actionEmbed
    };
};