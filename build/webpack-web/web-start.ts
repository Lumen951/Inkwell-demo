// 本文件用于启动多个开发进程，包括客户端、Web视图和服务器。
// 通过子进程执行命令，并实时打印输出信息。

import { exec } from 'child_process'; // 导入exec函数用于执行命令行指令
import path from 'path'; // 导入path模块用于处理文件路径

// 定义每个命令的启动函数
const commands = {
    // 🔧 配置项：客户端命令 一个前端开发服务器
    client: 'cross-env NODE_ENV=development WEBPACK_LOG_LEVEL=info webpack-dev-server --client-logging info --config ./build/webpack-web/webpack.browser.config.ts --progress --color',
    // 🔧 配置项：Web视图命令 嵌入在其他应用程序中的浏览器视图
    webview: 'cross-env NODE_ENV=development webpack-dev-server --config ./build/webpack-web/webpack.webview.config.ts --progress --color',
    // 🔧 配置项：服务器命令 启动后端服务器，处理API请求和其他服务器端逻辑
    server: 'cross-env NODE_ENV=development node -r ts-node/register -r tsconfig-paths/register src/bootstrap-web/node/index.ts'
};

/**
 * 启动子进程并打印输出
 * 
 * @param command {string} 要执行的命令
 * @param name {string} 进程名称，用于输出日志
 * 
 * @returns {void} 无返回值
 */
function startProcess(command: string, name: string): void {
    // 启动子进程，设置当前工作目录
    const child = exec(command, {cwd: path.resolve(__dirname, '../../')}, (error, stdout, stderr) => {
        // ⚠️ 注意事项：处理执行错误
        if (error) {
            console.error(`[${name}] Error: ${error.message}`);
            return;
        }

        // ⚠️ 注意事项：处理标准错误输出
        if (stderr) {
            console.error(`[${name}] stderr: ${stderr}`);
            return;
        }

        // 打印标准输出
        console.log(`[${name}] stdout: ${stdout}`);
    });

    // 监听子进程的标准输出
    child.stdout?.on('data', (data) => {
        console.log(`[${name}] ${data.toString()}`);
    });

    // 监听子进程的标准错误输出
    child.stderr?.on('data', (data) => {
        console.error(`[${name}] ${data.toString()}`);
    });
}

/**
 * 启动所有进程
 * 
 * @returns {void} 无返回值
 */
function startAll(): void {
    // 遍历命令对象，启动每个进程
    Object.entries(commands).forEach(([name, command]) => {
        startProcess(command, name);
    });
}

// 启动所有定义的进程
startAll();