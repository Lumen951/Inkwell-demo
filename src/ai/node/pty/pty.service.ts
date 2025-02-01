// 该类 AIPtyService 继承自 PtyService，负责启动终端进程并配置环境变量。
// 主要功能是根据 shellLaunchConfig 配置启动终端，并处理相关的环境变量和参数。

import { Injectable } from '@opensumi/di';
import { ITerminalLaunchError } from '@opensumi/ide-terminal-next';
import { PtyService } from '@opensumi/ide-terminal-next/lib/node/pty';
import { getShellPath } from '@opensumi/ide-core-node/lib/bootstrap/shell-path';

import { bashIntegrationPath, initShellIntegrationFile } from './shell-integration';

@Injectable({ multiple: true })
export class AIPtyService extends PtyService {
  /**
   * 启动终端进程
   * 
   * 功能描述：
   * 根据 shellLaunchConfig 配置启动终端进程，并设置环境变量。
   * 
   * 参数说明：
   * 无
   * 
   * 返回值说明：
   * Promise<ITerminalLaunchError | undefined> - 启动过程中可能发生的错误信息，若无错误则返回 undefined。
   */
  async start(): Promise<ITerminalLaunchError | undefined> {
    const { shellLaunchConfig } = this; // 从当前实例中获取 shellLaunchConfig 配置

    let ptyEnv: { [key: string]: string | undefined } | undefined; // 定义环境变量对象
    if (shellLaunchConfig.strictEnv) { // 如果严格环境变量配置被启用
      ptyEnv = shellLaunchConfig.env as { [key: string]: string | undefined }; // 使用用户自定义的环境变量
    } else {
      // 否则，合并系统环境变量与用户自定义环境变量
      ptyEnv = {
        ...process.env, // 获取当前进程的环境变量
        PATH: await getShellPath(), // 异步获取 shell 路径
        LC_ALL: `zh_CN.UTF-8`, // 设置语言环境
        LANG: `zh_CN.UTF-8`, // 设置语言
        ...shellLaunchConfig.env, // 合并用户自定义的环境变量
      };
    }

    // 如果可执行文件包含 'bash'，则进行 bash 特定的初始化
    if (shellLaunchConfig.executable?.includes('bash')) {
      await initShellIntegrationFile(); // 初始化 shell 集成文件
      if (!shellLaunchConfig.args) { shellLaunchConfig.args = []; } // 如果没有参数，则初始化为空数组
      if (Array.isArray(shellLaunchConfig.args)) {
        shellLaunchConfig.args.push('--init-file', bashIntegrationPath); // 将 bash 集成路径添加到参数中
      }
    }

    this._ptyOptions['env'] = ptyEnv; // 将环境变量设置到 ptyOptions 中

    try {
      await this.setupPtyProcess(); // 设置 pty 进程 pseudoterminal 伪终端 在程序中创建一个可以与用户交互的终端环境
      return undefined; // 启动成功，返回 undefined
    } catch (err: any) {
      this.logger.error('IPty#spawn native exception', err); // 记录错误日志
      return { message: `A native exception occurred during launch (${err.message})` }; // 返回错误信息
    }
  }
}