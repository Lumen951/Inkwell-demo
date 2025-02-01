// 该文件定义了一个Webpack插件，用于在Electron应用程序中处理Webpack编译过程中的日志记录和管理。它包括一个日志插件类和一个主插件类，后者负责编译不同进程的代码、启动开发服务器以及处理进程退出事件。

// 导入http模块，用于创建HTTP服务器
import http from 'http';
// 导入path模块，用于处理文件和目录路径
import path from 'path';

// 从@electron-forge/plugin-base导入命名钩子和插件基类
import { namedHookWithTaskFn, PluginBase } from '@electron-forge/plugin-base';
// 从@electron-forge/shared-types导入多钩子映射和启动结果类型
import { ForgeMultiHookMap, StartResult } from '@electron-forge/shared-types';
// 从@electron-forge/web-multi-logger导入Logger和Tab类
import Logger, { Tab } from '@electron-forge/web-multi-logger';
// 导入chalk库，用于控制台输出的颜色
import chalk from 'chalk';
// 导入debug库，用于调试信息的输出
import debug from 'debug';
// 导入fs/promises模块，用于文件系统操作
import fs from 'fs/promises';
// 从listr2导入预设计时器
import { PRESET_TIMER } from 'listr2';
// 导入webpack及其相关类型
import webpack, { Configuration, Watching, Compiler } from 'webpack';
// 导入webpack-dev-server，用于开发环境的服务器
import WebpackDevServer from 'webpack-dev-server';

// 创建调试实例
const d = debug('electron-forge:plugin:webpack');
// 默认日志端口
const DEFAULT_LOGGER_PORT = 9000;

// 定义WebpackToJsonOptions类型，表示webpack.Stats['toJson']方法的参数
type WebpackToJsonOptions = Parameters<webpack.Stats['toJson']>[0];

// 插件名称
const pluginName = 'ElectronForgeLogging';

// 日志插件类
class LoggingPlugin {
  tab: Tab; // 日志标签

  // 构造函数，初始化日志标签
  constructor(tab: Tab) {
    this.tab = tab; // 设置日志标签
  }

  // 应用插件到webpack编译器
  apply(compiler: Compiler): void {
    // 当编译完成时，记录编译统计信息
    compiler.hooks.done.tap(pluginName, (stats) => {
      if (stats) {
        this.tab.log(
          stats.toString({
            colors: true, // 启用颜色输出
          })
        );
      }
    });
    // 当编译失败时，记录错误信息
    compiler.hooks.failed.tap(pluginName, (err) => this.tab.log(err.message));
    // 记录基础设施日志
    compiler.hooks.infrastructureLog.tap(pluginName, (name: string, _type: string, args: string[]) => {
      this.tab.log(`${name} - ${args.join(' ')}\n`); // 记录基础设施日志信息
      return true; // 返回true以继续处理
    });
  }
}

// Webpack插件配置接口
export interface WebpackPluginConfig {
  jsonStats?: boolean; // 是否生成JSON统计信息
  loggerPort?: number; // 日志端口
}

// Webpack插件类
export class WebpackPlugin extends PluginBase<WebpackPluginConfig> {
  name = 'webpack'; // 插件名称

  private isProd = false; // 是否为生产模式

  private baseDir!: string; // 基础目录

  private watchers: Watching[] = []; // 监视器数组

  private servers: http.Server[] = []; // HTTP服务器数组

  private loggers: Logger[] = []; // 日志记录器数组

  private loggerPort = DEFAULT_LOGGER_PORT; // 日志端口

  private alreadyStarted = false; // 是否已启动

  // 获取当前模式（生产或开发）
  get mode() {
    return this.isProd ? 'production' : 'development'; // 返回当前模式
  }

  // 构造函数，初始化插件配置
  constructor(c: WebpackPluginConfig) {
    super(c); // 调用父类构造函数

    // 如果提供了loggerPort，则验证其有效性
    if (c.loggerPort) {
      if (this.isValidPort(c.loggerPort)) {
        this.loggerPort = c.loggerPort; // 设置日志端口
      }
    }
  }

  // 初始化方法，设置基础目录并挂载进程事件
  init = (dir: string): void => {
    this.baseDir = path.resolve(dir, 'out'); // 解析输出目录

    d('hooking process events'); // 调试信息
    // 处理进程退出事件
    process.on('exit', (_code) => this.exitHandler({ cleanup: true })); // 处理进程退出
    // 处理SIGINT信号
    process.on('SIGINT' as NodeJS.Signals, (_signal) => this.exitHandler({ exit: true })); // 处理SIGINT信号
  };

