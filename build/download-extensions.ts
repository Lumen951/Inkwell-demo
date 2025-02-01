/**
 * 下载并安装扩展程序的功能模块
 * 
 * 该模块负责从指定的 URL 下载扩展程序，并将其解压到指定目录中。相当于是一个下载扩展的工具。
 * 通过并行处理多个扩展的下载和安装，提高了效率。
 * 
 * @module download-extensions
 */

import path from 'path'; // 🔧 导入路径处理模块
import fs from 'fs'; // 🔧 导入文件系统模块
import fsp from 'fs/promises'; // 🔧 导入文件系统的 Promise 版本
import yauzl, { Entry, ZipFile, Options } from 'yauzl'; // 🔧 导入用于处理 ZIP 文件的库
import os from 'os'; // 🔧 导入操作系统相关模块
import { pipeline } from 'stream/promises' // 🔧 导入流处理模块
import { ReadableStream } from 'stream/web' // 🔧 导入 Web 可读流
import { randomUUID } from 'crypto'; // 🔧 导入生成随机 UUID 的模块
import { promisify } from 'util'; // 🔧 导入工具模块以支持 Promise
import debug from 'debug' // 🔧 导入调试模块
import { extensions } from './extensions.json' // 🔧 导入扩展信息的 JSON 文件

const d = debug('download-extension'); // 🔧 初始化调试器

const extensionsDir = path.resolve('extensions'); // 🔧 定义扩展程序存放目录的绝对路径

/**
 * 并行执行一组懒加载的 Promise 函数
 * 
 * @param lazyPromises {(() => Promise<void>)[]} - 懒加载的 Promise 函数数组
 * @param n {number} - 同时执行的最大 Promise 数量
 * @returns {Promise<void>} - 完成时解析的 Promise
 */
const parallelRunPromise = (lazyPromises: (() => Promise<void>)[], n: number) => {
  let working = 0; // 当前正在执行的 Promise 数量
  let complete = 0; // 已完成的 Promise 数量
  let all = lazyPromises.length; // 总的 Promise 数量

  return new Promise<void>((resolve, reject) => {
    const addWorking = () => {
      while (working < n) { // 🔧 控制并发数量
        const current = lazyPromises.shift(); // 从数组中取出下一个 Promise
        if (!current) break; // 如果没有更多的 Promise，退出循环
  
        working++; // 增加正在执行的计数

        current() // 执行当前 Promise
          .then(() => {
            working--; // 减少正在执行的计数
            complete++; // 增加已完成的计数
    
            if (complete === all) { // 如果所有 Promise 都已完成
              resolve(); // 解析 Promise
              return;
            }
            addWorking(); // 继续添加工作
          })
          .catch(err => reject(err)); // 捕获错误并拒绝 Promise
      }
    };
    addWorking(); // 启动工作
  });
};

/**
 * 从指定 URL 下载扩展程序
 * 
 * @param url {string} - 扩展程序的下载链接
 * @param extensionId {string} - 扩展程序的唯一标识符
 * @returns {Promise<string>} - 下载的 ZIP 文件路径
 */
async function downloadExtension(url: string, extensionId: string) {
  const tmpPath = path.join(os.tmpdir(), 'extension', randomUUID()); // 🔧 创建临时目录
  const tmpZipFile = path.join(tmpPath, extensionId); // 🔧 定义临时 ZIP 文件路径
  await fsp.mkdir(tmpPath, { recursive: true }); // 🔧 创建临时目录

  const res = await fetch(url, { // 🔧 发起下载请求
    method: 'GET',
    signal: AbortSignal.timeout(100000), // 设置请求超时
  });

  if (!res.ok) { // 🔧 检查请求是否成功
    throw new Error(`request extension failed: ${res.statusText}`);
  }
  if (!res.body) { // 🔧 检查响应体是否存在
    throw new Error(`request extension failed, body is null`);
  }

  await pipeline(res.body as ReadableStream, fs.createWriteStream(tmpZipFile)); // 🔧 将下载的内容写入 ZIP 文件

  return tmpZipFile; // 返回临时 ZIP 文件路径
}

/**
 * 从 ZIP 文件条目中获取文件权限模式
 * 
 * @param entry {Entry} - ZIP 文件中的条目
 * @returns {number} - 文件权限模式
 */
function modeFromEntry(entry: Entry) {
  const attr = entry.externalFileAttributes >> 16 || 33188; // 🔧 获取文件属性

  return [448 /* S_IRWXU */, 56 /* S_IRWXG */, 7 /* S_IRWXO */] // 🔧 权限掩码
    .map((mask) => attr & mask) // 🔧 计算权限
    .reduce((a, b) => a + b, attr & 61440 /* S_IFMT */); // 🔧 返回权限模式
}

/**
 * 解压 ZIP 文件到指定目录
 * 
 * @param tmpZipFile {string} - 临时 ZIP 文件路径
 * @param dist {string} - 解压目标目录
 * @param extensionId {string} - 扩展程序的唯一标识符
 * @returns {Promise<string>} - 解压后的扩展程序目录
 */
