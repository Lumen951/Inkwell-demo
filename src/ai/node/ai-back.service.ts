// 该类实现了AI后端服务，负责处理用户请求并与AI模型进行交互。

import { pipeline } from 'node:stream'; // 导入流处理模块
import { Autowired, Injectable } from '@opensumi/di'; // 注入依赖
import { ChatCompletionRequestMessage, ChatCompletionRequestMessageRoleEnum } from '@opensumi/ide-ai-native/lib/common'; // 导入聊天请求消息相关类型
import { IAIBackService, IAICompletionOption, IAIReportCompletionOption, IAIBackServiceOption } from '@opensumi/ide-core-common'; // 导入AI后端服务接口
import { IAIBackServiceResponse, IChatContent } from '@opensumi/ide-core-common/lib/types/ai-native'; // 导入AI后端服务响应类型
import { CancellationToken, INodeLogger } from '@opensumi/ide-core-node'; // 导入取消令牌和日志记录器
import { BaseAIBackService } from '@opensumi/ide-core-node/lib/ai-native/base-back.service'; // 导入基础AI后端服务
import { SumiReadableStream } from '@opensumi/ide-utils/lib/stream'; // 导入可读流
import type { Response, fetch as FetchType } from 'undici-types'; // 导入响应类型
import { ILogServiceManager } from '@opensumi/ide-logs'; // 导入日志服务管理器

import { ChatCompletionChunk, ChatCompletion, Completion } from './types'; // 导入聊天完成相关类型
import { AIModelService } from './model.service' // 导入AI模型服务

@Injectable() // 声明该类为可注入的服务
export class AIBackService extends BaseAIBackService implements IAIBackService {
  private logger: INodeLogger // 日志记录器

  @Autowired(ILogServiceManager) // 自动注入日志服务管理器
  private readonly loggerManager: ILogServiceManager;

  @Autowired(AIModelService) // 自动注入AI模型服务
  modelService: AIModelService

  // 存储历史消息
  private historyMessages: {
    role: ChatCompletionRequestMessageRoleEnum; // 消息角色
    content: string; // 消息内容
  }[] = [];

  constructor() {
    super(); // 调用父类构造函数
    this.logger = this.loggerManager.getLogger('ai' as any); // 获取日志记录器
  }

  /**
   * 处理用户请求并返回AI响应
   * @param input 用户输入的字符串
   * @param options AI后端服务选项
   * @param cancelToken 取消令牌
   * @returns Promise<IAIBackServiceResponse> AI后端服务响应
   */
  override async request(input: string, options: IAIBackServiceOption, cancelToken?: CancellationToken): Promise<IAIBackServiceResponse> {
    const config = this.checkConfig() // 检查配置
    if (!config) {
      return {
        errorCode: 1, // 错误代码
        errorMsg: 'miss config', // 错误信息
        data: '' // 返回数据
      }
    }

    // 构建消息数组
    const messages = [
      ...(config.chatSystemPrompt ? [
        {
          role: ChatCompletionRequestMessageRoleEnum.System, // 系统角色
          content: config.chatSystemPrompt, // 系统提示内容
        },
      ] : []),
      { role: ChatCompletionRequestMessageRoleEnum.User, content: input } // 用户输入
    ]

    // 向AI模型发送请求
    const response = await this.fetchModel(
      this.getCompletionUrl(config.baseUrl), // 获取完成URL
      {
        model: config.chatModelName, // 模型名称
        messages, // 消息内容
        stream: false, // 非流式请求
        max_tokens: config.chatMaxTokens, // 最大token数
        temperature: config.chatTemperature, // 温度参数
        presence_penalty: config.chatPresencePenalty, // 出现惩罚
        frequency_penalty: config.codeFrequencyPenalty, // 频率惩罚
        top_p: config.chatTopP, // top_p参数
      },
      cancelToken // 取消令牌
    );

    // 检查响应状态
    if (!response.ok) {
      this.logger.error(`ai request failed: status: ${response.status}, body: ${await response.text()}`); // 记录错误日志
      return {
        errorCode: 1, // 错误代码
        errorMsg: `request failed: ${response.status}`, // 错误信息
      }
    }

    try {
      const data = await response.json() as ChatCompletion // 解析响应数据
      const content = data?.choices?.[0]?.message?.content; // 获取内容

      return {
        errorCode: 0, // 成功代码
        data: content, // 返回内容
      }
    } catch (err: any) {
      this.logger.error(`ai request body parse error: ${err?.message}`); // 记录解析错误日志
      throw err // 抛出错误
    }
  }

