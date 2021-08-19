const fs = require('fs');
const path = require('path');

const deleteFolder = (path) => {
    if (fs.existsSync(path)) {
        const files = fs.readdirSync(path);

        files.forEach((file) => {
            const curPath = `${path}/${file}`;

            if (fs.statSync(curPath).isDirectory()) {
                deleteFolder(curPath);
            } else {
                fs.unlinkSync(curPath);
            }
        });

        fs.rmdirSync(path);
    }
};

module.exports = {
    // 获取目录名称
    getCurrentDirectoryBase: () => {
        return path.basename(process.cwd());
    },

    // 判断目录是否存在
    directoryExists: (filePath) => {
        return fs.existsSync(filePath);
    },

    deleteFolder,

    // 替换文件夹内文件字符串
    replaceDirectoryFilesString(path, oldStr, newStr) {
        try {
            const current_path = fs.realpathSync(path); // 获取当前路径
            const fileList = [];
            const reg = new RegExp(oldStr, 'g'); // 新建替换正则

            if (oldStr == null || newStr == null) {
                throw new Error('请输入原始字符串/替换字符串');
            }

            // 获取当前文件夹内所有指定格式的文件的绝对路径并缓存起来
            function walk(path) {
                if (fs.statSync(path).isDirectory()) {
                    const dirList = fs.readdirSync(path);

                    dirList.forEach(function(item) {
                        const _path = path + '/' + item;

                        if (fs.statSync(_path).isDirectory()) {
                            walk(_path);
                        } else {
                            fileList.push(_path);
                        }
                    });
                } else {
                    fileList.push(path);
                }
            }

            walk(current_path);

            const files = fileList;

            for (let i = 0; i < files.length; i++) {
                let file = files[i];

                (function(_file) {
                    let data = fs.readFileSync(_file);

                    data = data + '';
                    data = data.replace(reg, newStr);

                    fs.writeFileSync(_file, data);
                })(file);
            }

            return Promise.resolve(files);
        } catch (e) {
            return Promise.reject(e);
        }
    },
};