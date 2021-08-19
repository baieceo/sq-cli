const childProcess = require('child_process');

module.exports = {
    execSync: async(cmds, path) => {
        return await Promise.all(
            cmds.map((cmd) => childProcess.execSync(cmd, { cwd: path }))
        );
    },
};