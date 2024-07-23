const buttons = {
    back: {
        text: `Обратно к настройкам`,
        callback_data: `settings`
    },
    level: (l) => {
        return {
            text: l.name,
            callback_data: `user_level_${l.id}`
        }
    },
    theme: (t) => {
        return {
            text:           t.name,
            callback_data:  `user_theme_${t.id}`
        }
    },
    settings: (u, themes, levels) => {
        return {
            inline_keyboard: [
                [{
                    text: `Сюжет: ${u.theme ? (themes.filter(l=>l.id == u.theme)[0] ? themes.filter(l=>l.id == u.theme)[0].name : `не выбран`) : `не выбран`}`,
                    callback_data: `userSettings_theme`
                }],
                [{
                    text: `Уровень: ${u.level ? (levels.filter(l=>l.id == u.level)[0] ? levels.filter(l=>l.id == u.level)[0].name : `не выбран`) : `не выбран`}`,
                    callback_data: `userSettings_level`
                }]
            ]
        }
    },
    game: (id, u, themes, levels) => {
        return {
            inline_keyboard: [
                [{
                    text: `Сюжет: ${u.theme ? (themes.filter(l=>l.id == u.theme)[0] ? themes.filter(l=>l.id == u.theme)[0].name : `не выбран`) : `не выбран`}`,
                    callback_data: `gameSettings_theme_${id}`
                }],
                [{
                    text: `Уровень: ${u.level ? (levels.filter(l=>l.id == u.level)[0] ? levels.filter(l=>l.id == u.level)[0].name : `не выбран`) : `не выбран`}`,
                    callback_data: `gameSettings_level_${id}`
                }],
                [{
                    text: `Поехали!`,
                    callback_data: `startGame_${id}`
                }]
            ]
        }
    }
}

module.exports = {
    buttons
}