  /**
   * 处理用户流式请求并返回可读流
   * @param input 用户输入的字符串
   * @param options AI后端服务选项
   * @param cancelToken 取消令牌
   * @returns SumiReadableStream<IChatContent> 可读流
   */
  override async requestStream(input: string, options: IAIBackServiceOption, cancelToken?: CancellationToken) {
    const readableSteam = new SumiReadableStream<IChatContent>() // 创建可读流

    const config = this.checkConfig() // 检查配置
    if (!config) {
      readableSteam.emitError(new Error('miss config')); // 发送错误
      readableSteam.end(); // 结束流
      return readableSteam // 返回可读流
    }

    // 构建消息数组
    const messages = [
      ...(config.chatSystemPrompt ? [
        {
          role: ChatCompletionRequestMessageRoleEnum.System, // 系统角色
          content: config.chatSystemPrompt, // 系统提示内容
        },
      ] : []),
      { role: ChatCompletionRequestMessageRoleEnum.User, content: input } // 用户输入
    ]

    // 向AI模型发送流式请求
    const response = await this.fetchModel(
      this.getCompletionUrl(config.baseUrl), // 获取完成URL
      {
        model: config.chatModelName, // 模型名称
        messages, // 消息内容
        stream: true, // 流式请求
        max_tokens: config.chatMaxTokens, // 最大token数
        temperature: config.chatTemperature, // 温度参数
        presence_penalty: config.chatPresencePenalty, // 出现惩罚
        frequency_penalty: config.codeFrequencyPenalty, // 频率惩罚
        top_p: config.chatTopP, // top_p参数
      },
      cancelToken, // 取消令牌
    )

    // 检查响应状态
    if (!response.ok) {
      this.logger.error(`ai request stream failed: status: ${response.status}, body: ${await response.text()}`); // 记录错误日志
      readableSteam.emitError(new Error('Readable Stream Abort')); // 发送错误
      readableSteam.end(); // 结束流
      return readableSteam // 返回可读流
    }

    if (!response.body) {
      this.logger.log('ai request stream failed: no body'); // 记录日志
      readableSteam.emitError(new Error('Readable Stream Abort')); // 发送错误
      readableSteam.end(); // 结束流
      return readableSteam // 返回可读流
    }

    const { logger } = this; // 获取日志记录器

    // 使用管道处理响应体
    pipeline(response.body, async function* (readable) {
      const decoder = new TextDecoder(); // 创建解码器
      let remain = '' // 剩余数据
      for await (const chunk of readable) { // 遍历可读流
        const line = remain + decoder.decode(chunk, { stream: true }); // 解码数据
        const lines: string[] = line.split('\n'); // 按行分割
        remain = lines.pop()!; // 获取最后一行
        for (const line of lines) {
          if (!line) continue; // 跳过空行
          const data = line.slice(5).trim(); // 提取数据
          if (data === '[DONE]') { // 检查结束标志
            return
          }
          let obj: ChatCompletionChunk | undefined; // 定义聊天完成块
          try {
            obj = JSON.parse(data); // 解析数据
          } catch (error) {
            logger.log('parse data failed', error); // 记录解析错误
          }
          if (!obj) continue; // 跳过未定义对象
          const choices = obj.choices || []; // 获取选择
          for (const choice of choices) {
            const content = choice?.delta?.content // 获取内容
            if (content) {
              readableSteam.emitData({ // 发送数据到可读流
                kind: 'content', // 数据类型
                content, // 数据内容
              });
            }
          }
        }
      }
    }, (error: any) => { // 处理管道错误
      this.logger.error('ai request stream failed', error); // 记录错误日志
      if (error?.name === 'AbortError') {
        readableSteam.emitError(new Error('Readable Stream Abort')); // 发送流中止错误
      } else {
        readableSteam.emitError(error); // 发送其他错误
      }
      readableSteam.end(); // 结束流
    })

    return readableSteam; // 返回可读流
  }
  /**
   * 功能描述：请求AI模型生成代码补全或聊天响应。
   * 
   * 参数说明：
   * @param input - IAICompletionOption类型，包含会话ID和提示信息。
   * @param cancelToken - CancellationToken类型，可选，用于取消请求。
   * 
   * 返回值说明：
   * Promise<{ sessionId: string, codeModelList: Array<{ content: string }> }> - 返回会话ID和生成的代码模型列表。
   * 
   * ⚠️ 注意事项：确保配置项正确，避免请求失败。
   */
  async requestCompletion(input: IAICompletionOption, cancelToken?: CancellationToken) {
    const config = this.checkConfig(true); // 检查配置是否有效
    if (!config) {
      return {
        sessionId: input.sessionId,
        codeModelList: [],
      };
    }

    // 发送请求到AI模型，获取补全结果
    const response = await this.fetchModel(
      this.getCompletionUrl(config.baseUrl, !config.codeFimTemplate), // 获取请求URL
      {
        stream: false, // 不使用流式响应
        model: config.codeModelName || config.chatModelName, // 使用指定的模型
        max_tokens: config.codeMaxTokens, // 最大token数
        temperature: config.codeTemperature, // 温度设置
        presence_penalty: config.codePresencePenalty, // 存在惩罚
        frequency_penalty: config.codeFrequencyPenalty, // 频率惩罚
        top_p: config.codeTopP, // Top P设置
        ...(config.codeFimTemplate ? { // 如果使用代码Fim模板
          messages: [
            ...(config.codeSystemPrompt ? [
              {
                role: ChatCompletionRequestMessageRoleEnum.System,
                content: config.codeSystemPrompt, // 系统提示内容
              },
            ] : []),
            {
              role: ChatCompletionRequestMessageRoleEnum.User,
              content: config.codeFimTemplate.replace('{prefix}', input.prompt).replace('{suffix}', input.suffix || ''), // 用户提示内容
            }
          ]
        } : {
          prompt: input.prompt, // 直接使用用户输入的提示
          suffix: input.suffix, // 附加内容
        })
      },
      cancelToken // 传递取消令牌
    );

    // 检查响应状态
    if (!response.ok) {
      this.logger.error(`ai request completion failed: status: ${response.status}, body: ${await response.text()}`);
      return {
        sessionId: input.sessionId,
        codeModelList: [],
      };
    }

    try {
      const data = await response.json() as ChatCompletion | Completion; // 解析响应数据
      const content = config.codeFimTemplate ? (data as ChatCompletion)?.choices?.[0]?.message?.content : (data as Completion)?.choices?.[0]?.text; // 获取内容
      if (!content) {
        return {
          sessionId: input.sessionId,
          codeModelList: [],
        };
      }
      return {
        sessionId: input.sessionId,
        codeModelList: [{ content }], // 返回生成的内容
      };
    } catch (err: any) {
      this.logger.error(`ai request completion body parse error: ${err?.message}`);
      throw err; // 抛出解析错误
    }
  }

