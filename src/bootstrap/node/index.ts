
/*************** 版本2：标准版 *****************/
/*
File: src/bootstrap/node/index.ts
功能描述：本模块用于启动 Node 环境下的服务器应用，配置所需模块、网络监听参数以及错误处理逻辑。

函数：startServer
  - 描述：初始化服务器选项，并启动服务器进行网络监听
  - 参数：无
  - 返回：Promise<void>，表示异步启动过程完成
*/

//// 标准版代码如下：
// import 语句保持与上方一致，此处省略重复部分，实际使用时请确保全文件一致引用。

// 注意：以下代码与精简版功能一致，仅注释更完整。
/*
async function startServer() {
  const opts: IServerAppOpts = {
    modules,                              // 加载功能模块
    webSocketHandler: [],                 // 空的WebSocket处理器数组
    marketplace: {
      showBuiltinExtensions: true,        // 显示内置扩展
      extensionDir: process.env.IDE_EXTENSIONS_PATH!, // 扩展存放目录
    },
  };

  const server = net.createServer();      // 创建TCP服务
  const serverApp = new ServerApp(opts);    // 实例化服务器应用
  await serverApp.start(server);            // 启动服务器

  // 设置错误监听，发生错误时延时退出进程
  server.on('error', () => {
    setTimeout(() => {
      process.exit(1);
    });
  });

  // 解析命令行参数获取监听路径
  const listenPath = mri(process.argv).listenPath;
  // 开始监听并通知父进程服务已就绪
  server.listen(listenPath, () => {
    process.send?.('ready');
  });
}
*/
  
// 为避免代码重复，建议将上方“精简版”的实现复制至此处使用。


/*************** 版本3：详细版 *****************/
/*
File: src/bootstrap/node/index.ts
🔧 文件功能：启动 Node 环境下的服务器服务，整合多模块构成完整功能，负责网络监听以及错误处理。
⚠️ 注意事项：确保环境变量 IDE_EXTENSIONS_PATH 正确配置；错误处理采用延时退出策略，便于监控重启。

函数：startServer
🚀 功能描述：初始化服务器配置（包括各功能模块和 marketplace 配置）、启动 ServerApp、处理错误并监听指定路径。
@param {void} 无参数
@return {Promise<void>} 返回一个Promise对象，异步启动完成后无返回值

核心逻辑解析：
┌─────────────────────┬─────────────────────────────────────────────────────┐
│ 步骤                │ 说明及代码实现                                       │
├─────────────────────┼─────────────────────────────────────────────────────┤
│ 配置服务器选项      │ 构造 opts 对象，整合 modules、webSocketHandler 与 marketplace 配置 │
│ 创建 TCP 服务器     │ 调用 net.createServer() 建立网络服务                  │
│ 启动 ServerApp    │ 实例化 ServerApp 传入 opts，并调用其 start 方法启动服务  │
│ 错误处理            │ 绑定 error 事件，使用 setTimeout 延时退出当前进程以便重启 │
│ 网络监听            │ 解析命令行参数 listenPath，并调用 server.listen 开始监听  │
└─────────────────────┴─────────────────────────────────────────────────────┘
*/

//// 详细版代码如下：
import '@/core/common/asar'
import * as net from 'node:net';
import mri from 'mri'
import { IServerAppOpts, ServerApp, ConstructorOf, NodeModule } from '@opensumi/ide-core-node';
import { ServerCommonModule } from '@opensumi/ide-core-node';
import { FileServiceModule } from '@opensumi/ide-file-service/lib/node';
import { ProcessModule } from '@opensumi/ide-process/lib/node';
import { FileSearchModule } from '@opensumi/ide-file-search/lib/node';
import { SearchModule } from '@opensumi/ide-search/lib/node';
import { TerminalNodePtyModule } from '@opensumi/ide-terminal-next/lib/node';
import { terminalPreferenceSchema } from '@opensumi/ide-terminal-next/lib/common/preference'
import { LogServiceModule } from '@opensumi/ide-logs/lib/node';
import { ExtensionModule } from '@opensumi/ide-extension/lib/node';
import { FileSchemeNodeModule } from '@opensumi/ide-file-scheme/lib/node';
import { AddonsModule } from '@opensumi/ide-addons/lib/node';
import { OpenVsxExtensionManagerModule } from '@opensumi/ide-extension-manager/lib/node';
import { AINativeModule } from '@opensumi/ide-ai-native/lib/node';
import { CoreNodeModule } from '@/core/node';
import { LoggerModule } from '@/logger/node'
import { AIServiceModule } from '@/ai/node';

const modules: ConstructorOf<NodeModule>[] = [
  ServerCommonModule,           // 核心服务器功能模块
  LogServiceModule,             // 日志服务模块
  FileServiceModule,            // 文件服务模块
  ProcessModule,                // 进程管理模块
  FileSearchModule,             // 文件搜索模块
  SearchModule,                 // 搜索服务模块
  TerminalNodePtyModule,        // 终端伪终端支持模块
  ExtensionModule,              // 扩展加载模块
  OpenVsxExtensionManagerModule, // Open VSX扩展管理模块
  FileSchemeNodeModule,         // 文件协议处理模块
  AddonsModule,                 // 插件扩展模块
  CoreNodeModule,               // 核心 Node 功能模块
  LoggerModule,               // 日志记录模块
  // ai 功能模块
  AINativeModule,
  AIServiceModule,
];

startServer();

/**
 * 🚀 启动服务器服务
 *
 * 1. 构造服务器配置选项 opts，包含各功能模块、空的 WebSocket 处理器及 marketplace 配置。
 * 2. 通过 net.createServer() 建立 TCP 服务器，并实例化 ServerApp 启动服务。
 * 3. 绑定 error 事件，发生异常时延时调用 process.exit(1) 以促使监控工具进行重启。
 * 4. 利用 mri 模块解析 process.argv 中指定的 listenPath，启动监听，
 *    服务就绪后通过 process.send 通知父进程。
 *
 * @function startServer
 * @param {void} 无参数
 * @returns {Promise<void>} 返回 Promise 对象，异步启动过程完成后无返回值
 */
async function startServer() {
  // 构建服务器选项，集成所有功能模块及 marketplace 设置
  const opts: IServerAppOpts = {
    modules,                              // 各功能模块数组
    webSocketHandler: [],                 // 暂无 WebSocket 处理器
    marketplace: {                        // marketplace 配置项
      showBuiltinExtensions: true,        // 显示内置扩展
      extensionDir: process.env.IDE_EXTENSIONS_PATH!, // 扩展目录，从环境变量读取
    },
  };

  // 创建 TCP 服务实例，用于接收网络连接
  const server = net.createServer();

  // 实例化 ServerApp，并启动服务
  const serverApp = new ServerApp(opts);
  await serverApp.start(server);

  // 错误监听：捕获服务器错误，延时调用退出，为监控进程提供重启机会
  server.on('error', () => {
    setTimeout(() => {
      process.exit(1);
    });
  });

  // 解析命令行参数，获取监听路径 listenPath
  const listenPath = mri(process.argv).listenPath;

  // 启动监听，并在服务就绪后通过 process.send 通知父进程
  server.listen(listenPath, () => {
    process.send?.('ready');
  });
}

