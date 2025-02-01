// 文件功能：该文件实现了Electron应用的头部工具栏和窗口状态管理，包含自定义Hook (useMaximize) 及两个React组件 (ElectronHeaderBar 和 HeaderBarTitleComponent)。主要功能包括监听窗口最大化状态、根据操作系统调整头部布局，以及动态更新标题栏位置与页面标题。🚀

import React, { useEffect, useMemo, useRef, useState, useLayoutEffect } from 'react';

import {
  ComponentRegistry,
  ComponentRenderer,
  Disposable,
  DomListener,
  IWindowService,
  electronEnv,
  getIcon,
  isMacintosh,
  useEventEffect,
  useInjectable,
} from '@opensumi/ide-core-browser';
import { LayoutViewSizeConfig } from '@opensumi/ide-core-browser/lib/layout/constants';
import { IElectronMainUIService } from '@opensumi/ide-core-common/lib/electron';
import { IElectronHeaderService } from '@opensumi/ide-electron-basic/lib/common/header';

import styles from './header.module.less';

// 🔧 配置项：定义不同平台下窗口及菜单栏的固定宽度常量
const macTrafficWidth = 72;
const winActionWidth = 138;
const menuBarLeftWidth = 286;
const menuBarRightWidth = 28;
const extraWidth = 150;

/**
 * 🔧 useMaximize
 *
 * 功能描述：监听并管理Electron窗口的最大化状态变化。
 *
 * 参数说明：无
 *
 * 返回值说明：返回一个对象，包含：
 *   - maximized (boolean)：当前窗口是否为最大化状态
 *   - getMaximized (async function)：异步函数，用于获取当前窗口最大化状态
 */
const useMaximize = () => {
  // 注入IElectronMainUIService，用于控制窗口状态
  const uiService: IElectronMainUIService = useInjectable(IElectronMainUIService);
  const [maximized, setMaximized] = useState(false);

  // 异步获取窗口最大化状态
  const getMaximized = async () => uiService.isMaximized(electronEnv.currentWindowId);

  useEffect(() => {
    // ⚠️ 注意事项：监听窗口最大化状态变更事件，确保只对当前窗口生效
    const maximizeListener = uiService.on('maximizeStatusChange', (windowId, isMaximized) => {
      if (windowId === electronEnv.currentWindowId) {
        setMaximized(isMaximized);
      }
    });
    // 初始化时查询窗口状态，并更新state
    getMaximized().then((maximized) => {
      setMaximized(maximized);
    });
    // 清理监听器，防止内存泄露
    return () => {
      maximizeListener.dispose();
    };
  }, []);

  return {
    maximized,
    getMaximized,
  };
};

/**
 * 🚀 ElectronHeaderBar 组件
 *
 * 功能描述：渲染Electron应用的头部工具栏，并处理双击事件以切换窗口最大化与还原状态，同时针对不同操作系统调整布局样式。
 *
 * 参数说明：无
 *
 * 返回值说明：返回JSX.Element，包含自定义标题栏组件
 */
export const ElectronHeaderBar = () => {
  // 创建DOM引用，用于操作头部工具栏样式
  const ref = useRef<HTMLDivElement | null>(null);
  // 注入窗口服务，提供窗口最大化及还原方法
  const windowService: IWindowService = useInjectable(IWindowService);
  // 注入布局尺寸服务，计算Electron头部安全高度
  const layoutViewSize = useInjectable<LayoutViewSizeConfig>(LayoutViewSizeConfig);

  // 使用自定义Hook来获取窗口最大化状态
  const { getMaximized } = useMaximize();

  // 🚀 性能优化：使用useMemo缓存布局高度计算, 仅当layoutViewSize发生变化时重新计算
  const safeHeight = useMemo(() => {
    return layoutViewSize.calcElectronHeaderHeight();
  }, [layoutViewSize]);

  useLayoutEffect(() => {
    const currentElement = ref.current;
    if (!currentElement) return;
    const { parentElement } = currentElement;
    if (!parentElement) return;
    // 根据不同平台设置相应的内边距及位置
    if (isMacintosh) {
      parentElement.style.paddingLeft = `${macTrafficWidth}px`;
      currentElement.style.left = `${macTrafficWidth + menuBarLeftWidth + extraWidth}px`;
      currentElement.style.right = `${menuBarRightWidth + extraWidth}px`;
    } else {
      parentElement.style.paddingRight = `${winActionWidth}px`;
      currentElement.style.left = `${menuBarLeftWidth + extraWidth}px`;
      currentElement.style.right = `${menuBarRightWidth + winActionWidth + extraWidth}px`;
    }
  }, []);

  return (
    <div
      className={styles.header}
      style={{ height: safeHeight }}
      // ⚠️ 注意事项：双击头部工具栏切换窗口最大化/还原状态
      onDoubleClick={async () => {
        if (await getMaximized()) {
          windowService.unmaximize();
        } else {
          windowService.maximize();
        }
      }}
      ref={ref}
    >
      <HeaderBarTitleComponent />
    </div>
  );
};

