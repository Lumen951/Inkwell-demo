// 该服务类负责智能运行 Node.js 项目的配置生成，主要通过分析 package.json 文件中的 scripts 内容来确定合适的运行命令。

import * as jsoncparser from 'jsonc-parser'; // 引入 JSONC 解析库
import { Injectable, Autowired } from '@opensumi/di'; // 引入依赖注入相关的装饰器
import { PreferenceConfigurations } from '@opensumi/ide-core-browser'; // 引入偏好配置
import { CommandService, URI, FileType, ChatServiceToken } from '@opensumi/ide-core-common'; // 引入核心服务
import { DEBUG_COMMANDS, DebugConfiguration } from '@opensumi/ide-debug'; // 引入调试相关配置
import { DebugConfigurationManager } from '@opensumi/ide-debug/lib/browser/debug-configuration-manager'; // 引入调试配置管理器
import { WorkbenchEditorService } from '@opensumi/ide-editor'; // 引入工作台编辑器服务
import { IFileServiceClient } from '@opensumi/ide-file-service'; // 引入文件服务客户端
import { IWorkspaceService } from '@opensumi/ide-workspace'; // 引入工作区服务
import { ChatService } from '@opensumi/ide-ai-native/lib/browser/chat/chat.api.service'; // 引入聊天服务
import { AIBackSerivcePath } from '@opensumi/ide-core-common'; // 引入 AI 后端服务路径
import type { IAIBackService } from '@opensumi/ide-core-common'; // 引入 AI 后端服务接口
import { MessageService } from '@opensumi/ide-overlay/lib/browser/message.service'; // 引入消息服务
import { IAIReporter } from '@opensumi/ide-core-common'; // 引入 AI 报告接口

// 暂定的技术栈集合
export enum EStackName {
  NODEJS = 'node.js', // Node.js
  JAVA = 'java', // Java
  MINI_PROGRAM = 'mini program', // 小程序
  PYTHON = 'python', // Python
  C_CPP = 'c/c++', // C/C++
  GO = 'go', // Go
  rust = 'rust', // Rust
  FRONT_END = 'front end', // 前端
  EXTENSION = 'ide extension', // IDE 扩展
  EMPTY = 'empty', // 空
}

// 获取 EStackName 的所有键
const EStackNameKeys = Object.keys(EStackName) as (keyof typeof EStackName)[];

/**
 * AiRunService 类负责智能运行的逻辑规则。
 * 以 launch.json 配置为主。
 * - 如果没有该文件，则智能生成该文件（走 AI）。
 * - 如果有该文件，则默认运行第一条（后续可以配置）。
 */
@Injectable()
export class AiRunService {
  @Autowired(AIBackSerivcePath) // 注入 AI 后端服务
  aiBackService: IAIBackService;

  @Autowired(CommandService) // 注入命令服务
  protected readonly commandService: CommandService;

  @Autowired(MessageService) // 注入消息服务
  protected readonly messageService: MessageService;

  @Autowired(IWorkspaceService) // 注入工作区服务
  protected readonly workspaceService: IWorkspaceService;

  @Autowired(PreferenceConfigurations) // 注入偏好配置
  protected readonly preferenceConfigurations: PreferenceConfigurations;

  @Autowired(DebugConfigurationManager) // 注入调试配置管理器
  protected readonly debugConfigurationManager: DebugConfigurationManager;

  @Autowired(WorkbenchEditorService) // 注入工作台编辑器服务
  protected readonly workbenchEditorService: WorkbenchEditorService;

  @Autowired(IFileServiceClient) // 注入文件服务客户端
  private readonly fileSystem: IFileServiceClient;

  @Autowired(ChatServiceToken) // 注入聊天服务
  protected readonly aiChatService: ChatService;

  @Autowired(IAIReporter) // 注入 AI 报告接口
  aiReporter: IAIReporter;

  /**
   * 获取项目的 package.json 文件 URI。
   * @returns {URI | null} 返回 package.json 的 URI，如果不存在则返回 null。
   */
  get pkgUri() {
    const workspaceFolderUri = this.workspaceService.getWorkspaceRootUri(undefined);
    if (!workspaceFolderUri) {
      return null; // 如果工作区根 URI 不存在，返回 null
    }
    return workspaceFolderUri.resolve('package.json'); // 返回 package.json 的 URI
  }

  /**
   * 读取指定资源的内容。
   * @param {URI} resource - 要读取的资源 URI。
   * @returns {Promise<string>} 返回资源的内容，读取失败时返回空字符串。
   */
  private async readResourceContent(resource: URI): Promise<string> {
    try {
      const { content } = await this.fileSystem.readFile(resource.toString());
      return content.toString(); // 返回读取到的内容
    } catch (error) {
      return ''; // 读取失败，返回空字符串
    }
  }

