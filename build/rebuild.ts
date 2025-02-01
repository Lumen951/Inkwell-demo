/**
 * 重建指定的本地依赖包，支持 Electron 环境。
 * 
 * @param {Object} config - 配置项
 * @param {string} [config.arch] - 架构类型，默认为当前进程架构
 * @param {string} [config.cwd] - 当前工作目录，默认为 process.cwd()
 * @param {boolean} [config.silent] - 是否静默执行，默认为 false
 * @param {string} [config.loglevel] - 日志级别，默认为 'info'
 * 
 * @returns {Promise<void>} - 无返回值，异步执行
 * 
 * ⚠️ 注意事项：确保在执行此函数之前，已安装所有必要的依赖。
 * 
 * 🔧 配置项说明：
 * - arch: 指定要重建的架构类型
 * - cwd: 指定当前工作目录
 * - silent: 是否在执行过程中隐藏输出
 * - loglevel: 日志输出级别
 */
import * as path from 'node:path';
import { version as electronVersion } from 'electron/package.json';
import { nativeDeps, postInstallDeps } from './deps';
import { exec } from './util';
import { parseArgv } from '@opensumi/ide-utils/lib/argv';

// 解析命令行参数
const argv = parseArgv(process.argv);

/**
 * 执行重建操作
 * 
 * @param {Object} config - 配置项
 * @returns {Promise<void>} - 无返回值，异步执行
 */
export const rebuild = async (config?: { arch?: string, cwd?: string, silent?: boolean, loglevel?: string }) => {
  // 获取目标，默认为 'electron'
  const target = argv.target || 'electron';
  // 获取架构，默认为当前进程架构
  const arch = config?.arch || process.arch;
  // 获取当前工作目录，默认为 process.cwd()
  const cwd = config?.cwd || process.cwd();
  // 获取日志级别，默认为 'info'
  const loglevel = config?.loglevel || 'info';

  // 遍历本地依赖，执行重建
  for (const pkgName of nativeDeps) {
    const pkgPath = path.join(cwd, 'node_modules', pkgName);
    await exec(
      [
        'npx',
        'node-gyp',
        'rebuild',
        ...target === 'electron' ? [
          '--runtime=electron',
          `--target=${electronVersion}`,
          `--arch=${arch}`,
          `--dist-url=https://electronjs.org/headers`,
          `--loglevel=${loglevel}`
        ] : []
      ].join(' '),
      null,
      {
        cwd: pkgPath,
        stdio: config?.silent ? 'ignore' : 'inherit',
      }
    );
  }

  // 遍历后安装依赖，执行 postinstall
  for (const pkgName of postInstallDeps) {
    const pkgPath = path.join(process.cwd(), 'node_modules', pkgName);
    await exec(
      `npm run postinstall --arch=${arch} -- --force`,
      null,
      {
        cwd: pkgPath,
        stdio: config?.silent ? 'ignore' : 'inherit'
      }
    );
  }
}

// 如果当前模块是主模块，则执行重建
if (require.main === module) {
  rebuild({
    silent: false
  });
}
