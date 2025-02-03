// Start of Selection
/**
 * @file AITerminalDebugService.ts
 * @summary 本文件定义了 AITerminalDebugService 类，用于处理终端调试相关功能，包括错误信息的解析和自动生成提示内容。
 * @details
 *   该服务能够针对不同类型的错误（如 TypeScript、Shell 和 Java）分析终端报错信息，
 *   并生成带有详细上下文的提示信息，帮助开发者快速定位问题和获得改进建议。
 *
 * 🔧 配置项：使用 Dependency Injection 注入 IFileServiceClient 与 IWorkspaceService 依赖。
 * ⚠️ 注意事项：部分方法涉及文件 I/O 操作，可能受文件大小影响；请注意异常捕获和性能优化。
 */

import { Autowired, Injectable } from '@opensumi/di'; // 🔧 依赖注入装饰器
import { Disposable, URI } from '@opensumi/ide-core-common'; // 🔧 核心服务（Disposable 用于资源回收）
import { IFileServiceClient } from '@opensumi/ide-file-service'; // 🔧 文件服务客户端接口
import { IWorkspaceService } from '@opensumi/ide-workspace'; // 🔧 工作区服务接口

/**
 * MatcherType枚举定义了支持的错误类型。
 *
 * 功能描述：使用该枚举标识不同类别的错误类型，以便生成匹配的提示信息。
 *
 * @enum {number}
 * @property {number} base         - 基础错误类型
 * @property {number} npm          - npm 相关错误
 * @property {number} typescript   - TypeScript 相关错误
 * @property {number} node         - Node.js 相关错误
 * @property {number} shell        - Shell 相关错误
 * @property {number} java         - Java 相关错误
 */
export enum MatcherType {
  base,       // 基础错误类型
  npm,        // npm相关错误
  typescript, // TypeScript相关错误
  node,       // Node.js相关错误
  shell,      // Shell相关错误
  java,       // Java相关错误
}

/**
 * MatchResult接口定义了错误匹配结果的数据结构。
 *
 * 功能描述：用于封装错误信息、错误类型及操作指令的匹配结果，供提示生成模块使用。
 *
 * @interface
 * @property {MatcherType} type       - 错误类型（枚举）
 * @property {string} [input]         - 用户输入信息（可选）
 * @property {string} errorText       - 错误信息文本
 * @property {'debug'|'explain'} operate - 指定操作类型，'debug'表示调试，'explain'表示解释
 */
export interface MatchResult {
  type: MatcherType;
  input?: string;
  errorText: string;
  operate: 'debug' | 'explain';
}

@Injectable() // 🔧 标记为可注入服务
export class AITerminalDebugService extends Disposable {
  @Autowired(IFileServiceClient) // 注入文件服务客户端
  private fileServiceClient: IFileServiceClient;

  @Autowired(IWorkspaceService) // 注入工作区服务
  workspaceService: IWorkspaceService;

  /**
   * 获取操作前缀信息
   *
   * 功能描述：根据传入的操作类型返回对应的文本前缀，用于构造调试或解释提示消息。
   *
   * @param {'debug'|'explain'} operate - 操作类型，'debug'表示调试错误；'explain'表示解释错误
   * @returns {string} 返回操作前缀。例如：'分析以下内容' 或 '解释以下内容'
   *
   * 🚀 性能优化：该方法仅进行简单的条件判断，时间复杂度为 O(1)
   */
  private getMessagePrefix(operate: 'debug' | 'explain'): string {
    return operate === 'debug' ? '分析以下内容' : '解释以下内容';
  }

  /**
   * 生成错误提示信息
   *
   * 功能描述：根据错误匹配结果选择调用合适的提示生成方法，支持 TypeScript、Shell、Java 和基础类型提示。
   *
   * @param {MatchResult} result - 包含错误信息、错误类型及操作类型的匹配结果
   * @returns {Promise<{ message: string; prompt: string }>} Promise 对象，返回生成的消息与详细提示内容
   *
   * ⚠️ 注意：不同错误类型调用不同提示生成逻辑，扩展时需确保各分支逻辑的一致性
   */
  public async generatePrompt(result: MatchResult): Promise<{ message: string; prompt: string }> {
    switch (result.type) {
      case MatcherType.typescript:
        return await this.generateTsPrompt(result); // 调用 TypeScript 提示生成方法
      case MatcherType.shell:
        return await this.generateShellPrompt(result); // 调用 Shell 提示生成方法
      case MatcherType.java:
        return await this.generateJavaPrompt(result); // 调用 Java 提示生成方法
      default:
        return this.generateBasePrompt(result); // 调用基础错误提示生成方法
    }
  }