  /**
   * 检查项目中是否包含 package.json 文件。
   * @returns {Promise<boolean>} 如果存在 package.json 文件且不是目录，返回 true；否则返回 false。
   */
  public async containPackageJson(): Promise<boolean> {
    const { pkgUri } = this;
    if (!pkgUri) return false; // 如果 package.json URI 不存在，返回 false
    const stat = await this.fileSystem.getFileStat(pkgUri.toString());
    if (!stat) return false; // 如果获取文件状态失败，返回 false
    return !stat.isDirectory; // 返回是否为文件
  }

  /**
   * 获取 Node.js 的调试配置。
   * @returns {Promise<DebugConfiguration[] | undefined>} 返回调试配置数组，如果无法生成则返回 undefined。
   */
  public async getNodejsDebugConfigurations() {
    if (!(await this.containPackageJson())) {
      this.messageService.info('项目无 package.json，无法生成运行配置'); // 提示用户项目缺少 package.json
      return; // 结束函数
    }

    const fileContent = await this.readResourceContent(this.pkgUri!); // 读取 package.json 内容

    const parseJson = jsoncparser.parse(fileContent); // 解析 JSONC 格式的内容

    const jsonContent = JSON.stringify(
      {
        name: parseJson.name || '', // 项目名称
        version: parseJson.version || '', // 项目版本
        description: parseJson.description || '', // 项目描述
        egg: parseJson.egg || '', // egg 信息
        bin: parseJson.bin || '', // bin 信息
        scripts: parseJson.scripts // scripts 信息
      },
      undefined,
      1 // 格式化缩进
    );

    // 构建 AI 提示信息
    const prompt = `我会给你一个项目类型和 package.json 文件内容。你需要通过分析里面的 scripts 内容，找到合适的运行命令来启动项目。如果找到合适的命令后直接返回，不需要解释。请参照下面的示例问答的格式返回。
提问: 这是一个 node.js 项目，package.json 的文件内容是 \`\`\`\n${JSON.stringify({
scripts: { dev: 'npm run dev', test: 'npm run test' }
})}\n\`\`\`
回答: "dev"
提问: 这是一个 front-end 项目，package.json 的文件内容是 \`\`\`\n${JSON.stringify({
scripts: { start: 'npm run start', build: 'npm run build' }
})}\n\`\`\`
回答: "start"
提问: 这是一个 Node.js 项目，package.json 的文件内容是 \`\`\`\n${jsonContent}\n\`\`\`
`;

    const reportRelationId = this.aiReporter.start('aiRunFrontEnd', { message: 'aiRunFrontEnd' }); // 开始 AI 报告

    const res = await this.aiBackService.request(prompt, {
      // @ts-ignore
      maxTokens: 1600, // 最大 token 数
      enableGptCache: false // 禁用 GPT 缓存
    });

    if (!res.data || res.errorCode !== 0) {
      res.errorMsg && this.messageService.info(res.errorMsg); // 如果有错误信息，提示用户
      this.aiReporter.end(reportRelationId, { message: 'aiRunFrontEndModelFetchError', success: false }); // 结束 AI 报告
      return undefined; // 返回 undefined
    }

    const regex = /(?:(?:npm|cnpm) run|yarn) (\w+)/; // 解析命令的正则表达式
    const backtickRegex = /`(?:(?:npm|cnpm) run|yarn) (\w+)`/; // 反引号包围的命令匹配

    // 尝试匹配基础命令
    let match = res.data.match(regex);
    // 如果基础命令未匹配，尝试匹配反引号包围的命令
    if (!match) {
      match = res.data.match(backtickRegex);
    }

    let command = '';
    if (match) {
      command = match[1]; // 提取匹配的命令名
    } else {
      return undefined; // 如果没有匹配到命令，返回 undefined
    }

    const configuration: DebugConfiguration = {
      name: `Run npm ${command}`, // 配置名称
      type: 'node', // 调试类型
      request: 'launch', // 请求类型
      runtimeExecutable: 'npm', // 运行时可执行文件
      runtimeArgs: ['run', `${command}`], // 运行时参数
      cwd: '${workspaceFolder}', // 当前工作目录
      console: 'integratedTerminal', // 控制台类型
      autoPick: true // 跳过 quickPick 自动选择（此选项不会落到用户配置中）
    };

    return [configuration]; // 返回调试配置
  }
}
