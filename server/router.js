const koaRouter = require('koa-router');
const token = require('./api/getToken');
const crypto = require('crypto');
const _ = require('lodash');
const { createPool } = require('./database/mysql.config');

const router = koaRouter();
const { addToken, decryptToken, verify } = token;

const pool = createPool();

/**
 * koa-router 支持正则匹配，先定义的路由先执行
 */

// 
/**
 * 根据token检查登录状态，token被放在了请求头里
 * 匹配所有非login的路由，检查请求头的authorization
 * 如果未授权，通过next('/')不匹配其他路由并直接回到客户端，进而做错误处理
 */
router.post(/\/api\/(?!(login))[\w]+/g, async (ctx, next) => {
    const token = ctx.request.headers.authorization || '';
    const tokenInfo = await decryptToken(token);
    if(true) {
        const time = tokenInfo.time;
        const currentTime = Date.now();
        // 15分钟过期
        if(currentTime - time > 1000*60*15) {
            ctx.status = 401;            
            ctx.body = {
                msg: 'Login status out of date'
            }
            await next('/');
        } else {
            ctx.status = 200;
            ctx.body = {
                msg: ''
            }
            await next();
        }
    } else {
        ctx.status = 401;            
        ctx.body = {
            msg: 'Authorization fail'
        }
        await next('/');
    }
})

// 登录时授权
router.post('/api/login', async (ctx, next) => {
    const { username, password, guid } = ctx.request.body;
    if(username && password) {
        await new Promise((resolve, reject) => {
            pool.getConnection((err, conn) => {
                if(err) {
                    conn.release();
                    reject(err);
                } else {
                    console.log('Connected');
                    conn.query('select username from userInfo where username=? and password = ?', [username, password], (err2, res) => {
                        conn.release();
                        if(err2) {
                            reject(err2);
                        } else {
                            if(res.length > 0) {
                                try {
                                    const userToken = addToken({
                                        guid,
                                        username,
                                        password,
                                        time: Date.now()
                                    });
                                    resolve({
                                        code: 200,
                                        token: userToken
                                    });
                                } catch (e) {
                                    resolve({ 
                                        code: 500,
                                        msg: "Internal Server Error"
                                    });
                                }
                            } else {
                                resolve({
                                    code: 500,
                                    msg: "username or password wrong"
                                });
                            }
                        }
                    })
                }
            })
        }).then(res => {
            ctx.status = 200;
            ctx.body = res;
        }, err => {
            ctx.status = 500;
            ctx.body = err;
        })
    } else {
        ctx.status = 400;
        ctx.body = {msg: 'no username or password'};
    }
    await next();    
})

// 创建房间
router.post('/api/createroom', async (ctx, next) => {
    const { username } = ctx.request.body;
    if(username) {
        await new Promise((resolve, reject) => {
            pool.getConnection((err, conn) => {
                if(err) {
                    conn.release();
                    reject(err);
                }
                const hash = crypto.createHmac('sha256', 'roomCode')
                            .update(Date.now().toString())
                            .digest('hex');
                const cards = _.shuffle(Array(71).fill({}).map((item, index) => index)).toString();
                conn.query(`insert into gameInfo (gameid, owner, cardsOrder, cardsRemain) values (?, ?, ?, ?)`, [hash, username, cards, cards], (err, res) => {
                    conn.release();
                    if(err) {
                        reject(err);
                    }
                    resolve(res);
                })
            })
        }).then(res => {
            ctx.status = 200;
            ctx.body = res;
            next();
        }, err => {
            ctx.status = 500;
            ctx.body = err;
            next();
        })
    } else {
        ctx.status = 401;            
        ctx.body = {
            msg: 'username lost'
        }
        next();
    }
})

// 关闭房间
router.post('/api/closeroom', async (ctx, next) => {
    const { gameid } = ctx.request.body;
    if(gameid) {
        await new Promise((resolve, reject) => {
            pool.getConnection((err, conn) => {
                if(err) {
                    conn.release();
                    reject(err);
                }
                conn.query(`update gameinfo set gameStatus=? where gameid=?;`, ['0', gameid], (err, res) => {
                    conn.release();
                    if(err) {
                        reject(err);
                    }
                    resolve(res);
                })
            })
        }).then(res => {
            ctx.status = 200;
            ctx.body = res;
            next();
        }, err => {
            ctx.status = 500;
            ctx.body = err;
            next();
        })
    } else {
        ctx.status = 401;            
        ctx.body = {
            msg: 'gameid lost'
        }
        next();
    }
})

