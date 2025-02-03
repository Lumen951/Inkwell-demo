/**
 * InlineChatOperationModel 类
 * 
 * 功能摘要：该类用于与 AI 聊天服务进行交互，支持代码解释、生成注释、单元测试及代码优化。
 * 主要场景：在代码编辑器中获取选中的跨行代码片段，通过 AI 服务进行处理与展示。
 */
@Injectable()
export class InlineChatOperationModel {
  @Autowired(AIBackSerivcePath)
  private readonly aiBackService: IAIBackService; // 🔧 AI 后端服务实例，用于处理流式请求

  @Autowired(ChatServiceToken)
  private readonly aiChatService: ChatService; // 🔧 AI 聊天服务实例，用于发送消息

  /**
   * 获取跨行选中的代码片段
   *
   * 功能描述：从给定的 ICodeEditor 实例中提取跨行的代码文本，
   *         保证选中区域覆盖每行的起始到最大列，从而确保代码完整性。
   *
   * 参数：
   *   @param {ICodeEditor} monacoEditor - 用于操作编辑器实例，包括模型和选区信息
   *
   * 返回值：
   *   @returns {string} - 返回选中的代码片段；若模型或选区不存在，则返回空字符串
   *
   * 复杂度说明：
   *   - 时间复杂度：O(n)，与选中区域的行数 n 成正比
   *   - 空间复杂度：O(n)，返回字符串长度取决于选中代码的字节数
   *
   * 核心算法步骤：
   * | 步骤 | 描述                                   | 实现代码                                      |
   * | ---- | -------------------------------------- | --------------------------------------------- |
   * | 1    | 获取当前编辑器数据模型                 | const model = monacoEditor.getModel();        |
   * | 2    | 检查模型是否存在，若不存在则返回空字符串 | if (!model) { return ''; }                      |
   * | 3    | 获取当前的选区信息                     | const selection = monacoEditor.getSelection();  |
   * | 4    | 检查选区有效性，若无则返回空字符串     | if (!selection) { return ''; }                  |
   * | 5    | 调整选区范围，确保从行首至行尾覆盖       | selection.setStartPosition(...).setEndPosition(...); |
   * | 6    | 提取并返回选区内的代码文本               | const crossCode = model.getValueInRange(...);   |
   */
  private getCrossCode(monacoEditor: ICodeEditor): string {
    const model = monacoEditor.getModel(); // 🔧 获取当前编辑器的模型；历史背景：应对编辑器未加载模型的情况
    if (!model) {
      return ''; // ⚠️ 注意：当编辑器尚未加载模型时，直接返回空字符串以避免错误
    }

    const selection = monacoEditor.getSelection(); // 🔧 获取当前选中的文本区域
    if (!selection) {
      return ''; // ⚠️ 注意：若未选中文本，则返回空字符串
    }

    // 🚀 性能优化及准确性：调整选区，使得每行均从首字符开始直到行尾（使用 Number.MAX_SAFE_INTEGER 表示最大列）
    const crossSelection = selection
      .setStartPosition(selection.startLineNumber, 1) // 设置起始位置为所选行的第一列
      .setEndPosition(selection.endLineNumber, Number.MAX_SAFE_INTEGER); // 设置结束位置为所选行的最大列
    const crossCode = model.getValueInRange(crossSelection); // 根据调整后的选区获取文本块
    return crossCode; // 返回跨行选中的代码
  }

  /**
   * 解释选中的代码
   *
   * 功能描述：将编辑器中选中的代码以格式化的代码块发送至 AI 聊天服务，请求生成详尽的代码解释，
   *         帮助用户理解代码逻辑及实现细节。
   *
   * 参数：
   *   @param {ICodeEditor} monacoEditor - 编辑器实例，用于提取模型和选中代码
   *
   * 返回值：
   *   @returns {void} - 无返回值，结果通过 AI 服务异步处理
   */
  public [EInlineOperation.Explain](monacoEditor: ICodeEditor): void {
    const model = monacoEditor.getModel(); // 🔧 获取编辑器模型以确保代码上下文
    if (!model) {
      return; // ⚠️ 注意：缺失模型则无法继续操作，直接返回
    }

    const crossCode = this.getCrossCode(monacoEditor); // 🚀 提取跨行选中的代码文本
    // 通过 AI 聊天服务发送请求，利用代码语言标识和格式化后的代码块生成详细解释
    this.aiChatService.sendMessage({
      message: `解释以下代码: \n\`\`\`${model.getLanguageId()}\n${crossCode}\n\`\`\``,
      prompt: explainPrompt(model.getLanguageId(), crossCode), // 使用专用函数生成解释提示
    });
  }