  // 启动逻辑，编译各个进程的代码
  startLogic = async (): Promise<StartResult> => {
    if (this.alreadyStarted) return false; // 如果已启动则返回false
    this.alreadyStarted = true; // 标记为已启动

    // 删除基础目录
    await fs.rm(this.baseDir, { recursive: true, force: true }); // 删除输出目录

    const logger = new Logger(this.loggerPort); // 创建日志记录器
    this.loggers.push(logger); // 添加到日志记录器数组
    await logger.start(); // 启动日志记录器

    return {
      tasks: [
        {
          title: 'Compiling main process code', // 任务标题
          task: async () => {
            const tab = logger.createTab('Main Process'); // 创建主进程标签
            await this.compile(mainConfig, 'main', 'main', true, tab); // 编译主进程代码
          },
          rendererOptions: {
            timer: { ...PRESET_TIMER }, // 渲染选项
          },
        },
        {
          title: 'Compiling node process code', // 任务标题
          task: async () => {
            const tab = logger.createTab('Node Process'); // 创建节点进程标签
            await this.compile(nodeConfig, 'node', 'node', true, tab); // 编译节点进程代码
          },
          rendererOptions: {
            timer: { ...PRESET_TIMER }, // 渲染选项
          },
        },
        {
          title: 'Compiling ext host code', // 任务标题
          task: async () => {
            const tab = logger.createTab('Ext Host Process'); // 创建扩展主机标签
            await this.compile(extHostConfig, 'ext-host', 'ext-host', true, tab); // 编译扩展主机代码
          },
          rendererOptions: {
            timer: { ...PRESET_TIMER }, // 渲染选项
          },
        },
        {
          title: 'Compiling worker host code', // 任务标题
          task: async () => {
            const tab = logger.createTab('Worker Host'); // 创建工作主机标签
            await this.compile(workerHostConfig, 'ext-host', 'worker-host', false, tab); // 编译工作主机代码
          },
          rendererOptions: {
            timer: { ...PRESET_TIMER }, // 渲染选项
          },
        },
        {
          title: 'Compiling webview process code', // 任务标题
          task: async () => {
            const tab = logger.createTab('Webview Process'); // 创建Webview进程标签
            await this.compile(webviewConfig, 'webview', 'webview', false, tab); // 编译Webview进程代码
          },
          rendererOptions: {
            timer: { ...PRESET_TIMER }, // 渲染选项
          },
        },
        {
          title: 'Launching dev servers for renderer process code', // 任务标题
          task: async (_, task) => {
            const tab = logger.createTab('Render Process'); // 创建渲染进程标签
            await this.launchRendererDevServers(tab); // 启动渲染进程的开发服务器
            task.output = `Output Available: ${chalk.cyan(`http://localhost:${this.loggerPort}`)}\n`; // 输出可用的URL
          },
          rendererOptions: {
            persistentOutput: true, // 持久输出
            timer: { ...PRESET_TIMER }, // 渲染选项
          },
        },
      ],
      result: false, // 结果标记
    };
  }

  // 获取钩子
  getHooks = (): ForgeMultiHookMap => {
    return {
      prePackage: [
        namedHookWithTaskFn<'prePackage'>(async (task, config, platform, arch) => {
          if (!task) {
            throw new Error('Incompatible usage of webpack-plugin prePackage hook'); // 抛出错误
          }

          this.isProd = true; // 设置为生产模式
          await fs.rm(this.baseDir, { recursive: true, force: true }); // 删除基础目录

          return task.newListr(
            [
              {
                title: 'Building webpack bundles', // 任务标题
                task: async () => {
                  // 编译各个配置
                  await this.compile(mainConfig, 'main', 'main'); // 编译主进程
                  await this.compile(nodeConfig, 'node', 'node'); // 编译节点进程
                  await this.compile(extHostConfig, 'ext-host', 'ext-host'); // 编译扩展主机
                  await this.compile(workerHostConfig, 'ext-host', 'worker-host'); // 编译工作主机
                  await this.compile(webviewConfig, 'webview', 'webview'); // 编译Webview
                  await this.compile(rendererConfig, 'renderer', 'renderer'); // 编译渲染器
                },
                rendererOptions: {
                  timer: { ...PRESET_TIMER }, // 渲染选项
                },
              },
            ],
            { concurrent: false } // 不并发执行
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
          ) as any; // 类型断言
        }, 'Preparing webpack bundles'), // 钩子名称
      ],
      postStart: async (_config, child) => {
        d('hooking electron process exit'); // 调试信息
        child.on('exit', () => {
          if (child.restarted) return; // 如果子进程重启则返回
          this.exitHandler({ cleanup: true, exit: true }); // 处理退出
        });
      },
    };
  }

