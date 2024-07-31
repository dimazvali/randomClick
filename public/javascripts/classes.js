const firebaseConfig = {
    apiKey:         "AIzaSyBMIx8QWLhTLtQLVhRxodPKvI-Eyhb6JaE",
    authDomain:     "randomclick6666.firebaseapp.com",
    databaseURL:    "https://randomclick6666-default-rtdb.europe-west1.firebasedatabase.app",
    projectId:      "randomclick6666",
    storageBucket:  "randomclick6666.appspot.com",
    messagingSenderId: "627473550917",
    appId:          "1:627473550917:web:fc47abf0ab66cd7f5f5d2c"
};




import {
    initializeApp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";

import {
    getDatabase,
    ref,
    onChildAdded,
    query,
    orderByChild,
    onChildChanged,
    equalTo,
    onValue
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js";

let app = initializeApp(firebaseConfig);

let db = getDatabase(app)


function showTap(event, tg) {
    console.log(event);
    shimmer(true, tg);
    
    // Create the "+1" element
    let plus = document.createElement('div');
    plus.className = 'flyer';
    plus.textContent = '+1';
    
    // Set random color
    plus.style.color = getRandomColor();
    
    // Get the target image element
    const targetImage = document.getElementById('targetImage');
    const rect = targetImage.getBoundingClientRect();
    
    // Calculate random position within 50 pixels around the image
    const randomX = rect.left + Math.random() * (rect.width + 100) - 50;
    const randomY = rect.top + Math.random() * (rect.height + 100) - 50;
    plus.style.left = `${randomX}px`;
    plus.style.top = `${randomY}px`;
    
    // Append to body
    document.body.append(plus);
    
    // Remove after animation
    setTimeout(() => {
        plus.remove();
    }, 900);
}

// Helper function to generate a random color
function getRandomColor() {
    const letters = '0123456789ABCDEF';
    let color = '#';
    for (let i = 0; i < 6; i++) {
        color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
}
function shimmer(light,tg){
    if(light) return tg.HapticFeedback.impactOccurred('light')
    tg.HapticFeedback.notificationOccurred('success')
}

class Action{
    constructor(a){
        this.id =               a.id
        this.name =             ko.observable(a.name)
        this.description =      ko.observable(a.description)
        this.active =           ko.observable(!a.passed)
        this.price =            ko.observable(a.price || 0)
    }
}

class Page{
    constructor(d,tg,handleError,host,userLoad,drawDate){
        this.showAlert = (txt) => tg.showAlert(txt);
        this.active =       ko.observable(`tapper`);
        
        this.actions = ko.observableArray(d.actions.map(a=>new Action(a)))
        
        this.setActive = (v)=> {
            this.active(v)
        }

        // данные пользователя
        this.id =       d.profile.user.id;
        this.hash =     d.profile.user.hash;
        console.log(d.profile.user.hash)

        this.username = ko.observable(d.profile.user.username);
        this.score =    ko.observable(d.profile.user.score || 0);
        this.income =   ko.observable(d.profile.user.income || 0);
        this.refs =     ko.observable(d.profile.user.refs || 0);

        // методы пользователя
        this.tap = (e) => {
            showTap(e,tg)
            axios
                .post(`/api/tap`)
                .then(s=>{
                    // showTap(s.data)
                })
                .catch(err=>{
                    tg.showAlert(err.message)
                })
        }
        this.claim = (a) => {
            
            console.log(a);
            
            axios.post(`/api/actions/`,{
                action: a.id
            }).then(s=>{
                a.active(false)
                tg.showAlert(`ok!`)
            }).catch(err=>{
                tg.showAlert(err.message)
            })
        }

        // служебное
        this.copyRef =()=>{
            navigator.clipboard.writeText(`https://t.me/dimazvaliClickerTestBot?start=ref_${this.id}`).then(s=>{
                try {
                    tg.showAlert(`Ссылка скопирована`)    
                } catch (error) {
                    alert(`ссылка скопирована`)
                }
            }).catch(err=>{
                console.warn(err)
            })
        }

        // фоновое обновление
        onValue(ref(db,`users/${d.profile.user.hash}`),a=>{
            
            console.log(`обновился юзер`)

            a = a.val();

            
            console.log(a)
            

            if(a){
                console.log(a);

                this.score(a.score)
                this.income(a.income || 0)
            }
        })
    }
}

export {
    Page,
}
