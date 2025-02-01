/**
 * CommandRender组件用于处理用户输入的命令并返回相应的AI响应。
 * 
 * 功能描述：该组件接收用户输入的消息，调用AI服务获取响应，并根据响应类型执行相应操作。
 * 
 * 参数说明：
 * - userMessage: string - 用户输入的消息内容。
 * 
 * 返回值说明：
 * - JSX.Element - 返回的渲染结果，可能是加载状态、错误提示或AI响应内容。
 */

import React, { useCallback, useEffect, useMemo } from 'react';
import { ChatThinking, ChatThinkingResult } from '@opensumi/ide-ai-native/lib/browser/components/ChatThinking';
import { ChatMarkdown } from '@opensumi/ide-ai-native/lib/browser/components/ChatMarkdown';
import { TSlashCommandCustomRender } from '@opensumi/ide-ai-native/lib/browser/types';
import { useInjectable, COMMON_COMMANDS, CommandService } from '@opensumi/ide-core-browser';
import { Button } from '@opensumi/ide-core-browser/lib/components';
import { CommandOpener } from '@opensumi/ide-core-browser/lib/opener/command-opener';
import { IAIBackServiceResponse, URI } from '@opensumi/ide-core-common';
import { AICommandService, ISumiModelResp, ISumiCommandModelResp, ISumiSettingModelResp } from './command.service';
import styles from './command-render.module.less';

// AI响应提示信息
const AiResponseTips = {
  ERROR_RESPONSE: '当前与我互动的人太多，请稍后再试，感谢您的理解与支持', // 错误提示
  STOP_IMMEDIATELY: '我先不想了，有需要可以随时问我', // 停止提示
  NOTFOUND_COMMAND: '很抱歉，暂时未找到可立即执行的命令。', // 未找到命令提示
  NOTFOUND_COMMAND_TIP: '你可以打开命令面板搜索相关操作或者重新提问。' // 提示用户操作
};

/**
 * CommandRender组件实现了用户命令的处理逻辑。
 * 
 * @param {Object} props - 组件属性。
 * @param {string} props.userMessage - 用户输入的消息。
 * 
 * @returns {JSX.Element} - 返回的渲染结果。
 */
export const CommandRender: TSlashCommandCustomRender = ({ userMessage }) => {
  const aiSumiService = useInjectable<AICommandService>(AICommandService); // 注入AI命令服务
  const opener = useInjectable<CommandOpener>(CommandOpener); // 注入命令打开器
  const commandService = useInjectable<CommandService>(CommandService); // 注入命令服务

  const [loading, setLoading] = React.useState(false); // 加载状态
  const [modelRes, setModelRes] = React.useState<IAIBackServiceResponse<ISumiModelResp>>(); // AI响应结果

  // 处理用户输入，去除前缀并修剪空格
  const userInput = useMemo(() => {
    return userMessage.replace('/IDE', '').trim();
  }, [userMessage]);

  // 监听用户输入变化，获取AI响应
  useEffect(() => {
    if (!userInput) {
      return; // 如果用户输入为空，直接返回
    }

    setLoading(true); // 设置加载状态为true

    // 调用AI服务获取响应
    aiSumiService.getModelResp(userInput)
      .then((resp) => {
        setModelRes(resp); // 设置响应结果
      })
      .finally(() => {
        setLoading(false); // 重置加载状态
      });
  }, [userInput]);

  /**
   * 执行命令或打开设置。
   * 
   * 功能描述：根据AI响应的类型执行相应的操作。
   * 
   * 返回值说明：无返回值。
   */
  const excute = useCallback(() => {
    if (modelRes && modelRes.data) {
      const { type, data } = modelRes; // 解构响应数据
      if (type === 'command') {
        const modelData = data as ISumiCommandModelResp; // 强制类型转换
        opener.open(URI.parse(`command:${modelData.commandKey}`)); // 打开命令
        return;
      }

      if (type === 'setting') {
        const modelData = data as ISumiSettingModelResp; // 强制类型转换
        commandService.executeCommand(COMMON_COMMANDS.OPEN_PREFERENCES.id, modelData.settingKey); // 执行设置命令
      }
    }
  }, [modelRes]);

  // 处理失败文本
  const failedText = useMemo(() => {
    if (!modelRes) {
      return ''; // 如果没有响应，返回空字符串
    }

    return modelRes.errorCode
      ? AiResponseTips.ERROR_RESPONSE // 返回错误提示
      : !modelRes.data
        ? AiResponseTips.NOTFOUND_COMMAND // 返回未找到命令提示
        : '';
  }, [modelRes]);

  // 处理重新生成请求
  const handleRegenerate = useCallback(() => {
    console.log('retry'); // 记录重试操作
  }, []);

  // 加载状态或无响应时显示加载组件
  if (loading || !modelRes) {
    return <ChatThinking />;
  }

  // 如果有失败文本，显示错误信息
  if (failedText) {
    return (
      <ChatThinkingResult onRegenerate={handleRegenerate}>
        {failedText === AiResponseTips.NOTFOUND_COMMAND ? (
          <div>
            <p>{failedText}</p>
            <p>{AiResponseTips.NOTFOUND_COMMAND_TIP}</p>
            <Button
              style={{ width: '100%' }}
              onClick={() =>
                opener.open(
                  URI.from({
                    scheme: 'command',
                    path: 'editor.action.quickCommand.withCommand',
                    query: JSON.stringify([userInput]),
                  }),
                )
              }
            >
              打开命令面板
            </Button>
          </div>
        ) : (
          failedText // 显示其他错误信息
        )}
      </ChatThinkingResult>
    );
  }

  const { data } = modelRes; // 解构响应数据
  const { type, answer } = data ?? {}; // 解构类型和答案

  return (
    <ChatThinkingResult onRegenerate={handleRegenerate}>
      <div className={styles.chat_excute_result}>
        <ChatMarkdown markdown={answer ?? ''} /> {/* 渲染AI回答的Markdown内容 */}
        {type !== 'null' && (
          <Button onClick={excute} style={{ marginTop: '12px' }}>
            {type === 'command' ? '点击执行' : '在设置编辑器中显示'} {/* 根据类型显示不同按钮文本 */}
          </Button>
        )}
      </div>
    </ChatThinkingResult>
  );
};