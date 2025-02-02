/**
 * 🔧 模块概述：定义了一个核心 Node 模块 CoreNodeModule，用于在 Node 环境下进行依赖注入服务的管理。
 *
 * ⚙️ 详细描述：
 *   - CoreNodeModule 继承自 NodeModule，是一个扩展模块，为后续添加服务提供者提供基础框架。
 *   - 通过 @Injectable 装饰器标记，使 CoreNodeModule 能够被依赖注入系统识别和管理。
 *   - providers 属性初始化为空数组，预留用于注册模块内的各种服务提供者，便于模块扩展与解耦。
 *
 * 📋 历史背景：
 *   - 该设计初衷是为了构建一个灵活且可扩展的 Node.js 应用核心模块，能够适应未来业务需求的调整。
 *
 * ⏱️ 时间/空间复杂度：
 *   - 本模块主要进行简单的数据容器初始化，无复杂算法处理，时间和空间复杂度均为 O(1)。
 *
 * @class CoreNodeModule
 */
import { NodeModule } from '@opensumi/ide-core-node';  // 🔧 从核心 Node 模块中引入基类 NodeModule，用于模块扩展
import { Injectable } from '@opensumi/di';                // 🔧 引入 Injectable 装饰器，用于依赖注入管理

@Injectable()  // ⚠️ 确保 CoreNodeModule 类能够被依赖注入容器正确识别和处理
export class CoreNodeModule extends NodeModule {
  /**
   * 🚀 providers 属性：用于存储当前模块的服务提供者列表
   *
   * 功能描述：初始化时将服务提供者集合设为空，便于后续动态注册模块需要的服务。
   *
   * 参数说明：
   *   - 无参数，因为该属性在类定义时直接赋值，类型为 any[]。
   *
   * 返回值说明：
   *   - 无返回值，仅作为类属性的初始状态，类型为 any[]。
   */
  providers = [];
}
