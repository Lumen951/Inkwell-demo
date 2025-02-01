/**
 * @file 欢迎页面组件
 * @brief 🚀 本文件定义了 EditorWelcomeComponent 组件，
 *        用于展示欢迎信息、快速入门及近期工作区列表。
 * 
 * <table>
 *   <tr>
 *     <th>步骤</th>
 *     <th>描述</th>
 *     <th>实现代码</th>
 *   </tr>
 *   <tr>
 *     <td>1</td>
 *     <td>初始化服务：通过 useInjectable 获取 CommandService、IWindowService、IFileServiceClient、IMessageService 的实例</td>
 *     <td>
 *       const commandService = useInjectable(CommandService);<br/>
 *       const windowService = useInjectable(IWindowService);<br/>
 *       const fileService = useInjectable(IFileServiceClient);<br/>
 *       const messageService = useInjectable(IMessageService);
 *     </td>
 *   </tr>
 *   <tr>
 *     <td>2</td>
 *     <td>快速入门交互：点击超链接执行 OPEN_FOLDER 命令</td>
 *     <td>
 *       onClick={() => { commandService.executeCommand(FILE_COMMANDS.OPEN_FOLDER.id, { newWindow: false }); }}
 *     </td>
 *   </tr>
 *   <tr>
 *     <td>3</td>
 *     <td>近期工作区处理：<br/>
 *         - 判断工作区地址格式<br/>
 *         - 根据路径分隔符使用 posix 或 win32 处理文件路径<br/>
 *         - 若解析名称为空，则使用父目录作为名称
 *     </td>
 *     <td>
 *       let workspacePath = workspace;<br/>
 *       if (workspace.startsWith('file://')) { workspacePath = FileUri.fsPath(workspace); }<br/>
 *       const p = workspacePath.indexOf('/') !== -1 ? posix : win32;<br/>
 *       let name = p.basename(workspacePath);<br/>
 *       let parentPath = p.dirname(workspacePath);<br/>
 *       if (!name.length) { name = parentPath; parentPath = ''; }
 *     </td>
 *   </tr>
 *   <tr>
 *     <td>4</td>
 *     <td>点击近期工作区项：<br/>
 *         - 异步检查工作区是否存在<br/>
 *         - 存在则打开，否则显示错误提示
 *     </td>
 *     <td>
 *       onClick={async () => {<br/>
 *         const uri = new URI(workspace);<br/>
 *         const exist = await fileService.getFileStat(uri.toString());<br/>
 *         if (exist) { windowService.openWorkspace(uri, { newWindow: false }); } else { messageService.error(localize('welcome.workspace.noExist')); }<br/>
 *       }}
 *     </td>
 *   </tr>
 * </table>
 *
 * @component EditorWelcomeComponent
 * @param {object} props - 组件属性对象，其中包含 resource 属性
 * @param {IWelcomeMetaData} props.resource - 资源元数据，包含 recentWorkspaces 数组
 * @returns {JSX.Element} 返回编辑欢迎页面的 React 组件
 *
 * 🔧 注意：所有服务均由 useInjectable 钩子动态注入，确保依赖管理更加灵活
 */
import React from 'react';

import {
  CommandService,
  FILE_COMMANDS,
  FileUri,
  IWindowService,
  URI,
  localize,
  useInjectable,
} from '@opensumi/ide-core-browser';
import { ReactEditorComponent } from '@opensumi/ide-editor/lib/browser';
import { IFileServiceClient } from '@opensumi/ide-file-service';
import { IMessageService } from '@opensumi/ide-overlay';
import { posix, win32 } from '@opensumi/ide-utils/lib/path';

import { IWelcomeMetaData } from './common';
import styles from './welcome.module.less';

export const EditorWelcomeComponent: ReactEditorComponent<IWelcomeMetaData> = ({ resource }) => {
  // 🔧 使用依赖注入获取相关服务实例，便于后续调用对应API
  const commandService: CommandService = useInjectable<CommandService>(CommandService);
  const windowService: IWindowService = useInjectable<IWindowService>(IWindowService);
  const fileService: IFileServiceClient = useInjectable<IFileServiceClient>(IFileServiceClient);
  const messageService: IMessageService = useInjectable<IMessageService>(IMessageService);

  return (
    <div className={styles.welcome}>
      <div>
        {/* 🚀 快速入门标题 */}
        <h2>{localize('welcome.quickStart')}</h2>
        <div>
          {/* 🚀 快速入门操作：点击后打开文件夹 */}
          <a
            onClick={() => {
              // ⚠️ 执行文件夹打开命令，newWindow 参数指定是否新窗口打开
              commandService.executeCommand(FILE_COMMANDS.OPEN_FOLDER.id, { newWindow: false });
            }}
          >
            {localize('file.open.folder')}
          </a>
        </div>
      </div>
      <div>
        {/* 🚀 显示近期工作区标题 */}
        <h2>{localize('welcome.recent.workspace')}</h2>
        {resource.metadata?.recentWorkspaces.map((workspace) => {
          // 🔧 处理工作区路径，如果以 'file://' 开头需要转换为本地路径格式
          let workspacePath = workspace;
          if (workspace.startsWith('file://')) {
            workspacePath = FileUri.fsPath(workspace);
          }
          // ⚠️ 根据路径分隔符来决定使用 posix 或 win32 模块
          const p = workspacePath.indexOf('/') !== -1 ? posix : win32;
          // 🚀 解析工作区名称及父目录路径
          let name = p.basename(workspacePath);
          let parentPath = p.dirname(workspacePath);
          // 🚀 如果 basename 为空，此时将父目录作为显示名称，并清空父目录显示
          if (!name.length) {
            name = parentPath;
            parentPath = '';
          }
          // 历史背景：仅显示根目录片段，确保界面简洁
          return (
            <div key={workspace} className={styles.recentRow}>
              <a
                onClick={async () => {
                  // 🔧 构建 URI 实例以供后续调用
                  const uri = new URI(workspace);
                  // 🚀 异步查询该工作区在文件系统中的状态
                  const exist = await fileService.getFileStat(uri.toString());
                  if (exist) {
                    // 🚀 存在该工作区，打开工作区在主窗口中显示
                    windowService.openWorkspace(uri, { newWindow: false });
                  } else {
                    // ⚠️ 工作区不存在，反馈错误信息给用户
                    messageService.error(localize('welcome.workspace.noExist'));
                  }
                }}
              >
                {name}
              </a>
              {/* 🚀 显示父目录路径 */}
              <span className={styles.path}>{parentPath}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