  /**
   * 生成基础错误提示信息
   *
   * 功能描述：构造一个通用的错误提示内容，适用于未明确分类的错误情况。
   *
   * @param {MatchResult} result - 错误匹配结果对象，包含错误文本和操作类型
   * @returns {{ message: string; prompt: string }} 返回包含格式化错误消息和提示文本的对象
   *
   * 🔧 历史背景：此方法最初用于提供简单错误提示，当前仍作为默认提示策略使用
   */
  public generateBasePrompt(result: MatchResult): { message: string; prompt: string } {  
    const message = `${this.getMessagePrefix(result.operate)}：\`\`\`\n${result.errorText}\`\`\``; // 根据操作类型构造消息前缀
    const prompt = `在 IDE 中进行研发时，终端输出了一些报错信息，其中可能存在多个报错，需要你分别给出每个报错的解决方案，报错信息如下：\`\`\`\n${result.errorText}\n\`\`\``;
    return { message, prompt };
  }

  /**
   * 生成 TypeScript 错误提示信息
   *
   * 功能描述：尝试从错误文本中提取文件位置，并解析出相应的代码片段（包含上下文 20 行代码），以便生成详细的提示信息。
   *
   * @param {MatchResult} result - 包含 TypeScript 错误描述及操作类型的匹配结果
   * @returns {Promise<{ message: string; prompt: string }>} 返回 Promise 对象，包含格式化消息和详细提示文本
   *
   * 🚀 性能优化：涉及文件 I/O 和字符串处理，受文件大小影响；建议对频繁读取操作进行缓存优化
   */
  public async generateTsPrompt(result: MatchResult): Promise<{ message: string; prompt: string }> {
    const message = `${this.getMessagePrefix(result.operate)}：\`\`\`\n${result.errorText}\`\`\``;
    let prompt = '';
    const fileInfo = this.pickFileInfo(result.errorText); // 从错误文本中提取文件信息

    if (fileInfo?.path && fileInfo?.row && fileInfo?.col) { // 当匹配到文件路径、行号和列号
      try {
        // 调用解析代码片段方法，注意：类型转换将 row 字符串转换为 number
        const codeSnippet = await this.resolveCodeSnippet(fileInfo.path, +fileInfo.row);
        if (codeSnippet) {
          // 构造包含代码行上下文和错误提示的详细信息
          prompt = `
          在 IDE 中进行研发时，终端输出了一些与 TypeScript 有关的报错信息。
          错误中的代码行内的代码为: \`${codeSnippet.lineCode}\`
          代码行附近的 20 行代码为: \`\`\`\n${codeSnippet.snippet.join('\n')}\n\`\`\`
          错误信息如下: ${result.errorText}
          请给予上面的信息给出解决方案和代码建议
          `;
        }
      } catch {
        // 异常捕获：返回基础提示，保证服务稳定性
        prompt = `在 IDE 中进行研发时，终端输出了一些报错信息，其中可能存在多个报错，需要你分别给出每个报错的解决方案，报错信息如下：\`\`\`\n${result.errorText}\n\`\`\``;
      }
    }

    return { message, prompt };
  }

  /**
   * 从错误信息中提取文件信息
   *
   * 功能描述：利用正则表达式从报错文本中匹配文件路径、行号和列号。支持 TS/TSX 文件格式。
   *
   * @param {string} errorText - 终端报错字符串
   * @returns {{ path: string; row: string; col: string } | undefined} 若匹配成功则返回包含路径、行号、列号的对象，否则返回 undefined
   *
   * 🔧 历史背景：该方法为早期错误解析模块的重要组成部分，目前仍作为基础数据提取方法使用
   * 🚀 性能优化：正则表达式匹配操作的效率通常较高，适用于报错文本长度有限的场景
   */
  public pickFileInfo(errorText: string): { path: string; row: string; col: string } | undefined {
    // 定义正则表达式，使用命名捕获组 (?<name>) 匹配文件路径及定位信息
    const fileReg = /(?<path>[\w\/]+\.tsx?):(?<row>\d+):(?<col>\d+)/;
    const match = fileReg.exec(errorText); // 执行匹配
    return match ? match.groups as { path: string; row: string; col: string } : undefined;
  }