/**
 * 🚀 HeaderBarTitleComponent 组件
 *
 * 功能描述：渲染头部工具栏中的应用标题，并根据窗口大小动态调整标题位置，同时更新document.title以同步浏览器标签。
 *
 * 参数说明：无
 *
 * 返回值说明：返回JSX.Element，包含带有动态调整位置和更新逻辑的标题栏DOM结构
 */
export const HeaderBarTitleComponent = () => {
  // 注入IElectronHeaderService，用于获取并监听应用标题
  const headerService = useInjectable(IElectronHeaderService) as IElectronHeaderService;
  // container引用，用于调整标题容器样式
  const ref = useRef<HTMLDivElement>(null);
  // span引用，用于获取标题宽度，便于计算居中位置
  const spanRef = useRef<HTMLSpanElement>(null);
  const [appTitle, setAppTitle] = useState<string>('');

  useEffect(() => {
    // 🔧 配置项：设置默认标题，并监听标题变化事件
    const defaultAppTitle = 'CodeFuse IDE';
    setAppTitle(headerService.appTitle || defaultAppTitle);
    const disposable = headerService.onTitleChanged((v) => {
      setAppTitle(v || defaultAppTitle);
    });
    // 清理订阅，防止内存泄露
    return () => {
      disposable.dispose();
    };
  }, []);

  useEffect(() => {
    // 初始位置设置及窗口尺寸变化时重新计算标题位置
    setPosition();
    const disposer = new Disposable();

    // ⚠️ 注意事项：监听window的resize事件，确保标题位置能够自适应变化
    disposer.addDispose(
      new DomListener(window, 'resize', () => {
        setPosition();
      }),
    );
  }, []);

  /**
   * 🔧 setPosition
   *
   * 功能描述：根据窗口宽度、菜单栏宽度及标题自身宽度计算标题的左内边距，从而实现水平居中效果。
   *
   * 核心算法步骤：
   * | 步骤描述                              | 实现代码                                                         |
   * | ------------------------------------- | ---------------------------------------------------------------- |
   * | 获取当前窗口宽度                      | const windowWidth = window.innerWidth;                           |
   * | 计算菜单栏及额外宽度（根据平台考虑macTrafficWidth） | const leftWidth = menuBarLeftWidth + extraWidth + (isMacintosh ? macTrafficWidth : 0); |
   * | 计算标题居中后左边距                  | const left = Math.max(0, windowWidth * 0.5 - leftWidth - spanRef.current.offsetWidth * 0.5); |
   * | 更新容器样式使标题居中                | ref.current.style.paddingLeft = left + 'px';                      |
   * | 更新容器可见性                        | ref.current.style.visibility = 'visible';                         |
   *
   * 参数说明：无
   *
   * 返回值说明：void，无返回值
   */
  function setPosition() {
    window.requestAnimationFrame(() => {
      if (ref.current && spanRef.current) {
        const windowWidth = window.innerWidth;
        const leftWidth = menuBarLeftWidth + extraWidth + (isMacintosh ? macTrafficWidth : 0);
        const left = Math.max(0, windowWidth * 0.5 - leftWidth - spanRef.current.offsetWidth * 0.5);
        ref.current.style.paddingLeft = left + 'px';
        // 🚀 性能优化：在requestAnimationFrame中更新DOM样式，降低重排频率
        ref.current.style.visibility = 'visible';
      }
    });
  }

  // 🚀 性能优化：监听appTitle变化，同步更新页面标签标题
  useEffect(() => {
    document.title = appTitle;
  }, [appTitle]);

  return (
    <div className={styles.title_info} ref={ref} style={{ visibility: 'hidden' }}>
      <span ref={spanRef}>{appTitle}</span>
    </div>
  );
};
