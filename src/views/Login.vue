<template>
    <div class="m-auto w-56">
        <a-input v-model:value="username" placeholder="用户名">
            <template #prefix>
                <UserOutlined />
            </template>
        </a-input>
        <a-input-password placeholder="密码" v-model:value="password">
            <template #prefix>
                <LockOutlined />
            </template>
        </a-input-password>
        <a-button type="primary" @click="login" block>Login</a-button>
        <!-- <a-button type="primary" @click="increment" block>increment</a-button> -->
    </div>
</template>
<script>
/**
 * antd 绑定input时要用v-model:value=""
 * ElementUI或者Vue用v-model=""即可
 */
import { Input, Button } from 'ant-design-vue'
import { UserOutlined, LockOutlined } from '@ant-design/icons-vue'
import axios from 'axios'
import Faker from 'faker'
import { mapState, mapMutations } from 'vuex'

import myaxios from '../api/axios'

export default {
    data() {
        return { 
            username: '',
            password: '',
            click: 0,
            axios: null,
        }
    },
    methods: {
        ...mapMutations([
            'update'
        ]),
        login() {
            console.log(this.username, this.password);
            axios.post("/api/login", {
                    guid: Faker.datatype.uuid,
                    username: this.username,
                    password: this.password
                }
            ).then(res => {
                if(res.status === 200) {
                    const data = res.data;
                    if(data.code === 200) {
                        localStorage.setItem('token', `Bearer ${data.token}`);
                        localStorage.setItem('username', this.username);
                        // 登录后更新vuex里记录的用户名
                        this.update({
                            key: 'username', 
                            value: this.username
                        });
                        this.$router.push("/room");
                    } else {
                        console.log(data.msg);
                    }
                }
            }, err => console.log(err));
        },
        // increment() {
        //     myaxios.post('/api/login')
        // }
    },
    components: {
        UserOutlined,
        LockOutlined
    },
    mounted() {
        // this.axios = axios;
        // this.axios.interceptors.request.use(config => {
        //     config.headers.Authorization = (() => this.click)();
        //     return config;
        // // })
        // localStorage.setItem('mytoken', 'token');
    }
}
</script>

