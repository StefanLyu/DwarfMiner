<template>
    <div>
        <div v-if="!loadComplete">Loading</div>
        <div class="table"  v-if="loadComplete">
            <a-card title="Please select your seat">
                <a-card-grid :title="index" v-for="(data, index) in table" :key="index" style="width: 20%; text-align: center" @click="settle(index)">
                    <!-- <plus-outlined style="fontSize: 30px; color: #ccc " v-if="!data"/> -->
                    <div>{{ index }}</div>
                    <div>{{ data }}</div>
                </a-card-grid>
            </a-card>
            <br />
            <a-button type="primary" danger v-if="owner===username">Primary</a-button>
        </div>
        
    </div>
</template>
<script>
import axios from '../api/axios'
import { mapState, mapMutations } from 'vuex';
// import interceptor from '../api/interceptor'
import { PlusOutlined } from '@ant-design/icons-vue' 
import { Button } from 'ant-design-vue'

export default {
    data() {
        return {
            loadComplete: false,
            table: Array(10).fill(""),
            ws: null,
            timerHeart: null,
            timerWs: null,
            owner: "",
        }
    },
    computed: {
        ...mapState(['username', 'gameid']),
    },
    methods: {
        ...mapMutations(['update']),
        settle(index){
            if(this.table[index] === this.username) {
                axios.post("/api/authorization").then(() => {
                    this.ws.send(JSON.stringify({
                        action: 'release',
                        gameid: this.gameid,
                        index: index
                    }))
                }, (err) => {
                    console.log(err.response.data.msg);
                    return Promise.reject(this.$router.push('/login'));
                });
            } else if(!this.table[index]) {
                axios.post("/api/authorization").then(() => {
                    this.ws.send(JSON.stringify({
                        action: 'occupy',
                        gameid: this.gameid,
                        index: index
                    }))
                }, (err) => {
                    console.log(err.response.data.msg);
                    return Promise.reject(this.$router.push('/login'));
                });              
            }
        },
        refreshTable() {
            axios.post('/api/refreshtable', {username: this.username, gameid: this.$route.params.gameid}).catch((err) => {
                console.log(err.response.data.msg);
                return Promise.reject(this.$router.push('/login'));
            }).then(res => {
                let newTable = Array(10).fill("");
                res.data.forEach((item, index) => {
                    console.log(item, item.username, item.seatOrder)
                    if(item.username && item.seatOrder !== -1) {
                        newTable.splice(item.seatOrder,1, item.username);
                    }
                });
                this.table = newTable;
            })
        },        
        initWebsocket() {
            if(WebSocket && this.username) {
                this.ws = new WebSocket(`ws://localhost:5000/api/table?username=${this.username}`);
                this.ws.onopen = () => {
                    console.log('connect success');
                };
                this.ws.onmessage = (msg) => {
                    clearTimeout(this.timerWs);
                    // this.heartBeat();
                    if(msg.data) {
                        if(JSON.parse(msg.data).action === 'refreshtable') {
                            this.refreshTable();
                        }
                    }
                };
                this.ws.onerror = () => {
                    console.log('connection error');
                    this.initWebsocket();
                };
                this.ws.onclose = () => {
                    console.log('connection closed');
                };
            } else {
                this.$router.push('/login');
            }
        },
    },
    components: {
        PlusOutlined
    },
    created() {
        const gameid = this.$route.params.gameid;
        if(!gameid) {
            this.$router.push('/login');
            return;
        }

        // 检查玩家：
        // 1. 如果当前玩家在roundinfo里没有参与过游戏，不允许新玩家加入
        // 2. 如果游戏已开，status=1/0，老玩家加载手牌和状态
        // 3. 游戏未开，status=-1，进入等待界面，可以选择位置，一共10个人

        axios.post('/api/checkGamePlayer', {gameid, username: this.username})
        .catch((err) => {
            console.log(err.response.data.msg);
            return Promise.reject(this.$router.push('/login'));
        }).then(res => {
            if(res) {
                if(res.length ===0) {
                    // 检查gameid是否存在
                    return Promise.reject('Wrong gameid');
                } else {
                    let status = res.data[0].gameStatus;
                    let username = res.data[0].username;
                    this.update({
                            key: 'gameid', 
                            value: gameid
                        });
                    this.owner = res.data[0].owner || "";
                    if(status === '-1' && !username) {
                        // 新增roundinfo
                        return Promise.resolve('insert');
                    } else if(username && (status === '0' || status === '1')) {
                        // 加载历史游戏
                        return Promise.resolve('reload');
                    } else if(username && status === '-1') {
                        // 已经加入待开始的房间
                        return Promise.resolve('wait');
                    }else {
                        // 返回选择房间页面
                        return Promise.reject('quit');
                    }
                }
            }
        }).then(res => {
            if(res === 'insert') {
                // axios.post('/api/roundinfo', {gameid, username: this.username})
                // .then(res => {
                    setTimeout(() => {
                        this.loadComplete = true;
                    }, 1000);
                // })
                console.log('添加玩家');
            } else if(res === 'wait'){
                this.loadComplete = true;
                console.log('等待游戏开始');
            } else if(res === 'reload') {
                // 进入历史游戏
                console.log(`reload game ${gameid}`)
            }
        }, err => {
            if(err === 'quit') {
                console.log('You can not join in an ongoing game');
                this.$router.push('/room');
            } else {
                console.log(err);
                this.$router.push('/room');
            }
            return;
        })        
    },
    mounted() {
        this.refreshTable();
        this.initWebsocket();
    },
    beforeRouteLeave(to, from ,next) {
        if(this.ws) {
            this.ws.send(JSON.stringify({
                action: 'occupy',
                gameid: this.gameid,
                index: -1
            }))
            this.ws.close();
        }
        if(!this.username) {
            this.$router.push('/login');
        }
        next();
    }
}
</script>
<style lang="scss" scoped>
.ant-card-bordered {
    border: none
}
// .table {
//     display: flex;
//     justify-content: center;
//     align-items: center;
//     position: absolute;
//     margin: 10px;
// }
// .chair {
//     width: 100px;
//     height: 100px;
//     border: 1px solid #ccc;
//     padding: 10px;

//     &:hover {
//         box-shadow: 0px 1px 1px 1px #888888;
//         opacity: 0.5;
//     }
// }
</style>
