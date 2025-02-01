/**
 * AITerminalDebugService类负责处理终端调试相关的功能。
 * 该服务通过分析终端输出的错误信息，生成相应的提示信息，帮助用户解决问题。
 * 
 * ⚙️ 功能描述：
 * - 该类实现了终端调试的逻辑，包括生成不同类型的提示信息。
 * - 支持的错误类型包括 TypeScript、Shell 和 Java。
 */

import { Autowired, Injectable } from '@opensumi/di'; // 引入依赖注入装饰器
import { Disposable, URI } from '@opensumi/ide-core-common'; // 引入核心服务
import { IFileServiceClient } from '@opensumi/ide-file-service'; // 引入文件服务客户端
import { IWorkspaceService } from '@opensumi/ide-workspace'; // 引入工作区服务

/**
 * MatcherType枚举定义了支持的错误类型。
 */
export enum MatcherType {
  base, // 基础错误类型
  npm, // npm相关错误
  typescript, // TypeScript相关错误
  node, // Node.js相关错误
  shell, // Shell相关错误
  java, // Java相关错误
}

/**
 * MatchResult接口定义了匹配结果的结构。
 */
export interface MatchResult {
  type: MatcherType; // 错误类型
  input?: string; // 用户输入（可选）
  errorText: string; // 错误信息文本
  operate: 'debug' | 'explain'; // 操作类型，debug或explain
}

@Injectable() // 注入服务
export class AITerminalDebugService extends Disposable {
  @Autowired(IFileServiceClient) // 注入文件服务客户端
  private fileServiceClient: IFileServiceClient;

  @Autowired(IWorkspaceService) // 注入工作区服务
  workspaceService: IWorkspaceService;

  /**
   * 获取操作前缀信息。
   * 
   * @param operate - 操作类型，'debug'或'explain'。
   * @returns {string} 返回操作前缀信息。
   */
  private getMessagePrefix(operate: 'debug' | 'explain') {
    return operate === 'debug' ? '分析以下内容' : '解释以下内容';
  }

  /**
   * 生成提示信息。
   * 
   * @param result - 匹配结果，包含错误类型和错误信息。
   * @returns {Promise<{ message: string; prompt: string }>} 返回生成的提示信息。
   */
  public async generatePrompt(result: MatchResult) {
    switch (result.type) {
      case MatcherType.typescript:
        return await this.generateTsPrompt(result); // 生成TypeScript提示
      case MatcherType.shell:
        return await this.generateShellPrompt(result); // 生成Shell提示
      case MatcherType.java:
        return await this.generateJavaPrompt(result); // 生成Java提示
      default:
        return this.generateBasePrompt(result); // 生成基础提示
    }
  }

  /**
   * 生成基础提示信息。
   * 
   * @param result - 匹配结果，包含错误信息。
   * @returns {{ message: string; prompt: string }} 返回基础提示信息。
   */
  public generateBasePrompt(result: MatchResult) {  
    const message = `${this.getMessagePrefix(result.operate)}：\`\`\`\n${result.errorText}\`\`\``; // 生成消息前缀
    const prompt = `在 IDE 中进行研发时，终端输出了一些报错信息，其中可能存在多个报错，需要你分别给出每个报错的解决方案，报错信息如下：\`\`\`\n${result.errorText}\n\`\`\``; // 生成提示内容

    return { message, prompt }; // 返回消息和提示
  }

  /**
   * 生成TypeScript相关的提示信息。
   * 
   * @param result - 匹配结果，包含错误信息。
   * @returns {Promise<{ message: string; prompt: string }>} 返回生成的TypeScript提示信息。
   */
  public async generateTsPrompt(result: MatchResult) {
    const message = `${this.getMessagePrefix(result.operate)}：\`\`\`\n${result.errorText}\`\`\``; // 生成消息前缀
    let prompt = ''; // 初始化提示内容
    const fileInfo = this.pickFileInfo(result.errorText); // 提取文件信息

    if (fileInfo?.path && fileInfo?.row && fileInfo?.col) { // 如果文件信息存在
      try {
        const codeSnippet = await this.resolveCodeSnippet(fileInfo.path, +fileInfo.row); // 解析代码片段
        if (codeSnippet) {
          prompt = `
          在 IDE 中进行研发时，终端输出了一些与 typescript 有关的报错信息。
          错误中的代码行内的代码为: \`${codeSnippet.lineCode}\`
          代码行附近的 20 行代码为: \`\`\`\n${codeSnippet.snippet.join('\n')}\n\`\`\`
          错误信息如下: ${result.errorText}
          请给予上面的信息给出解决方案和代码建议
          `;
        }
      } catch {
        prompt = `在 IDE 中进行研发时，终端输出了一些报错信息，其中可能存在多个报错，需要你分别给出每个报错的解决方案，报错信息如下：\`\`\`\n${result.errorText}\n\`\`\``; // 捕获异常，生成默认提示
      }
    }

    return { message, prompt }; // 返回消息和提示
  }

