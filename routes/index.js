let ngrok = process.env.ngrok 

const host = `clicker`;
const token = process.env.pdToken;

const refBounty = 5000;
const tapBounty = 1;

var express =   require('express');
var router =    express.Router();
var axios =     require('axios');

const fileUpload = require('express-fileupload');

var cors =      require('cors')

var cron =      require('node-cron');
var FormData =  require('form-data');

const qs =      require('qs');
const fs =      require('fs')

const { createHash,createHmac } = require('node:crypto');

router.use(cors())

router.use(fileUpload({
    // Configure file uploads with maximum file size 10MB
    limits: { fileSize: 10 * 1024 * 1024 },
  
    // Temporarily store uploaded files to disk, rather than buffering in memory
    useTempFiles : true,
    tempFileDir : '/tmp/'
  }));


const {
    objectify,
    getDoc,
    uname,
    drawDate,
    devlog,
    letterize,
    letterize2,
    shuffle,
    clearTags,
    handleQuery,
    handleDoc,
    sudden,
    cutMe,
    interpreteCallBackData,
    authWebApp,
    sanitize,
    cur,
    ifBefore,
    pa,
} = require ('./common.js')

const {
    sendMessage2,
    getUser,
    greeting,
} = require('./methods.js')


const {
    initializeApp,
    applicationDefault,
    cert
} = require('firebase-admin/app');

const {
    getFirestore,
    Timestamp,
    FieldValue
} = require('firebase-admin/firestore');

const { getStorage, getDownloadUrl } = require('firebase-admin/storage');

const {
    getDatabase,
    increment
} = require('firebase-admin/database');
const { database } = require('firebase-admin');

const { buttons } = require('./keyboards.js');







let gcp = initializeApp({
    credential: cert({
        "type": "service_account",
        "project_id": "randomclick6666",
        "private_key_id": process.env.gcpId,
        "private_key": process.env.gcpKey.replace(/\\n/g, '\n'),
        "client_email": "firebase-adminsdk-mgwhj@randomclick6666.iam.gserviceaccount.com",
        "client_id": "111351706144586346047",
        "auth_uri": "https://accounts.google.com/o/oauth2/auth",
        "token_uri": "https://oauth2.googleapis.com/token",
        "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
        "client_x509_cert_url": "https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-mgwhj%40randomclick6666.iam.gserviceaccount.com",
        "universe_domain": "googleapis.com"
      }),
    databaseURL: "https://randomclick6666-default-rtdb.europe-west1.firebasedatabase.app"
}, host);


let fb =    getFirestore(gcp);
let rdb =   getDatabase(gcp)




setTimeout(function(){
    axios.get(`https://api.telegram.org/bot${token}/setWebHook?url=${ngrok}/hook`).then(()=>{
        console.log(`${host} hook set on ${ngrok}`)
    }).catch(err=>{
        handleError(err)
    })   
},1000)

function handleError(err,res) {
    console.log(err);
    if(res) res.status(500).send(err.message)
}

const adminTokens =       fb.collection(`${host}AdminTokens`);

const udb =               fb.collection(`${host}Users`);
const messages =          fb.collection(`${host}UserMessages`);
const logs =              fb.collection(`${host}Logs`);
const actions =           fb.collection(`${host}Actions`);
const usersActions =      fb.collection(`${host}UsersActions`);
const usersTaps =           fb.collection(`${host}UsersTaps`);

// TBD: в релизе добавить проверку на develop
if(process.env.develop) setInterval(()=>{
    ifBefore(udb,{blocked:false}).then(users=>{
        users.forEach(u=>{
            udb.doc(u.id).update({
                score: FieldValue.increment(u.income)
            })
            rdb.ref(`users/${u.hash}`).update({
                score: database.ServerValue.increment(u.income)
            })
        })
    })
},1000)


