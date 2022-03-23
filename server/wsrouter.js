const koaRouter = require('koa-router');
const axios = require('axios');
// const axios = require('../src/api/axios');

const router = koaRouter();

let ws = {
    'room': {},
    'table': {},
};

const boradcast = (name, action) => {
    Object.keys(ws[name]).forEach((item, index) => {
        if(ws[name][item]) {
            ws[name][item].websocket.send(JSON.stringify({action: action}));
        }
    })
}

router.get('/api/room', (ctx, next) => {
    const username = ctx.query.username || '';
    if(username) {
        console.log(username);
        ws['room'][username] = ctx;
        // ctx.websocket.send('data from server');
        ctx.websocket.on('message', (message) => {
            if(message) {
                if(message === 'heartBeat') {
                    ctx.websocket.send('heartBeat');
                    return;
                }
                const messageJSON = JSON.parse(message);
                if(messageJSON.action === 'createRoom') {
                    // 根据创建人生成房间
                    axios.post('http://localhost:5000/api/createroom', { username }).then(res => {
                        boradcast('room', 'listroom');
                    }, err => {
                        console.log(err);
                    })
                } else if(messageJSON.action === 'deleteRoom' && messageJSON.gameid) {
                    axios.post('http://localhost:5000/api/closeroom', {gameid: messageJSON.gameid}).then(res => {
                        boradcast('room', 'listroom');
                    }, err => {
                        console.log(err);
                    })
                }
            }
        });
        ctx.websocket.on('close', () => {
            ws['room'][username] = '';
            console.log('close');
        });
    }

})

router.get('/api/table', (ctx, next) => {
    const username = ctx.query.username || '';
    if(username) {
        ws['table'][username] = ctx;
        ctx.websocket.on('message', (message) => {
            if(message) {
                if(message === 'heartBeat') {
                    ctx.websocket.send('heartBeat');
                    return;
                }
                const messageJSON = JSON.parse(message);
                if(messageJSON.action === 'release' && messageJSON.gameid) {
                    // 
                    axios.post('http://localhost:5000/api/release', { username, gameid: messageJSON.gameid, index: messageJSON.index }).then(res => {
                        boradcast('table', 'refreshtable');
                    }, err => {
                        console.log(err);
                    })
                } else if(messageJSON.action === 'occupy' && messageJSON.gameid) {
                    axios.post('http://localhost:5000/api/occupy', {username, gameid: messageJSON.gameid, index: messageJSON.index }).then(res => {
                        boradcast('table', 'refreshtable');
                    }, err => {
                        console.log(err);
                    })
                }
            }
        })
    }
})

module.exports = router;