  /**
   * 解析指定文件的代码片段
   *
   * 功能描述：读取文件内容，并返回目标代码行及其周围上下文代码，便于在提示中展示代码环境。
   *
   * @param {string} filePath - 文件路径（相对于工作区根目录）
   * @param {number} row - 目标代码所在行号（1-indexed）
   * @returns {Promise<{ snippet: string[]; lineCode: string } | undefined>}
   *          Promise 对象，解析成功时返回包含目标行代码和上下文代码片段的对象；否则返回 undefined
   *
   * 🔧 配置项：上下文行范围固定为目标行上下各 10 行，总共 20 行代码片段
   * 🚀 性能优化：文件读取操作时间复杂度 O(m)（m 为文件行数）；之后的数组切片操作为 O(1)
   *
   * 以下为代码片段提取算法核心步骤：
   *
   * | 步骤序号 | 步骤描述                              | 实现代码                                                      |
   * |----------|---------------------------------------|---------------------------------------------------------------|
   * | 1        | 获取工作区根 URI                      | this.workspaceService.getWorkspaceRootUri(undefined)          |
   * | 2        | 解析文件 URI                          | workspaceFolderUri.resolve(filePath)                          |
   * | 3        | 读取文件内容，并拆分为行数组            | fileContent.content.toString().split('\n')                     |
   * | 4        | 提取目标行及上下文代码（前后各10行）     | fileContentLineArray.slice(Math.max(0, row - 10), row + 10)      |
   * | 5        | 获取目标行代码（行号从1开始）           | fileContentLineArray[+row - 1]                                  |
   */
  public async resolveCodeSnippet(filePath: string, row: number): Promise<{ snippet: string[]; lineCode: string } | undefined> {
    // 获取当前工作区根目录的 URI，若不存在则提前返回
    const workspaceFolderUri = this.workspaceService.getWorkspaceRootUri(undefined);
    if (!workspaceFolderUri) return;
    // 利用工作区根 URI 解析目标文件的完整 URI
    const fileUri = workspaceFolderUri.resolve(filePath);
    // 读取文件内容（文件内容为 Buffer 或字符串），转换为文本后按行拆分
    const fileContent = await this.fileServiceClient.readFile(fileUri.toString());
    const fileContentLineArray = fileContent.content.toString().split('\n');

    return fileContentLineArray.length ? {
      snippet: fileContentLineArray.slice(Math.max(0, row - 10), row + 10),
      lineCode: fileContentLineArray[+row - 1]
    } : undefined;
  }

  /**
   * 生成 Shell 错误提示信息
   *
   * 功能描述：针对命令行报错，根据错误文本及用户输入信息来构造提示内容，辅助用户定位命令问题。
   *
   * @param {MatchResult} result - 包含 Shell 错误信息和可能的用户输入信息的匹配结果
   * @returns {Promise<{ message: string; prompt: string }>} 返回 Promise 对象，包含格式化后的消息及提示内容
   *
   * 🔧 配置项：若存在用户输入，则将其嵌入提示文本中，增强提示的针对性
   */
  public async generateShellPrompt(result: MatchResult): Promise<{ message: string; prompt: string }> {
    const message = `${this.getMessagePrefix(result.operate)}：\`\`\`\n${result.errorText}\`\`\``;
    // 根据用户是否提供输入信息动态构造提示文本
    const inputPrompt = `请结合我的输入信息给出具体解决方案:输入信息：${result.input}，`;
    const prompt = `在终端中输入命令遇到了报错，${result.input ? inputPrompt : '请给出可能的解决方案'}，报错信息：\`\`\`\n${result.errorText}\n\`\`\` `;
    return { message, prompt };
  }

  /**
   * 生成 Java 错误提示信息
   *
   * 功能描述：对 Java 报错信息进行简化处理，截取前 10 行堆栈信息以避免生成过长文本，并构造相应的提示内容。
   *
   * @param {MatchResult} result - 包含 Java 错误信息及操作类型的匹配结果
   * @returns {Promise<{ message: string; prompt: string }>} 返回 Promise 对象，包含格式化后的消息及简化提示内容
   *
   * ⚠️ 注意：为防止 token 超限问题，仅取堆栈信息的前 10 行进行提示生成
   */
  public async generateJavaPrompt(result: MatchResult): Promise<{ message: string; prompt: string }> {
    const message = `${this.getMessagePrefix(result.operate)}：\`\`\`\n${result.errorText}\`\`\``;
    const errorTextArray = result.errorText.split('\n'); // 将错误信息拆分为行
    // 截取前 10 行堆栈信息（过长信息可能影响生成效果）
    const errorText = errorTextArray.slice(0, 10).join('\n');
    const prompt = `Java应用程序在运行过程中产生了一些报错，请根据报错信息，给出可能的解决方案，报错信息如下：\`\`\`\n${errorText}\n\`\`\` `;
    return { message, prompt };
  }
}
// End of Selectio