function userScore(id, sum){
    
    if(!sum) sum = 0;

    return getUser(id, udb)
        .then(u=>{
            if(u && !u.blocked){
                udb.doc(u.id).update({
                    score: FieldValue.increment(+sum)
                })
                rdb.ref(`users/${u.hash}`).update({
                    score: database.ServerValue.increment(+sum)
                })
            }
        })
        .catch(err=>{
            throw new Error(err.message)
        })
}


function log(o) {

    o.createdAt = new Date()

    logs.add(o).then(r => {

        if(!o.silent){
            alertAdmins({
                text:   o.text
            })
        }

    })
}


function alertAdmins(mess) {
    let message = {
        text: mess.text,
        isReply: true
    }

    udb.where(`admin`, '==', true).get().then(admins => {
        admins.docs.forEach(a => {
            message.chat_id = a.id
            if (mess.type != 'stopLog' || !a.data().stopLog) sendMessage2(message, false, token, messages)
        })
    })
}


function sendMessage(req,res,admin){
    let t = {
        chat_id: req.body.user,
        text:   req.body.text
    }
    
    sendMessage2(t, false, token, messages,{admin: +admin.id})
    
    if(res) res.sendStatus(200);
}

const datatypes = {
    messages:{
        col:    messages,
        newDoc: sendMessage,
    },
    actions:{
        col:    actions,
        newDoc: newEntity,
        extras: [`subscription`,`price`,`bounty`]
    },
    users: {
        col:    udb,
    }
}

function newEntity(req,res,admin,extra){
    
    if(!req.body.name) return res.status(400).send(`no name`)
    
    let o = {
        createdAt:      new Date(),
        createdBy:      +admin.id,
        active:         true,
        description:    req.body.description || null,
        name:           req.body.name || null,
        pic:            req.body.pic || null,
    }

    if(extra) extra.forEach(t=>{
        o[t] = req.body[t] ||null
    })

    datatypes[req.params.method].col.add(o).then(rec=>{
        res.redirect(`/web?page=${req.params.method}_${rec.id}`)
        log({
            admin:      +admin.id,
            [req.params.method]:      rec.id,
            text:       `${uname(admin,admin.id)} создает ${req.params.method} ${req.body.name}`
        })
    })
}

router.post(`/authWebApp`,(req,res)=>{
    authWebApp(req,res,token,adminTokens,udb)  
})


router.all(`/api/:method`,(req,res)=>{

    if(process.env.develop) req.signedCookies.userToken = req.query.token 

    if (!req.signedCookies.userToken) return res.status(401).send(`Вы кто вообще?`);
    
    devlog(req.signedCookies.userToken)

    adminTokens.doc(req.signedCookies.userToken).get().then(doc => {
        if (!doc.exists) return res.sendStatus(403)
    
        doc  = doc.data();

        getUser(doc.user,udb).then(u=>{
            if(u.blocked) return res.sendStatus(403)
            switch(req.params.method){
                case `tap`:{
                    usersTaps.add({
                        createdAt: new Date(),
                        user: +u.id
                    })
                    udb.doc(u.id.toString()).update({
                        taps: FieldValue.increment(1)
                    })
                    userScore(u.id, tapBounty)
                    return res.sendStatus(200)
                }
                case `profile`:{
                    return ifBefore(usersActions,{user:+u.id}).then(actions=>{
                        res.json({
                            user:       u,
                            actions:    actions
                        })
                    })
                }
                case `actions`:{
                    switch (req.method){
                        case `GET`:{
                            return pa({col:actions},{col:usersActions,f:{user:+u.id}}).then(data=>{
                                res.json(data[0].map(a=>{
                                    if(data[1].filter(passed=>passed.action == a.id)) a.passed = true;
                                    return a
                                }))
                            })
                        }
                        case `POST`:{
                            if(!req.body.action) return res.status(400).send(`no action provided`);
                            return getDoc(actions,req.body.action).then(a=>{
                                if(!a || !a.active) return res.status(404).send(`no such action available`);
                                ifBefore(usersActions,{
                                    user: +u.id
                                }).then(col=>{
                                    if(a.price){
                                        if(col.length) return res.status(400).send(`user already participated`)
                                        if(u.score >= a.price){
                                            usersActions.add({
                                                createdAt:  new Date(),
                                                user:       +u.id,
                                                action:     req.body.action,
                                                actionName: a.name
                                            }).then(rec=>{
                                                res.status(200).send(rec.id)
                                                userScore(u.id,-a.price)
                                            })
                                        } else {
                                            res.status(400).send(`insufficient funds`)
                                        }
                                    }
                                    if(a.subscription){
                                        res.status(200).send(`in progress`)
                                    }
                                })
                            })
                        }
                    }
                }
                default:{
                    res.sendStatus(404)
                }
            }
        })
    })
})

