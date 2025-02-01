// 该模块提供了用于执行命令行指令的异步和同步方法，以及用于签名Windows应用程序的功能。

import { spawn, spawnSync, SpawnOptions } from 'child_process';

/**
 * 异步执行命令行指令。
 * 
 * @param {string} command - 要执行的命令。
 * @param {string[] | null} [args] - 命令的参数，默认为空数组。
 * @param {SpawnOptions} [options] - 额外的选项，控制子进程的行为。
 * 
 * @returns {Promise<void>} - 无返回值，异步执行。
 * 
 * ⚠️ 注意事项：确保传入的命令和参数是有效的。
 */
export const exec = async (command: string, args?: string[] | null, options?: SpawnOptions) => {
  await new Promise<void>((resolve, reject) => {
    const child = spawn(
      command,
      args || [],
      {
        stdio: 'inherit', // 继承父进程的标准输入输出
        shell: true, // 在shell中执行命令
        ...options, // 合并额外选项
      }
    );

    let exited = false; // 标记子进程是否已退出
    let err: Error | null = null; // 存储错误信息

    // 处理子进程退出事件
    const handleExit = (code: number | null, signal: string | null) => {
      if (exited) return; // 防止重复处理
      exited = true;

      // 如果没有错误且正常退出，解析Promise
      if (!err && code === 0 && signal === null) {
        resolve();
        return;
      }

      // 否则，拒绝Promise并返回错误信息
      reject(err || new Error(`exec command: '${command}' error, code: ${code}, signal: ${signal}`));
    };

    // 处理子进程错误事件
    child.on('error', e => {
      err = e; // 记录错误
      handleExit(null, null); // 调用退出处理
    });

    // 监听子进程退出事件
    child.on('exit', handleExit);
  });
};

/**
 * 同步执行命令行指令。
 * 
 * @param {string} command - 要执行的命令。
 * @param {string[] | null} [args] - 命令的参数，默认为空数组。
 * @param {SpawnOptions} [options] - 额外的选项，控制子进程的行为。
 * 
 * @throws {Error} - 如果命令执行失败，将抛出错误。
 */
export const execSync = async (command: string, args?: string[] | null, options?: SpawnOptions) => {
  const { error } = spawnSync(
    command,
    args || [],
    {
      stdio: 'inherit', // 继承父进程的标准输入输出
      shell: true, // 在shell中执行命令
      ...options, // 合并额外选项
    }
  );
  if (error) {
    throw error; // 抛出错误
  }
};

/**
 * 签名Windows应用程序。保证不会出现风险报错，以及可以上架Windows Store。
 * 
 * @param {string} file - 要签名的文件路径。
 * 
 * @returns {Promise<void>} - 无返回值，异步执行。
 * 
 * ⚠️ 注意事项：确保环境变量WINDOWS_SIGN_TOOL_PATH已设置。
 */
export const signWinApp = async (file: string) => {
  const signPath = process.env.WINDOWS_SIGN_TOOL_PATH; // 获取签名工具路径
  if (!signPath) return Promise.resolve(); // 如果未设置路径，直接返回
  return exec(signPath, [file, file], { shell: false }); // 执行签名命令
};