async function unzipFile(tmpZipFile: string, dist: string, extensionId: string) {
  const extensionDir = path.join(dist, extensionId); // 🔧 定义扩展程序目录
  await fsp.mkdir(extensionDir, { recursive: true }); // 🔧 创建扩展程序目录

  const zipFile = await promisify<string, Options, ZipFile>(yauzl.open)(tmpZipFile, { lazyEntries: true }); // 🔧 打开 ZIP 文件
  let canceled = false; // 🔧 标记是否取消操作

  return new Promise((resolve, reject) => {
    zipFile.readEntry(); // 🔧 读取 ZIP 文件条目

    zipFile.on('error', (e) => { // 🔧 处理 ZIP 文件错误
      canceled = true;
      reject(e);
    });

    zipFile.on('close', () => { // 🔧 ZIP 文件关闭时的处理
      if (!fs.existsSync(path.join(extensionDir, 'package.json'))) { // 🔧 检查 package.json 是否存在
        reject(`Download Error: ${extensionDir}/package.json`);
        return;
      }
      fsp.rm(tmpZipFile); // 🔧 删除临时 ZIP 文件
      resolve(extensionDir); // 🔧 返回解压后的目录
    });

    const extensionPrefix = 'extension/'; // 🔧 定义扩展程序文件前缀
    zipFile.on('entry', async (entry: Entry) => { // 🔧 处理 ZIP 文件条目
      if (canceled) {
        return; // 🔧 如果已取消，直接返回
      }
      if (!entry.fileName.startsWith(extensionPrefix)) { // 🔧 检查文件名是否以扩展程序前缀开头
        zipFile.readEntry(); // 🔧 读取下一个条目
        return;
      }
      let fileName = entry.fileName.slice(extensionPrefix.length); // 🔧 获取文件名

      try {
        if (/\/$/.test(fileName)) { // 🔧 如果是目录
          const targetFileName = path.join(extensionDir, fileName); // 🔧 定义目标目录路径
          await fsp.mkdir(targetFileName, { recursive: true }); // 🔧 创建目标目录
          zipFile.readEntry(); // 🔧 读取下一个条目
          return;
        }
  
        const dirname = path.dirname(fileName); // 🔧 获取文件目录
        const targetDirName = path.join(extensionDir, dirname); // 🔧 定义目标目录路径
        if (targetDirName.indexOf(extensionDir) !== 0) { // 🔧 检查路径是否有效
          throw new Error(`invalid file path ${targetDirName}`);
        }
        await fsp.mkdir(targetDirName, { recursive: true }); // 🔧 创建目标目录
        
        const targetFileName = path.join(extensionDir, fileName); // 🔧 定义目标文件路径
        const readStream = await promisify(zipFile.openReadStream.bind(zipFile))(entry); // 🔧 获取读取流
        await pipeline(readStream, fs.createWriteStream(targetFileName, { mode: modeFromEntry(entry) })); // 🔧 将读取流写入目标文件
        zipFile.readEntry(); // 🔧 读取下一个条目
      } catch (err) {
        canceled = true; // 🔧 标记为已取消
        zipFile.close(); // 🔧 关闭 ZIP 文件
        reject(err); // 🔧 拒绝 Promise
      }
    });
  });
}

/**
 * 安装指定的扩展程序
 * 
 * @param extensionId {string} - 扩展程序的唯一标识符
 * @param publisher {string} - 扩展程序发布者
 * @param name {string} - 扩展程序名称
 * @param version {string} - 扩展程序版本（可选）
 * @returns {Promise<void>} - 无返回值
 */
const installExtension = async (extensionId: string, publisher: string, name: string, version?: string) => {
  const extensionPath = `${publisher}/${name}${version ? `/${version}` : ''}`; // 🔧 定义扩展程序路径
  const res = await fetch(`https://open-vsx.org/api/${extensionPath}`, { // 🔧 发起请求获取扩展信息
    signal: AbortSignal.timeout(100000), // 设置请求超时
  });
  const data = await res.json(); // 🔧 解析响应数据
  if (data.files?.download) { // 🔧 检查是否有下载链接
    const tmpZipFile = await downloadExtension(data.files.download, extensionId); // 🔧 下载扩展程序
    await unzipFile(tmpZipFile, extensionsDir, extensionId); // 🔧 解压扩展程序
  }
};

/**
 * 下载所有扩展程序
 * 
 * @param force {boolean} - 是否强制重新下载（默认为 false）
 * @returns {Promise<void>} - 无返回值
 */
export const downloadExtensions = async (force = false) => {
  if (force) { // 🔧 如果强制下载
    d('清空 extension 目录：%s', extensionsDir); // 🔧 日志输出
    await fsp.rm(extensionsDir, { recursive: true, force: true }); // 🔧 删除扩展目录
  }
  await fsp.mkdir(extensionsDir, { recursive: true }); // 🔧 创建扩展目录

  const promises: (() => Promise<void>)[] = []; // 🔧 存储所有安装扩展的 Promise
  const publishers = Object.keys(extensions); // 🔧 获取所有发布者
  for (const publisher of publishers) {
    const items = extensions[publisher]; // 🔧 获取发布者的扩展列表

    for (const item of items) {
      const { name, version } = item; // 🔧 解构获取扩展名称和版本
      promises.push(async () => { // 🔧 将安装任务添加到 Promise 数组
        const extensionId = `${publisher}.${name}`; // 🔧 定义扩展程序 ID
        if (fs.existsSync(path.join(extensionsDir, extensionId, 'package.json'))) { // 🔧 检查扩展是否已存在
          d(`${publisher}.${name} 已存在，跳过`); // 🔧 日志输出
          return; // 🔧 跳过安装
        }
        d('开始安装：%s', name, version); // 🔧 日志输出
        try {
          await installExtension(extensionId, publisher, name, version); // 🔧 安装扩展程序
        } catch (e: any) {
          console.error(`${name} 插件安装失败`); // 🔧 错误日志输出
          throw e; // 🔧 抛出错误
        }
      });
    }
  }

  await parallelRunPromise(promises, 2); // 🔧 并行执行安装任务
  d('安装完毕'); // 🔧 日志输出
};

if (require.main === module) { // 🔧 检查是否为主模块
  downloadExtensions(); // 🔧 执行下载扩展程序
}
