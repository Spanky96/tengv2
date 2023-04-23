const fs = require("fs");
process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = '0'
const mitmproxy = require('node-mitmproxy');


var token =  '';
const getToken = async () => {
  return new Promise((resolve) => {
    mitmproxy.createProxy({
      sslConnectInterceptor: (req, cltSocket, head) => true,
      requestInterceptor: (rO, req, rep, ssl, next) => {
        if (req.headers && req.headers.t) {
          token = req.headers.t;
          console.log('取到T值：' + token);
          fs.writeFileSync('./tokens.json', JSON.stringify([token]));
          resolve(token);
          next();
        } else {
          next();
        }
        next();
      },
      port: 6666,
      getCertSocketTimeout: 10 * 1000
    });
  })

}

const main = async () => {
  await getToken();
  console.log('任务结束，别忘了关掉系统代理哦~');
};

main();
