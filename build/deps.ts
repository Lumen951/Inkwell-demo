/**
 * 功能描述：定义项目所需的依赖项，包括原生依赖、安装后依赖和asar打包依赖。
 * 
 * 参数说明：
 * - nativeDeps: string[] - 原生依赖项列表，包含项目运行所需的核心库。
 * - postInstallDeps: string[] - 安装后依赖项列表，包含在安装后需要的库。
 * - asarDeps: string[] - asar打包依赖项列表，包含所有需要打包的依赖。
 * 
 * 返回值说明：
 * - nativeDeps: string[] - 返回原生依赖项数组。
 * - postInstallDeps: string[] - 返回安装后依赖项数组。
 * - asarDeps: string[] - 返回asar打包依赖项数组。
 */

export const nativeDeps = [
  '@parcel/watcher', // 🔧 监视文件变化的库
  '@vscode/spdlog', // 🔧 高性能日志库
  'node-pty', // 🔧 提供伪终端功能的库
  'nsfw', // 🔧 监视文件系统变化的库
  'spdlog', // 🔧 C++日志库的Node.js绑定
  'keytar', // 🔧 用于安全存储凭证的库
]

export const postInstallDeps = [
  '@opensumi/vscode-ripgrep', // 🔧 用于高效文本搜索的库
]

export const asarDeps = [
  ...nativeDeps, // 将原生依赖项展开到asar依赖中
  ...postInstallDeps, // 将安装后依赖项展开到asar依赖中
  'vscode-oniguruma', // 🔧 用于正则表达式匹配的库
  '@opensumi/tree-sitter-wasm' // 🔧 用于语法解析的WebAssembly库
]
