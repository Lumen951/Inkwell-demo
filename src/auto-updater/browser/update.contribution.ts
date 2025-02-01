// 该模块负责自动更新功能的命令和菜单注册。
// 它实现了 MenuContribution 和 CommandContribution 接口，
// 允许用户通过菜单项手动检查更新。

import { Autowired } from '@opensumi/di' // 🔧 依赖注入装饰器，用于自动注入服务
import { Command, CommandRegistry, Domain, localize } from '@opensumi/ide-core-common' // 🔧 引入命令相关的模块
import { BrowserModule, CommandContribution } from '@opensumi/ide-core-browser'; // 🔧 引入浏览器模块
import { MenuId, MenuContribution, IMenuRegistry } from '@opensumi/ide-core-browser/lib/menu/next'; // 🔧 引入菜单相关的模块
import { IUpdateMainService } from '../common' // 🔧 引入更新服务接口

// 定义检查更新命令的ID和标签
const CHECK_COMMAND_ID = {
  id: 'autoUpdater.checkForUpdates', // 命令ID
  label: localize('autoUpdater.checkForUpdates'), // 本地化标签
}

// 使用 @Domain 装饰器定义 UpdaterContribution 类
@Domain(MenuContribution, CommandContribution)
export class UpdaterContribution implements MenuContribution, CommandContribution {
  @Autowired(IUpdateMainService) // 🔧 自动注入更新服务
  updateService: IUpdateMainService // 更新服务实例

  /**
   * 注册命令到命令注册表
   * 
   * 功能描述：将检查更新命令注册到命令注册表中。
   * 
   * 参数说明：
   * - commands: CommandRegistry - 命令注册表实例
   * 
   * 返回值说明：
   * - void - 无返回值
   */
  registerCommands(commands: CommandRegistry): void {
    commands.registerCommand(
      { id: CHECK_COMMAND_ID.id }, // 注册命令ID
      {
        execute: async () => { // 执行命令时调用
          await this.updateService.checkForUpdatesManual() // 调用更新服务的手动检查更新方法
        }
      }
    )
  }

  /**
   * 注册菜单项到菜单注册表
   * 
   * 功能描述：将检查更新菜单项注册到应用菜单中。
   * 
   * 参数说明：
   * - menuRegistry: IMenuRegistry - 菜单注册表实例
   * 
   * 返回值说明：
   * - void - 无返回值
   */
  registerMenus(menuRegistry: IMenuRegistry) {
    menuRegistry.registerMenuItem(MenuId.MenubarAppMenu, {
      group: '0_about', // 菜单组
      order: 1, // 菜单项顺序
      command: {
        id: CHECK_COMMAND_ID.id, // 菜单项对应的命令ID
        label: CHECK_COMMAND_ID.label, // 菜单项标签
      },
    });
  }
}