// 列出房间
router.post('/api/listroom', async (ctx, next) => {
    await new Promise((resolve, reject) => {
        pool.getConnection((err, conn) => {
            if(err) {
                conn.release();
                reject(err);
            }
            conn.query(`select gameid, owner, dtmCreated from gameInfo where gameStatus != 0 order by dtmCreated desc`, (err, res) => {
                conn.release();
                if(err) {
                    reject(err);
                }
                if(res) {
                    resolve(res);
                }
            })

        })
    }).then(res => {
        ctx.status = 200;
        ctx.body = res;
        next();
    }, err => {
        ctx.status = 500;
        ctx.body = err;
        next();
    });

})

// 查找房间
router.post('/api/selectroom', async (ctx, next) => {
    const { gameid } = ctx.request.body;
    if(gameid) {
        await new Promise((resolve, reject) => {
            pool.getConnection((err, conn) => {
                if(err) {
                    conn.release();
                    reject(err);
                }
                conn.query(`select gameid from gameinfo where gameid=? and gameStatus!=0;`, [gameid], (err, res) => {
                    conn.release();
                    if(err) {
                        reject(err);
                    }
                    resolve(res);
                })
            })
        }).then(res => {
            ctx.status = 200;
            ctx.body = res;
            next();
        }, err => {
            ctx.status = 500;
            ctx.body = err;
            next();
        })
    } else {
        ctx.status = 401;            
        ctx.body = {
            msg: 'gameid lost'
        }
        next();
    }
})

// 查找房间和玩家状态
router.post('/api/checkGamePlayer', async (ctx, next) => {
    const { gameid, username } = ctx.request.body;
    if( gameid && username ) {
        await new Promise((resolve, reject) => {
            pool.getConnection((err, conn) => {
                if(err) {
                    conn.release();
                    reject(err);
                }
                conn.query(`select A.gameid, A.owner, A.gameStatus, B.username from gameinfo as A left join roundinfo as B on A.gameid = B.gameid and B.username=? where A.gameid=?;`, [username, gameid], (err, res) => {
                    conn.release();
                    if(err) {
                        reject(err);
                    }
                    if(res.length === 0) {
                        reject({ msg: 'wrong gameid' });
                    }
                    resolve(res);
                })
            })
        }).then(res => {
            ctx.status = 200;
            ctx.body = res;
            next();
        }, err => {
            ctx.status = 500;
            ctx.body = err;
            next();
        })
    } else {
        ctx.status = 400;
        ctx.body = { msg: 'username or gameid is missing'  };    
        next();
    }
})

// 列出玩家位置
router.post('/api/refreshtable', async (ctx, next) => {
    const { username, gameid } = ctx.request.body;
    if(username && gameid) {
        await new Promise((resolve, reject) => {
            pool.getConnection((err, conn) => {
                if(err) {
                    conn.release();
                    reject(err);
                }
                conn.query(`select gameid, username, seatOrder from roundinfo where gameid=? and seatOrder >= 0;`, [gameid, username], (err, res) => {
                    conn.release();
                    if(err) {
                        reject(err);
                    }
                    resolve(res);
                })
            })
        }).then(res => {
            ctx.status = 200;
            ctx.body = res;
            next();
        }, err => {
            ctx.status = 500;
            ctx.body = err;
            next();
        })
    }
})

// 占座和释放作为
router.post('/api/release', async (ctx, next) => {
    const { username, gameid, index } = ctx.request.body;
    if(username && gameid && index !== null) {
        await new Promise((resolve, reject) => {
            pool.getConnection((err, conn) => {
                if(err) {
                    conn.release();
                    reject(err);
                }
                conn.query(`delete from roundinfo where gameid=? and username=? and seatOrder=? and g_u=?;`, [gameid, username, index,`${gameid}_${username}`], (err, res) => {
                    conn.release();
                    if(err) {
                        reject(err);
                    }
                    resolve(res);
                })
            })
        }).then(res => {
            ctx.status = 200;
            ctx.body = res;
            next();
        }, err => {
            ctx.status = 500;
            ctx.body = err;
            next();
        })
    }
})

