# tmcube

> 基于现代Web技术的高校教学管理系统后台项目

## 开发环境
- Node.js >= 8
- npm >= 5
- mongoDB >= 3.6

## yarn基本命令
```bash
yarn                    # 相当于 npm install
yarn add <module>       # 相当于 npm install <module> --save
yarn add <module> --dev # 相当于 npm install <module> --save-dev
yarn remove <module>    # 相当于 npm uninstall <module> --save
```

## 启动项目

``` bash
git clone https://github.com/baoanj/tmcube.git
cd tmcube

# install dependencies
yarn

# mail config
cp mail.config.example.js mail.config.js

# serve with hot reload at localhost:4000
npm start

# build for deploy
npm run build
```

## 技术栈
- Node.js
- Express
- Webpack
- ES6
