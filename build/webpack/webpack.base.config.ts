// 该模块用于创建Webpack配置，支持不同环境的构建设置。
// 主要功能包括：合并用户自定义配置、设置开发服务器端口、处理模块解析等。

import { Configuration, DefinePlugin } from 'webpack' // 导入Webpack配置和定义插件
import path from 'node:path' // 导入Node.js的path模块，用于处理文件路径
import TsconfigPathsPlugin from 'tsconfig-paths-webpack-plugin' // 导入Tsconfig路径插件，用于支持TypeScript路径别名
import { merge } from 'webpack-merge' // 导入webpack-merge，用于合并Webpack配置

export const webpackDir = path.resolve('out') // 🔧 配置项：Webpack输出目录

export const devServerPort = 3000 // 🔧 配置项：开发服务器端口

export const codeWindowName = 'code' // 🔧 配置项：代码窗口名称

export const updateWindowName = 'update' // 🔧 配置项：更新窗口名称

/**
 * 创建Webpack配置
 * 
 * 功能描述：根据传入的配置和环境参数生成Webpack配置对象。
 * 
 * @param config - 用户自定义的Webpack配置或返回Configuration的函数
 * @returns (env: unknown, argv: Record<string, any>) => Configuration - 返回一个函数，该函数接收环境和命令行参数并返回最终的Webpack配置
 */
export const createConfig = (config: Configuration | ((_env: unknown, argv: Record<string, any>) => Configuration)) => (_env: unknown, argv: Record<string, any>) => {
  return merge({
    mode: argv.mode, // 🔧 配置项：设置Webpack模式（development或production）
    devtool: argv.mode === 'development' ? 'source-map' : false, // 🔧 配置项：开发模式下启用source-map
    node: {
      __dirname: false, // 🔧 配置项：禁用__dirname
      __filename: false, // 🔧 配置项：禁用__filename
    },
    output: {
      asyncChunks: false, // 🔧 配置项：禁用异步代码分块
    },
    resolve: {
      extensions: ['.ts', '.tsx', '.mjs', '.js', '.json', '.less'], // 🔧 配置项：支持的文件扩展名
      plugins: [
        new TsconfigPathsPlugin({
          configFile: path.join(__dirname, '../../tsconfig.json'), // 🔧 配置项：指定tsconfig.json文件路径
        }),
      ],
    },
    module: {
      exprContextCritical: false, // 🔧 配置项：禁用表达式上下文的关键性检查
      rules: [
        {
          test: /\.tsx?$/, // 🔧 配置项：匹配TypeScript文件
          loader: 'ts-loader', // 🔧 配置项：使用ts-loader进行TypeScript编译
          exclude: /(node_modules|\.webpack)/, // 🔧 配置项：排除node_modules和webpack目录
          options: {
            configFile: path.join(__dirname, '../../tsconfig.json'), // 🔧 配置项：指定tsconfig.json文件路径
            transpileOnly: true, // 🔧 配置项：仅进行转译，不进行类型检查
          },
        },
        {
          test: /\.mjs$/, // 🔧 配置项：匹配.mjs文件
          include: /node_modules/, // 🔧 配置项：仅包含node_modules目录
          type: 'javascript/auto', // 🔧 配置项：自动识别JavaScript类型
        },
      ],
    },
    plugins: [
      new DefinePlugin({
        'process.env.KTLOG_SHOW_DEBUG': argv.mode === 'development', // 🔧 配置项：根据环境变量设置调试标志
      }),
    ],
  }, typeof config === 'function' ? config(_env, argv) : config); // 合并用户自定义配置
};
