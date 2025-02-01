/**
 * AINativeContribution类用于注册AI相关功能，包括聊天功能和命令处理。
 * 
 * ⚙️ 功能描述：
 * - 该类实现了ComponentContribution和AINativeCoreContribution接口，负责注册组件和聊天功能。
 * - 提供了多种命令的注册，包括解释代码、生成单测、优化代码等。
 * 
 * 🔧 配置项：
 * - 使用@Autowired注解注入所需的服务和组件。
 * 
 * ⚠️ 注意事项：
 * - 确保在使用该类之前，已正确配置相关依赖服务。
 */

import { Autowired } from '@opensumi/di'; // 引入依赖注入装饰器
import {
  AIBackSerivcePath, // AI后端服务路径
  ChatServiceToken, // 聊天服务令牌
  getDebugLogger, // 获取调试日志记录器
  IChatContent, // 聊天内容接口
  IChatProgress, // 聊天进度接口
  IAIBackService, // AI后端服务接口
  CancellationToken, // 取消令牌
  ChatResponse, // 聊天响应
  ECodeEditsSourceTyping, // 代码编辑源类型
} from '@opensumi/ide-core-common'; // 引入核心命令和类型
import { ClientAppContribution, Domain, getIcon } from '@opensumi/ide-core-browser'; // 引入浏览器相关类型
import { ComponentContribution, ComponentRegistry } from '@opensumi/ide-core-browser/lib/layout'; // 引入组件注册相关类型
import { AINativeCoreContribution, ERunStrategy, IChatFeatureRegistry, IInlineChatFeatureRegistry, IIntelligentCompletionsRegistry, IProblemFixContext, IProblemFixProviderRegistry, IRenameCandidatesProviderRegistry, ITerminalProviderRegistry, TChatSlashCommandSend, TerminalSuggestionReadableStream } from '@opensumi/ide-ai-native/lib/browser/types'; // 引入AI相关类型
import { ICodeEditor, MarkdownString, NewSymbolNameTag, Range } from '@opensumi/ide-monaco'; // 引入代码编辑器相关类型
import { MessageService } from '@opensumi/ide-overlay/lib/browser/message.service'; // 引入消息服务
import { BaseTerminalDetectionLineMatcher, JavaMatcher, MatcherType, NodeMatcher, NPMMatcher, ShellMatcher, TSCMatcher } from '@opensumi/ide-ai-native/lib/browser/contrib/terminal/matcher'; // 引入终端匹配器
import { ChatService } from '@opensumi/ide-ai-native/lib/browser/chat/chat.api.service'; // 引入聊天服务
import { InlineChatController } from '@opensumi/ide-ai-native/lib/browser/widget/inline-chat/inline-chat-controller'; // 引入内联聊天控制器
import { ITerminalCommandSuggestionDesc } from '@opensumi/ide-ai-native/lib/common'; // 引入终端命令建议描述
import { listenReadable } from '@opensumi/ide-utils/lib/stream'; // 引入可读流监听器

import { AI_MENU_BAR_LEFT_ACTION, EInlineOperation } from './constants'; // 引入常量
import { LeftToolbar } from './components/left-toolbar'; // 引入左侧工具栏组件
import { explainPrompt, testPrompt, optimizePrompt, detectIntentPrompt, RenamePromptManager, terminalCommandSuggestionPrompt, codeEditsLintErrorPrompt } from './prompt'; // 引入提示相关函数
import { CommandRender } from './command/command-render'; // 引入命令渲染器
import { AITerminalDebugService } from './ai-terminal-debug.service'; // 引入AI终端调试服务
import { InlineChatOperationModel } from './inline-chat-operation'; // 引入内联聊天操作模型
import { AICommandService } from './command/command.service'; // 引入AI命令服务
import hiPng from './assets/hi.png'; // 引入欢迎图标
import { ILinterErrorData } from '@opensumi/ide-ai-native/lib/browser/contrib/intelligent-completions/source/lint-error.source'; // 引入Lint错误数据接口

@Domain(ComponentContribution, AINativeCoreContribution) // 定义域
export class AINativeContribution implements ComponentContribution, AINativeCoreContribution {
  @Autowired(MessageService) // 注入消息服务
  protected readonly messageService: MessageService;

  @Autowired(AITerminalDebugService) // 注入终端调试服务
  protected readonly terminalDebugService: AITerminalDebugService;

  @Autowired(ChatServiceToken) // 注入聊天服务
  private readonly chatService: ChatService;

