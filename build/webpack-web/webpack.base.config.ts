/**
 * @file webpack.base.config.ts
 * @description 该文件用于配置Webpack的基本设置，包括模块解析、输出选项和插件配置。
 * 
 * @constant {string} webpackDir - Webpack输出目录的绝对路径。
 * @constant {number} devServerPort - 开发服务器的端口号。 指定开发服务器的监听端口，通过设置端口号，开发者可以在浏览器中访问应用程序
 * @constant {string} codeWindowName - 代码窗口的名称。 标识和管理代码编辑器或者显示代码的窗口，更方便在多个窗口或者标签页中切换
 * @constant {string} updateWindowName - 更新窗口的名称。 标识和管理更新窗口的名称
 * 
 * @function createConfig
 * @param {Configuration | function} config - Webpack配置对象或返回配置的函数。
 * @param {unknown} _env - 环境变量（未使用）。
 * @param {Record<string, any>} argv - 命令行参数。
 * @returns {Configuration} - 合并后的Webpack配置对象。
 */
import { Configuration, DefinePlugin } from 'webpack' // 引入Webpack的配置和定义插件
import path from 'node:path' // 引入Node.js的path模块
import TsconfigPathsPlugin from 'tsconfig-paths-webpack-plugin' // 引入tsconfig路径插件
import { merge } from 'webpack-merge' // 引入Webpack合并工具

// Webpack输出目录的绝对路径
export const webpackDir = path.resolve(path.join(__dirname,'..','..', 'out'))

// 开发服务器的端口号
export const devServerPort = 8080

// 代码窗口的名称
export const codeWindowName = 'code'

// 更新窗口的名称
export const updateWindowName = 'update'

// 创建Webpack配置的函数
export const createConfig = (config: Configuration | ((_env: unknown, argv: Record<string, any>) => Configuration)) => (_env: unknown, argv: Record<string, any>) => {
  return merge({
    mode: argv.mode, // 设置Webpack的模式（development或production）
    devtool: argv.mode === 'development' ? 'source-map': false, // 根据模式选择source-map
    node: {
      __dirname: false, // 禁用__dirname的Node.js行为
      __filename: false, // 禁用__filename的Node.js行为
    },
    output: {
      asyncChunks: false, // 禁用异步代码分割
    },
    resolve: {
      extensions: ['.ts', '.tsx', '.mjs', '.js', '.json', '.less'], // 解析的文件扩展名
      plugins: [
        new TsconfigPathsPlugin({
          configFile: path.join(__dirname, '../../tsconfig.json'), // 指定tsconfig.json文件路径
        }),
      ],
    },
    module: {
      // https://github.com/webpack/webpack/issues/196#issuecomment-397606728
      exprContextCritical: false, // 禁用表达式上下文的警告
      rules: [
        {
          test: /\.tsx?$/, // 匹配TypeScript文件
          loader: 'ts-loader', // 使用ts-loader进行加载
          exclude: /(node_modules|\.webpack)/, // 排除node_modules和webpack目录
          options: {
            configFile: path.join(__dirname, '../../tsconfig.json'), // 指定tsconfig.json文件路径
            transpileOnly: true, // 仅进行转译，不进行类型检查
          },
        },
        {
          test: /\.mjs$/, // 匹配.mjs文件
          include: /node_modules/, // 仅包含node_modules目录
          type: 'javascript/auto', // 自动识别JavaScript类型
        },
      ],
    },
    plugins: [
      new DefinePlugin({
        'process.env.KTLOG_SHOW_DEBUG': argv.mode === 'development', // 根据模式设置调试环境变量
      }),
    ],
  }, typeof config === 'function' ? config(_env, argv) : config); // 合并用户自定义配置
};
