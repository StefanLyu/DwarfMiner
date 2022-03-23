const Koa = require('koa');
// node 中间件，把post的数据转为json格式
const bodyParser = require('koa-bodyparser');
// websocket 支持全双工，长连接
const websockify = require('koa-websocket');
// node 中间件，允许跨域
const cors = require('koa-cors');

const router = require('./router');

const wsrouter = require('./wsrouter');

const app = websockify(new Koa());


// 使用中间件
app.use(bodyParser());
app.use(cors({
    origin: "http://localhost:8080"
}))

// 注册http路由
app.use(router.routes());

// 注册websocket路由
// ctx 是websocket的object
app.ws.use(wsrouter.routes());

// 侦听端口
app.listen(5000);

console.log('app is running on 5000')