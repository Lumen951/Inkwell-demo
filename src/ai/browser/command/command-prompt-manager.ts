// 该类负责管理AI命令提示，提供命令分组和搜索功能。
// 通过分析用户输入的命令，返回相应的分组或命令。

import { Injectable } from '@opensumi/di'; // 引入依赖注入装饰器
import { BasePromptManager } from '@opensumi/ide-ai-native/lib/common/prompts/base-prompt-manager'; // 引入基础提示管理器

// 定义提示选项接口
export interface PromptOption {
  language?: string; // 语言选项，默认为undefined
  useCot?: boolean; // 是否使用Cot选项，默认为undefined Chain of Thought 用于增强模型推理能力
}

@Injectable() // 将该类标记为可注入的服务
export class AICommandPromptManager extends BasePromptManager {
  /**
   * 将命令字符串分组
   * 
   * @param {string} commandString - 要分组的命令字符串
   * @param {PromptOption} [option] - 可选的提示选项
   * 
   * 可以再添加根据不同模型产生分组
   * 
   * @returns {string} - 返回去除多余空格的分组命令字符串
   */
  groupCommand(commandString: string, option?: PromptOption) {
    // 根据语言选择相应的分组提示，并去除多余空格
    return this.removeExtraSpace(option?.language === 'zh' ? this.zhGroupCommandPrompt(commandString, option?.useCot) : this.enGroupCommandPrompt(commandString, option?.useCot));
  }

  // 定义Cot提示的命令分组
  private groupCommandCotPrompt = `
    Commands: git.commit,git.commitStaged,theme.toggle
    Output:
    * [File and Editor Management]: 
    * [Version Control and Git]: git.commit,git.commitStaged
    * [Debugging and Testing]: 
    * [Terminal and Command Line]: 
    * [User Interface and Layout Management]: theme.toggle
    * [Code Editing and Refactoring]: 
    * [Search and Navigation]: 
    * [Extensions and Customization]: 
    * [Data Science and Notebooks]: 
    * [Accessibility and Help]: 
  `;

  /**
   * 英文命令分组提示
   * 
   * @param {string} commands - 要分组的命令
   * @param {boolean} [useCot=true] - 是否使用Cot选项
   * 
   * @returns {string} - 返回英文分组提示字符串
   */
  private enGroupCommandPrompt(commands: string, useCot = true) {
    return `
      In my software, there are some commands that can be categorized into different groups. I will provide all the groups, group descriptions, and the commands in the system. Please help me find the appropriate group for these commands, based on the command names or descriptions.
      
      Groups:
      * [File and Editor Management]: Includes commands related to file operations such as creation, opening, saving, closing, and other file management functions.
      * [Version Control and Git]: Covers commands related to version control systems, especially Git, including committing changes, branch operations, pulling, and pushing.
      * [Debugging and Testing]: Encompasses commands related to debugging programs and testing code, such as starting or stopping debugging sessions, setting breakpoints, and running tests.
      * [Terminal and Command Line]: Includes commands related to managing the terminal and command-line interface, such as opening, splitting the terminal, executing terminal commands, etc.
      * [User Interface and Layout Management]:  Involves commands for customizing the user interface and editor layout, including adjusting sidebars, changing view layouts, theme switching, etc.
      * [Code Editing and Refactoring]: Comprises text editing and code refactoring commands, including formatting, refactoring, text editing, code navigation, and more.
      * [Search and Navigation]: Focuses on commands for code searching and navigation, including symbol search, in-file search, and navigating to specific code locations.
      * [Extensions and Customization]: Pertains to commands for installing, managing, and configuring extensions and plugins, as well as extension-specific functionalities.
      * [Data Science and Notebooks]: Includes commands for operations with data science and Jupyter Notebooks, such as running cells, exporting notebooks, etc.
      * [Accessibility and Help]: Covers commands that enhance accessibility features and user support, such as accessing help documentation, enabling accessibility features, etc.
      
      ${useCot ? this.groupCommandCotPrompt : ''}

      Commands: ${commands}
      Output:
    `;
  }

