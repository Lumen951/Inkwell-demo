/**
 * @file AiRunService 服务类
 * @summary 🔧 本文件提供了 AiRunService 类，该类通过分析 package.json 中的 scripts 字段，
 *          利用 AI 后端服务来智能生成 Node.js 项目的调试配置（DebugConfiguration）。
 * 
 * 功能：
 *  - 从工作区获取 package.json 文件 URI，并读取文件内容（支持 JSONC 格式）
 *  - 分析 package.json 中 scripts 的内容，通过 AI 判断合适的启动命令
 *  - 根据 AI 返回的命令构造 Node.js 调试配置
 *
 * 历史背景：
 *  早期该流程要求开发者手动指定启动命令，后经过需求优化，引入 AI 自动分析逻辑，
 *  提升了用户体验和自动化水平。
 */

import * as jsoncparser from 'jsonc-parser'; // 🔧 引入 JSONC 解析库，用于解析可能带注释的 JSON 文件
import { Injectable, Autowired } from '@opensumi/di'; // 🔧 依赖注入装饰器
import { PreferenceConfigurations } from '@opensumi/ide-core-browser'; // 🔧 注入偏好配置服务
import { CommandService, URI, FileType, ChatServiceToken } from '@opensumi/ide-core-common'; // 🔧 核心服务和数据类型
import { DEBUG_COMMANDS, DebugConfiguration } from '@opensumi/ide-debug'; // 🔧 调试相关常量和配置类型
import { DebugConfigurationManager } from '@opensumi/ide-debug/lib/browser/debug-configuration-manager'; // 🔧 调试配置管理器
import { WorkbenchEditorService } from '@opensumi/ide-editor'; // 🔧 工作台编辑器服务
import { IFileServiceClient } from '@opensumi/ide-file-service'; // 🔧 文件服务客户端接口
import { IWorkspaceService } from '@opensumi/ide-workspace'; // 🔧 工作区服务接口
import { ChatService } from '@opensumi/ide-ai-native/lib/browser/chat/chat.api.service'; // 🔧 聊天 AI 服务
import { AIBackSerivcePath } from '@opensumi/ide-core-common'; // 🔧 AI 后端服务路径标识
import type { IAIBackService } from '@opensumi/ide-core-common'; // 🔧 AI 后端服务接口类型
import { MessageService } from '@opensumi/ide-overlay/lib/browser/message.service'; // 🔧 消息服务，用于提示用户信息
import { IAIReporter } from '@opensumi/ide-core-common'; // 🔧 AI 报告接口，用于统计 AI 请求情况

/**
 * 🔧 技术栈枚举
 * 定义项目中可能使用的技术栈类型
 */
export enum EStackName {
  NODEJS = 'node.js',         // Node.js
  JAVA = 'java',              // Java
  MINI_PROGRAM = 'mini program',  // 小程序
  PYTHON = 'python',          // Python
  C_CPP = 'c/c++',            // C/C++
  GO = 'go',                  // Go
  rust = 'rust',              // Rust
  FRONT_END = 'front end',    // 前端
  EXTENSION = 'ide extension',// IDE 扩展
  EMPTY = 'empty',            // 空
}