  /**
   * 功能描述：检查配置项的有效性。
   * 
   * 参数说明：
   * @param isCodeCompletion - boolean类型，指示是否为代码补全请求。
   * 
   * 返回值说明：
   * { config: any } | null - 返回有效的配置对象或null。
   * 
   * ⚠️ 注意事项：确保配置项完整，避免后续请求失败。
   */
  private checkConfig(isCodeCompletion = false) {
    const { config } = this.modelService; // 获取模型服务的配置
    if (!config) {
      this.logger.warn('miss config'); // 配置缺失警告
      return null;
    }
    if (!config.baseUrl) {
      this.logger.warn('miss config baseUrl'); // 基础URL缺失警告
      return null;
    }
    const modelName = isCodeCompletion ? (config.codeModelName || config.chatModelName) : config.chatModelName; // 获取模型名称
    if (!modelName) {
      this.logger.warn('miss config modelName'); // 模型名称缺失警告
      return null;
    }
    return config; // 返回有效配置
  }

  /**
   * 功能描述：向指定URL发送请求以获取AI模型的响应。
   * 
   * 参数说明：
   * @param url - string | URL类型，请求的目标URL。
   * @param body - Record<string, any>类型，请求体内容。
   * @param cancelToken - CancellationToken类型，可选，用于取消请求。
   * 
   * 返回值说明：
   * Promise<Response> - 返回AI模型的响应。
   * 
   * 🔧 配置项：确保请求体格式正确，避免请求失败。
   */
  private async fetchModel(url: string | URL, body: Record<string, any>, cancelToken?: CancellationToken): Promise<Response> {
    const controller = new AbortController(); // 创建AbortController以支持请求取消
    const signal = controller.signal; // 获取信号

    const { config } = this.modelService; // 获取模型服务的配置

    // 处理取消请求
    cancelToken?.onCancellationRequested(() => {
      controller.abort(); // 中止请求
    });

    // 发送POST请求
    return fetch(
      url,
      {
        signal, // 传递信号以支持取消
        method: 'POST', // 请求方法
        headers: {
          'Content-Type': 'application/json;charset=UTF-8', // 设置请求头
          ...(config?.apiKey ? {
            Authorization: `Bearer ${config.apiKey}` // 添加API密钥
          } : null),
        },
        body: JSON.stringify(body), // 请求体
      },
    ) as unknown as Promise<Response>; // 返回Promise<Response>
  }

  /**
   * 功能描述：构建AI模型请求的完整URL。
   * 
   * 参数说明：
   * @param baseUrl - string类型，基础URL。
   * @param supportFim - boolean类型，指示是否支持Fim模板。
   * 
   * 返回值说明：
   * URL - 返回构建好的请求URL。
   * 
   * 🔧 配置项：确保基础URL格式正确。
   */
  private getCompletionUrl(baseUrl: string, supportFim = false) {
    if (!baseUrl.endsWith('/')) {
      baseUrl += '/'; // 确保基础URL以斜杠结尾
    }
    return new URL(supportFim ? 'completions' : 'chat/completions', baseUrl); // 返回完整的请求URL
  }
}
