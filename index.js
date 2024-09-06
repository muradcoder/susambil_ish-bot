const TelegramBot = require('node-telegram-bot-api');
const axios = require('axios');
require('dotenv').config()

const bot = new TelegramBot(process.env.BOT_TOKEN, { polling: true });

const channelUsername = '@susambil_ish';

const dataUrl = process.env.DATA_URL;

const jobIdTracker = {};

// Start buyrug'iga javob
bot.onText(/\/start/, (msg) => {
    const chatId = msg.chat.id;

    const options = {
        reply_markup: {
            inline_keyboard: [
                [{ text: '📢 Kanalga obuna bo\'lish', url: `https://t.me/${channelUsername.replace('@', '')}` }],
                [{ text: '✅ Tekshirish', callback_data: 'check_subscription' }]
            ]
        }
    };

    bot.sendMessage(chatId, 'Botdan foydalanish uchun kanalga obuna bo\'lishingiz kerak. Obuna bo\'lgach, "Tekshirish" tugmasini bosing.', options);
});

bot.on('callback_query', (query) => {
    const chatId = query.message.chat.id;

    if (query.data === 'check_subscription') {
       
        bot.getChatMember(channelUsername, chatId).then((chatMember) => {
            if (chatMember.status === 'member' || chatMember.status === 'administrator' || chatMember.status === 'creator') {
                bot.sendMessage(chatId, 'Rahmat, siz kanalga obuna bo\'ldingiz! Endi botdan foydalanishingiz mumkin.');
            } else {
                bot.sendMessage(chatId, 'Siz hali kanalga obuna bo\'lmadingiz. Iltimos, avval kanalga obuna bo\'ling.');
            }
        }).catch((error) => {
            console.error(error);
            bot.sendMessage(chatId, 'Xatolik yuz berdi. Iltimos, keyinroq qayta urinib ko\'ring.');
        });
    }
});

bot.on('message', (msg) => {
    const chatId = msg.chat.id;
    const userJobId = msg.text;

    bot.getChatMember(channelUsername, chatId).then((chatMember) => {
        if (chatMember.status === 'member' || chatMember.status === 'administrator' || chatMember.status === 'creator') {

            axios.get(dataUrl)
                .then(response => {
                    const data = response.data;

                    const jobData = data.find(item => item.jobId === userJobId);

                    if (jobData) {
                        if (jobIdTracker[userJobId]) {
                            jobIdTracker[userJobId]++;
                        } else {
                            jobIdTracker[userJobId] = 1;
                        }

                        const message = `<b>${jobData.titleJob}</b>\n\n<b>Maosh:</b> ${jobData.maosh}\n<b>Manzil:</b> ${jobData.manzil}\n<b>Ish jadvali:</b> ${jobData.ishJadvali}\n<b>Tashkilot:</b> ${jobData.tashkilot}\n<b>Aloqa uchun:</b> ${jobData.aloqaUchun} ${jobData.pochta}\n\n<b>№ ${jobData.jobId} / Ishning ID raqami</b>\n\n<b>Batafsil👇</b>\n${jobData.urllink}`;

                        bot.sendPhoto(chatId, jobData.rasmLink, { caption: message, parse_mode: 'HTML' });
                    } else {
                        bot.sendMessage(chatId, `Afsuski siz yuboran ID topilmadi. Yaxshilab e'tibor berib boshidan o'rinib ko'ring`);
                    }
                })
                .catch(error => {
                    console.error('Xato:', error);
                    bot.sendMessage(chatId, 'Ma\'lumotni olishda xatolik yuz berdi.');
                });
        } else {
            bot.sendMessage(chatId, 'Siz hali kanalga obuna bo\'lmadingiz. Iltimos, avval kanalga obuna bo\'ling.');
        }
    }).catch((error) => {
        console.error('Xatolik:', error);
        bot.sendMessage(chatId, 'Xatolik yuz berdi. Iltimos, keyinroq qayta urinib ko\'ring.');
    });
});
