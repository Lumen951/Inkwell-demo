// Start of Selection
/* **********************************************************************************
 * 模块功能：
 * -----------
 * 实现了 StorageService 和 StorageContribution，用于在 Electron 主进程中管理持久化存储操作。
 * StorageService 提供对数据的读取、写入、删除等方法，并通过文件系统将缓存数据同步到磁盘上，
 * 同时通过 ThrottledDelayer 控制保存操作的频率，保证性能与数据一致性。
 * StorageContribution 则负责将 StorageService 注册为主进程 API，供 Electron 主进程调用。
 ************************************************************************************/

import * as path from 'node:path';                     // 🔧 用于处理文件路径
import * as fs from 'node:fs/promises';                // 🔧 异步文件系统操作
import { Injectable, Autowired } from '@opensumi/di';    // 🔧 依赖注入装饰器
import { Domain, isUndefinedOrNull, isUndefined, ThrottledDelayer, IDisposable } from '@opensumi/ide-core-common'; // 🔧 常用工具函数及类型
import {
  ElectronMainApiRegistry,
  ElectronMainContribution,
  ElectronMainApiProvider,
} from '@opensumi/ide-core-electron-main/lib/bootstrap/types'; // 🔧 Electron 主进程 API 接口及类型

import { ILogService } from '@/logger/common';          // 🔧 日志服务接口
import { IStorageService, IEnvironmentService, IStorageData } from '../common/types'; // 🔧 存储相关接口及类型

/**
 * @class StorageService
 * @summary 管理持久化存储数据，支持数据读取、写入及删除，并负责将数据异步写入磁盘。🚀
 * @历史背景 为降低频繁写入导致的性能问题，采用 ThrottledDelayer 延迟执行写入操作，同时确保数据一致性。
 */
@Injectable()
export class StorageService extends ElectronMainApiProvider implements IStorageService, IDisposable {
	// 🔧 内部缓存对象，存储所有键值对，防止频繁与磁盘交互
	#cache: Record<string, unknown> = Object.create(null);
	// 🔧 上次从文件读取的内容，保存 JSON 字符串形式的数据
	#lastContents = '';
	// 🔧 初始化状态，确保初始化操作仅执行一次
	#initializing: Promise<void> | undefined = undefined;
	// 🔧 关闭状态，防止重复保存操作
	#closing: Promise<void> | undefined = undefined;
  // 🚀 使用 ThrottledDelayer 控制延迟写入操作，避免频繁 I/O（延迟 100 毫秒）
  readonly #flushDelayer = new ThrottledDelayer<void>(100);

  @Autowired(IEnvironmentService)
  environmentService: IEnvironmentService;

	@Autowired(ILogService)
	logService: ILogService;

	/**
	 * @summary 初始化存储服务
	 * @description 确保服务仅初始化一次，重复调用返回同一 Promise，延迟文件系统操作以提升性能。
	 * @returns {Promise<void>} 表示初始化完成的 Promise 对象
	 */
	init(): Promise<void> {
		if (!this.#initializing) {
			this.#initializing = this.doInit();
		}
		return this.#initializing;
	}

	/**
	 * @summary 执行实际的初始化操作
	 * @description 创建存储文件所在目录、读取存储文件并解析 JSON 内容存入缓存，
   *              若文件不存在（ENOENT 错误）则忽略错误，不影响后续操作。
	 * @returns {Promise<void>} 表示异步初始化完成的 Promise 对象
	 */
	private async doInit() {
		try {
      // 🔧 创建存储目录（递归创建，确保父目录存在）
      await fs.mkdir(path.dirname(this.environmentService.storagePath), { recursive: true });
      // 🔧 读取存储文件的内容（utf8 格式）
			this.#lastContents = await fs.readFile(this.environmentService.storagePath, 'utf8');
      // 🚀 将 JSON 字符串解析为对象并存入缓存
			this.#cache = JSON.parse(this.#lastContents);
		} catch (error: any) {
      // ⚠️ 若错误非因文件不存在引起（ENOENT），则记录错误，历史背景：首次运行时文件可能尚未创建
      if (error.code !== 'ENOENT') {
        this.logService.error(error);
      }
		}
	}

	/**
	 * @summary 获取指定键的存储项
	 * @param {string} key - 存储项的键
	 * @param {T} [defaultValue] - 当存储项未定义时返回的默认值
	 * @returns {T | undefined} 返回存储项对应的值，若不存在则返回 defaultValue
	 */
	getItem<T>(key: string, defaultValue: T): T;
	getItem<T>(key: string, defaultValue?: T): T | undefined;
	getItem<T>(key: string, defaultValue?: T): T | undefined {
		const res = this.#cache[key];
		// 🔧 检查缓存中对应键的值是否为 null 或 undefined，若是则返回默认值
		if (isUndefinedOrNull(res)) {
			return defaultValue;
		}
		return res as T;
	}

	/**
	 * @summary 设置单个存储项
	 * @param {string} key - 存储项的键
	 * @param {IStorageData} [data] - 存储项对应的数据
	 * @returns {void}
	 */
	setItem(key: string, data?: IStorageData): void {
		this.setItems([{ key, data }]);
	}