  @Autowired(InlineChatOperationModel) // 注入内联聊天操作模型
  inlineChatOperationModel: InlineChatOperationModel;

  @Autowired(AIBackSerivcePath) // 注入AI后端服务
  private aiBackService: IAIBackService;

  @Autowired(AICommandService) // 注入AI命令服务
  aiCommandService: AICommandService;

  logger = getDebugLogger(); // 获取调试日志记录器

  /**
   * 注册组件到组件注册表
   * 
   * 🔧 参数说明：
   * - registry: ComponentRegistry - 组件注册表
   * 
   * 🚀 返回值说明：
   * - void - 无返回值
   */
  registerComponent(registry: ComponentRegistry): void {
    registry.register(AI_MENU_BAR_LEFT_ACTION, { // 注册左侧菜单栏组件
      id: AI_MENU_BAR_LEFT_ACTION,
      component: LeftToolbar,
    });
  }

  /**
   * 注册聊天功能到聊天功能注册表
   * 
   * 🔧 参数说明：
   * - registry: IChatFeatureRegistry - 聊天功能注册表
   * 
   * 🚀 返回值说明：
   * - void - 无返回值
   */
  registerChatFeature(registry: IChatFeatureRegistry): void {
    registry.registerWelcome( // 注册欢迎信息
      new MarkdownString(`<img src="${hiPng}" />
      嗨，我是您的专属 AI 小助手，我在这里回答有关代码的问题，并帮助您思考</br>您可以提问我一些关于代码的问题`),
      [
        {
          icon: getIcon('send-hollow'), // 设置图标
          title: '生成 Java 快速排序算法', // 设置标题
          message: '生成 Java 快速排序算法', // 设置消息
        },
      ],
    );

    /**
     * 拦截执行命令并处理输入
     * 
     * 🔧 参数说明：
     * - value: string - 输入的命令
     * - slash: string - 命令前缀
     * - editor?: ICodeEditor - 可选的代码编辑器实例
     * 
     * 🚀 返回值说明：
     * - string - 处理后的命令
     */
    const interceptExecute = (value: string, slash: string, editor?: ICodeEditor): string => {
      if (!editor) {
        return ''; // 如果没有编辑器，返回空字符串
      }
      const model = editor.getModel(); // 获取编辑器模型

      const selection = editor.getSelection(); // 获取选中的文本
      let selectCode: string | undefined;
      if (selection) {
        selectCode = model!.getValueInRange(selection); // 获取选中范围的代码
      }

      const parseValue = value.replace(slash, ''); // 解析命令

      if (!parseValue.trim()) { // 如果解析后的命令为空
        if (!selectCode) {
          this.messageService.info('很抱歉，您并未选中或输入任何代码，请先选中或输入代码'); // 提示用户
          return ''; // 返回空字符串
        }

        return value + `\n\`\`\`${model?.getLanguageId()}\n${selectCode}\n\`\`\``; // 返回包含选中代码的命令
      }

      return value; // 返回原始命令
    };

    // 注册解释代码的命令
    registry.registerSlashCommand(
      {
        name: 'Explain', // 命令名称
        description: '解释代码', // 命令描述
        isShortcut: true, // 是否为快捷方式
        tooltip: '解释代码', // 工具提示
      },
      {
        providerInputPlaceholder(_value, _editor) {
          return '请输入或者粘贴代码'; // 输入占位符
        },
        providerPrompt(value: string, editor?: ICodeEditor) {
          if (!editor) {
            return value; // 如果没有编辑器，返回原始值
          }
          const parseValue = value.replace('/Explain', ''); // 解析命令
          const model = editor.getModel(); // 获取编辑器模型
          return explainPrompt(model?.getLanguageId() || '', parseValue); // 返回解释提示
        },
        execute: (value: string, send: TChatSlashCommandSend, editor?: ICodeEditor) => {
          const parseValue = interceptExecute(value, '/Explain', editor); // 拦截执行命令

          if (!parseValue) {
            return; // 如果没有解析值，返回
          }

          send(parseValue); // 发送命令
        },
      },
    );

    // 注册生成单测的命令
    registry.registerSlashCommand(
      {
        name: 'Test', // 命令名称
        description: '生成单测', // 命令描述
        isShortcut: true, // 是否为快捷方式
        tooltip: '生成单测' // 工具提示
      },
      {
        providerInputPlaceholder(_value, _editor) {
          return '请输入或者粘贴代码'; // 输入占位符
        },
        providerPrompt(value: string, editor?: ICodeEditor) {
          if (!editor) {
            return value; // 如果没有编辑器，返回原始值
          }
          const parseValue = value.replace('/Text', ''); // 解析命令
          return testPrompt(parseValue); // 返回生成单测的提示
        },
        execute: (value: string, send: TChatSlashCommandSend, editor?: ICodeEditor) => {
          const parseValue = interceptExecute(value, '/Text', editor); // 拦截执行命令

          if (!parseValue) {
            return; // 如果没有解析值，返回
          }

          send(parseValue); // 发送命令
        },
      },
    );

    // 注册优化代码的命令
    registry.registerSlashCommand(
      {
        name: 'Optimize', // 命令名称
        description: '优化代码', // 命令描述
        isShortcut: true, // 是否为快捷方式
        tooltip: '优化代码' // 工具提示
      },
      {
        providerInputPlaceholder(_value, _editor) {
          return '请输入或者粘贴代码'; // 输入占位符
        },
        providerPrompt(value: string, editor?: ICodeEditor) {
          if (!editor) {
            return value; // 如果没有编辑器，返回原始值
          }
          const parseValue = value.replace('/Optimize', ''); // 解析命令
          return optimizePrompt(parseValue); // 返回优化提示
        },
        execute: (value: string, send: TChatSlashCommandSend, editor?: ICodeEditor) => {
          const parseValue = interceptExecute(value, '/Optimize', editor); // 拦截执行命令

          if (!parseValue) {
            return; // 如果没有解析值，返回
          }

          send(parseValue); // 发送命令
        },
      },
    );

    // 注册执行IDE相关命令的命令
    registry.registerSlashCommand(
      {
        name: 'IDE', // 命令名称
        description: '执行 IDE 相关命令', // 命令描述
      },
      {
        providerInputPlaceholder(_value, _editor) {
          return '可以问我任何问题，或键入主题 \"/\"'; // 输入占位符
        },
        providerRender: CommandRender, // 渲染命令
        execute: (value: string, send: TChatSlashCommandSend) => {
          const parseValue = value.replace('/IDE', ''); // 解析命令

          if (!parseValue) {
            this.messageService.warning('请输入要执行的 IDE 命令'); // 提示用户
            return; // 返回
          }

          send(parseValue); // 发送命令
        },
      },
    );
  }

