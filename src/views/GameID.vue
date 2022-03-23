<template>
    <div class="m-auto w-56">
        <a-input placeholder="Enter the miner area code" v-model:value="code">
            <template #prefix>
                <GoldOutlined />
            </template>
        </a-input>
        <a-button type="primary" danger @click="enterGame" block>Enter</a-button>
    </div>
</template>
<script>
import { Input, Button } from 'ant-design-vue'
import { GoldOutlined } from '@ant-design/icons-vue'
import interceptor from '../api/interceptor'
import axios from 'axios'

export default {
    data() {
        return {
            code: null
        }
    },
    methods: {
        /**
         * 进入游戏
         * 检查游戏和玩家的状态，决定是否载入或者新开游戏
         */
        enterGame() {
            if(this.code) {
                interceptor().catch((err) => {
                    console.log(err.response.data.msg);
                    return Promise.reject(this.$router.push('/login'));
                }).then(() => {
                    return axios.post('/api/code', { code: this.code, username: localStorage.getItem('username') || '' })
                }).then(res => {
                    console.log(res.msg || '');
                }, err => {
                    if(err.msg) {
                        console.log(err.msg);
                    } else {
                        console.log(err.response.data.msg);
                    }
                    this.$router.push('/login');
                })
            }
        }
    },
    components: {
        GoldOutlined,
    }   
}
</script>
 