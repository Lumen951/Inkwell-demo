/**
 * 🔧 文件功能：本文件主要提供生成多种提示信息的函数和一个变量重命名管理类。
 * 说明：
 * - 包含解释代码、生成单元测试、代码优化、添加注释、提取用户意图、生成Shell命令建议等多种提示生成器。
 * - RenamePromptManager 类用于生成变量重命名的提示及从响应中解析重命名候选项。
 * 
 * 遵循Google代码注释规范及Electron官方注释规范，包含详细的功能描述、参数说明和返回值说明，并
 * 使用emoji图标标记配置项（🔧）、注意事项（⚠️）和性能优化（🚀）。
 */

import { IMarkerErrorData } from '@opensumi/ide-ai-native/lib/browser/contrib/intelligent-completions/source/lint-error.source';
import { EInlineOperation } from './constants'

/**
 * 🚀 功能描述：生成用于代码解释的提示信息。
 * 
 * @param {string} language - 编程语言，用于指定代码块的语法高亮。（例如："javascript", "python"）
 * @param {string} code - 需要解释的代码内容。
 * @returns {string} 返回一个格式化后的中文提示，指导用户简洁地解释给定代码。
 *
 * 历史背景：用于辅助AI解析代码含义的提示生成器。
 */
export const explainPrompt = (language: string, code: string) => {
  return `你将获得一段代码, 你的任务是以简洁的方式解释它，用中文回答。代码内容是: \n\`\`\`${language}\n${code}\n\`\`\``;
};

/**
 * 🚀 功能描述：生成请求编写单元测试用例的提示信息。
 * 
 * @param {string} code - 需要为其编写单元测试的代码内容。
 * @returns {string} 返回格式化后的中文提示，引导用户为代码编写单测。
 */
export const testPrompt = (code: string) => {
  return `为以下代码写单测：\n\`\`\`\n ${code}\n\`\`\``;
};

/**
 * 🚀 功能描述：生成用于代码优化的提示信息。
 * 
 * @param {string} code - 需要优化的代码字符串。
 * @returns {string} 返回一个格式化后的中文提示，引导用户对代码进行优化。
 */
export const optimizePrompt = (code: string) => {
  return `优化以下代码：\n\`\`\`\n ${code}\`\`\``;
};

/**
 * 🚀 功能描述：生成要求为代码添加中文注释的提示信息。
 * 
 * @param {string} code - 原始代码内容，提示要求保持代码格式不变，仅添加中文注释。
 * @returns {string} 返回格式化后的中文提示，用于请求添加代码注释。
 */
export const commentsPrompt = (code: string) => {
  return `帮我将下面这段代码加入中文注释，原来的代码的代码请按照原样返回，不要添加任何额外字符包括空格:\n\`\`\`\n${code}\`\`\``;
};

/**
 * 🚀 功能描述：生成检测用户输入意图的提示信息，依据预设指令分组返回对应分组名称。
 * 
 * @param {string} input - 用户输入的问题或描述。
 * @returns {string} 返回一个格式化的提示，要求AI识别后只回复对应的指令分组名称。
 *
 * ⚠️ 注意事项：确保返回值中只包含分组名称，不包含其他多余内容。
 */
export const detectIntentPrompt = (input: string) => {
  return `
  在我的编辑器中，存在一些指令，这些指令可以被分成几组，下面给出全部的分组及分组简介，请针对用户给出的提问，找到对应的分组，并直接返回分组名称

  指令分组：
  * [${EInlineOperation.Explain}]: 解释代码，代码解释，用于对代码的解释，能够用自然语言解释代码的意思，它能够理解并分析各种编程语言的代码，并提供清晰、准确、易于理解的解释。
  * [${EInlineOperation.Comments}]: 添加注释，用于给代码添加注释
  * [${EInlineOperation.Test}]: 生成单测，用于生成单元测试用例，能够对代码进行单元测试的生成，生成测试代码，生成代码的测试
  * [${EInlineOperation.Optimize}]: 优化代码，用于对代码进行优化，能够优化代码，使其代码更加合理
  * [None]: 表示用户的提问并不适合以上任意一个分组，则返回 None
  
  提问: ${input}
  回答: [分组名称]，请返回上述的指令分组名称，不要包含其它内容
  `;
};

/**
 * 🚀 功能描述：生成用于提供Shell命令建议的提示信息。
 * 
 * @param {string} message - 自然语言描述，用于生成相应的Shell命令。
 * @returns {string} 返回一个格式化的中文提示，包括示例描述，引导生成1到5个命令。
 *
 * ⚠️ 注意事项：提示中要求使用“.”来表示当前文件夹，确保示例与要求一致。
 */
export const terminalCommandSuggestionPrompt = (message: string) => {
  return `
  你是一个 Shell 脚本专家，现在我需要使用 Shell 来完成一些操作，但是我不熟悉 Shell 命令，因此我需要通过自然语言描述生成终端命令，只需生成 1 到 5 个命令。
  提示：使用 . 来表示当前文件夹
  下面是自然语言描述和其对应的终端命令：
  提问: 查看机器内存
  回答:
  #Command#: free -m
  #Description#: 查看机器内存
  提问: 查看当前进程的 pid
  回答:
  #Command#: echo$$
  #Description#: 查看当前进程的 pid
  提问: ${message}`;
};