  /**
   * 注册内联聊天功能到内联聊天功能注册表
   * 
   * 🔧 参数说明：
   * - registry: IInlineChatFeatureRegistry - 内联聊天功能注册表
   * 
   * 🚀 返回值说明：
   * - void - 无返回值
   */
  registerInlineChatFeature(registry: IInlineChatFeatureRegistry) {
    // 注册终端解释功能
    registry.registerTerminalInlineChat(
      {
        id: 'terminal-explain', // 功能ID
        name: 'Explain', // 功能名称
        title: '解释选中的内容' // 功能标题
      },
      {
        triggerRules: 'selection', // 触发规则
        execute: async (stdout: string) => {
          const { message, prompt } = await this.terminalDebugService.generatePrompt({ // 生成提示
            type: MatcherType.base, // 匹配器类型
            errorText: stdout, // 错误文本
            operate: 'explain' // 操作类型
          });

          this.chatService.sendMessage({ // 发送消息
            message,
            prompt,
            reportType: 'terminal-selection-explain' as any // 报告类型
          });
        },
      },
    );

    // 注册终端调试功能
    registry.registerTerminalInlineChat(
      {
        id: 'terminal-debug', // 功能ID
        name: 'debug', // 功能名称
        title: '分析选中内容' // 功能标题
      },
      {
        triggerRules: [ // 触发规则
          NodeMatcher,
          TSCMatcher,
          NPMMatcher,
          ShellMatcher,
          JavaMatcher,
        ],
        execute: async (stdout: string, _stdin: string, rule?: BaseTerminalDetectionLineMatcher) => {
          const { message, prompt } = await this.terminalDebugService.generatePrompt({ // 生成提示
            type: rule!.type, // 匹配器类型
            errorText: stdout, // 错误文本
            operate: 'debug' // 操作类型
          });

          this.chatService.sendMessage({ // 发送消息
            message,
            prompt,
            reportType: 'terminal-explain' as any // 报告类型
          });
        },
      },
    );

    // 注册解释代码的内联聊天功能
    registry.registerEditorInlineChat(
      {
        id: `ai-${EInlineOperation.Explain}`, // 功能ID
        name: EInlineOperation.Explain, // 功能名称
        title: '解释代码', // 功能标题
        renderType: 'button', // 渲染类型
        codeAction: {
          isPreferred: true, // 是否为首选
        },
      },
      {
        execute: (editor: ICodeEditor) => this.inlineChatOperationModel.Explain(editor) // 执行解释操作
      },
    );

    // 注册添加注释的内联聊天功能
    registry.registerEditorInlineChat(
      {
        id: `ai-${EInlineOperation.Comments}`, // 功能ID
        name: EInlineOperation.Comments, // 功能名称
        title: '添加注释', // 功能标题
        renderType: 'button', // 渲染类型
        codeAction: {
          isPreferred: true, // 是否为首选
          kind: 'refactor.rewrite', // 操作类型
        },
      },
      {
        providerDiffPreviewStrategy: (...args) => this.inlineChatOperationModel.Comments(...args), // 提供差异预览策略
      },
    );

    // 注册生成单测的内联聊天功能
    registry.registerEditorInlineChat(
      {
        id: `ai-${EInlineOperation.Test}`, // 功能ID
        name: EInlineOperation.Test, // 功能名称
        title: '生成单测', // 功能标题
        renderType: 'button', // 渲染类型
        codeAction: {
          isPreferred: true, // 是否为首选
        },
      },
      {
        execute: (editor: ICodeEditor) => this.inlineChatOperationModel.Test(editor), // 执行生成单测操作
      },
    );

    // 注册优化代码的内联聊天功能
    registry.registerEditorInlineChat(
      {
        id: `ai-${EInlineOperation.Optimize}`, // 功能ID
        name: EInlineOperation.Optimize, // 功能名称
        renderType: 'dropdown', // 渲染类型
        codeAction: {
          isPreferred: true, // 是否为首选
          kind: 'refactor.rewrite', // 操作类型
        },
      },
      {
        providerDiffPreviewStrategy: (...args) => this.inlineChatOperationModel.Optimize(...args), // 提供差异预览策略
      },
    );

    /**
     * 注册 inlinchat 输入框，提供用户交互式输入功能。
     * 
     * 🔧 配置项：
     * - handleStrategy: 处理用户输入的策略，决定如何响应用户的输入。
     * - execute: 执行用户输入的操作。
     * - providePreviewStrategy: 提供输入的预览策略。
     * 
     * ⚠️ 注意事项：
     * - 确保在调用此功能之前，AI后端服务已正确配置。
     * 
     * @param _editor - 当前编辑器实例。
     * @param value - 用户输入的内容。
     * @returns 返回执行策略（ERunStrategy类型），指示如何处理输入。
     */
    registry.registerInteractiveInput(
      {
        handleStrategy: async (_editor, value) => {
          // 向AI后端请求意图识别，获取操作类型
          const result = await this.aiBackService.request(detectIntentPrompt(value), {});

          let operation: string = result.data as EInlineOperation;

          // 如果模型因为报错没返回字段，则默认选择 preview 模式
          if (!operation) {
            return ERunStrategy.PREVIEW;
          }

          // 去除操作字符串的方括号
          if (operation[0] === '[' && operation[operation.length - 1] === ']') {
            operation = operation.slice(1, -1);
          }

          // 根据操作类型返回相应的执行策略
          if (
            operation.startsWith(EInlineOperation.Explain) ||
            operation.startsWith(EInlineOperation.Test)
          ) {
            return ERunStrategy.EXECUTE; // 执行操作
          }

          return ERunStrategy.PREVIEW; // 默认预览模式
        },
      },
      {
        /**
         * 执行用户输入的操作。
         * 
         * @param editor - 当前编辑器实例。
         * @param value - 用户输入的内容。
         */
        execute: (editor, value) => {
          const model = editor.getModel();
          if (!model) {
            return; // 如果模型不存在，直接返回
          }

          // 获取跨行代码
          const crossCode = this.getCrossCode(editor);
          const prompt = `${value}：\n\`\`\`${model.getLanguageId()}\n${crossCode}\n\`\`\``;

          // 发送消息到聊天服务
          this.chatService.sendMessage({
            message: prompt,
            prompt,
          });
        },
        /**
         * 提供输入的预览策略。
         * 
         * @param editor - 当前编辑器实例。
         * @param value - 用户输入的内容。
         * @param token - 取消令牌。
         * @returns 返回一个可读流控制器，用于展示预览。
         */
        providePreviewStrategy: async (editor, value, token) => {
          const model = editor.getModel();
          const crossCode = this.getCrossCode(editor);

          let prompt = `${value}`;
          if (crossCode) {
            prompt += `：\n\`\`\`${model!.getLanguageId()}\n${crossCode}\n\`\`\``;
          }

          const controller = new InlineChatController({ enableCodeblockRender: true });
          const stream = await this.aiBackService.requestStream(prompt, {}, token);
          controller.mountReadable(stream); // 将可读流挂载到控制器上

          return controller; // 返回控制器以供后续使用
        },
      }
    );
  }

