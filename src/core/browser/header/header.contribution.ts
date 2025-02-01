import { Domain } from '@opensumi/ide-core-browser';
import { ComponentContribution, ComponentRegistry } from '@opensumi/ide-core-browser/lib/layout';
import { ElectronHeaderBar } from './header.view';

/**
 * 🔧 @brief 定义 Electron Header 组件的识别常量
 *
 * @description
 * 该部分代码定义了 ELECTRON_HEADER 和 WINDOW 两个常量，作为 Electron
 * 头部组件注册和标识使用。通过使用常量来管理组件 ID，可以保证全局唯一性，
 * 并方便后续维护和扩展。
 *
 * @note 历史背景：初期项目中组件标识分散在各处，后改为集中管理常量提高代码一致性。
 */
export const ELECTRON_HEADER = 'electron_header';
export const WINDOW = 'electron_header';

/**
 * 🔧 @brief HeaderContribution 类，用于注册 ElectronHeaderBar 组件
 *
 * @class HeaderContribution
 * @implements ComponentContribution
 *
 * @description
 * 该类实现了 ComponentContribution 接口，用于将 ElectronHeaderBar 组件注册到
 * 系统的组件注册器中，使其能够在 Electron 应用中被动态加载和展示。
 *
 * ⚠️ 注意事项：
 * - 注册时确保组件的 id 与常量 ELECTRON_HEADER 保持一致，避免出现重复或冲突。
 * - 注册过程的时间复杂度为 O(1)，因为是直接注册映射，不涉及复杂计算。
 */
@Domain(ComponentContribution)
export class HeaderContribution implements ComponentContribution {
  /**
   * 🚀 @brief 注册 ElectronHeaderBar 组件到组件注册器
   *
   * @param {ComponentRegistry} registry - 组件注册器实例，用于管理系统内所有组件。
   *        例如：注册操作类似于数学中的函数映射 f(ELECTRON_HEADER) = { id, component }。
   *
   * @returns {void} 无返回值
   *
   * @example
   * registry.register(ELECTRON_HEADER, {
   *   id: ELECTRON_HEADER,
   *   component: ElectronHeaderBar,
   * });
   *
   * @note 历史背景：采用统一的组件注册机制可以有效提高项目的可维护性和代码复用率。
   */
  registerComponent(registry: ComponentRegistry): void {
    // 直接调用 registry.register 方法将 ElectronHeaderBar 组件进行注册，
    // 使用预定义的 ELECTRON_HEADER 作为组件标识符
    registry.register(
      ELECTRON_HEADER,
      {
        id: ELECTRON_HEADER,
        component: ElectronHeaderBar,
      },
    );
  }
}
