require('dotenv').config();
const express = require('express');
const app = new express();
const admin = require("firebase-admin");
const serviceAccount = require("./servicesAccountKey.json");
const WebSocket = require('ws');
const wss = new WebSocket.WebSocketServer({port: 9700});
const axios = require('axios');
const {Telegraf} = require('telegraf')
const bot = new Telegraf(process.env.BOT_TOKEN);
const fs = require('fs')
const file = require('./src/data/user.json')

let answerCallbacks = {};
bot.command('start', ctx => {
    bot.telegram.sendMessage(ctx.chat.id, 'Welcome to bot chat! Please choose option', {
        reply_markup: {
            inline_keyboard: [
                [
                    {
                        text: "Verify account",
                        callback_data: 'verify'
                    },
                    {
                        text: 'More actions',
                        callback_data: 'more'
                    }
                ]
            ]
        }
    }).then(r => console.log(r))
})
bot.action('verify', ctx => {
    bot.telegram.sendMessage(ctx.chat.id, 'Please give me your account').then(() => {
       bot.on('message', ctx => {
           const listUser = JSON.parse(file.data)
           const user = listUser.find(e => e.username.isEqual(ctx.update.message.text))
           if (user !== null && user !== undefined){
               bot.sendMessage(ctx.chat.id, 'Verify Successful')
               return
           }

       })
    })
})

bot.on('new_chat_members', async ctx => {
    const {from, new_chat_member} = ctx.update.message
    const user = await axios.get(`${process.env.API_USER_URL}infor-tele?tele_chat_id=${from.id}`)
    const data = {
        "tele_chat_id": from.id,
        "ref_id_by_tele": new_chat_member.id
    }
    const result = await axios.put(`${process.env.API_USER_URL}infor-tele/${user.data.data.id}`, data);
    console.log('====== result \n', result.data)
})
bot.launch()

const bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({
    extended: true
}));
const tokens = [];
const router = express.Router();
app.use(bodyParser.json());
app.use('/', router)
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: "https://fir-notification-b712e-default-rtdb.asia-southeast1.firebasedatabase.app"
});


const firestore = admin.firestore();
const settings = {timestampsInSnapshots: true};
firestore.settings(settings);

router.post('/res', (req, res) => {
    tokens.push(req.body.token);
    console.log("=======res token", req.body)
    res.status(200).json({message: "Successfully registered FCM Token!"});
})

router.post('/notifications', async (req, res) => {
    try {
        const {title, body, imageUrl} = req.body;
        await admin.messaging().sendMulticast({
            tokens,
            notification: {
                title,
                body,
                imageUrl
            }
        });
        res.status(200).json({message: "Successfully sent notifications!"})
    }catch (err) {
        res.status(err.status || 500).json({message: err.message || "Something went wrong"})
    }
})

const server = app.listen(process.env.PORT || 8080, () => {});