  /**
   * 中文命令分组提示
   * 
   * @param {string} commands - 要分组的命令
   * @param {boolean} [useCot=true] - 是否使用Cot选项
   * 
   * @returns {string} - 返回中文分组提示字符串
   */
  private zhGroupCommandPrompt(commands: string, useCot = true) {
    return `
      在我的软件中有一些指令，这些指令可以被分类至不同的分组，我会给出全部的分组和分组简介，以及系统内的指令。请帮我将这些命令找到合适的分组，可以根据指令的命名或者描述
      
      分组描述:
      * [File and Editor Management]: 包括所有与文件操作相关的指令，如文件的创建、打开、保存、关闭以及其他文件管理功能。
      * [Version Control and Git]: 涉及与版本控制系统（尤其是Git）相关的指令，如提交更改、分支操作、拉取和推送等。
      * [Debugging and Testing]: 包含与程序调试和代码测试相关的指令，包括启动或停止调试会话、设置断点、运行测试等。
      * [Terminal and Command Line]: 包括与终端和命令行界面相关的管理操作，如打开、分割终端，执行终端命令等。
      * [User Interface and Layout Management]: 涉及对用户界面和编辑器布局进行自定义设置的指令，包括调整侧边栏、更改视图布局、主题切换等。
      * [Code Editing and Refactoring]: 包括文本编辑和代码重构的指令，如格式化、重构、编辑文本、代码导航等。
      * [Search and Navigation]: 专注于代码搜索和导航的指令，包括符号搜索、文件内搜索和导航到特定代码位置等。
      * [Extensions and Customization]: 涉及扩展和插件的安装、管理和配置，以及扩展特定功能的指令。
      * [Data Science and Notebooks]: 包括数据科学和Jupyter Notebook操作的指令，如运行单元格、导出笔记本等。
      * [Accessibility and Help]: 涉及提高辅助功能和用户支持的指令，如访问帮助文档、开启辅助功能等。
      
      ${useCot ? this.groupCommandCotPrompt : ''}
      
      Commands: ${commands}
      Output:
    `;
  }

  /**
   * 搜索命令分组
   * 
   * @param {string} input - 用户输入的命令
   * @param {PromptOption} [option] - 可选的提示选项
   * 
   * @returns {string} - 返回去除多余空格的分组命令字符串
   */
  searchGroup(input: string, option?: PromptOption) {
    // 根据语言选择相应的搜索提示，并去除多余空格
    return this.removeExtraSpace(option?.language === 'zh' ? this.zhSearchGroupPrompt(input, option?.useCot) : this.enSearchGroupPrompt(input, option?.useCot));
  }

  // 定义Cot提示的搜索示例
  private searchGroupCotPrompt = `
    Input: 提交代码
    Output: commit code maybe in group [Version Control and Git]
    Input: 放大字体
    Output: zoom font maybe in group [Code Editing and Refactoring]
  `;

  /**
   * 英文搜索分组提示
   * 
   * @param {string} input - 用户输入的命令
   * @param {boolean} [useCot] - 是否使用Cot选项
   * 
   * @returns {string} - 返回英文搜索分组提示字符串
   */
  private enSearchGroupPrompt(input: string, useCot?: boolean) {
    return `
      In my software, there are some commands that can be grouped into several categories. Below are all the groups and a brief description of each group. Please identify the corresponding group based on the functionality provided by the user.

      Groups:
      * [File and Editor Management]: Includes commands related to file operations such as creation, opening, saving, closing, and other file management functions.
      * [Version Control and Git]: Covers commands related to version control systems, especially Git, including committing changes, branch operations, pulling, and pushing.
      * [Debugging and Testing]: Encompasses commands related to debugging programs and testing code, such as starting or stopping debugging sessions, setting breakpoints, and running tests.
      * [Terminal and Command Line]: Includes commands related to managing the terminal and command-line interface, such as opening, splitting the terminal, executing terminal commands, etc.
      * [User Interface and Layout Management]:  Involves commands for customizing the user interface and editor layout, including adjusting sidebars, changing view layouts, theme switching, etc.
      * [Code Editing and Refactoring]: Comprises text editing and code refactoring commands, including formatting, refactoring, text editing, code navigation, and more.
      * [Search and Navigation]: Focuses on commands for code searching and navigation, including symbol search, in-file search, and navigating to specific code locations.
      * [Extensions and Customization]: Pertains to commands for installing, managing, and configuring extensions and plugins, as well as extension-specific functionalities.
      * [Data Science and Notebooks]: Includes commands for operations with data science and Jupyter Notebooks, such as running cells, exporting notebooks, etc.
      * [Accessibility and Help]: Covers commands that enhance accessibility features and user support, such as accessing help documentation, enabling accessibility features, etc.
      
      ${useCot ? this.searchGroupCotPrompt : ''}
      Input：${input}
      Output: [group name]
    `;
  }

  /**
   * 中文搜索分组提示
   * 
   * @param {string} input - 用户输入的命令
   * @param {boolean} [useCot] - 是否使用Cot选项
   * 
   * @returns {string} - 返回中文搜索分组提示字符串
   */
  private zhSearchGroupPrompt(input: string, useCot?: boolean) {
    return `
      在我的软件中，存在一些指令，这些指令可以被分成几组，下面给出全部的分组及分组简介，请针对用户给出的功能，找到对应的分组。

      指令分组：
      * [File and Editor Management]: 包括所有与文件操作相关的指令，如文件的创建、打开、保存、关闭以及其他文件管理功能。
      * [Version Control and Git]: 涉及与版本控制系统（尤其是Git）相关的指令，如提交更改、分支操作、拉取和推送等。
      * [Debugging and Testing]: 包含与程序调试和代码测试相关的指令，包括启动或停止调试会话、设置断点、运行测试等。
      * [Terminal and Command Line]: 包括与终端和命令行界面相关的管理操作，如打开、分割终端，执行终端命令等。
      * [User Interface and Layout Management]: 涉及对用户界面和编辑器布局进行自定义设置的指令，包括调整侧边栏、更改视图布局、主题切换等。
      * [Code Editing and Refactoring]: 包括文本编辑和代码重构的指令，如格式化、重构、编辑文本、代码导航等。
      * [Search and Navigation]: 专注于代码搜索和导航的指令，包括符号搜索、文件内搜索和导航到特定代码位置等。
      * [Extensions and Customization]: 涉及扩展和插件的安装、管理和配置，以及扩展特定功能的指令。
      * [Data Science and Notebooks]: 包括数据科学和Jupyter Notebook操作的指令，如运行单元格、导出笔记本等。
      * [Accessibility and Help]: 涉及提高辅助功能和用户支持的指令，如访问帮助文档、开启辅助功能等。
      
      ${useCot ? this.searchGroupCotPrompt : ''}
      提问: ${input}
      回答: [分组名称]
    `;
  }

