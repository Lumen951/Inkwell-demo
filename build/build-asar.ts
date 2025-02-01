/**
 * @file build-asar.ts
 * @description 该模块用于构建ASAR包，包含依赖项的复制和打包功能。
 * 
 * 主要功能包括：
 * - 获取所有ASAR依赖项
 * - 删除目标目录
 * - 复制依赖项到目标目录
 * - 创建ASAR包
 */

import { execSync } from 'node:child_process'; // 🔧 导入Node.js的child_process模块，用于执行命令行指令
import * as path from 'node:path'; // 🔧 导入Node.js的path模块，用于处理文件路径
import * as fs from 'node:fs/promises'; // 🔧 导入Node.js的fs模块，用于文件系统操作
import { glob } from 'glob'; // 🔧 导入glob模块，用于文件路径匹配
import { createPackageWithOptions } from 'asar'; // 🔧 导入asar模块，用于创建ASAR包
import { asarDeps } from './deps'; // 🔧 导入ASAR依赖项列表

interface Dep {
  name: string; // 依赖项名称
  version: string; // 依赖项版本
}

/**
 * 构建ASAR包
 * 
 * @param {string} destDir - 目标目录，用于存放构建的ASAR包。
 * @returns {Promise<void>} - 无返回值，异步执行。
 */
export async function buildAsar(destDir: string): Promise<void> {
  const deps = getAllAsarDeps(); // 获取所有ASAR依赖项
  await fs.rm(destDir, { recursive: true, force: true }); // 删除目标目录及其内容
  const srcModules = path.join(process.cwd(), 'node_modules'); // 获取源模块目录
  const destModules = path.join(destDir, 'node_modules'); // 定义目标模块目录
  await copyDeps(srcModules, destModules, deps); // 复制依赖项到目标目录
  await createPackageWithOptions(
    destModules,
    path.join(destDir, 'node_modules.asar'), // 创建ASAR包的输出路径
    {
      dot: true, // 包含以点开头的文件
      unpack: '{' + [
        '**/*.node', // 不打包的文件类型
        '**/@opensumi/vscode-ripgrep/bin/*',
        '**/node-pty/build/Release/*',
        '**/node-pty/lib/worker/conoutSocketWorker.js',
        '**/node-pty/lib/shared/conout.js',
        '**/*.wasm',
      ].join(',') + '}'
    }
  );
  await fs.rm(destModules, { recursive: true }); // 删除目标模块目录
}

/**
 * 解析语义化版本号
 * 
 * @param {string} value - 版本号字符串，格式为"@name@version"。
 * @returns {{ name: string, version: string }} - 返回解析后的名称和版本对象。
 */
function parseSemver(value: string): { name: string; version: string } {
  const [, name, version] = value.match(/(@?[^@]+)@(?:.+):(.+)/) || [];
  return { name, version };
}

/**
 * 获取所有ASAR依赖项
 * 
 * @returns {Dep[]} - 返回ASAR依赖项的数组。
 */
function getAllAsarDeps(): Dep[] {
  const raw = execSync('corepack yarn info -A -R --json', { encoding: 'utf-8' }); // 执行命令获取依赖信息
  const asarDepsMap: Record<string, string> = {}; // 存储ASAR依赖项的映射
  const result: Dep[] = []; // 存储最终的依赖项列表
  const allDeps = raw
    .split('\n')
    .filter(Boolean)
    .map(line => JSON.parse(line))
    .reduce((acc, data) => {
      const { name } = parseSemver(data.value); // 解析依赖项名称
      if (asarDeps.includes(name)) { // 检查是否为ASAR依赖项
        if (asarDepsMap[name]) {
          throw new Error(`Duplicate package: ${name}`); // ⚠️ 检测到重复的依赖项
        }
        asarDepsMap[name] = data.value; // 存储依赖项
      }
      acc[data.value] = data; // 将依赖项添加到累加器
      return acc;
    }, {});

  const addDep = (value: string) => {
    const { name, version } = parseSemver(value); // 解析依赖项名称和版本
    if (name === 'node-gyp') return; // 🔧 排除node-gyp依赖项
    result.push({ name, version }); // 添加依赖项到结果列表
    const dependencies = allDeps[value].children.Dependencies; // 获取子依赖项
    if (!dependencies) return; // 如果没有子依赖项则返回
    dependencies.forEach(({ locator }) => {
      const { name, version } = parseSemver(locator); // 解析子依赖项
      addDep(`${name}@npm:${version}`); // 递归添加子依赖项
    });
  };

  asarDeps.forEach((pkgName) => {
    const value = asarDepsMap[pkgName]; // 获取ASAR依赖项的值
    addDep(value); // 添加依赖项
  });

  return result; // 返回所有ASAR依赖项
}