// 🔧 获取 EStackName 的所有键，便于后续处理
const EStackNameKeys = Object.keys(EStackName) as (keyof typeof EStackName>[];

/**
 * @class AiRunService
 * @classdesc 🚀 本类负责根据 package.json 文件内容和 AI 后端返回的数据，
 *           自动生成 Node.js 项目的调试配置（DebugConfiguration）。
 *
 * 功能描述：
 *  1. 通过工作区服务获取 package.json 文件 URI；
 *  2. 读取并解析 package.json 文件（支持 JSONC 格式）；
 *  3. 构造 AI 请求提示信息，并发送至 AI 后端服务；
 *  4. 利用 AI 返回的启动命令生成对应的调试配置。
 *
 * @note 历史背景：最初调试配置由开发者手动指定，后引入 AI 服务自动匹配合适的启动命令，
 *       提高了配置的自动化和准确性。
 */
@Injectable()
export class AiRunService {
  @Autowired(AIBackSerivcePath) // 🔧 注入 AI 后端服务实例
  aiBackService: IAIBackService;

  @Autowired(CommandService) // 🔧 注入命令服务实例
  protected readonly commandService: CommandService;

  @Autowired(MessageService) // 🔧 注入消息提示服务实例
  protected readonly messageService: MessageService;

  @Autowired(IWorkspaceService) // 🔧 注入工作区服务实例
  protected readonly workspaceService: IWorkspaceService;

  @Autowired(PreferenceConfigurations) // 🔧 注入用户偏好配置实例
  protected readonly preferenceConfigurations: PreferenceConfigurations;

  @Autowired(DebugConfigurationManager) // 🔧 注入调试配置管理器实例
  protected readonly debugConfigurationManager: DebugConfigurationManager;

  @Autowired(WorkbenchEditorService) // 🔧 注入工作台编辑器服务实例
  protected readonly workbenchEditorService: WorkbenchEditorService;

  @Autowired(IFileServiceClient) // 🔧 注入文件服务客户端实例
  private readonly fileSystem: IFileServiceClient;

  @Autowired(ChatServiceToken) // 🔧 注入聊天服务实例
  protected readonly aiChatService: ChatService;

  @Autowired(IAIReporter) // 🔧 注入 AI 报告统计接口实例
  aiReporter: IAIReporter;

  /**
   * @getter pkgUri
   * @description 🚀 获取当前项目中 package.json 文件的 URI
   * @returns {URI | null} 返回 package.json 的 URI，如果未获取到工作区根路径则返回 null
   */
  get pkgUri() {
    const workspaceFolderUri = this.workspaceService.getWorkspaceRootUri(undefined);
    if (!workspaceFolderUri) {
      // ⚠️ 注意：若工作区根 URI 不存在，则无法定位 package.json 文件
      return null;
    }
    return workspaceFolderUri.resolve('package.json'); // 返回 package.json 文件的完整 URI
  }

  /**
   * @function readResourceContent
   * @description 🚀 读取指定 URI 资源的文本内容
   * @param {URI} resource - 待读取的资源 URI
   * @returns {Promise<string>} 返回 Promise，其 resolve 值为资源内容字符串；若读取失败则返回空字符串
   *
   * @example
   *   const content = await readResourceContent(uri);
   */
  private async readResourceContent(resource: URI): Promise<string> {
    try {
      // 🚀 调用文件服务读取文件内容，确保文件正确编码
      const { content } = await this.fileSystem.readFile(resource.toString());
      return content.toString(); // 返回文件内容
    } catch (error) {
      // ⚠️ 注意：读取文件失败时返回空字符串，避免后续解析异常
      return '';
    }
  }

  /**
   * @function containPackageJson
   * @description 🚀 检查当前项目中是否存在 package.json 文件，并确认其为文件而非目录
   * @returns {Promise<boolean>} 返回 Promise，其 resolve 值为布尔值，
   *          true 表示存在且为文件，false 表示不存在或为目录
   */
  public async containPackageJson(): Promise<boolean> {
    const { pkgUri } = this;
    if (!pkgUri) return false; // ⚠️ 注意：无法获取 package.json 路径时直接返回 false
    const stat = await this.fileSystem.getFileStat(pkgUri.toString());
    if (!stat) return false; // ⚠️ 注意：获取文件状态失败时返回 false
    return !stat.isDirectory; // 返回检测结果：仅当为文件时返回 true
  }

  /**
   * @function getNodejsDebugConfigurations
   * @description 🚀 利用 AI 服务分析 package.json 的 scripts 字段，
   *           自动生成 Node.js 项目的调试配置 DebugConfiguration。
   *
   * @returns {Promise<DebugConfiguration[] | undefined>} 返回 Promise，
   *          resolve 值为包含调试配置的数组，若无法生成配置则返回 undefined。
   *
   * @note 性能说明：时间复杂度主要受文件读取和 AI 请求延迟影响，O(n) 其中 n 为文件内容长度。
   *
   * 核心算法步骤解析：
   * +----------------+-----------------------------------------------------------+-----------------------------------------------------+
   * | 步骤           | 描述                                                      | 实现代码                                            |
   * +----------------+-----------------------------------------------------------+-----------------------------------------------------+
   * | 1. 校验文件存在| 检查项目是否存在 package.json 文件，不存在则提示用户错误       | if (!(await this.containPackageJson())) { ... }      |
   * | 2. 读取内容    | 使用 readResourceContent 方法读取 package.json 的内容         | const fileContent = await this.readResourceContent...|
   * | 3. 解析内容    | 利用 jsoncparser 解析可能带注释的 JSONC 格式                   | const parseJson = jsoncparser.parse(fileContent);     |
   * | 4. 构造提示    | 将解析后的内容封装为 JSON 字符串，并构造 AI 请求提示             | const prompt = `我会给你...                           |
   * | 5. AI 请求    | 向 AI 后端发送请求，获取根据 scripts 自动生成的命令字符串         | const res = await this.aiBackService.request(prompt, ...|
   * | 6. 正则匹配    | 使用正则表达式匹配命令名称，尝试两种匹配方式                     | let match = res.data.match(regex) ...                |
   * | 7. 生成配置    | 根据匹配到的命令构造 DebugConfiguration 配置对象，并返回数组       | return [configuration];                             |
   * +----------------+-----------------------------------------------------------+-----------------------------------------------------+
   */
  public async getNodejsDebugConfigurations() {
    // 🚀 检查项目中是否存在 package.json 文件，不存在则提示用户并退出
    if (!(await this.containPackageJson())) {
      this.messageService.info('项目无 package.json，无法生成运行配置');
      return;
    }

    // 🚀 从 package.json 读取文件内容
    const fileContent = await this.readResourceContent(this.pkgUri!);

    // 🚀 解析 JSONC 格式内容，确保即使文件中包含注释也能正确处理
    const parseJson = jsoncparser.parse(fileContent);

    // 🚀 构造用于 AI 请求的 package.json 摘要信息
    const jsonContent = JSON.stringify(
      {
        name: parseJson.name || '',         // 📜 项目名称（若缺失默认为空字符串）
        version: parseJson.version || '',     // 📜 项目版本
        description: parseJson.description || '', // 📜 项目描述
        egg: parseJson.egg || '',             // 📜 egg 配置信息（业务相关，可为空）
        bin: parseJson.bin || '',             // 📜 bin 信息
        scripts: parseJson.scripts            // 📜 scripts 字段用于后续 AI 分析
      },
      undefined,
      1 // 🚀 格式化缩进为 1 空格，便于 AI 解析和阅读
    );

    // 🚀 构建 AI 提示信息文本，其中包含两个示例以指导 AI 返回合适的运行命令
    const prompt = `我会给你一个项目类型和 package.json 文件内容。你需要通过分析里面的 scripts 内容，找到合适的运行命令来启动项目。如果找到合适的命令后直接返回，不需要解释。请参照下面的示例问答的格式返回。
提问: 这是一个 node.js 项目，package.json 的文件内容是 \`\`\`
${JSON.stringify({
  scripts: { dev: 'npm run dev', test: 'npm run test' }
})}
\`\`\`
回答: "dev"
提问: 这是一个 front-end 项目，package.json 的文件内容是 \`\`\`
${JSON.stringify({
  scripts: { start: 'npm run start', build: 'npm run build' }
})}
\`\`\`
回答: "start"
提问: 这是一个 Node.js 项目，package.json 的文件内容是 \`\`\`
${jsonContent}
\`\`\`
`;

    // 🚀 开始 AI 报告统计，便于后续错误追踪
    const reportRelationId = this.aiReporter.start('aiRunFrontEnd', { message: 'aiRunFrontEnd' });

    // 🚀 发起 AI 请求，配置最大 token 数并禁用 GPT 缓存以获取最新响应
    const res = await this.aiBackService.request(prompt, {
      // @ts-ignore
      maxTokens: 1600,
      enableGptCache: false
    });

    // ⚠️ 注意：处理 AI 返回的错误情况，若响应数据无效或错误码不为 0，则结束报告并返回 undefined
    if (!res.data || res.errorCode !== 0) {
      res.errorMsg && this.messageService.info(res.errorMsg);
      this.aiReporter.end(reportRelationId, { message: 'aiRunFrontEndModelFetchError', success: false });
      return undefined;
    }

    // 🚀 利用正则表达式匹配 AI 返回字符串中的运行命令
    const regex = /(?:(?:npm|cnpm) run|yarn) (\w+)/; // 🔧 匹配如 "npm run dev" 格式的命令
    const backtickRegex = /`(?:(?:npm|cnpm) run|yarn) (\w+)`/; // 🔧 匹配被反引号包围的命令

    // 🚀 尝试使用基础正则匹配命令
    let match = res.data.match(regex);
    // 🚀 若未匹配到，再尝试匹配带反引号的格式
    if (!match) {
      match = res.data.match(backtickRegex);
    }

    let command = '';
    if (match) {
      command = match[1]; // 📜 提取到的命令名称
    } else {
      // ⚠️ 注意：若没有匹配到命令，则说明 AI 未返回预期格式，返回 undefined
      return undefined;
    }

    // 🚀 构造调试配置对象，配置项详见 DebugConfiguration 接口文档
    const configuration: DebugConfiguration = {
      name: `Run npm ${command}`, // 📜 配置名称，包含命令提示
      type: 'node',              // 📜 调试类型：node
      request: 'launch',         // 📜 请求类型：启动服务
      runtimeExecutable: 'npm',  // 📜 运行时依赖的可执行文件：npm
      runtimeArgs: ['run', `${command}`], // 📜 运行时参数，指定 npm 脚本命令
      cwd: '${workspaceFolder}', // 📜 当前工作目录使用占位符，实际由调试器渲染
      console: 'integratedTerminal', // 📜 使用集成终端显示输出
      autoPick: true             // 🚀 自动选择配置，无需用户手动干预
    };

    // 🚀 返回构造好的调试配置数组
    return [configuration];
  }
}