router.all(`/admin/:method`,(req,res)=>{
    
    if (!req.signedCookies.adminToken) return res.status(401).send(`Вы кто вообще?`)
    
    adminTokens.doc(req.signedCookies.adminToken).get().then(doc => {
        
        if (!doc.exists) return res.sendStatus(403)
        
        let token = handleDoc(doc)

        devlog(`toke`,token)


        getUser(token.user,udb).then(admin=>{

            devlog(admin)

            if(!admin) return res.sendStatus(403)

            

            switch(req.params.method){
                

                default:{

                    if(!datatypes[req.params.method])  return res.sendStatus(404)
                    
                    if(req.method == `GET`)     return datatypes[req.params.method].col.get().then(col=>{
                        
                        let data = handleQuery(col,true);
                        
                        Object.keys(req.query).forEach(q=>{
                            data = data.filter(i=> i[q] == (Number(req.query[q]) ? Number(req.query[q]) : req.query[q]))
                        })

                        if(!admin.admin && req.params.method == `users`) data = data.filter(i=>i.createdBy == +admin.id)

                        res.json(data)
                    }) 
                    if(req.method == `POST`)    return datatypes[req.params.method].newDoc(req,res,admin,datatypes[req.params.method].extras)
                    return res.sendStatus(404)
                }
            }
        })  
    })
})




router.all(`/admin/:method/:id`,(req,res)=>{
    
    if (!req.signedCookies.adminToken) return res.status(401).send(`Вы кто вообще?`)
    
    adminTokens.doc(req.signedCookies.adminToken).get().then(doc => {
        
        if (!doc.exists) return res.sendStatus(403)
        
        let token = handleDoc(doc)

        getUser(token.user,udb).then(admin=>{
            
            switch(req.params.method){

                
                case `logs`:{
                    
                    if(!admin.admin) return res.sendStatus(403)

                    let q = req.params.id.split('_')
                    
                    return logs
                        .where(q[0],'==',Number(q[1])?+q[1]:q[1])
                        .get()
                        .then(col=>{
                            res.json(handleQuery(col,true))
                        })
                }

                default:{
                    
                    if(!datatypes[req.params.method])  return res.sendStatus(404)
                    
                    let ref = datatypes[req.params.method].col.doc(req.params.id)

                    ref.get().then(d=>{
                        d = handleDoc(d)

                        if(!admin.admin){
                            if(d.createdBy != +admin.id) return res.sendStatus(403)
                        } 

                        if(req.method == `GET`)         return ref.get().then(d=>{
                            d.exists ? res.json(handleDoc(d)) : res.sendStatus(404)
                        })

                        if(req.method == `PUT`)         return updateEntity(req,res,ref,admin)
                        if(req.method == `DELETE`)      return deleteEntity(req,res,ref,admin)
                        
                        return res.sendStatus(404)
                        
                    })

                    
                }
            }
        })
        
    })
})

