/**
 * 常量和枚举定义文件
 * 
 * 本文件定义了与AI相关的菜单操作常量和内联操作枚举。
 * 这些常量和枚举用于在用户界面中标识不同的操作类型。
 */

// 🔧 配置项：左侧菜单栏操作常量
export const AI_MENU_BAR_LEFT_ACTION = 'ai-menu-bar-left-action';
// export const AI_MENU_BAR_RIGHT_ACTION = 'ai-menu-bar-right-action'; // 右侧菜单栏操作常量（暂时注释掉）

/**
 * EInlineOperation 枚举定义了内联操作的类型。
 * 
 * 该枚举用于标识用户在编辑器中可以执行的不同操作。
 */
export enum EInlineOperation {
  Explain = 'Explain', // 解释操作
  Comments = 'Comments', // 添加注释操作
  Test = 'Test', // 测试操作
  Optimize = 'Optimize', // 优化操作
}
