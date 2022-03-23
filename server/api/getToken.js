/**
 * JWT 授权，返回生成和解密token的方法
 */
const jwt = require('jsonwebtoken');
const secret = 'dwarf-minder';

const token = {
    /**
     * info - 待加密的信息
     */
    addToken: (info) => {
        const token = jwt.sign({
            guid: info.guid,
            username: info.username,
            password: info.password
        }, secret, {
            expiresIn: 15
        });
        return token;
    },
    /**
     * token - 待解密的token
     */
    decryptToken: (token) => {
        let decrypted = '';
        if(token) {
            let trueToken = token.split(" ")[1];
            decrypted = jwt.decode(trueToken, secret);
        }
        return decrypted;
    },
    verify: (token) => {
        try {
            return jwt.verify(token, secret);
        } catch (error) {
            console.log(error);
            return false;
        }
    }
}

module.exports = token;