function updateEntity(req,res,ref,admin){
    ref.get().then(d=>{
        
        d = handleDoc(d);

        if(req.params.method == `messages`){
            let mess = d;
            
            if(mess.deleted || mess.edited)       return res.status(400).send(`уже удалено`);
            if(!mess.messageId)    return res.status(400).send(`нет id сообщения`);
            
            sendMessage2({
                chat_id:    mess.user,
                message_id: mess.messageId,
                text:       req.body.value
            },`editMessageText`,token).then(resp=>{
                if(resp.ok) {
                    res.json({
                        success: true,
                        comment: `Сообщение обновлено.`
                    })
                    ref.update({
                        text:       req.body.value,
                        textInit:   mess.text,
                        editedBy:   +admin.id,
                        edited:     new Date()
                    })
                } else {
                    res.sendStatus(500)
                }
            })
        } else {
            ref.update({
                [req.body.attr]: req.body.value || null,
                updatedAt: new Date(),
                updatedBy: +admin.id
            }).then(s=>{
                res.json({
                    success: true
                })
                log({
                    silent: true,
                    admin: +admin.id,
                    [req.params.method]: req.params.id,
                    text: `Обновлен ${req.params.method} / ${d.name || req.params.id}.\n${req.body.attr} стало ${req.body.value} (было ${d[req.body.attr || null]})`
                })
            })
        }
    })
}



router.get(`/auth`,(req,res)=>{
    res.render(`auth`)
})



router.post(`/auth`,(req,res)=>{

    data_check_string=Object.keys(req.body)
        .filter(key => key !== 'hash')
        .sort()
        .map(key=>`${key}=${req.body[key]}`)
        .join('\n')

        devlog(data_check_string)

    const secretKey = createHash('sha256')
        .update(token)
        .digest();

    const hmac = createHmac('sha256', secretKey)
        .update(data_check_string)
        .digest('hex');

    if(req.body.hash == hmac){

        getUser(req.body.id,udb).then(u=>{

            if(u.blocked) return res.sendStatus(403)

            if(!u) registerUser(req.body)
                
                adminTokens.add({
                    createdAt:  new Date(),
                    user:       +req.body.id,
                    active:     true 
                }).then(c=>{
                    res.cookie('adminToken', c.id, {
                        maxAge: 7 * 24 * 60 * 60 * 1000,
                        signed: true,
                        httpOnly: true,
                    }).sendStatus(200)
                })
        })
    } else {
        res.sendStatus(403)
    }
})

function deleteEntity(req, res, ref, admin, attr, callback) {
    
    return ref.get().then(e => {
        
        let data = handleDoc(e)

        if(req.params.method == `messages`){ 
            
            mess = data;

            if(mess.deleted)       return res.status(400).send(`уже удалено`);
            if(!mess.messageId)    return res.status(400).send(`нет id сообщения`);
            
            sendMessage2({
                chat_id:    mess.user,
                message_id: mess.messageId
            },`deleteMessage`,token).then(resp=>{
                if(resp.ok) {
                    res.json({
                        success: true,
                        comment: `Сообщение удалено.`
                    })
                    ref.update({
                        deleted:    new Date(),
                        deletedBy:  +admin.id
                    })
                } else {
                    res.sendStatus(500)
                }
            })
        } else {
            if (!data[attr || 'active']) return res.json({
                success: false,
                comment: `Вы опоздали. Запись уже удалена.`
            })
    
    
            ref.update({
                [attr || 'active']: false,
                updatedBy: +admin.id
            }).then(s => {
    
                log({
                    [req.params.method]: req.params.id,
                    admin: +admin.id,
                    text: `${uname(admin,admin.id)} архивирует ${req.params.method} ${e.name || e.id}.`
                })
    
                res.json({
                    success: true
                })
    
                if (typeof (callback) == 'function') {
                    console.log(`Запускаем коллбэк`)
                    callback()
                }
            }).catch(err => {
                
                console.log(err)
    
                res.json({
                    success: false,
                    comment: err.message
                })
            })
        }

        
    })
}


