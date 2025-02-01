/**
 * @fileOverview 🔧 该模块用于为浏览器端注册核心命令。其中包括通过依赖注入获得 IWindowDialogService 和 IWorkspaceService，
 * 用于处理打开文件夹的操作，并在用户选择一个新的工作目录时打开新的工作空间窗口。
 */

import { Injectable, Autowired } from '@opensumi/di';
import { CommandContribution, CommandRegistry, Domain, FILE_COMMANDS } from '@opensumi/ide-core-browser';
import { IWindowDialogService } from '@opensumi/ide-overlay';
import { IWorkspaceService } from '@opensumi/ide-workspace';

@Injectable() // 🔧 标识该类可被注入
@Domain(CommandContribution) // 🔧 定义该类为 CommandContribution 类型的领域
export class CoreCommandContribution implements CommandContribution {

  @Autowired(IWindowDialogService)
  private window: IWindowDialogService; // 🚀 注入窗口对话框服务，用于显示文件夹选择对话框

  @Autowired(IWorkspaceService)
  private workspace: IWorkspaceService; // 🚀 注入工作空间服务，用于判断当前打开的工作空间

  /**
   * 🚀 注册命令到命令注册表
   * 
   * 功能描述:
   *   为FILE_COMMANDS.OPEN_FOLDER命令注册一个处理函数，当用户执行此命令时弹出文件夹选择对话框，
   *   并在选择的文件夹与当前工作空间不一致时，通过浏览器窗口重新打开对应的新工作空间。
   * 
   * @param {CommandRegistry} commands - 命令注册表，用于注册新命令
   * @return {void} 无返回值
   *
   * ⚠️ 逻辑说明：
   *   1. 调用this.window.showOpenDialog显示文件夹对话框，允许用户选择单个文件夹。
   *   2. 检查返回的newWorkspace数组是否存在，并判断用户选择的文件夹与当前工作空间是否不同。
   *   3. 为确保新工作空间能够加载，使用window.open打开一个新的URL，其中包含新的工作目录参数。
   * 
   * 历史背景: 该逻辑起源于早期桌面版工作空间切换的实现，后来迁移至Web端并结合依赖注入机制进行重构。
   *
   * 时间复杂度: O(1) - 命令注册与简单判断
   * 空间复杂度: O(1) - 使用常量内存
   */
  registerCommands(commands: CommandRegistry): void {
    commands.registerCommand(FILE_COMMANDS.OPEN_FOLDER, {
      execute: async () => {
        // 🚀 打开对话框允许用户选择文件夹，仅允许单选（canSelectMany: false）
        const newWorkspace = await this.window.showOpenDialog({
          canSelectFolders: true,
          canSelectMany: false,
        });
        // ⚠️ 判断是否有有效选择的工作空间
        if (newWorkspace) {
          // 🚀 检查当前工作空间与选择的文件夹是否相同，避免重复加载
          if (this.workspace.workspace?.uri.toString() === newWorkspace[0].toString()) {
            return; // ⚠️ 若相同则直接返回，不进行任何操作
          }
          // 🚀 构造新URL并打开，传递所选工作目录的文件系统路径作为workspaceDir参数
          window.open(
            `${window.location.protocol}//${window.location.host}?workspaceDir=${newWorkspace[0].codeUri.fsPath.toString()}`
          );
        }
      }
    });
  }
}
