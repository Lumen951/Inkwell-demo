/**
 * 该代码定义了一系列接口，用于描述工具调用、消息、选择、使用情况以及聊天和文本完成的结构。
 * 
 * @interface ToolCall
 * @description 描述工具调用的结构
 * @property {string} id - 工具调用的唯一标识符
 * @property {string} type - 工具调用的类型
 * @property {Object} function - 工具调用的函数信息
 * @property {string} function.name - 函数名称
 * @property {string} function.arguments - 函数参数
 */
interface ToolCall {
  id: string; // 工具调用的唯一标识符
  type: string; // 工具调用的类型
  function: {
    name: string; // 函数名称
    arguments: string; // 函数参数
  }
}

/**
 * @interface Message
 * @description 描述消息的结构
 * @property {string} role - 消息的角色（如用户或系统）
 * @property {any} content - 消息内容
 * @property {ToolCall[]} tool_calls - 相关的工具调用数组
 */
interface Message {
  role: string; // 消息的角色
  content: any; // 消息内容
  tool_calls: ToolCall[]; // 相关的工具调用数组
}

/**
 * @export
 * @interface Choice
 * @description 描述选择的结构
 * @property {number} index - 选择的索引
 * @property {Message} message - 选择的消息
 * @property {string} [finish_reason] - 完成原因（可选）
 */
export interface Choice {
  index: number; // 选择的索引
  message: Message; // 选择的消息
  finish_reason?: string; // 完成原因（可选）
}

/**
 * @export
 * @interface ChunkChoice
 * @description 描述分块选择的结构
 * @property {number} index - 分块选择的索引
 * @property {Message} delta - 分块消息
 * @property {string} [finish_reason] - 完成原因（可选）
 */
export interface ChunkChoice {
  index: number; // 分块选择的索引
  delta: Message; // 分块消息
  finish_reason?: string; // 完成原因（可选）
}

/**
 * @interface Usage
 * @description 描述使用情况的结构
 * @property {number} prompt_tokens - 提示令牌数量
 * @property {number} completion_tokens - 完成令牌数量
 * @property {number} total_tokens - 总令牌数量
 */
interface Usage {
  prompt_tokens: number; // 提示令牌数量
  completion_tokens: number; // 完成令牌数量
  total_tokens: number; // 总令牌数量
}

/**
 * @export
 * @interface ChatCompletion
 * @description 描述聊天完成的结构
 * @property {string} id - 聊天完成的唯一标识符
 * @property {string} object - 对象类型
 * @property {string} created - 创建时间戳
 * @property {string} model - 使用的模型
 * @property {string} system_fingerprint - 系统指纹
 * @property {Choice[]} choices - 选择数组
 * @property {Usage} [usage] - 使用情况（可选）
 */
export interface ChatCompletion {
  id: string; // 聊天完成的唯一标识符
  object: string; // 对象类型
  created: string; // 创建时间戳
  model: string; // 使用的模型
  system_fingerprint: string; // 系统指纹
  choices: Choice[]; // 选择数组
  usage?: Usage; // 使用情况（可选）
}

/**
 * @export
 * @interface ChatCompletionChunk
 * @description 描述聊天完成分块的结构
 * @property {string} id - 聊天完成分块的唯一标识符
 * @property {string} object - 对象类型
 * @property {string} created - 创建时间戳
 * @property {string} model - 使用的模型
 * @property {string} system_fingerprint - 系统指纹
 * @property {ChunkChoice[]} choices - 分块选择数组
 */
export interface ChatCompletionChunk {
  id: string; // 聊天完成分块的唯一标识符
  object: string; // 对象类型
  created: string; // 创建时间戳
  model: string; // 使用的模型
  system_fingerprint: string; // 系统指纹
  choices: ChunkChoice[]; // 分块选择数组
}

/**
 * @export
 * @interface CompletionChoice
 * @description 描述完成选择的结构
 * @property {string} finish_reason - 完成原因
 * @property {number} index - 选择的索引
 * @property {string} text - 完成的文本
 */
export interface CompletionChoice {
  finish_reason: string; // 完成原因
  index: number; // 选择的索引
  text: string; // 完成的文本
}

/**
 * @export
 * @interface Completion
 * @description 描述文本完成的结构
 * @property {string} id - 文本完成的唯一标识符
 * @property {Array<CompletionChoice>} choices - 完成选择数组
 * @property {number} created - 创建时间戳
 * @property {string} model - 使用的模型
 * @property {'text_completion'} object - 对象类型
 * @property {string} [system_fingerprint] - 系统指纹（可选）
 * @property {Usage} [usage] - 使用情况（可选）
 */
export interface Completion {
  id: string; // 文本完成的唯一标识符
  choices: Array<CompletionChoice>; // 完成选择数组
  created: number; // 创建时间戳
  model: string; // 使用的模型
  object: 'text_completion'; // 对象类型
  system_fingerprint?: string; // 系统指纹（可选）
  usage?: Usage; // 使用情况（可选）
}