  /**
   * 注册重命名提供者，提供重命名建议。
   * 
   * @param registry - 重命名候选提供者注册表。
   */
  registerRenameProvider(registry: IRenameCandidatesProviderRegistry) {
    registry.registerRenameSuggestionsProvider(async (model, range, token) => {
      // 获取重命名范围上方的代码
      const above = model.getValueInRange({
        startColumn: 0,
        startLineNumber: 0,
        endLineNumber: range.startLineNumber,
        endColumn: range.startColumn,
      });
      const varName = model.getValueInRange(range); // 获取当前变量名
      // 获取重命名范围下方的代码
      const below = model.getValueInRange({
        startColumn: range.endColumn,
        startLineNumber: range.endLineNumber,
        endLineNumber: model.getLineCount(),
        endColumn: Number.MAX_SAFE_INTEGER,
      });

      // 请求重命名提示
      const prompt = RenamePromptManager.requestPrompt(model.getLanguageId(), varName, above, below);

      this.logger.info('rename prompt', prompt); // 记录重命名提示

      const result = await this.aiBackService.request(
        prompt,
        {
          type: 'rename',
        },
        token,
      );

      this.logger.info('rename result', result); // 记录重命名结果

      if (result.data) {
        const names = RenamePromptManager.extractResponse(result.data); // 提取重命名结果

        return names.map((name) => ({
          newSymbolName: name,
          tags: [NewSymbolNameTag.AIGenerated], // 标记为AI生成的名称
        }));
      }
    });
  }

