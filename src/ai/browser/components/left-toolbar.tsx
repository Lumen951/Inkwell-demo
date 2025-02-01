// 本组件用于渲染左侧工具栏，包含AI运行工具条
// 引入React库和AIRunToolbar组件

import React from 'react' // 引入React库以支持JSX语法
import { AIRunToolbar } from '@opensumi/ide-ai-native/lib/browser/contrib/run-toolbar/run-toolbar'; // 引入AIRunToolbar组件

/**
 * LeftToolbar组件
 * 
 * 功能描述：渲染AI运行工具条的左侧工具栏
 * 
 * 参数说明：无
 * 
 * 返回值说明：JSX.Element - 渲染的AIRunToolbar组件
 */
export const LeftToolbar = () => {
  return <AIRunToolbar />; // 返回AIRunToolbar组件的实例
}
