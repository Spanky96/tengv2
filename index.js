const { resolve } = require("path");
const { delay } = require("./utils/helpers");
const fs = require("fs");
const spawn = require("child_process").spawn;
process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = '0'
const mitmproxy = require('node-mitmproxy');


const spawnSolverProcess = (type, id, token) => {
  return new Promise((resolve) => {
    const solverProcess = spawn("node", [`${type}.js`, "-t", token]);
    solverProcess.stdout.on("data", (data) => {
      const outputs = data
        .toString()
        .split(/\r?\n/)
        .filter((e) => e);

      for (line of outputs) {
        if (line === ">>>CLEAR<<<") {
          console.clear();
          console.log(
            "正在执行",
            id,
            type === "topic" ? "每日话题" : "每日挑战"
          );
          continue;
        } else if (line === ">>>COMPLETED<<<") {
          console.clear();
          console.log(
            id,
            type === "topic" ? "每日话题" : "每日挑战",
            "执行完毕"
          );
          continue;
        }
        console.log(line);
      }
    });

    solverProcess.stderr.on("data", (data) => {
      console.log(data.toString());
    });

    solverProcess.on("exit", () => {
      console.log(id, type === "topic" ? "每日话题" : "每日挑战", "执行完毕");
      resolve();
    });
  });
};

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
  var tokens = [];
  try {
    console.log("正在读取 tokens.json");
    tokens = require("./tokens.json");
  } catch(e) {
    tokens = [];
  }
   
  if (!tokens.length) {
    console.log("没有设置TOKEN, 开始捕捉token");
    var t = await getToken();
    console.log("继续进入主线");
    tokens = [t];
  }

  for (id in tokens) {
    console.log("=========================");
    console.log("开始", id, "的每日挑战");
    console.log("=========================");
    await spawnSolverProcess("challenge", id, tokens[id]);
    await delay(3);

    console.log("=========================");
    console.log("开始", id, "的每日话题");
    console.log("=========================");
    await spawnSolverProcess("topic", id, tokens[id]);
    await delay(3);
  }
};

main();
