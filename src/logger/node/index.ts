// Start of Selection
/**
 * @文件: LoggerModule日志模块
 * @功能概述:
 *   本模块用于在Node环境中提供日志服务管理，通过依赖注入将ILogServiceManager接口与其实现LogServiceManager绑定，
 *   确保日志服务在系统中的统一管理与可替换性。
 *
 * @详细描述:
 *   LoggerModule继承自NodeModule，并利用@opensumi/di提供的依赖注入机制，将日志服务(ILogServiceManager)的具体实现(LogServiceManager)
 *   注册为Provider。模块初始化时，该Provider会被注入到依赖注入容器中，从而允许其他模块通过接口获取日志服务实例。
 *
 * @性能与资源:
 *   时间复杂度：O(1) —— 初始化时仅注册一次Provider。
 *   空间复杂度：O(1)
 *
 * @历史背景:
 *   初期版本直接实例化日志服务，但为增强系统模块的灵活替换性与可维护性，转向使用依赖注入策略。
 *
 * @依赖:
 *   - @opensumi/di：用于依赖注入
 *   - @opensumi/ide-core-node：Node模块基类
 *   - @opensumi/ide-logs：日志服务接口定义
 *   - ./log-manager：日志服务具体实现
 */

import { Injectable, Provider } from '@opensumi/di';
import { NodeModule } from '@opensumi/ide-core-node';
import { ILogServiceManager } from '@opensumi/ide-logs';
import { LogServiceManager } from './log-manager';

@Injectable()
/**
 * @class LoggerModule
 * @extends NodeModule
 *
 * @功能描述:
 *   提供日志服务管理功能，通过依赖注入机制注册ILogServiceManager的实现(LogServiceManager)。
 *
 * @构造参数:
 *   无 (默认构造函数)
 *
 * @返回值:
 *   LoggerModule类的实例，用于在Node环境中进行日志服务管理。
 *
 * @注意事项:
 *   ⚠️ 使用@opensumi/di依赖注入时，确保相关依赖模块安装正确。override属性设置为true，允许覆盖已有的ILogServiceManager实现。
 */
export class LoggerModule extends NodeModule {
  // 注册依赖提供者，将ILogServiceManager接口绑定到其具体实现LogServiceManager
  providers: Provider[] = [
    {
      token: ILogServiceManager,   // 🔧 配置项：依赖注入标识符，指明需要实现的接口
      useClass: LogServiceManager, // 🔧 配置项：提供ILogServiceManager接口的具体实现类
      override: true,              // ⚠️ 注意：开启覆盖模式，允许替换已有的ILogServiceManager实现
    },
  ];
}
// End of Selectio
