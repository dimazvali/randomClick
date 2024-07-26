let host = null;

function shimmer(light){
    if(light) return tg.HapticFeedback.impactOccurred('light')
    tg.HapticFeedback.notificationOccurred('success')
}

function userLoad(collection, id, extra) {
    return axios.get(`${host ? `/${host}` : ``}/api/${collection}${id?`/${id}`:''}${extra?`?${Object.keys(extra).map(k=>`${k}=${extra[k]}`).join(`&`)}`:''}`)
        .then(data => {
            return data.data
        })
}

function showLoad(){
    tg.MainButton.setParams({
        text:`загружаем`,
        is_visible: true
    })
    tg.MainButton.showProgress()
}

function setWarning(inp){
    inp.classList.add('warning')
    setTimeout(()=>{
        inp.classList.remove(`warning`)  
    },1500)
}


function helper(type){
    let c = ce(`div`,false,`containerHelp`,`?`,{
        onclick:()=>{
            let m = ce(`div`,false,[`modal`,(tg.colorScheme=='dark'?`reg`:`light`)])
                m.append(ce(`h2`,false,false,helperTexts[type].title,{
                    onclick:()=>m.remove()
                }))
            let sub = ce(`div`,false, `vScroll`)
                helperTexts[type].text.forEach(p=>{
                    sub.append(ce(`p`,false,`info`,p))
                })

                sub.append(ce(`button`,false,`thin`,`скрыть`,{
                    onclick:()=>m.remove()
                }))
            m.append(sub)
            document.body.append(m)
        }
    });
    
    return c;
}

function toast(txt){
    tg.MainButton.setParams({
        text: txt,
        is_visible: true
    })
    setTimeout(()=>{
        tg.MainButton.hide()
    },1500)
}

function preparePopup(type) {
    tg.BackButton.show();
    tg.onEvent('backButtonClicked', clearPopUp)

    if (document.querySelector(`[data-type="${type}"]`)) {
        document.querySelector(`[data-type="${type}"]`).remove()
    }

    let index = Math.floor(Math.random()*4)+1

    mcb = clearPopUp
    let popup = ce('div', false, 'popup', false, {
        dataset: {
            type: type
        }
    })

    
    document.body.append(popup)
    let content = ce('div')

    popup.append(content)

    tg.MainButton.hide()
    return content
}


function clearPopUp() {
    let length = document.querySelectorAll('.popup').length;

    console.log(length)

    let p = document.querySelectorAll('.popup')[length - 1]

    console.log(p)

    p.classList.add('sb')

    setTimeout(function () {
        p.remove()
        if (!document.querySelectorAll('.popup').length) tg.BackButton.hide()
    }, 500)

    if (mcb) {
        tg.MainButton.offClick(mcb)
        mcb = null;
        tg.MainButton.hide()
    }

    if (mbbc) {
        tg.MainButton.hide()
        tg.MainButton.offClick(mbbc)
        mbbc = null
    }
}