router.get(`/web`,(req,res)=>{
    
    devlog(req.signedCookies.adminToken)

    getDoc(adminTokens, (req.signedCookies.adminToken || process.env.adminToken)).then(t=>{

        devlog(t)

        if(!t || !t.active) return res.sendStatus(403)

        getUser(t.user,udb).then(u=>{

            devlog(`пользватель получен`)

            if(process.env.develop && req.query.stopadmin) return logs
            .orderBy(`createdAt`,'desc')
            .limit(100)
            .where(`user`,`==`,+u.id)
            .get()
            .then(col=>{
                cities.get().then(col2=>{
                    res.render(`admin`,{
                        user:       u,
                        seller:     true,
                        admin:      false,
                        adminAccess: u.admin,
                        wysykey:    process.env.wysykey,
                        logs:       handleQuery(col),
                        cities:     objectify(handleQuery(col2))
                    })
                })
            })
            
            if(process.env.develop == `true`) return logs
                .orderBy(`createdAt`,'desc')
                .limit(100)
                .get()
                .then(col=>{
                    
                        res.cookie('adminToken', req.query.admintoken || process.env.adminToken, {
                            maxAge: 24 * 60 * 60 * 1000,
                            signed: true,
                            httpOnly: true,
                        }).render(`web`,{
                            user:       u,
                            admin:      req.query.admin ? true : false,
                            wysykey:    process.env.wysykey,
                            adminAccess: true,
                            start:      req.query.page,
                            logs:       handleQuery(col),
                            
                        })

                }) 
        
        

            if(u.blocked) return res.sendStatus(403)

            if(u.admin && !req.query.stopAdmin) return logs
                .orderBy(`createdAt`,'desc')
                .limit(100)
                .get()
                .then(col=>{
                    
                        res.render(`web`,{
                            user:       u,
                            wysykey:    process.env.wysykey,
                            adminAccess: u.admin,
                            logs:       handleQuery(col),
                        })
                    
                })

            
            if(u.seller || req.query.seller)  return logs
                .orderBy(`createdAt`,'desc')
                .limit(100)
                .where(`user`,`==`,+u.id)
                .get()
                .then(col=>{
                    cities.get().then(col2=>{
                        res.render(`admin`,{
                            user:       u,
                            seller:     true,
                            admin:      false,
                            adminAccess: u.admin,
                            wysykey:    process.env.wysykey,
                            logs:       handleQuery(col),
                            cities:     objectify(handleQuery(col2))
                        })
                    })
                })

            

            
            
            return cities.get().then(col=>{
                res.render(`concent`,{
                    light: true,
                    greetings:() => greeting(),
                    cities: handleQuery(col)
                })
            })
        })

    })
})