  /**
   * 查找命令
   * 
   * @param {Object} input - 包含命令和问题的对象
   * @param {string} input.commands - 系统中的所有命令
   * @param {string} input.question - 用户提出的问题
   * @param {PromptOption} [option] - 可选的提示选项
   * 
   * @returns {string} - 返回去除多余空格的命令提示字符串
   */
  findCommand(input: { commands: string; question: string }, option?: PromptOption) {
    // 根据语言选择相应的查找命令提示，并去除多余空格
    return this.removeExtraSpace(option?.language === 'zh' ? this.zhFindCommandPrompt(input, option?.useCot) : this.enFindCommandPrompt(input, option?.useCot));
  }

  // 定义Cot提示的查找示例
  private findCommandCotPrompt = `
    提问: 打开全局快捷键配置
    回答: 通过分析需求「打开全局快捷键配置」, 可以获取到一些关键词： open、keybinding、global。通过这些关键词可以在 Command 的列表内匹配到相关的命令是： \`workbench.action.openGlobalKeybindings\`
    提问: 提交代码
    回答: 通过分析需求「提交代码」，可以获取到一些关键词：git、commit。通过这些关键词可以在 Command 的列表内匹配到相关的命令是： \`git.commit\`
  `;

  /**
   * 英文查找命令提示
   * 
   * @param {Object} input - 包含命令和问题的对象
   * @param {string} input.commands - 系统中的所有命令
   * @param {string} input.question - 用户提出的问题
   * @param {boolean} [useCot=true] - 是否使用Cot选项
   * 
   * @returns {string} - 返回英文查找命令提示字符串
   */
  private enFindCommandPrompt(input: { commands: string; question: string }, useCot = true) {
    return `
      In my system, there are some Commands. Through these commands, certain functions can be achieved. Please analyze my question to determine the function I want to implement, and match the appropriate Command.
      Please refer to the example Q&A below and return in the format of the example answer. If no suitable command is found, please return 'No suitable command found.'
      I will provide all the commands in the system and their descriptions in the format of {command}-{description}. When analyzing the question, please refer to both the command and its description.
      Below are all the Commands and their descriptions in the system:
      ${input.commands}
      {workbench.action.openGlobalKeybindings}-{Keybindings}
      {editor.action.setEncoding}-{set encoding}
      
      ${useCot ? this.findCommandCotPrompt : ''}
      提问: ${input.question}
    `;
  }

  /**
   * 中文查找命令提示
   * 
   * @param {Object} input - 包含命令和问题的对象
   * @param {string} input.commands - 系统中的所有命令
   * @param {string} input.question - 用户提出的问题
   * @param {boolean} [useCot=true] - 是否使用Cot选项
   * 
   * @returns {string} - 返回中文查找命令提示字符串
   */
  private zhFindCommandPrompt(input: { commands: string; question: string }, useCot = true) {
    return `
      在系统中，有一些指令可以实现某些功能。请分析我的问题，确定我想要实现的功能，并匹配适当的指令。
      请参考下面的示例问答，并以示例答案的格式返回。如果找不到合适的指令，请返回“未找到合适的指令。”
      我会提供系统中的所有指令及其描述，格式为{指令}-{描述}。在分析问题时，请参考指令和其描述。
      以下是系统中的所有指令及其描述：
      ${input.commands}
      {workbench.action.openGlobalKeybindings}-{Keybindings}
      {editor.action.setEncoding}-{set encoding}
      
      ${useCot ? this.findCommandCotPrompt : ''}
      提问: ${input.question}
    `;
  }

  /**
   * IDE能力提示
   * 
   * @param {string} input - 用户输入的问题
   * 
   * @returns {string} - 返回IDE能力提示字符串
   */
  private zhIDEPrompt(input: string) {
    return `你是 OpenSumi 专家。需要你针对用户遇到的问题，给出相应的解决方案。解决方案用 markdown 格式输出。当前用户问题是：${input}。`;
  }

  /**
   * 查找IDE能力提示
   * 
   * @param {string} input - 用户输入的问题
   * 
   * @returns {string} - 返回去除多余空格的IDE能力提示字符串
   */
  findIDECapabilityPrompt(input: string) {
    return this.removeExtraSpace(this.zhIDEPrompt(input));
  }
}
