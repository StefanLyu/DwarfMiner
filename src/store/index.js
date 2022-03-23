import { createStore } from 'vuex'

const state = () => ({
    username: '',
    gameid: '',
    handCards: '',
    gameCards: '',
    owner: ''
})

const mutations = {
    update (state, payload) {
        state[payload.key] = payload.value;
    }
}

export default createStore({
    state,
    mutations
})