// 占座和释放作为
router.post('/api/occupy', async (ctx, next) => {
    const { username, gameid, index } = ctx.request.body;
    if(username && gameid && index !== null) {
        await new Promise((resolve, reject) => {
            pool.getConnection((err, conn) => {
                if(err) {
                    conn.release();
                    reject(err);
                }
                conn.query(`insert into roundinfo set gameid=?, username=?, seatOrder=?, g_u=? ON DUPLICATE KEY UPDATE seatOrder=?;`, [gameid, username, index,`${gameid}_${username}`, index], (err, res) => {
                    conn.release();
                    if(err) {
                        reject(err);
                    }
                    resolve(res);
                })
            })
        }).then(res => {
            ctx.status = 200;
            ctx.body = res;
            next();
        }, err => {
            ctx.status = 500;
            ctx.body = err;
            next();
        })
    }
})

// 根据code检查游戏状态
/**
 * pool.getConnection 是异步的，如果要连用必须套上 new Promise，然后resolve/reject，否则api不能返回正确的内容给前端
 */
router.post('/api/code', async (ctx, next) => {
    const {code, username} = ctx.request.body;
    if(code && username) {
        const hash = await crypto.createHmac('sha256', 'gameCode')
                    .update(code)
                    .digest('hex');
        new Promise((resolve, reject) => {
            pool.getConnection((err, conn) => {
                if(err) {
                    conn.release();
                    reject(err);
                }
                // 检查游戏是否存在
                // 0 - 游戏已结束，默认不能回到已经结束的游戏里
                conn.query(`select * from gameInfo where gameid = ? and gamestatus != 0`, [hash], (err2, res) => {
                    conn.release();
                    if(err2) {
                        reject(err2);
                    } else {
                        resolve(res);
                    }
                })
            }) 
        }).then(res => {
            return new Promise((resolve, reject) => {
                if(res.length > 0) {
                    // 游戏已存在，检查用户是否有参与，如果没有，不允许中途参加
                    pool.getConnection((err, conn) => {
                        conn.query(`select A.username from roundInfo as A
                        inner join
                        gameInfo as B
                        on A.gameid = B.gameid and A.username = ? and B.status = 1`);
                    })
                    return Promise.reject({code: 400, msg: 'Please wait till next game begins'});
                } else {
                    // 游戏不存在，创建新游戏，更新gameInfo，更新gameInfo里的牌堆顺序，然后更新roundInfo
                    let cardsOrder = Array(71).fill({}).map((_, index) => index);
                    cardsOrder = _.shuffle(cardsOrder);
                    pool.getConnection((err, conn) => {
                        conn.query(`insert into gameInfo (gameid, cardsOrder, cardsRemain, owner) values (?, ?, ?, ?)`, [hash, cardsOrder.toString(), cardsOrder.toString(), username], (err3, res) => {
                            if(err3) {
                                return Promise.reject(err3);
                            } else {
                                return Promise.resolve();
                            }
                        })
                    })
                }
            })
        }).then(res => {
            // 更新roundInfo
            return new Promise((resolve, reject) => {
                pool.getConnection((err, conn) => {
                    conn.query(`insert into roundInfo (gameid, username, handcards) values (?, ?, ?)`, [hash, username, 'test'], (err4, res) => {
                        conn.release();
                        if(err4) {
                            reject(err4);
                        } else {
                            resolve({msg: 'Game generated'});
                        }
                    })
                })
            })
        }).then(res => {
            ctx.status = 200;
            ctx.body = res;
            console.log(res);
            next();
        }).catch(err => {
            console.log(err);
            ctx.status = err.code || 500;
            ctx.body = {msg: err.msg || err}
            next();
        })
    } else {
        ctx.status = 400;
        ctx.body = {
            code: 400,
            msg: 'Parameter is missing'
        }
        next();
    }
    console.log(ctx.body)
})
module.exports = router;