/**
 * @file common-modules.ts
 * @brief 定义并导出通用 Node 模块集合
 *
 * 🔧 配置项：CommonNodeModules 用于在 Node 环境中初始化应用所有必要的模块，
 *    包括服务、文件操作、搜索、终端仿真、扩展加载及 AI 相关功能。
 * 🚀 性能优化：所有模块一次性加载，减少初始化时的重复加载，提升启动效率。
 * ⚠️ 注意事项：确保各依赖包已经安装且类型声明完备，避免运行时错误。
 *
 * 详细信息：
 * - 功能描述：通过引入并集中管理各类 Node 模块，便于依赖注入和模块化管理。
 * - 参数说明：无参数，所有模块通过 import 引入后统一存放于数组中。
 * - 返回值说明：ConstructorOf<NodeModule>[] —— 模块构造函数数组，用于系统依赖注入。
 *
 * 历史背景：此代码经过多次重构以提升可维护性，最初版本用于快速搭建 Node 应用环境，
 *   后续增加了更多业务及 AI 模块，提高了系统扩展与集成能力。
 */
import { NodeModule, ConstructorOf } from '@opensumi/ide-core-node'; // 🔧 Node 基础模块及类型定义
import { ServerCommonModule } from '@opensumi/ide-core-node';         // 🔧 服务器基础服务模块
import { FileServiceModule } from '@opensumi/ide-file-service/lib/node'; // 🔧 文件服务模块，用于处理文件相关操作
import { OpenerModule } from '@opensumi/ide-remote-opener/lib/node';      // 🔧 资源打开模块，用于支持远程资源的访问
import { ProcessModule } from '@opensumi/ide-process/lib/node';          // 🔧 进程管理模块，用于管理子进程操作
import { FileSearchModule } from '@opensumi/ide-file-search/lib/node';     // 🔧 文件搜索模块，优化文件查找效率
import { SearchModule } from '@opensumi/ide-search/lib/node';              // 🔧 综合搜索模块，支持多场景搜索需求
import { TerminalNodePtyModule } from '@opensumi/ide-terminal-next/lib/node'; // 🔧 终端仿真模块，实现终端功能
import { LogServiceModule } from '@opensumi/ide-logs/lib/node';            // 🔧 日志服务模块，便于记录系统运行日志
import { ExtensionModule } from '@opensumi/ide-extension/lib/node';        // 🔧 扩展管理模块，负责插件加载与管理
import { OpenVsxExtensionManagerModule } from '@opensumi/ide-extension-manager/lib/node'; // 🔧 Open VSX 扩展管理模块
import { FileSchemeNodeModule } from '@opensumi/ide-file-scheme/lib/node';  // 🔧 文件协议模块，用于特殊文件操作场景
import { AddonsModule } from '@opensumi/ide-addons/lib/node';              // 🔧 附加组件模块，提供额外功能扩展
import { CoreNodeModule } from "@/core/node";                            // 🔧 核心业务逻辑模块
import { LoggerModule } from "@/logger/node";                              // 🔧 日志记录模块，辅助系统问题追踪
import { AINativeModule } from "@opensumi/ide-ai-native/lib/node";         // 🔧 AI 原生模块，集成 AI 基础能力
import { AIServiceModule } from "@/ai/node";                               // 🔧 AI 服务模块，提供智能化服务功能

/**
 * @brief 构造并导出通用 Node 模块数组
 *
 * 功能描述：集中管理并导出所有必需的 Node 模块，方便依赖注入和系统初始化。
 *
 * 参数说明：
 *   无参数 —— 所引用的各模块均通过 import 导入，无需运行时传递参数。
 *
 * 返回值说明：
 *   ConstructorOf<NodeModule>[] —— 包含所有模块构造函数的数组，
 *      用于统一注入 Node 环境中所需的模块。
 *
 * 时间复杂度：O(1)  // 🚀 常量时间复杂度，直接赋值操作
 * 空间复杂度：O(n)  // 🚀 空间依赖于模块数量 n
 */
export const CommonNodeModules: ConstructorOf<NodeModule>[] = [
  ServerCommonModule,             // 🚀 提供基础服务器服务
  LogServiceModule,               // 🚀 实现日志记录和追踪功能
  FileServiceModule,              // 🚀 支持文件操作及管理
  ProcessModule,                  // 🚀 管理子进程，保障进程间通信
  FileSearchModule,               // 🚀 增强文件搜索能力，提升检索效率
  SearchModule,                   // 🚀 通用搜索模块，覆盖多种搜索需求
  TerminalNodePtyModule,          // 🚀 实现终端仿真和交互功能
  ExtensionModule,                // 🚀 管理插件扩展，支持动态加载
  OpenVsxExtensionManagerModule,  // 🚀 管理 Open VSX 扩展，丰富插件生态
  FileSchemeNodeModule,           // 🚀 支持特殊文件协议，便于文件操作定制化
  AddonsModule,                   // 🚀 提供附加扩展功能，增加系统灵活性
  CoreNodeModule,                 // 🚀 核心业务逻辑支持，为系统提供基础功能
  LoggerModule,                   // 🚀 记录详细日志，便于问题排查与监控
  OpenerModule,                   // 🚀 支持远程和本地资源的统一打开方式
  // ai 模块
  AINativeModule,                 // 🚀 快速集成 AI 原生能力，历史上用于提升智能响应速度
  AIServiceModule,                // 🚀 提供 AI 服务接口，支持智能化处理任务
];