router.post(`/hook`,(req,res)=>{
    
    res.sendStatus(200)

    devlog(JSON.stringify(req.body, null, 2))

    let user = {};

    if (req.body.my_chat_member) {
        if (req.body.my_chat_member.new_chat_member.status == 'kicked') {

            udb.doc(req.body.my_chat_member.chat.id.toString()).update({
                active: false,
                stopped: true
            }).then(s => {
                udb.doc(req.body.my_chat_member.chat.id.toString()).get().then(u => {

                    u = handleDoc(u)

                    log({
                        silent: true,
                        text: `${uname(u,u.id)} блочит бот`,
                        user: +u.id
                    })
                })

            }).catch(err => {
                console.log(err)
            })
        }
    }

    if (req.body.message && req.body.message.from) {
        user = req.body.message.from;
        
        getUser(user.id, udb).then(u => {

            if(req.body.message.text){
                messages.add({
                    user:       user.id,
                    text:       req.body.message.text || null,
                    createdAt:  new Date(),
                    isReply:    false
                })
            }

            if (!u) return registerUser(user,req.body)
            
            
            if (!u.active) return udb.doc(user.id.toString()).update({
                active: true,
                stopped: null
            }).then(s => {
                log({
                    silent:     true,
                    user:       +user.id,
                    text:       `Пользователь id ${user.id} возвращается`
                })
            })

            if (req.body.message.text) {

                // пришло текстовое сообщение;


                switch (req.body.message.text) {
                    case `/game`:{
                        return ifBefore(games,{room: req.body.message.chat.id}).then(current=>{
                            current.forEach(g=>{
                                games.doc(g.id).update({
                                    active:     false,
                                    closedAt:   new Date()
                                })
                            })

                            games.add({
                                createdAt:  new Date(),
                                room:       req.body.message.chat.id,
                                active:     true,
                                createdBy:  req.body.message.from.id,
                                level:      u.level || null,
                                theme:      u.theme || null
                            }).then(g=>{
                                pa(themes, levels)
                                    .then(data=>{
                                        sendMessage2({
                                            chat_id:    +user.id,
                                            text:       `Настройки игры`,
                                            reply_markup:buttons.game(g.id, u, data[0], data[1])
                                        },false,token)
                                })
                            })
                        })
                    }
                    case `/settings`:{
                        return pa(themes, levels)
                            .then(data=>{
                                sendMessage2({
                                    chat_id:    +user.id,
                                    text: `Ваши настройки`,
                                    reply_markup:buttons.settings(u, data[0], data[1])
                                },false,token)
                        })
                    }
                    case `/test`:{
                        return sendMessage2({
                            chat_id:    u.id,
                            text:       `Приложение с теста`,
                            reply_markup:{
                                inline_keyboard:[[{
                                    text: `${ngrok}`,
                                    web_app:{
                                        url: `${ngrok}/${host}/app` 
                                    }
                                }]]
                            }
                        },false,token,messages)
                    }

                    case `/settings`:{
                        return sendMessage2({
                            chat_id: +u.id,
                            text:   locals.settingsDescription,
                            reply_markup: {
                                inline_keyboard:[[{
                                    text: `Уровень`,
                                    callback_data: `userSettings_level`
                                }],[{
                                    text: `Тема`,
                                    callback_data: `userSettings_theme`
                                }]]
                            }
                        }, false, token, messages)
                    }

                    default:
                        return alertAdmins({
                            text: `${uname(u,u.id)} пишет: ${req.body.message.text}`,
                            user: user.id
                        })
                        
                }
            }
        })
    }

    if (req.body.callback_query) {
        
        user = req.body.callback_query.from;

        let userRef = udb.doc(user.id.toString())
        
        let inc = req.body.callback_query.data.split('_')

        getUser(user.id,udb).then(u=>{

            if(!u) sendMessage2({
                callback_query_id: req.body.callback_query.id,
                show_alert: true,
                text:       `Извините, мы вас пока не знаем...`
            }, 'answerCallbackQuery', token)

            // TBD: проверка блокировки

            let userLogName = uname(u||user, u ? u.id : user.id)

            switch(inc[0]){
                case `startGame`:{
                    return getDoc(games, inc[1]).then(g=>{
                        if(!g || !g.active) return sendMessage2({
                            callback_query_id: req.body.callback_query.id,
                            show_alert: true,
                            text:       `Простите, игра недоступна.`
                        }, 'answerCallbackQuery', token)
                        
                        games.doc(inc[1]).update({
                            startedAt: new Date()
                        })

                        sendMessage2({
                            chat_id:    req.body.callback_query.message.chat.id,
                            message_id: req.body.callback_query.message.message_id,
                            text:       `Первы раунд!`,
                            
                            reply_markup:buttons.pd(u, data[0], data[1])
                        },'editMessageReplyMarkup',token)
                    })
                }
                case `settings`:{

                    pa(themes, levels)
                        .then(data=>{
                            sendMessage2({
                                chat_id:    +user.id,
                                text: `Ваши настройки`,
                                message_id: req.body.callback_query.message.message_id,
                                reply_markup:buttons.settings(u, data[0], data[1])
                            },'editMessageReplyMarkup',token)
                        })
                }

                case `userSettings`:{
                    switch(inc[1]){
                        case `level`:{
                            ifBefore(levels).then(levels=>{
                                sendMessage2({
                                    chat_id:    +user.id,
                                    message_id: req.body.callback_query.message.message_id,
                                    reply_markup:{
                                        inline_keyboard: levels.map(l=>[buttons.level(l)]).concat([[buttons.back]])
                                    }
                                },`editMessageReplyMarkup`,token)
                            })
                            
                            break;
                        }

                        case `theme`:{
                            ifBefore(themes).then(themes=>{
                                sendMessage2({
                                    chat_id:    +user.id,
                                    message_id: req.body.callback_query.message.message_id,
                                    reply_markup:{
                                        inline_keyboard: themes.map(t=>[buttons.theme(t)]).concat([[buttons.back]])
                                    }
                                },`editMessageReplyMarkup`,token)
                            })
                            
                            break;
                        }
                    }
                    break;
                }
                
                case `user`:{
                    return userRef.update({
                        [inc[1]]: interpreteCallBackData(inc[2])
                    }).then(upd=>{
                        log({
                            user:   +user.id,
                            silent: true,
                            text:   `${userLogName} обновляет профиль: ${inc[1]} становится ${inc[2]}`
                        })

                        sendMessage2({
                            callback_query_id: req.body.callback_query.id,
                            show_alert: true,
                            text:       locals.updateSuccess
                        }, 'answerCallbackQuery', token)

                        pa(themes, levels)
                            .then(data=>{
                                sendMessage2({
                                    chat_id:    +user.id,
                                    message_id: req.body.callback_query.message.message_id,
                                    reply_markup:buttons.settings(u, data[0], data[1])
                                },`editMessageReplyMarkup`,token)
                            })

                        
                    }).catch(err=>{
                        console.log(err)
                    })
                }
                

                default:{
                    sendMessage2({
                        callback_query_id: req.body.callback_query.id,
                        show_alert: true,
                        text:       locals.commandUnknown
                    }, 'answerCallbackQuery', token)
                }
            }
        })
        
    }

    if (req.body.inline_query){
        
    }
})


