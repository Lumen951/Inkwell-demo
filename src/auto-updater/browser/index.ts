/**
 * @module AutoUpdaterModule
 * @description 自动更新模块，负责提供更新服务的相关功能。
 * 
 * @imports
 * - Provider: 依赖注入提供者类型
 * - Injectable: 标记类为可注入的服务
 * - BrowserModule: 基础浏览器模块
 * - createElectronMainApi: 创建Electron主API的函数
 * - UpdaterContribution: 更新贡献类
 * - IUpdateMainService: 更新主服务接口
 * 
 * @class AutoUpdaterModule
 * @extends BrowserModule
 * @implements {Provider[]}
 * 
 * @provides
 * - UpdaterContribution: 更新功能的实现
 * - IUpdateMainService: 更新主服务的API
 * 
 * @returns {void} 无返回值
 */
import { Provider, Injectable } from '@opensumi/di'; // 导入依赖注入相关模块
import { BrowserModule, createElectronMainApi } from '@opensumi/ide-core-browser'; // 导入浏览器模块和API创建函数
import { UpdaterContribution } from './update.contribution'; // 导入更新贡献类
import { IUpdateMainService } from '../common'; // 导入更新主服务接口

@Injectable() // 标记该类为可注入的服务
export class AutoUpdaterModule extends BrowserModule {
  // 提供者数组，包含更新功能和服务
  providers: Provider[] = [
    UpdaterContribution, // 更新功能的实现
    {
      token: IUpdateMainService, // 服务标识符
      useValue: createElectronMainApi(IUpdateMainService) // 创建并提供更新主服务的API
    }
  ];
}