	/**
	 * @summary 批量设置多个存储项
	 * @param {readonly { key: string; data?: IStorageData }[]} items - 存储项数组，每个对象包含键和值
	 * @returns {void}
	 * @注意 当新数据与缓存中已有数据相同，或均为空时，不触发保存操作，优化不必要的 I/O
	 */
	setItems(items: readonly { key: string; data?: IStorageData }[]): void {
		let needSave = false;
		for (const { key, data } of items) {
			// ⚠️ 当新数据与当前缓存数据一致时，跳过更新操作
			if (this.#cache[key] === data) continue;
      // ⚠️ 同时判断新数据与缓存均为空时，避免无意义更新
      if (isUndefinedOrNull(data) && isUndefined(this.#cache[key])) continue;
      // 🔧 更新缓存，若数据为空则以 undefined 表示
      this.#cache[key] = isUndefinedOrNull(data) ? undefined : data;
      needSave = true;
		}
		if (needSave) {
			this.save();
		}
	}

	/**
	 * @summary 移除指定存储项
	 * @param {string} key - 存储项的键
	 * @returns {void}
	 * @注意 仅当存储项存在时执行移除，并触发保存操作同步到磁盘
	 */
	removeItem(key: string): void {
		if (!isUndefined(this.#cache[key])) {
			this.#cache[key] = undefined;
			this.save();
		}
	}

	/**
	 * @summary 将缓存数据保存至磁盘文件
	 * @returns {Promise<void>} 表示保存操作完成的 Promise 对象
	 * @描述 如果服务处于关闭状态，则中断保存；否则，借助 ThrottledDelayer 延迟触发实际保存操作，
   *        从而降低频繁写入对性能的影响（O(1) 延时触发）。
	 */
	private async save(): Promise<void> {
		if (this.#closing) {
      // ⚠️ 正在关闭时，不再触发新的保存操作
			return;
		}
		// 🚀 通过延迟器执行保存操作
		return this.#flushDelayer.trigger(() => this.doSave());
	}

	/**
	 * @summary 实际执行缓存数据的写文件操作
	 * @returns {Promise<void>} 表示异步保存操作完成的 Promise 对象
	 * @描述 首先等待初始化完成，然后将缓存数据序列化为 JSON 字符串（带 4 空格缩进），
	 *        对比当前内容与上次保存内容是否发生变化，若变化则写入文件更新缓存。
	 * @时间复杂度 O(n) - n 为缓存数据大小
	 *
	 * 核心算法步骤说明：
	 * | 步骤 | 描述                                 | 实现代码片段                                         |
	 * | ---- | ------------------------------------ | ---------------------------------------------------- |
	 * | 1    | 等待初始化操作完成                   | await this.#initializing;                           |
	 * | 2    | 将缓存数据转换成格式化 JSON 字符串     | const serializedContent = JSON.stringify(this.#cache, null, 4); |
	 * | 3    | 比较新旧内容，如无变化则退出           | if (serializedContent === this.#lastContents) return; |
	 * | 4    | 写入文件并更新上次内容记录              | await fs.writeFile(...); this.#lastContents = serializedContent; |
	 */
	private async doSave(): Promise<void> {
		// ⚠️ 未完成初始化时，不执行保存操作
		if (!this.#initializing) {
			return;
		}
		await this.#initializing;
		// 🚀 序列化缓存数据，格式化输出（便于调试，但增加文件体积）
		const serializedContent = JSON.stringify(this.#cache, null, 4);
		// 🔧 当内容未变化时，跳过写入操作
		if (serializedContent === this.#lastContents) {
			return;
		}
		try {
			await fs.writeFile(this.environmentService.storagePath, serializedContent);
			// 🔧 更新最近一次保存的内容记录，用于后续比较
			this.#lastContents = serializedContent;
		} catch (error) {
			// ⚠️ 文件写入失败，输出错误日志便于调试问题
			this.logService.error(error);
		}
	}

	/**
	 * @summary 关闭存储服务，并确保所有待保存数据均写入磁盘
	 * @returns {Promise<void>} 表示关闭操作完成的 Promise 对象
	 * @描述 若当前不处于保存操作中，则触发保存操作；否则等待当前保存结束，确保数据一致性。
	 */
	async close(): Promise<void> {
		if (!this.#closing) {
			this.#closing = this.#flushDelayer.trigger(() => this.doSave(), 0);
		}
		return this.#closing;
	}

	/**
	 * @summary 释放资源，清理内部延迟器，防止内存泄漏
	 * @returns {void}
	 */
  dispose(): void {
    this.#flushDelayer.dispose();
  }
}

/**
 * @class StorageContribution
 * @summary 为 Electron 主进程注册存储服务 API
 * @描述 通过依赖注入将 StorageService 注册为 IStorageService 的实现，供 Electron 主进程调用，
 *        从而实现模块化与解耦管理。
 */
@Domain(ElectronMainContribution)
export class StorageContribution implements ElectronMainContribution {
  @Autowired(StorageService)
  storageService: StorageService;

  /**
   * @summary 注册主进程 API
   * @param {ElectronMainApiRegistry} registry - Electron 主进程 API 注册表
   * @returns {void}
   */
  registerMainApi(registry: ElectronMainApiRegistry) {
    registry.registerMainApi(IStorageService, this.storageService);
  }
}
// End of Selectio