const locals = {
    refBountyCollected: `Ура! Вы получили ${refBounty} баллов по рефералке`,
    settingsDescription:    `Что именно вам хотелось бы изменить?..`,
    updateSuccess:  `Настройки обновлены.`,
    commandUnknown: `Извините, я еще не выучил такой команды`,
    greetings:      `${greeting()}! Я текст приветствия, хорошо бы меня изменить`,
}

function cba(req,txt){
    sendMessage2({
        callback_query_id: req.body.callback_query.id,
        show_alert: true,
        text:       txt
    }, 'answerCallbackQuery', token)
}

function getAvatar(id){
    return axios.post('https://api.telegram.org/bot' + token + '/getUserProfilePhotos', {
        user_id: id || common.dimazvali
    }, {headers: {'Content-Type': 'application/json'}
    }).then(d=>{
        return d.data
        console.log(d.data)
    }).catch(err=>{
        console.log(err)
    })
}


function registerUser(u, body) {

    udb.get().then(col=>{
        u.createdAt =       new Date();
        u.active =          true;
        u.blocked =         false;
        u[u.language_code] = true; 
        u.income =          0;
        
        udb.doc(u.id.toString()).set(u).then(() => {
            
            sendMessage2({
                chat_id: +u.id,
                text:   locals.greetings
            }, false, token, messages)

            if(body && body.message && body.message.text){
                if(body.message.text.indexOf(`ref_`)>-1){
                    ref = body.message.text.split(`ref_`)[1]
                    getUser(ref,udb).then(refUser=>{
                        
                        if(refUser) udb.doc(u.id.toString()).update({
                            ref: +ref
                        })
    
                        udb.doc(ref).update({
                            refs: FieldValue.increment(1)
                        })

                        userScore(ref,refBounty)

                        sendMessage2({
                            chat_id: ref,
                            text: locals.refBountyCollected
                        },false,token)
                    })
                }
            }

            getAvatar(u.id).then(data=>{
                if(data && data.ok && data.result.total_count){
                    
                    let pic = data.result.photos[0].reverse()[0]
                    
                    udb.doc(u.id.toString()).update({
                        avatar_id: pic.file_id
                    })
                }
            })

            rdb.ref(`/users`).push({
                id:     +u.id,
                score:  0
            }).then(rec=>{
                udb.doc(u.id.toString()).update({
                    hash: rec.key
                })
            })

            log({
                user: +u.id,
                text: `${uname(u,u.id)} регистрируется в боте.`
            })

        })
    })

    
}

module.exports = router;