/**
 * 复制依赖项到目标目录
 * 
 * @param {string} srcModules - 源模块目录。
 * @param {string} destModules - 目标模块目录。
 * @param {Dep[]} depList - 依赖项列表。
 * @returns {Promise<void>} - 无返回值，异步执行。
 */
async function copyDeps(srcModules: string, destModules: string, depList: Dep[]): Promise<void> {
  const filenames = await Promise.all([
    glob(depList.map(dep => `${dep.name}/**`), {
      cwd: srcModules, // 设置当前工作目录为源模块目录
      dot: true, // 包含以点开头的文件
      nodir: true, // 忽略目录
      ignore: [ // 🔧 忽略的文件和目录
        '**/package-lock.json',
        '**/yarn.lock',
        '**/*.js.map',
        'nan/**',
        '*/node_modules/nan/**',
        '**/docs/**',
        '**/example/**',
        '**/examples/**',
        '**/test/**',
        '**/tests/**',
        '**/.vscode/**',
        '**/node-addon-api/**/*',
        '**/prebuild-install/**/*',
        '**/History.md',
        '**/CHANGELOG.md',
        '**/README.md',
        '**/readme.md',
        '**/readme.markdown',
        '**/CODE_OF_CONDUCT.md',
        '**/SUPPORT.md',
        '**/CONTRIBUTING.md',
        '**/*.ts',
        '@vscode/spdlog/binding.gyp',
        '@vscode/spdlog/build/**',
        '@vscode/spdlog/deps/**',
        '@vscode/spdlog/src/**',
        '@vscode/spdlog/*.yml',
        'node-pty/binding.gyp',
        'node-pty/build/**',
        'node-pty/src/**',
        'node-pty/lib/*.test.js',
        'node-pty/tools/**',
        'node-pty/deps/**',
        'node-pty/scripts/**',
        '@parcel/watcher/binding.gyp',
        '@parcel/watcher/build/**',
        '@parcel/watcher/prebuilds/**',
        '@parcel/watcher/src/**',
        'nsfw/binding.gyp',
        'nsfw/build/**',
        'nsfw/includes/**',
        'nsfw/src/**',
        'keytar/binding.gyp',
        'keytar/build/**',
        'keytar/src/**',
      ]
    }),
    glob([
      '@vscode/spdlog/build/Release/*.node',
      'node-pty/build/Release/spawn-helper',
      'node-pty/build/Release/*.exe',
      'node-pty/build/Release/*.dll',
      'node-pty/build/Release/*.node',
      '@parcel/watcher/build/Release/*.node',
      'nsfw/build/Release/*.node',
      'keytar/build/Release/*.node',
    ], {
      cwd: srcModules, // 设置当前工作目录为源模块目录
      dot: true, // 包含以点开头的文件
      nodir: true, // 忽略目录
    })
  ]);
  await fs.rm(destModules, { recursive: true, force: true }); // 删除目标模块目录及其内容

  for (const filename of filenames.flat(Infinity) as string[]) {
    const destPath = path.join(destModules, filename); // 定义目标文件路径
    await fs.mkdir(path.dirname(destPath), { recursive: true }); // 创建目标文件的目录
    await fs.copyFile(path.join(srcModules, filename), destPath); // 复制文件到目标路径
  }
}
