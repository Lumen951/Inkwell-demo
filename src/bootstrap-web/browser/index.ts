/**
 * @fileoverview
 * 功能描述：🚀 此模块用于初始化和渲染浏览器端应用程序，加载所需的国际化、文件服务、样式、布局以及AI相关配置等模块。
 *
 * 参数说明：
 *   无直接输入参数；通过模块导入和 renderApp 函数调用将各子模块注入应用程序初始化流程中
 *
 * 返回值说明：
 *   无返回值；该模块通过调用 renderApp 启动并在浏览器环境下渲染应用程序
 *
 * 注意事项：
 *   ⚠️ 请确保所有依赖模块均正确安装，且路径声明符合项目结构要求。
 */

import '@opensumi/ide-i18n/lib/browser';  // 🔧 引入国际化模块，支持多语言功能

// 🔧 引入 Express 文件服务模块，为浏览器端提供静态文件服务支持
import {ExpressFileServerModule} from '@opensumi/ide-express-file-server/lib/browser';

// 🔧 引入基础样式文件，确保浏览器端 UI 样式一致
import '@opensumi/ide-core-browser/lib/style/index.less';

// 🔧 引入图标样式，保证图标资源正常显示
import '@opensumi/ide-core-browser/lib/style/icon.less';

import {renderApp} from './render-app';  // 🔧 主应用渲染函数，用于初始化并启动整个应用
import {CommonBrowserModules} from '@/bootstrap-web/browser/common-modules';  // 🔧 公共浏览器模块，包含应用常用功能模块
import {layoutConfig} from './layout-config';  // 🔧 布局配置对象，用于设置界面布局相关参数

// 🔧 引入主样式文件，优化应用整体风格
import './main.less';

// 🔧 引入额外样式文件，提供补充样式支持
import './styles.less';

// 🔧 引入 AI 布局组件，用于支持 AI 智能界面布局
import {AILayout} from "@opensumi/ide-ai-native/lib/browser/layout/ai-layout";

// 🔧 引入默认布局视图大小常量，根据系统预设进行视图尺寸配置，实验性支持Shadow DOM
import {DEFAULT_LAYOUT_VIEW_SIZE} from "@opensumi/ide-core-browser/lib/layout/constants";

// 🔧 引入 AI 原生设置部分 ID，用于在默认配置中指定参数项
import {AINativeSettingSectionsId} from "@opensumi/ide-core-common";

// 🔧 导入应用标志性 LOGO，用于展示在应用菜单栏或启动界面
import logo from '@/core/browser/assets/logo.svg';

/**
 * @function renderApp
 * @brief 功能描述：初始化并渲染浏览器端应用程序
 * @param {Object} config - 应用配置对象，包含各项功能模块、布局配置、默认设置等参数
 *   - modules {Array}：包含通用浏览器模块与 Express 文件服务模块
 *   - layoutConfig {Object}：界面布局配置参数
 *   - layoutComponent {Component}：指定用于布局的 React 组件
 *   - layoutViewSize {Object}：界面视图尺寸设置，当前配置 bigSurTitleBarHeight 使用预设 menubar 高度
 *   - useCdnIcon {Boolean}：是否使用 CDN 图标，false 表示本地图标资源
 *   - useExperimentalShadowDom {Boolean}：是否启用实验性 Shadow DOM 功能
 *   - defaultPreferences {Object}：默认应用偏好设置，键值对定义各项默认参数
 *   - AINativeConfig {Object}：AI 原生模块配置，包括布局相关信息（如 menubarLogo）
 * @return {void} 无返回值，直接渲染启动应用程序
 */
renderApp({
  modules: [
    ...CommonBrowserModules,  // 🚀 合并公共模块，确保所有页面所需权限与服务均被加载
    ExpressFileServerModule,  // 🚀 添加 Express 文件服务模块，确保静态资源服务正常
  ],
  layoutConfig,               // 🔧 设置界面布局配置项
  layoutComponent: AILayout,  // 🔧 指定布局组件为 AI 布局组件，支持智能交互布局
  layoutViewSize: {
    // 🚀 根据默认布局尺寸常量配置 Big Sur 风格标题栏高度
    bigSurTitleBarHeight: DEFAULT_LAYOUT_VIEW_SIZE.menubarHeight,
  },
  useCdnIcon: false,          // ⚠️ 不使用 CDN 图标，使用本地图标资源以保证一致性和离线可用性
  useExperimentalShadowDom: false,  // ⚠️ 未启用实验性 Shadow DOM 功能，稳定性优先
  defaultPreferences: {
    'settings.userBeforeWorkspace': true,  // 🔧 默认用户设置优先于工作区设置
    'general.icon': 'vs-seti',              // 🔧 指定默认图标主题为 vs-seti
    [AINativeSettingSectionsId.IntelligentCompletionsPromptEngineeringEnabled]: false,  // 🔧 禁用智能提示工程配置
    // 🔧 历史背景：始终显示智能提示，提升用户体验
    [AINativeSettingSectionsId.IntelligentCompletionsAlwaysVisible]: true,
  },
  AINativeConfig: {
    layout: {
      menubarLogo: logo,  // 🚀 设置菜单栏 LOGO 为应用默认标志
    }
  }
});