  /**
   * 获取跨行代码。
   * 
   * @param monacoEditor - 当前Monaco编辑器实例。
   * @returns 返回跨行代码的字符串。
   */
  private getCrossCode(monacoEditor: ICodeEditor): string {
    const model = monacoEditor.getModel();
    if (!model) {
      return ''; // 如果模型不存在，返回空字符串
    }

    const selection = monacoEditor.getSelection();

    if (!selection) {
      return ''; // 如果没有选择，返回空字符串
    }

    // 创建跨行选择范围
    const crossSelection = selection
      .setStartPosition(selection.startLineNumber, 1)
      .setEndPosition(selection.endLineNumber, Number.MAX_SAFE_INTEGER);
    const crossCode = model.getValueInRange(crossSelection); // 获取跨行代码
    return crossCode;
  }

  /**
   * 注册终端提供者，提供终端命令建议。
   * 
   * @param register - 终端提供者注册表。
   */
  registerTerminalProvider(register: ITerminalProviderRegistry): void {
    let aiCommandSuggestions: ITerminalCommandSuggestionDesc[] = [];
    let currentObj = {} as ITerminalCommandSuggestionDesc;

    /**
     * 处理每一行的命令和描述。
     * 
     * @param lineBuffer - 当前行的内容。
     * @param stream - 终端建议可读流。
     */
    const processLine = (lineBuffer: string, stream: TerminalSuggestionReadableStream) => {
      const firstCommandIndex = lineBuffer.indexOf('#Command#:');
      let line = lineBuffer;

      if (firstCommandIndex !== -1) {
        // 找到了第一个#Command#:，截取它及之后的内容
        line = lineBuffer.substring(firstCommandIndex);
      }

      // 解析命令和描述
      if (line.startsWith('#Command#:')) {
        if (currentObj.command) {
          // 如果currentObj中已有命令，则将其添加到结果数组中，并开始新的对象
          currentObj = {} as ITerminalCommandSuggestionDesc;
        }
        currentObj.command = line.substring('#Command#:'.length).trim(); // 提取命令
      } else if (line.startsWith('#Description#:')) {
        currentObj.description = line.substring('#Description#:'.length).trim(); // 提取描述
        aiCommandSuggestions.push(currentObj); // 添加到命令建议数组
        if (aiCommandSuggestions.length > 4) {
          // 如果 AI 返回的命令超过 5 个，就停止 AI 生成 (这种情况下往往是模型不稳定或者出现了幻觉)
          stream.end(); // 结束流
        }
        stream.emitData(currentObj); // 每拿到一个结果就回调一次，优化用户体验
      }
    };

    /**
     * 注册命令建议提供者。
     * 
     * @param message - 用户输入的消息。
     * @param token - 取消令牌。
     * @returns 返回终端建议可读流。
     */
    register.registerCommandSuggestionsProvider(async (message, token) => {
      const prompt = terminalCommandSuggestionPrompt(message); // 生成命令建议提示

      aiCommandSuggestions = [];
      const backStream = await this.aiBackService.requestStream(prompt, {}, token);
      const stream = TerminalSuggestionReadableStream.create();

      let buffer = '';

      listenReadable<IChatProgress>(backStream, {
        onData: (data) => {
          const { content } = data as IChatContent;

          buffer += content; // 累加内容
          let newlineIndex = buffer.indexOf('\n');
          while (newlineIndex !== -1) {
            const line = buffer.substring(0, newlineIndex).trim();
            buffer = buffer.substring(newlineIndex + 1);
            processLine(line, stream); // 处理每一行
            newlineIndex = buffer.indexOf('\n');
          }
        },
        onEnd: () => {
          buffer += '\n';
          let newlineIndex = buffer.indexOf('\n');
          while (newlineIndex !== -1) {
            const line = buffer.substring(0, newlineIndex).trim();
            buffer = buffer.substring(newlineIndex + 1);
            processLine(line, stream); // 处理每一行
            newlineIndex = buffer.indexOf('\n');
          }
          stream.end(); // 结束流
        },
      });

      return stream; // 返回终端建议流
    });
  }

