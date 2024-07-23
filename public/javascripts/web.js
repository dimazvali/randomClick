let host = null
let subHost = `admin`
let downLoadedUsers = {};
let buttonStyle = []


function showUsers(){
    showScreen(`Пользователи`,`users`,showUserLine,false)
}

function showActions(){
    showScreen(`Задания`,`actions`,showActionLine,addAction)
}

function showUserLine(u){
    let c = listContainer(u,true,{
        taps:   `тапов`,
        score:  `счет`,
        refs:   `рефералов`
    });
    c.append(ce(`h3`,false,false,uname(u, u.id),{
        onclick:()=>showUser(u.id)
    }))
    return c;
}


function messageLine(m){
    
    m.active = m.hasOwnProperty(`deleted`) ? false : true
    
    let c = listContainer(m,true,false,{
        isReply:        m.isReply,
        isIncoming:     !m.isReply,
        user:           m.user,
        reply:          m.isReply?true:false,
        incoming:       !m.isReply?true:false,
    })

    if(!m.active) c.classList.remove(`hidden`)

    c.append(ce(`p`,false,false,m.text || `без текста`))

    if(m.textInit) c.append(ce(`p`,false,false,`Исходный текст: ${m.textInit}`))

    let bc = ce(`div`,false,`flex`)
        c.append(bc)

    if(m.messageId && !m.deleted  && (+new Date() - new Date(m.createdAt._seconds*1000 < 48*60*60*1000))){
        bc.append(deleteButton(`messages`,m.id,false,[`active`,`dark`,`dateButton`],()=>message.remove()))
        if(!m.edited) bc.append(ce(`button`,false,buttonStyle,`редактировать`,{
            onclick:()=>{
                let ew = modal()
                    let txt = ce(`textarea`,false,false,false,{
                        placeholder: `вам слово`,
                        value: m.text || null
                    })
                     
                    ew.append(txt);

                    ew.append(ce(`button`,false,false,`Сохранить`,{
                        onclick:()=>{
                            if(txt.value) axios.put(`/admin/messages/${m.id}`,{
                                attr: `text`,
                                value: txt.value
                            }).then(handleSave)
                            .catch(handleError)
                        }
                    }))
            }
        }))
    }

    if(!m.isReply){
        bc.append(ce(`button`,false,buttonStyle,`Ответить`,{
            onclick:()=>{
                let b = modal()
                let txt = ce(`textarea`,false,false,false,{placeholder: `Вам слово`})
                    b.append(txt)
                    b.append(ce(`button`,false,buttonStyle,`Написать`,{
                        onclick:function(){
                            if(!txt.value) return alert(`Я не вижу ваших букв`)
                            this.setAttribute(`disabled`,true)
                            axios.post(`/admin/message`,{
                                text: txt.value,
                                user: m.user
                            }).then(handleSave)
                            .catch(handleError)
                            .finally(()=>{
                                txt.value = null;
                                this.removeAttribute(`disabled`)
                            })
                        }
                    }))
            }
        }))
    }

    return c
}


function showUser(id){
    let p = preparePopupWeb(`user_${id}`,false,false,true)
    load(`users`,id).then(u=>{
        
        p.append(ce(`a`,false,`info`,`realtime score`,{
            href: `https://console.firebase.google.com/u/0/project/randomclick6666/database/randomclick6666-default-rtdb/data/~2Fusers~2F${u.hash}`
        }))
        
        p.append(ce(`h1`,false,false,uname(u, u.id)))

        p.append(line(
            toggleButton(`users`,u.id,`blocked`,u.blocked||false,`Разблокировать`,`Заблокировать`,[`dateButton`,`dark`]),
        ))
        
        let messenger = ce('div')
        
        p.append(messenger)

        messenger.append(ce(`button`,false,buttonStyle,`Открыть переписку`,{
            onclick:function(){
                this.remove()
                messenger.append(ce(`h2`,false,false,`Переписка:`))
                load(`messages`,false,{user:id}).then(messages=>{
                    let mc = ce(`div`,false,`messenger`)
                    messenger.append(mc)
                    messages.forEach(m=>{
                        mc.prepend(messageLine(m))
                    })
                    let txt = ce('textarea',false,false,false,`вам слово`)
                    messenger.append(txt)
                    messenger.append(ce(`button`,false,buttonStyle,`Отправить`,{
                        onclick:()=>{
                            if(txt.value){
                                axios.post(`/admin/messages`,{
                                    text: txt.value,
                                    user: u.id
                                }).then(s=>{
                                    
                                    alert(`ушло!`)
                                    let message = ce('div',false,false,false,{dataset:{reply:true}})
                                        message.append(ce(`span`,false,`info`,drawDate(new Date(),false,{time:true})))
                                        message.append(ce(`p`,false,false,txt.value))
                                        txt.value = null;
                                    mc.prepend(message)
                                }).catch(err=>{
                                    alert(err.message)
                                })
                            }
                        }
                    }))
                })
            }
        }))
    
    })
}

start = start.split('_')

switch(start[0]){
    case `users`:{
        if(!start[1]) {
            showUsers()
        } else {
            showUser(start[1])
        }
    }
    case `actions`:{
        if(!start[1]) {
            showActions()
        } else {
            showAction(start[1])
        }
    }
}

function showAction(id){
    
    let p = preparePopupWeb(`actions_${id}`,false,false,true)
    
    load(`actions`,id).then(q=>{
        p.append(detailsContainer(q))
        
        p.append(ce(`h1`,false,false,q.name,{
            onclick:function(){
                edit(`actions`,id,`name`,`text`,q.name,this)
            }
        }))

        p.append(ce(`p`,false,false,q.description||'добавьте описание',{
            onclick:function(){
                edit(`actions`,id,`description`,`textarea`,q.description||`добавьте описание`,this)
            }
        }))

        p.append(ce(`p`,false,false,q.price? `стоимость: ${q.price}` :`без цены`,{
            onclick:function(){
                edit(`actions`,id,`price`,`number`,q.price||`добавьте цену`,this)
            }
        }))

        let history = ce(`div`)
        p.append(history)

        load(`usersActions`,false,{action:id}).then(log=>{
            history.append(ce(`h3`,false,false,log.length?`Использована ${letterize(log.length,`раз`)}`:`Еще никто не брал`)) 
            log.forEach(r=>{
                history.append(ce(`p`,false,false,`юзер ${r.user} @ ${drawDate(r.createdAt._seconds*1000)}`))
            })
        })

        p.append(deleteButton(`actions`,id,!q.active))
    })
}

function showActionLine(q){
    let c = listContainer(q,true,{
        price:          `Стоимость`,
        subscription:   `Требуется подписка`
    });
        c.append(ce(`h3`,false,`clickable`,q.name,{
            onclick:()=>showAction(q.id)
        }))
        c.append(ce(`p`,false,`info`,q.description))
    return c;
}

function addAction(){
    addScreen(`actions`,`Новое действие`,{
        name:           {placeholder: `Текст`},
        description:    {placeholder: `Описание`,   tag:`textarea`},
        subscription:   {placeholder: `Требуются подписки`, bool: true},
        price:          {placeholder: `Стоимость`,      type: `number`}
    })
}