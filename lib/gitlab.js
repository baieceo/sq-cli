const CLI = require('clui');
const Configstore = require('configstore');
const gitlab = require('node-gitlab');
const inquirer = require('./inquirer.js');
const pkg = require('../package.json');

const Spinner = CLI.Spinner;
// 初始化本地的存储配置
const conf = new Configstore(pkg.name);
const gitlabHost = 'inside-git.01zhuanche.com';
const sfeGitlab = require('sfe-gitlab');

// 模块内部的单例
let gitClient;
let sfeGitClient;

// conf.delete('gitlab.token');

// 验证gitlab私有令牌
async function authGitlabPrivateToken(privateToken) {
    try {
        const client = sfeGitlab.create({ privateToken });
        const projects = await client.get('/projects');

        if (typeof projects === 'object' && projects.message) {
            throw new Error(projects.message);
        }
    } catch (e) {
        throw e;
    }
}

function createBasicAuth({ on2Fa }) {
    return () => {
        return on2Fa();
    };
}

module.exports = {
    // 获取octokit实例
    getInstance: () => {
        return gitClient;
    },

    // 获取octokit实例
    getSfeInstance: () => {
        return sfeGitClient;
    },

    // 获取本地token
    getStoredGitlabToken: () => {
        return conf.get('gitlab.token');
    },

    // 通过个人账号信息获取token
    getPersonalAccessToken: async() => {
        const credentials = await inquirer.askGitlabCredentials();

        const status = new Spinner('验证身份中，请等待...');

        status.start();

        const auth = createBasicAuth({
            privateToken: credentials.privateToken,
            async on2Fa() {
                status.stop();

                await authGitlabPrivateToken(credentials.privateToken);

                status.start();

                return {
                    token: credentials.privateToken,
                };
            },
        });

        try {
            const res = await auth();

            if (res.token) {
                conf.set('gitlab.token', res.token);

                return res.token;
            } else {
                throw new Error('获取GitLab token失败');
            }
        } finally {
            status.stop();
        }
    },

    // 通过token登陆
    gitlabAuth: (token) => {
        gitClient = gitlab.create({
            api: `https://${gitlabHost}/api/v4`,
            privateToken: token,
        });

        sfeGitClient = sfeGitlab.create({ privateToken: token, host: gitlabHost });
    },
};