  /**
   * 为选中的代码生成注释
   *
   * 功能描述：调用 AI 后端的流式服务，为当前选中的代码生成详细注释，返回一个 InlineChatController 实例用于展示生成结果。
   *
   * 参数：
   *   @param {ICodeEditor} editor - 编辑器实例，用于定位并提取代码
   *   @param {CancellationToken} token - 取消令牌，用于在必要时中断 AI 请求
   *
   * 返回值：
   *   @returns {Promise<InlineChatController>} - 包含返回结果流的控制器实例，便于前端交互显示生成的注释
   *
   * 异步说明：本方法内部通过异步流式请求获取 AI 生成的注释内容，并挂载于控制器上供持续更新。
   */
  public async [EInlineOperation.Comments](editor: ICodeEditor, token: CancellationToken): Promise<InlineChatController> {
    const crossCode = this.getCrossCode(editor); // 🔧 使用 getCrossCode 方法提取跨行代码
    const prompt = commentsPrompt(crossCode); // 构造生成注释的提示信息（prompt）

    // 实例化 InlineChatController，配置支持代码块渲染，便于显示格式化文本
    const controller = new InlineChatController({ enableCodeblockRender: true });
    // 🚀 发起异步请求获取 AI 生成的流数据，token 用于支持请求的取消
    const stream = await this.aiBackService.requestStream(prompt, {}, token);
    controller.mountReadable(stream); // 挂载流数据，确保前端实时更新展示内容

    return controller; // 返回最终的控制器实例
  }

  /**
   * 为选中的代码生成单元测试
   *
   * 功能描述：将编辑器中选中的代码以代码块形式包装，并通过 AI 聊天服务请求生成相应的单元测试代码，
   *         以帮助开发者验证代码功能正确性。
   *
   * 参数：
   *   @param {ICodeEditor} editor - 编辑器实例，用于获取代码模型及选区
   *
   * 返回值：
   *   @returns {void} - 无返回值，生成过程由 AI 服务处理，并通过消息反馈进行展示
   *
   * 注意事项：此方法为同步调用，未涉及流式数据处理，错误处理或取消逻辑需在外层进行捕获
   */
  public [EInlineOperation.Test](editor: ICodeEditor): void {
    const model = editor.getModel(); // 🔧 获取当前编辑器模型，确认代码上下文
    if (!model) {
      return; // ⚠️ 注意：缺失模型直接中断操作，避免产生异常
    }

    const crossCode = this.getCrossCode(editor); // 提取跨行选中的代码文本
    const prompt = testPrompt(crossCode); // 构建生成测试代码的提示信息

    // 🚀 通过 AI 聊天服务发送格式化消息，请求生成单元测试代码块
    this.aiChatService.sendMessage({
      message: `为以下代码写单测：\n\`\`\`${model.getLanguageId()}\n${crossCode}\n\`\`\``,
      prompt,
    });
  }

  /**
   * 优化选中的代码
   *
   * 功能描述：本方法调用 AI 服务对选中的代码进行优化处理，
   *         通过流式请求优化结果，并将结果挂载于 InlineChatController 实例中以便前端展示。
   *
   * 参数：
   *   @param {ICodeEditor} editor - 编辑器实例，用于提取代码选区和语言信息
   *   @param {CancellationToken} token - 取消令牌，用于支持请求中断
   *
   * 返回值：
   *   @returns {Promise<InlineChatController>} - 返回封装优化结果流的控制器实例
   *
   * 异步说明：通过 requestStream 发起 AI 优化请求，并实时挂载返回流数据，以便支持长时间数据更新。
   */
  public async [EInlineOperation.Optimize](editor: ICodeEditor, token: CancellationToken): Promise<InlineChatController> {
    const crossCode = this.getCrossCode(editor); // 🔧 提取跨行代码片段
    const prompt = optimizePrompt(crossCode); // 构建代码优化的提示内容

    // 实例化控制器，启用代码块渲染以提升展示效果
    const controller = new InlineChatController({ enableCodeblockRender: true });
    // 🚀 发起流式请求，使用 token 支持请求过程中的中断处理
    const stream = await this.aiBackService.requestStream(prompt, {}, token);
    controller.mountReadable(stream); // 挂载数据流实现实时更新

    return controller; // 返回控制器实例，供前端展示优化后的代码
  }
}