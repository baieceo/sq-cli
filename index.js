#!/usr/bin/env node

const chalk = require('chalk');
const clear = require('clear');
const figlet = require('figlet');
const files = require('./lib/files.js');
const gitlab = require('./lib/gitlab.js');
const repo = require('./lib/repo.js');
const pkg = require('./package.json');
const minimist = require('minimist');
const argv = minimist(process.argv.slice(2));
const inquirer = require('./lib/inquirer');

// 清除命令行
clear();

// 输出Logo
console.log(chalk.yellow(figlet.textSync(pkg.name, { horizontalLayout: 'full' })));

// 判断是否存在.git文件
if (files.directoryExists('.git')) {
    console.log(chalk.red('已经存在一个本地仓库!'));

    process.exit();
}

// 获取gitlab token
const getGitlabToken = async() => {
    // 从本地获取token记录
    let token = gitlab.getStoredGitlabToken();

    if (token) {
        return token;
    }

    // 通过账号、密码获取token
    token = await gitlab.getPersonalAccessToken();

    return token;
};

const createProject = async() => {
    try {
        // 获取token
        const token = await getGitlabToken();

        gitlab.gitlabAuth(token);

        // 创建远程仓库
        const repoRes = await repo.createRemoteRepo();

        // 创建 .gitignore
        // await repo.createGitignore();

        // 初始化本地仓库并推送到远端
        await repo.setupRepo(repoRes);

        console.log(chalk.green(`完成创建! 仓库地址：${repoRes.web_url}`));
    } catch (err) {
        if (err) {
            switch (err.status) {
                case 401:
                    console.log(chalk.red("登陆失败，请提供正确的登陆信息"));
                    break;
                case 422:
                    console.log(chalk.red('远端已存在同名仓库'));
                    break;
                default:
                    console.log(chalk.red(err));
            }
        }
    }
}

const run = async() => {
    if (argv._ && !argv._[0]) {
        const todoAnswer = await inquirer.askTodo();

        if (todoAnswer.todo === 'create') {
            return createProject();
        }
    } else if (argv._ && argv._[0] && argv._[0] === 'create') {
        return createProject();
    } else {
        console.log(chalk.red('创建项目请输入：sq-cli create'));
    }
};

run();