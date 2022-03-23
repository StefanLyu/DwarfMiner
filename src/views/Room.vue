<template>
<div class="flex justify-start items-start">
    <div class="roomList">
          <a-list item-layout="vertical" size="large" :pagination="{pageSize: 4}" :data-source="roomList" style="width:340px">
            <template #renderItem="{ item, index }">
                <a-card hoverable :loading="loading && index===0" class="w-80" style="margin: 10px;">
                    <template #actions>
                        <poweroff-outlined key="close" v-if="item.owner === this.username" @click="closeRoom(item.gameid)"/>
                        <tool-filled key="edit"/>
                        <enter-outlined key="play" @click="enterGame(item.gameid)"/>
                    </template>
                    <a-card-meta :title="title(item)" :description="dateTime(item)">
                    </a-card-meta>
                </a-card>
            </template>
          </a-list>
    </div>
    <div class="btn" style="margin: 10px">
        <a-button type="primary" size="large" @click="createRoom" :disabled="disabled">
            <template #icon>
                <PlusSquareOutlined />
            </template>
        </a-button>
    </div>
</div>
</template>
<script>
import { Button } from 'ant-design-vue'
import { PlusSquareOutlined } from '@ant-design/icons-vue'
// import interceptor from '../api/interceptor'
// import axios from 'axios'
import { mapState, mapMutations, mapGetters } from 'vuex'
import { List } from 'ant-design-vue'
import { EnterOutlined, PoweroffOutlined, ToolFilled } from '@ant-design/icons-vue'
import axios from '../api/axios'

export default {
    data() {
        return {
            roomList: [],
            interval: null,
            count: 0,
            ws: null,
            timerHeart: null,
            timerWs: null,
            disabled: false,
            loading: false,
            loadingOrNot: false
        }
    },
    components: {
        PlusSquareOutlined,
        PoweroffOutlined,
        ToolFilled,
        EnterOutlined
    },
    computed: {
        ...mapState([
        'username'
        ])
    },
    methods: {
        ...mapMutations(['update']),
        // websocket 心跳包，防止连接断开
        heartBeat() {
            // this.timer = setTimeout(() => {
            //     if(this.ws) {
            //         this.ws.send('heartBeat');
            //         this.timerWs = setTimeout(() => {
            //             this.ws.close();
            //             this.initWebsocket();
            //             this.heartBeat();
            //         }, 5000);
            //     }
            // }, 5000);
        },
        initWebsocket() {
            if(WebSocket && this.username) {
                this.ws = new WebSocket(`ws://localhost:5000/api/room?username=${this.username}`);
                this.ws.onopen = () => {
                    console.log('connect success');
                };
                this.ws.onmessage = (msg) => {
                    clearTimeout(this.timerWs);
                    this.heartBeat();
                    if(msg.data) {
                        if(JSON.parse(msg.data).action === 'listroom') {
                            console.log('Room update');
                            this.updateRoomList();
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
        createRoom() {
            this.disabled = true;
            this.loadingOrNot = true;
            axios.post("/api/authorization").then(() => {
                this.ws.send(JSON.stringify({
                    action: 'createRoom'
                }))
            }, (err) => {
                console.log(err.response.data.msg);
                return Promise.reject(this.$router.push('/login'));
            });
        },
        updateRoomList() {
                axios.post('/api/listroom').then(res => {
                    const len = res.data.length;
                    this.roomList = res.data;
                    if(this.loadingOrNot) {
                        this.loading = true;
                        setTimeout(() => {
                            this.loading = false;
                            this.disabled = false;
                        }, 2000);
                    }
                }, (err) => {
                console.log(err.response.data.msg);
                return Promise.reject(this.$router.push('/login'));
            })
        },
        closeRoom(gameid) {
            this.loadingOrNot = false;
            if(gameid) {
                axios.post("/api/authorization").then(() => {
                    this.ws.send(JSON.stringify({
                        action: 'deleteRoom',
                        gameid
                    }));
                }, (err) => {
                    console.log(err.response.data.msg);
                    return Promise.reject(this.$router.push('/login'));
                })
            };
        },
        title(item) {
            return `${item.owner.toUpperCase()}'S ROOM`
        },
        dateTime(item) {
            return item.dtmCreated? new Date(+new Date(item.dtmCreated) + 8 * 3600 * 1000).toISOString().replace(/T/g, ' ').replace(/\.[\d]{3}Z/, ''):''
        },
        enterGame(gameid) {
            if(gameid) {
                axios.post("/api/autorization").then(() => {
                    console.log(gameid)
                    this.$router.push(`/game/${gameid}`);
                }, (err) => {
                    console.log(err.response.data.msg);
                    return Promise.reject(this.$router.push('/login'));
                });
            }
        }
    },
    beforeMount() {
        this.loadingOrNot = false;
        this.initWebsocket();
        this.updateRoomList('mount');
        this.heartBeat();
    },
    beforeRouteLeave(to, from ,next) {
        if(this.ws) {
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
.btn {
    button {
        display: flex;
        justify-content: center;
        align-items: center
    }
}
.title {
    text-transform: capitalize
}
.ant-list-item {
    height: 100px;
}
.ant-spin-container {
    height: 600px !important;
}
</style>

