const readline = require("readline");
const protobufjs = require("protobufjs");
const path = require("path");
const fs = require("fs");

function delay(sec) {
    return new Promise(function (resolve) {
        setTimeout(function () {
            resolve();
        }, sec * 1000);
    });
}

function getRandom(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min) + min); // The maximum is exclusive and the minimum is inclusive
}

function prompt(userPrompt) {
    return new Promise((resolve) => {
        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout,
        });

        rl.question(userPrompt, (token) => {
            resolve(token);
            rl.close();
        });
    });
}

function flattenMapData(map) {
    let flattened = [];

    for (idx in map.levelData) {
        flattened = [...flattened, ...map.levelData[idx]];
    }

    return flattened;
}

function buildMatchPlayInfo(map, solution, gameType = 3) {
    let flattened = flattenMapData(map);
    let averageDelta = Math.ceil((210 * 1000) / (solution.length - 1))
    const stepInfoList = solution.map((index, i) => {
        let time = index < 0 ? getRandom(600, 800) : getRandom(averageDelta - 200, averageDelta + 200);
        return {
            chessIndex: index,
            timeTag: index >= 0 ? flattened[index].type : index,
            deltaTime: i == 0 ? 0 : time
        };
    });
    return {
        gameType,
        stepInfoList,
    };
}

function matchPlayInfoToStr(map, solution, isTopic = false) {
    return new Promise((resolve) => {
        protobufjs.load(path.join(__dirname, "yang.proto"), (_, root) => {
            const MatchPlayInfo = root.lookupType("yang.MatchPlayInfo");
            const matchPlayInfo = buildMatchPlayInfo(map, solution, isTopic ? 6 : 3);
            fs.writeFileSync("cache/matchPlayInfo.json", JSON.stringify(matchPlayInfo));
            const buf = MatchPlayInfo.encode(matchPlayInfo).finish();
            const b64 = Buffer.from(buf).toString("base64");
            let rankTime = 0, waitTime = 0;
            matchPlayInfo.stepInfoList.forEach(function (step) {
                rankTime += step.deltaTime;
                waitTime += step.deltaTime;
                if (step.timeTag < 0) {
                    console.log("使用道具", step.timeTag, "减" + Math.ceil(step.deltaTime / 1000) + "秒")
                }
            })
            rankTime = Math.floor( rankTime / 1000) + 1;
            waitTime = Math.floor( waitTime / 1000) + 2;
            resolve({b64, rankTime, waitTime});
        });
    });
}

function MapInfoToStr(data) {
    return new Promise((resolve) => {
        protobufjs.load(path.join(__dirname, "map.proto"), (_, root) => {
            const GameMap = root.lookupType("map.GameMap");
            let mapData = GameMap.decode(data.slice(21))
            let l = {};
            for (const i in mapData.levelData) {
                let nodeList = mapData.levelData[i].node
                for (let j = 0; j < nodeList.length; j++) {
                    if (!nodeList[j].type) nodeList[j].type = 0;
                    if (!nodeList[j].rolNum) nodeList[j].rolNum = 0;
                    if (!nodeList[j].rowNum) nodeList[j].rowNum = 0;
                    if (!nodeList[j].layerNum) nodeList[j].layerNum = 0;
                    if (!nodeList[j].moldType) nodeList[j].moldType = 0;
                }
                l[i] = nodeList;
            }
            let map = Object.assign(Object.assign({}, mapData), {
                levelData: l
            });
            resolve(map);
        });
    });
}

const getSolverMode = (issort, percent) => {
    if (issort !== "true" && issort !== "reverse" && percent === 0.85) {
        return "普通模式";
    } else if (issort == "reverse" && percent == 0.85) {
        return "高层优先模式";
    } else if (issort != "true" && issort != "reverse" && percent == 0) {
        return "优先移除两张相同类型的手牌模式";
    } else if (issort == "reverse" && percent == 0) {
        return "高层优先且优先移除两张相同类型的手牌模式";
    } else {
        return "自定义模式";
    }
};

const parseToken = (token) => {
    return JSON.parse(Buffer.from(token.split(".")[1], "base64").toString());
};

const getExpirationDateFromToken = (token) => {
    const {exp} = parseToken(token);
    const date = new Date(+exp * 1000);

    return date.toLocaleString();
};

module.exports = {
    delay,
    getRandom,
    prompt,
    matchPlayInfoToStr,
    MapInfoToStr,
    getSolverMode,
    getExpirationDateFromToken,
    flattenMapData,
};
