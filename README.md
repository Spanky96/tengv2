## 安装

```bash
npm install
```

装好依赖运行

每日挑战

```bash
node challenge.js
```

话题战：

```bash
node topic.js
```

## 国内用户

装不了 package 的可以尝试使用 `npm install --registry=https://registry.npmmirror.com`
 

 获取T,
1. 先把代码里面的tokens.json移除。 否则会直接用t,不启动获取t的程序。
2. 命令启动index.js
↓
node index.js
1. 设置系统代理 ip: 127.0.0.1 端口6666
2. 关掉微信，设置微信代理。ip: 127.0.0.1 端口6666
3. 登录微信，打开游戏
4. 正常情况进入游戏之后，会获取到token，如果获取不到，退出程序，重复2~6步骤