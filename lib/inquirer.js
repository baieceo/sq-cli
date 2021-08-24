const inquirer = require('inquirer');

module.exports = {
    // 询问需要做什么
    askTodo: () => {
        const questions = [{
            type: 'list',
            name: 'todo',
            message: '选择命令:',
            choices: ['create'],
            default: 'create'
        }, ];
        return inquirer.prompt(questions);
    },

    // 询问git账号信息
    askGitlabCredentials: () => {
        const questions = [{
            name: 'privateToken',
            type: 'input',
            message: `请输入令牌 https://inside-git.01zhuanche.com/profile/personal_access_tokens`,
            validate: function(value) {
                if (value.length) {
                    return true;
                } else {
                    return '请输入你的Gitlab私有令牌.';
                }
            },
        }, ];

        return inquirer.prompt(questions);
    },

    // 询问仓库详细信息
    askRepoDetails: () => {
        // const argv = require('minimist')(process.argv.slice(2));

        const questions = [{
                type: 'list',
                name: 'projectType',
                message: '项目类型:',
                choices: ['sam-components'],
                default: 'sam-components',
                validate: function(value) {
                    if (value.length) {
                        return true;
                    } else {
                        return '请选择项目类型';
                    }
                },
            }, {
                type: 'input',
                name: 'name',
                message: '仓库名称:',
                validate: function(value, { projectType }) {
                    const repoNameReg = /^sam-(base|func|biz)-[0-9a-zA-Z\-]+$/;

                    if (!value.length) {
                        return '请输入仓库名称';
                    } else if (projectType === 'sam-components' && !repoNameReg.test(value)) {
                        throw new Error('仓库名称无效：sam-[base|func|biz]-[name]');
                    } else {
                        return true;
                    }
                },
            },
            {
                type: 'input',
                name: 'description',
                // default: argv._[1] || null,
                message: '仓库描述:',
                validate: function(value) {
                    if (value.length) {
                        return true;
                    } else {
                        return '请输入仓库描述';
                    }
                },
            },
            {
                type: 'list',
                name: 'visibility',
                message: '是否公有:',
                choices: ['public', 'private'],
                default: 'public',
            },
        ];

        return inquirer.prompt(questions);
    },

    // 选择需要忽略的文件
    askIgnoreFiles: (fileList) => {
        const questions = [{
            type: 'checkbox',
            name: 'ignore',
            message: '忽略文件:',
            choices: fileList,
            default: ['node_modules', 'bower_components'],
        }, ];
        return inquirer.prompt(questions);
    },
};