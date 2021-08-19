const CLI = require('clui');
const fs = require('fs');
const git = require('simple-git/promise')();
const Spinner = CLI.Spinner;
const touch = require('touch');
const _ = require('lodash');
const files = require('./files');
const path = require('path');

const inquirer = require('./inquirer');
const gitlab = require('./gitlab');
const childProcess = require('./childProcess.js');

module.exports = {
    // 创建远程仓库
    createRemoteRepo: async() => {
        const sfeGitInstance = gitlab.getSfeInstance();
        const answers = await inquirer.askRepoDetails();
        const { projectType } = answers;
        const projectGroupsMap = {
            'sam-components': {
                id: 401,
                name: 'sam-components',
                ssl_url: 'git@inside-git.01zhuanche.com:sam-components/sam-template.git',
                cloneName: 'sam-template',
                replaceNameList: [
                    './dist',
                    './src',
                    './index.html',
                    './package.json',
                    './README.MD',
                    './rollup.config.js'
                ]
            }
        }
        const data = {
            name: answers.name,
            // path: projectGroupsMap[projectType].name,
            description: answers.description,
            public: answers.public === 'public',
            namespace_id: projectGroupsMap[projectType].id
        };

        const status = new Spinner('创建远程仓库中...');

        status.start();

        try {
            const response = await sfeGitInstance.post('/projects', data);
            let message;

            // 创建仓库发生错误
            if (response.message && response.message.name && response.message.name.length) {
                message = response.message.name.pop();
            }

            if (message && message === 'has already been taken') {
                throw new Error(`仓库名称（${answers.name}）已存在，请重新创建！`);
            } else if (message) {
                throw new Error(message);
            }

            return {
                ...response,
                template: projectGroupsMap[projectType]
            };
        } finally {
            status.stop();
        }
    },

    // 创建git ignore
    createGitignore: async() => {
        const fileList = _.without(fs.readdirSync('.'), '.git', '.gitignore');

        if (fileList.length) {
            const answers = await inquirer.askIgnoreFiles(fileList);

            if (answers.ignore.length) {
                // 写入信息
                fs.writeFileSync('.gitignore', answers.ignore.join('\n'));
            } else {
                // 创建文件
                touch('.gitignore');
            }
        } else {
            // 创建文件
            touch('.gitignore');
        }
    },

    // 设置
    setupRepo: async(repo) => {
        const status = new Spinner('初始化本地仓库并推送到远端仓库中...');

        status.start();

        const repoPath = `./${repo.name}`;

        if (files.directoryExists(repoPath)) {
            await files.deleteFolder(repoPath);
        }

        try {
            await git.clone(repo.template.ssl_url, repoPath);
            // await git.add('.gitignore');

            await childProcess.execSync([
                `git clone ${repo.template.ssl_url}`,
                'git remote rename origin old-origin',
                `git remote add origin ${repo.ssh_url_to_repo}`,
                'git push -u origin --all',
                'git push -u origin --tags',
            ], repoPath);

            await files.deleteFolder(`./${repo.name}/${repo.template.cloneName}`);

            if (repo.template.replaceNameList && repo.template.replaceNameList.length) {
                await Promise.all(repo.template.replaceNameList.map(_path => files.replaceDirectoryFilesString(path.join(`./${repo.name}`, _path), repo.template.cloneName, repo.name)));
            }
        } finally {
            status.stop();
        }
    },
}