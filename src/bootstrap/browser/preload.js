// 该代码用于初始化 Electron 环境，设置与主进程的 IPC 通信，并配置相关的网络连接和环境变量。

const net = require('net'); // 引入 net 模块，用于创建网络连接
const os = require('os'); // 引入 os 模块，用于获取操作系统信息
const path = require('path'); // 引入 path 模块，用于处理文件路径

const { ipcRenderer } = require('electron'); // 从 Electron 中引入 ipcRenderer，用于与主进程进行通信

const electronEnv = {}; // 创建一个对象用于存储 Electron 环境变量

// 解析 URL 参数，获取窗口 ID 和 WebContents ID
const urlParams = new URLSearchParams(decodeURIComponent(window.location.search));
window.id = Number(urlParams.get('windowId')); // 获取当前窗口的 ID
const webContentsId = Number(urlParams.get('webContentsId')); // 获取当前 WebContents 的 ID

/**
 * 创建 RPC 网络连接
 * 
 * 功能描述：通过 IPC 获取 RPC 监听路径并创建网络连接
 * 
 * 返回值说明：返回一个 net.Socket 实例，用于与主进程进行 RPC 通信
 */
function createRPCNetConnection() {
  const rpcListenPath = ipcRenderer.sendSync('window-rpc-listen-path', electronEnv.currentWindowId); // 同步获取 RPC 监听路径
  return net.createConnection(rpcListenPath); // 创建并返回网络连接
}

/**
 * 创建网络连接
 * 
 * 功能描述：根据提供的连接路径创建网络连接
 * 
 * 参数说明：
 * - connectPath: string - 连接路径
 * 
 * 返回值说明：返回一个 net.Socket 实例，用于进行网络通信
 */
function createNetConnection(connectPath) {
  return net.createConnection(connectPath); // 创建并返回网络连接
}

// 设置 Electron 环境变量
electronEnv.ElectronIpcRenderer = ipcRenderer; // 将 ipcRenderer 赋值给 electronEnv
electronEnv.createNetConnection = createNetConnection; // 将 createNetConnection 赋值给 electronEnv
electronEnv.createRPCNetConnection = createRPCNetConnection; // 将 createRPCNetConnection 赋值给 electronEnv

// 获取操作系统信息
electronEnv.platform = os.platform(); // 获取操作系统平台
electronEnv.osRelease = os.release(); // 获取操作系统版本

// 设置其他环境变量
electronEnv.isElectronRenderer = true; // 标记当前为 Electron 渲染进程
electronEnv.BufferBridge = Buffer; // 赋值 Buffer
electronEnv.currentWindowId = window.id; // 当前窗口 ID
electronEnv.currentWebContentsId = webContentsId; // 当前 WebContents ID
electronEnv.monacoWorkerPath = path.join(__dirname, 'editor.worker.bundle.js'); // Monaco Worker 的路径

// 获取窗口元数据并解析
const metaData = JSON.parse(ipcRenderer.sendSync('window-metadata', electronEnv.currentWindowId)); // 同步获取窗口元数据
electronEnv.metadata = metaData; // 将元数据赋值给 electronEnv
process.env = Object.assign({}, process.env, metaData.env, { WORKSPACE_DIR: metaData.workspace }); // 合并环境变量

// 设置 WASM 文件路径
electronEnv.onigWasmPath = path.join(__dirname, '..', '..', '..', metaData.environment.isDev ? 'node_modules' : 'node_modules.asar.unpacked', 'vscode-oniguruma/release/onig.wasm'); // onig.wasm 文件路径
electronEnv.treeSitterWasmDirectoryPath = path.join(__dirname, '..', '..', '..', metaData.environment.isDev ? 'node_modules' : 'node_modules.asar.unpacked', '@opensumi/tree-sitter-wasm'); // tree-sitter.wasm 目录路径
electronEnv.appPath = metaData.appPath; // 应用程序路径
electronEnv.env = Object.assign({}, process.env); // 复制当前环境变量
electronEnv.webviewPreload = metaData.webview.webviewPreload; // Webview 预加载脚本
electronEnv.plainWebviewPreload = metaData.webview.plainWebviewPreload; // 普通 Webview 预加载脚本
electronEnv.env.EXTENSION_DIR = metaData.extensionDir[0]; // 扩展目录

global.electronEnv = electronEnv; // 将 electronEnv 赋值给全局对象
Object.assign(global, electronEnv); // 将 electronEnv 的属性合并到全局对象中

// 如果存在预加载脚本，则依次加载
if (metaData.preloads) {
  metaData.preloads.forEach((preload) => {
    require(preload); // 加载每个预加载脚本
  });
}
