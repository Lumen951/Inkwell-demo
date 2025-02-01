// 此类负责Shell集成服务的初始化，主要用于创建和配置Bash初始化文件。

import * as fs from 'node:fs/promises'; // 引入文件系统模块以进行文件操作
import * as path from 'node:path'; // 引入路径模块以处理文件路径
import * as os from 'node:os'; // 引入操作系统模块以获取用户主目录
import { Autowired, Injectable } from '@opensumi/di' // 引入依赖注入相关模块
import { ShellIntegrationService as BaseShellIntegrationService } from '@opensumi/ide-terminal-next/lib/node/shell-integration.service' // 引入基础Shell集成服务

/**
 * ShellIntegrationService类扩展了基础Shell集成服务，提供Bash初始化文件的创建功能。
 */
export class ShellIntegrationService extends BaseShellIntegrationService {
  @Autowired(ShellIntegrationService) // 自动注入ShellIntegrationService实例
  shellIntegrationService: ShellIntegrationService // 当前类的实例

  /**
   * 初始化Bash初始化文件。
   * 
   * 功能描述：创建Shell集成目录并生成Bash初始化文件。
   * 
   * @returns {Promise<string>} 返回生成的Bash初始化文件的路径。
   */
  async initBashInitFile(): Promise<string> {
    // 获取用户主目录下的Shell集成目录路径
    const shellIntegrationDirPath = path.join(os.homedir(), process.env.IDE_DATA_FOLDER_NAME!, 'shell-integration');
    // 定义Bash初始化文件的完整路径
    const bashIntegrationPath = path.join(shellIntegrationDirPath, 'bash-integration.bash');
    
    // 创建Shell集成目录，如果已存在则不报错
    await fs.mkdir(shellIntegrationDirPath, { recursive: true });
    
    // 将生成的Bash集成内容写入到指定的文件中
    await fs.writeFile(bashIntegrationPath, await this.getBashIntegrationContent());
    
    // 返回生成的Bash初始化文件路径
    return bashIntegrationPath;
  }
}
