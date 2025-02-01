/**
 * @fileoverview 🔧 此模块用于为 Node.js 的 Module 查找路径启用 ASAR 支持，
 * 允许在 Electron 应用中直接加载 .asar 格式的 node_modules，从而提高资源加载效率。
 *
 * 🚀 函数功能摘要：在默认的 node_modules 路径查找逻辑中插入对应的 .asar 目录，以支持 ASAR 打包文件的加载。
 *
 * @function enableASARSupport
 * @description
 *   启用 ASAR 支持，将 node_modules 路径扩展为包括 .asar 文件路径。
 *   改写 Module._resolveLookupPaths 方法，在原始路径中插入 .asar 目录以便在查找模块时优先尝试加载
 *   ASAR 格式的模块包。
 *
 * @param {无} 无参数
 * @returns {void} 无返回值
 *
 * @注意事项 ⚠️
 *   1. 修改 Node.js 的内部模块查找行为可能会影响应用调试及打包时的模块解析。
 *   2. 保证 __dirname 已在 Node.js 环境中有效定义，否则路径解析将失败。历史背景：在 Electron 中启用 ASAR 后，
 *      某些 npm 包的加载逻辑可能有所不同，因此需要此适配层。
 *
 * @复杂度分析 🚀
 *   时间复杂度：在查找节点时遍历路径数组，最坏情况下 O(n)，n 为路径数组长度
 *   空间复杂度：O(1)
 */
import path from 'node:path'  // 🔧 使用 Node.js 内置的 path 模块处理路径操作
import module from 'node:module'  // 🔧 导入 Node.js 的 module 模块用于访问内部 Module 类

function enableASARSupport() {
  // 🔧 定义 node_modules 的绝对路径，利用 __dirname 指向当前文件所在目录
  const NODE_MODULES_PATH = path.join(__dirname, '../../node_modules');
  // 🔧 生成对应的 .asar 文件夹路径，通常 .asar 文件将与 node_modules 同名但扩展为 .asar
  const NODE_MODULES_ASAR_PATH = `${NODE_MODULES_PATH}.asar`;

  // 🔧 获取 Module 类，并通过类型断言转换为任意类型以便后续覆盖其私有方法
  const Module = module.Module as any;
  // 🔧 保存原始的 _resolveLookupPaths 方法，以便在修改过程中调用原始逻辑
  const originalResolveLookupPaths = Module._resolveLookupPaths;

  // 🚀 重写 _resolveLookupPaths 方法，插入 ASAR 路径到查找路径数组中
  Module._resolveLookupPaths = function (request: any, parent: any) {
    // 🚀 调用原始方法，获取默认的模块查找路径数组
    const paths = originalResolveLookupPaths(request, parent);

    // 🚀 判断返回的路径是否为数组，确保操作安全
    if (Array.isArray(paths)) {
      // 🚀 遍历路径数组，找到与 NODE_MODULES_PATH 相匹配的路径位置，插入对应的 .asar 路径
      for (let i = 0, len = paths.length; i < len; i++) {
        if (paths[i] === NODE_MODULES_PATH) {
          // 🚀 使用 splice 方法在目标位置前插入 NODE_MODULES_ASAR_PATH，然后跳出循环（只插入一次）
          paths.splice(i, 0, NODE_MODULES_ASAR_PATH);
          break;
        }
      }
    }
    // 🚀 返回修改后的查找路径数组，供后续模块解析操作使用
    return paths;
  };
}

// 🚀 调用 enableASARSupport 函数，以使 ASAR 支持生效
enableASARSupport()