  /**
   * 提取错误信息中的文件信息。
   * 
   * @param errorText - 错误信息文本。
   * @returns {undefined | { path: string; row: string; col: string }} 返回提取的文件信息或undefined。
   */
  public pickFileInfo(errorText: string) {
    const fileReg = /(?<path>[\w\/]+\.tsx?):(?<row>\d+):(?<col>\d+)/; // 正则表达式匹配文件路径、行号和列号

    const match = fileReg.exec(errorText); // 执行匹配

    return match ? match.groups as { path: string; row: string; col: string } : undefined; // 返回匹配结果
  }

  /**
   * 解析指定文件的代码片段。
   * 
   * @param filePath - 文件路径。
   * @param row - 行号。
   * @returns {Promise<{ snippet: string[]; lineCode: string } | undefined>} 返回代码片段和行内代码。
   */
  public async resolveCodeSnippet(filePath: string, row: number) {
    const workspaceFolderUri = this.workspaceService.getWorkspaceRootUri(undefined); // 获取工作区根URI
    if (!workspaceFolderUri) return; // 如果工作区根URI不存在，返回
    const fileUri = workspaceFolderUri.resolve(filePath); // 解析文件URI
    const fileContent = await this.fileServiceClient.readFile(fileUri.toString()); // 读取文件内容
    const fileContentLineArray = fileContent.content.toString().split('\n'); // 按行分割文件内容

    return fileContentLineArray.length ? {
      snippet: fileContentLineArray.slice(Math.max(0, row - 10), row + 10), // 获取指定行附近的代码片段
      lineCode:  fileContentLineArray[+row - 1] // 获取指定行的代码
    } : undefined; // 返回代码片段或undefined
  }

  /**
   * 生成Shell相关的提示信息。
   * 
   * @param result - 匹配结果，包含错误信息。
   * @returns {Promise<{ message: string; prompt: string }>} 返回生成的Shell提示信息。
   */
  public async generateShellPrompt(result: MatchResult) {
    const message = `${this.getMessagePrefix(result.operate)}：\`\`\`\n${result.errorText}\`\`\``; // 生成消息前缀
    const inputPrompt = `请结合我的输入信息给出具体解决方案:输入信息：${result.input}，`; // 用户输入提示
    const prompt = `在终端中输入命令遇到了报错，${result.input ? inputPrompt : '请给出可能的解决方案'}，报错信息：\`\`\`\n${result.errorText}\n\`\`\` `; // 生成提示内容

    return { message, prompt }; // 返回消息和提示
  }

  /**
   * 生成Java相关的提示信息。
   * 
   * @param result - 匹配结果，包含错误信息。
   * @returns {Promise<{ message: string; prompt: string }>} 返回生成的Java提示信息。
   */
  public async generateJavaPrompt(result: MatchResult) {
    const message = `${this.getMessagePrefix(result.operate)}：\`\`\`\n${result.errorText}\`\`\``; // 生成消息前缀

    const errorTextArray = result.errorText.split('\n'); // 按行分割错误信息
    // 截取 10 行堆栈信息，过多会导致 token 超出上限
    const errorText = errorTextArray.slice(0, 10).join('\n'); // 获取前10行错误信息
    const prompt = `Java应用程序在运行过程中产生了一些报错，请根据报错信息，给出可能的解决方案，报错信息如下：\`\`\`\n${errorText}\n\`\`\` `; // 生成提示内容

    return { message, prompt }; // 返回消息和提示
  }
}