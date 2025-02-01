// 该类实现了与AI聊天服务的交互，提供代码解释、注释、测试和优化功能。
// 主要用于在代码编辑器中获取选中的代码片段，并通过AI服务进行处理。

import { Autowired, Injectable } from "@opensumi/di";
import { ChatService } from "@opensumi/ide-ai-native/lib/browser/chat/chat.api.service";
import { InlineChatController } from "@opensumi/ide-ai-native/lib/browser/widget/inline-chat/inline-chat-controller";
import { AIBackSerivcePath, CancellationToken, ChatServiceToken, IAIBackService } from "@opensumi/ide-core-common";
import { ICodeEditor } from "@opensumi/ide-monaco";
import { commentsPrompt, explainPrompt, optimizePrompt, testPrompt } from "./prompt";
import { EInlineOperation } from './constants';

@Injectable()
export class InlineChatOperationModel {
  @Autowired(AIBackSerivcePath)
  private readonly aiBackService: IAIBackService; // 🔧 AI后端服务

  @Autowired(ChatServiceToken)
  private readonly aiChatService: ChatService; // 🔧 AI聊天服务

  /**
   * 获取选中的代码片段
   * 
   * 功能描述：从给定的代码编辑器中获取跨行的代码片段。
   * 
   * @param monacoEditor ICodeEditor - 代码编辑器实例
   * @returns string - 选中的代码片段
   */
  private getCrossCode(monacoEditor: ICodeEditor): string {
    const model = monacoEditor.getModel(); // 获取当前模型
    if (!model) {
      return ''; // 如果没有模型，返回空字符串
    }

    const selection = monacoEditor.getSelection(); // 获取当前选中的区域

    if (!selection) {
      return ''; // 如果没有选中区域，返回空字符串
    }

    // 设置跨行选择，从选中区域的开始行到结束行的最大列
    const crossSelection = selection
      .setStartPosition(selection.startLineNumber, 1)
      .setEndPosition(selection.endLineNumber, Number.MAX_SAFE_INTEGER);
    const crossCode = model.getValueInRange(crossSelection); // 获取选中区域的代码
    return crossCode; // 返回选中的代码
  }

  /**
   * 解释选中的代码
   * 
   * 功能描述：将选中的代码发送给AI服务进行解释。
   * 
   * @param monacoEditor ICodeEditor - 代码编辑器实例
   * @returns void
   */
  public [EInlineOperation.Explain](monacoEditor: ICodeEditor): void {
    const model = monacoEditor.getModel(); // 获取当前模型
    if (!model) {
      return; // 如果没有模型，直接返回
    }

    const crossCode = this.getCrossCode(monacoEditor); // 获取选中的代码

    // 发送消息给AI聊天服务进行代码解释
    this.aiChatService.sendMessage({
      message: `解释以下代码: \n\`\`\`${model.getLanguageId()}\n${crossCode}\n\`\`\``,
      prompt: explainPrompt(model.getLanguageId(), crossCode), // 生成解释提示
    });
  }

  /**
   * 为选中的代码生成注释
   * 
   * 功能描述：将选中的代码发送给AI服务生成注释，并返回控制器。
   * 
   * @param editor ICodeEditor - 代码编辑器实例
   * @param token CancellationToken - 取消令牌
   * @returns Promise<InlineChatController> - 返回控制器实例
   */
  public async [EInlineOperation.Comments](editor: ICodeEditor, token: CancellationToken): Promise<InlineChatController> {
    const crossCode = this.getCrossCode(editor); // 获取选中的代码
    const prompt = commentsPrompt(crossCode); // 生成注释提示

    const controller = new InlineChatController({ enableCodeblockRender: true }); // 创建控制器实例
    const stream = await this.aiBackService.requestStream(prompt, {}, token); // 请求AI服务流
    controller.mountReadable(stream); // 挂载可读流

    return controller; // 返回控制器
  }

  /**
   * 为选中的代码生成单元测试
   * 
   * 功能描述：将选中的代码发送给AI服务生成单元测试。
   * 
   * @param editor ICodeEditor - 代码编辑器实例
   * @returns void
   */
  public [EInlineOperation.Test](editor: ICodeEditor): void {
    const model = editor.getModel(); // 获取当前模型
    if (!model) {
      return; // 如果没有模型，直接返回
    }

    const crossCode = this.getCrossCode(editor); // 获取选中的代码
    const prompt = testPrompt(crossCode); // 生成测试提示

    // 发送消息给AI聊天服务进行单元测试生成
    this.aiChatService.sendMessage({
      message: `为以下代码写单测：\n\`\`\`${model.getLanguageId()}\n${crossCode}\n\`\`\``,
      prompt,
    });
  }

  /**
   * 优化选中的代码
   * 
   * 功能描述：将选中的代码发送给AI服务进行优化，并返回控制器。
   * 
   * @param editor ICodeEditor - 代码编辑器实例
   * @param token CancellationToken - 取消令牌
   * @returns Promise<InlineChatController> - 返回控制器实例
   */
  public async [EInlineOperation.Optimize](editor: ICodeEditor, token: CancellationToken): Promise<InlineChatController> {
    const crossCode = this.getCrossCode(editor); // 获取选中的代码
    const prompt = optimizePrompt(crossCode); // 生成优化提示

    const controller = new InlineChatController({ enableCodeblockRender: true }); // 创建控制器实例
    const stream = await this.aiBackService.requestStream(prompt, {}, token); // 请求AI服务流
    controller.mountReadable(stream); // 挂载可读流

    return controller; // 返回控制器
  }

}