  // 验证端口有效性
  private isValidPort = (port: number) => {
    if (port < 1024) {
      throw new Error(`Cannot specify port (${port}) below 1024, as they are privileged`); // 抛出错误
    } else if (port > 65535) {
      throw new Error(`Port specified (${port}) is not a valid TCP port.`); // 抛出错误
    } else {
      return true; // 返回有效
    }
  };

  // 处理退出事件
  private exitHandler = (options: { cleanup?: boolean; exit?: boolean }): void => {
    d('handling process exit with:', options); // 调试信息
    if (options.cleanup) {
      // 清理监视器
      for (const watcher of this.watchers) {
        d('cleaning webpack watcher'); // 调试信息
        watcher.close(() => {
          /* Do nothing when the watcher closes */
        });
      }
      this.watchers = []; // 清空监视器数组
      // 清理HTTP服务器
      for (const server of this.servers) {
        d('cleaning http server'); // 调试信息
        server.close(); // 关闭服务器
      }
      this.servers = []; // 清空服务器数组
      // 停止日志记录器
      for (const logger of this.loggers) {
        d('stopping logger'); // 调试信息
        logger.stop(); // 停止日志记录器
      }
      this.loggers = []; // 清空日志记录器数组
    }
    if (options.exit) process.exit(); // 退出进程
  };

  // 写入JSON统计信息
  private async writeJSONStats(type: string, stats: webpack.Stats | undefined, statsOptions: WebpackToJsonOptions, suffix: string): Promise<void> {
    if (!stats) return; // 如果没有统计信息则返回
    d(`Writing JSON stats for ${type} config`); // 调试信息
    const jsonStats = stats.toJson(statsOptions); // 转换为JSON格式
    const jsonStatsFilename = path.resolve(this.baseDir, type, `stats-${suffix}.json`); // 生成文件名
    await fs.writeFile(jsonStatsFilename, JSON.stringify(jsonStats, null, 2)); // 写入文件
  }

  // 编译方法
  private async compile(c: Configuration | ((env: unknown, argv: Record<string, any>) => Configuration), name: string, statsName: string, watch = false, tab?: Tab) {  
    await new Promise((resolve, reject) => {
      const config = this.processConfig(c); // 处理配置
      const compiler = webpack(config); // 创建webpack编译器
      const cb: Parameters<webpack.Compiler['watch']>[1] = async (err, stats) => {
        if (tab && stats) {
          tab.log(
            stats.toString({
              colors: true, // 启用颜色输出
            })
          );
        }
        if (this.config.jsonStats) {
          await this.writeJSONStats(name, stats, config.stats, statsName); // 写入JSON统计信息
        }
  
        if (err) return reject(err); // 如果有错误则拒绝
        if (!watch && stats?.hasErrors()) {
          return reject(new Error(`Compilation errors in the ${name} process: ${stats.toString()}`)); // 如果没有监视且有错误则拒绝
        }
  
        return resolve(undefined); // 解析成功
      };
      if (watch) {
        this.watchers.push(compiler.watch({}, cb)); // 如果监视则添加监视器
      } else {
        compiler.run(cb); // 否则直接运行编译
      }
    });
  }

  // 启动渲染进程的开发服务器
  private launchRendererDevServers = async (tab: Tab): Promise<void> => {
    const config = this.processConfig(rendererConfig); // 处理渲染器配置
    if (!config.plugins) config.plugins = []; // 如果没有插件则初始化为空数组
    config.plugins.push(new LoggingPlugin(tab)); // 添加日志插件
    const compiler = webpack(config); // 创建webpack编译器
    const webpackDevServer = new WebpackDevServer(config.devServer, compiler); // 创建开发服务器
    await webpackDevServer.start(); // 启动开发服务器
    this.servers.push(webpackDevServer.server!); // 添加到服务器数组
  };

  // 处理配置
  private processConfig(c: Configuration | ((env: unknown, argv: Record<string, any>) => Configuration)) {
    if (typeof c === 'function') {
      return c({}, { mode: this.mode }); // 如果是函数则调用
    }
    return c; // 否则直接返回配置
  }
}