/**
 * 🚀 类功能描述：管理变量重命名相关的提示生成与响应解析。
 *
 * 历史背景：用于请求和提取变量重命名候选项列表，从而帮助提升代码质量和可维护性。
 */
export class RenamePromptManager {
  /**
   * 🚀 功能描述：生成变量重命名建议的提示信息。
   * 
   * @param {string} language - 编程语言，用于确定代码风格和提示格式。
   * @param {string} varName - 当前变量名，需要获取重命名建议。
   * @param {string} above - 变量出现之前的代码片段（截取最后500字符），提供上下文信息。
   * @param {string} below - 变量出现之后的代码片段（截取前500字符），提供上下文信息。
   * @returns {string} 返回格式化后的提示信息，指示生成重命名候选项。
   *
   * ⚠️ 注意事项：代码片段之间使用 '---' 分隔，确保上下文清晰。
   */
  static requestPrompt(language: string, varName: string, above: string, below: string) {
    const prompt = `
    我需要你的帮助，请帮我推荐 5 个指定变量的重命名候选项。
我希望这些新的变量名能更符合代码上下文、整段代码的风格，更有意义。

我会将代码分成三段发给你，每段代码用 --- 进行包裹。这些代码是一段 ${language} 代码片段。
第一段代码是该变量之前的上文，第二段是变量名，第三段是该变量的下文。

---
${above.slice(-500)}
---

---
${varName}
---

---
${below.slice(0, 500)}
---


你的任务是：
请根据上下文以及代码的作用帮我推荐一下 ${varName} 能替换成哪些变量名，仅需要把所有可能的变量名输出，不用输出所有的代码。将结果放在代码块中（用 \`\`\` 包裹），每行一个，不用带序号。`;
    return prompt;
  }

  /**
   * 🚀 功能描述：从AI响应中提取变量重命名候选项列表。
   * 
   * @param {string} data - 包含代码块的AI响应字符串数据。
   * @returns {string[]} 返回一个变量重命名建议的数组，其中每一行为一种建议。
   *
   * 核心算法步骤：
   * | 步骤       | 实现代码                                               | 说明                                       |
   * |------------|-------------------------------------------------------|-------------------------------------------|
   * | 提取代码块 | const codeBlock = /```([\s\S]*?)```/g;                  | 使用正则表达式匹配被```包裹的代码块           |
   * | 正则匹配   | const result = data.match(codeBlock);                 | 返回所有匹配项，如果无匹配则返回 null         |
   * | 拆分行     | result[0].replace(/```/g, '').trim().split('\n');      | 去除反引号，清除空白，并按行拆分生成候选列表     |
   *
   * 时间复杂度：O(n)，其中 n 为输入字符串的长度。
   */
  static extractResponse(data: string) {
    const codeBlock = /```([\s\S]*?)```/g;
    const result = data.match(codeBlock);

    if (!result) {
      return [];
    }

    const lines = result[0].replace(/```/g, '').trim().split('\n');
    return lines;
  }
}

/**
 * 🚀 功能描述：生成针对代码错误修复的提示信息，包含代码片段和对应的lint错误描述。
 * 
 * @param {string} text - 包含问题代码的代码片段。
 * @param {IMarkerErrorData[]} errors - lint错误数组，每个对象包含错误详情信息（如message）。
 * @returns {string} 返回一个详细格式的提示信息，指向需要修复代码中的错误。
 *
 * ⚠️ 注意事项：
 * - 仅修改必要代码以修复错误，不能更改代码逻辑及缩进。
 * - JSON.stringify(errors.map(e => ({ message: e.message }))) 用于序列化错误描述信息。
 */
export const codeEditsLintErrorPrompt = (text: string, errors: IMarkerErrorData[]) => {
  return `
  #Role: 代码领域的 IDE 专家

  #Profile:
  - description: 熟悉各种编程语言并擅长解决由语言服务引起的各种问题，能够快速定位问题并提供解决方案，专注于代码质量和错误修复的专家
  
  ##Goals:
  - 修复代码中的 error 错误，提升代码质量
  
  ##Constrains:
  - 仅修改必要的代码以修复错误
  - 保持代码的原始功能和逻辑不变
  - 保持代码的缩进规则不变，这是强规定，你需要检查代码的缩进规则，并保持这个缩进规则
  
  ##Skills:
  - 熟悉 Java/TypeScript/JavaScript/Python 等语言
  - 能够根据错误信息快速定位问题并提供解决方案
  
  ##Workflows:
  - 分析提供的代码和错误信息
  - 提供修复步骤和修改后的代码

  ##CodeSnippet：
  - 以下是有问题的代码片段
\`\`\`
${text}
\`\`\`
  
  ##LintErrors:
  ${JSON.stringify(errors.map(e => ({ message: e.message })))}

  请根据上述错误信息，直接提供修复后的代码，不需要解释
`;
};
