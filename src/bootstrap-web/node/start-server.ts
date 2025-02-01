/**
 * @summary 🚀 启动服务器，配置 Koa 应用、静态资源访问和 HTTP 服务
 *
 * @param {NodeModule[] | Partial<IServerAppOpts>} arg1 - ⚙️ 可选模块数组或服务器配置选项，用于扩展默认配置
 * @return {Promise<http.Server>} - 🔧 返回 Promise，解析值为创建并启动的 http.Server 实例
 *
 * @description
 * 该函数创建一个 Koa 应用，并根据环境变量配置工作目录、扩展目录与扩展主机入口。
 * 默认配置包括超时阈值、静态资源白名单等，同时集成了 marketplace 默认配置（阿里云注册表）。
 * 根据传入参数更新进一步的配置后，利用 ServerApp 类启动 HTTP 服务器。
 * 若环境为 production，则加载预编译静态文件目录。函数监听错误并在正常启动后返回服务器实例。
 *
 * 时间复杂度：O(1) - 固定初始化操作
 * 空间复杂度：O(1) - 内存占用固定
 */
import * as path from 'path';                                        // 🔧 导入 Node.js 路径模块
import * as http from 'http';                                        // 🔧 导入内置 HTTP 模块以创建服务器
import Koa from 'koa';                                                // 🔧 导入 Koa 框架以创建 web 应用
import koaStatic from 'koa-static';                                   // 🔧 导入 Koa 静态资源中间件，用于服务静态文件
import { Deferred } from '@opensumi/ide-core-common';                 // 🔧 延迟对象，用于处理异步服务器启动结果
import { DEFAULT_ALIPAY_CLOUD_REGISTRY } from '@opensumi/ide-core-common/lib/const/application'; // 🔧 默认阿里云注册表配置参数
import { IServerAppOpts, ServerApp, NodeModule } from '@opensumi/ide-core-node'; // 🔧 服务器应用相关接口与类

export async function startServer(arg1: NodeModule[] | Partial<IServerAppOpts>) {
  // 创建 Koa 应用实例
  const app = new Koa();

  // 初始化 Deferred 对象：控制异步启动流程，延迟返回服务器实例
  const deferred = new Deferred<http.Server>();

  // 设置扩展模式环境变量为 'js'
  process.env.EXT_MODE = 'js';

  // 设置服务器监听端口，默认为 8000 🚀
  const port = process.env.IDE_SERVER_PORT || 8000;

  // ⚠️ 注意：根据环境变量配置工作目录路径，生产环境与开发环境使用不同的目录结构
  const workspaceDir = process.env.WORKSPACE_DIR || 
    (process.env.NODE_ENV === 'production'
      ? path.join(__dirname, '../../workspace')
      : path.join(__dirname, '../../../workspace'));

  // ⚠️ 注意：配置扩展目录，路径选择规则同上
  const extensionDir = process.env.EXTENSION_DIR || 
    (process.env.NODE_ENV === 'production'
      ? path.join(__dirname, '../../extensions')
      : path.join(__dirname, '../../../extensions'));

  // 设置扩展主机入口文件路径，根据环境选择不同的预编译资源路径
  const extensionHost = process.env.EXTENSION_HOST_ENTRY ||
    (process.env.NODE_ENV === 'production'
      ? path.join(__dirname, '..', '..', 'out/ext-host/index.js')
      : path.join(__dirname, '..', '..', '..', 'out/ext-host/index.js'));

  // 初始化服务器配置选项
  let opts: IServerAppOpts = {
    // 将 Koa 的中间件注册函数绑定到 opts 中
    use: app.use.bind(app),
    // 进程关闭等待时间阈值，5分钟（单位：毫秒）
    processCloseExitThreshold: 5 * 60 * 1000,
    // 终端 PTY 关闭等待时间阈值，5分钟（单位：毫秒）
    terminalPtyCloseThreshold: 5 * 60 * 1000,
    // 允许的静态资源请求来源，使用通配符表示全部允许
    staticAllowOrigin: '*',
    // 允许访问的静态文件目录：包含工作区、扩展目录及根目录
    staticAllowPath: [
      workspaceDir,
      extensionDir,
      '/',
    ],
    // 指定扩展主机入口文件路径
    extHost: extensionHost,
  };

  // 设置 marketplace 配置项，使用默认阿里云注册表配置参数 🔧
  opts.marketplace = {
    endpoint: DEFAULT_ALIPAY_CLOUD_REGISTRY.ENDPOINT,
    accountId: DEFAULT_ALIPAY_CLOUD_REGISTRY.ACCOUNT_ID,
    masterKey: DEFAULT_ALIPAY_CLOUD_REGISTRY.MASTER_KEY,
    showBuiltinExtensions: true,
  };

  // 根据传入参数更新配置选项
  if (Array.isArray(arg1)) {
    // 当 arg1 为模块数组时，将其作为 modulesInstances 添加到配置中
    opts = {
      ...opts,
      modulesInstances: arg1,
    };
  } else {
    // 否则，将 arg1 视为部分服务器配置选项并与默认配置合并
    opts = {
      ...opts,
      ...arg1,
    };
  }

  // 实例化服务器应用
  const serverApp = new ServerApp(opts);

  // 利用 Koa 应用生成 HTTP 服务器，该服务器回调处理所有请求
  const server = http.createServer(app.callback());

  // 若当前为生产环境，则静态服务预编译输出目录 🚀
  if (process.env.NODE_ENV === 'production') {
    app.use(koaStatic(path.join(__dirname, '../../out')));
  }

  // 异步启动服务器应用，确保所有中间件被正确加载
  await serverApp.start(server);

  // 注册错误事件监听器 ⚠️ 当服务器遇到错误时，通过 deferred.reject 终止加载流程
  server.on('error', (err) => {
    deferred.reject(err);
    console.error('Server error: ' + err.message);
    // 使用 setTimeout 延迟调用 process.exit，保证输出日志后退出
    setTimeout(process.exit, 0, 1);
  });

  // 启动服务器并监听指定端口，启动成功后解析 deferred
  server.listen(port, () => {
    console.log(`Server listen on port ${port}`);
    deferred.resolve(server);
  });

  // 返回一个 Promise，在服务器启动成功后解析为 HTTP Server 实例
  return deferred.promise;
}