  /**
   * 注册问题修复功能，提供代码修复建议。
   * 
   * @param registry - 问题修复提供者注册表。
   */
  registerProblemFixFeature(registry: IProblemFixProviderRegistry): void {
    registry.registerHoverFixProvider({
      provideFix: async (
        editor: ICodeEditor,
        context: IProblemFixContext,
        token: CancellationToken,
      ): Promise<ChatResponse | InlineChatController> => {
        const { marker, editRange } = context;

        const prompt = `原始代码内容:
\`\`\`
${editor.getModel()!.getValueInRange(editRange)}
\`\`\`

        lint error 信息:
        
        ${marker.message}.

        请根据 lint error 信息修复代码！
        不需要任何解释，只要返回修复后的代码块内容`;

        const controller = new InlineChatController({ enableCodeblockRender: true });
        const stream = await this.aiBackService.requestStream(prompt, {}, token);
        controller.mountReadable(stream); // 将可读流挂载到控制器上

        return controller; // 返回控制器以供后续使用
      },
    });
  }

  /**
   * 注册智能补全功能，提供代码编辑建议。
   * 
   * @param registry - 智能补全提供者注册表。
   */
  registerIntelligentCompletionFeature(registry: IIntelligentCompletionsRegistry): void {
    registry.registerCodeEditsProvider(async (editor, _position, bean, token) => {
      const model = editor.getModel();
      if (!model) {
        return; // 如果模型不存在，直接返回
      }

      if (bean.typing === ECodeEditsSourceTyping.LinterErrors) {
        const errors = (bean.data as ILinterErrorData).errors;

        if (errors.length === 0) {
          return; // 如果没有错误，直接返回
        }

        const lastItem = errors[errors.length - 1];
        const lastRange = lastItem.range;

        // 创建警告范围
        const waringRange = Range.fromPositions(
          { lineNumber: errors[0].range.startPosition.lineNumber, column: 1 },
          { lineNumber: lastRange.endPosition.lineNumber, column: model!.getLineMaxColumn(lastRange.endPosition.lineNumber) }
        );

        const prompt = codeEditsLintErrorPrompt(model.getValueInRange(waringRange), errors); // 生成修复提示
        const response = await this.aiBackService.request(prompt, {}, token); // 请求修复建议

        if (response.data) {
          const controller = new InlineChatController({ enableCodeblockRender: true });
          const codeData = controller['calculateCodeBlocks'](response.data); // 计算代码块

          return {
            items: [
              {
                insertText: codeData, // 插入修复后的代码
                range: waringRange // 修复范围
              }
            ]
          };
        }
      }
      return undefined; // 返回未定义
    });
  }
}
