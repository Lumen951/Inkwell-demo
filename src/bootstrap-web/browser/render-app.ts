import {Injector} from '@opensumi/di';
import {IClientAppOpts} from '@opensumi/ide-core-browser';
import {ClientApp} from '@opensumi/ide-core-browser/lib/bootstrap/app';
import {ToolbarActionBasedLayout} from '@opensumi/ide-core-browser/lib/components';
import logo from '@/core/browser/assets/logo.svg';
import {CoreCommandContribution} from "@/bootstrap-web/browser/core-commands";

/**
 * 渲染并启动客户端应用
 *
 * 🚀 功能描述：
 * 初始化依赖注入器、处理环境配置参数（如端口、WebSocket路径等），
 * 构造客户端应用实例并启动，将应用挂载到指定 DOM 节点上。
 *
 * @param {IClientAppOpts} opts - 客户端应用的配置选项
 *        - appName: string   应用名称
 *        - workspaceDir: string   工作目录（可选，优先级：opts.workspaceDir > URL查询参数 > 环境变量 WORKSPACE_DIR）
 *        - extensionDir: string   扩展目录（可选，若未设置则使用环境变量 EXTENSION_DIR）
 *        - wsPath: string   WebSocket 连接地址（可选，若未设置则根据环境自动配置）
 *        - extWorkerHost: string   扩展工作者地址（可选，若未设置则使用默认构造的 URL）
 *        - staticServicePath: string   静态服务地址
 *        - webviewEndpoint: string   WebView 终端地址
 *        - layoutComponent: any   布局组件（默认 ToolbarActionBasedLayout）
 *        - injector: Injector   注入器实例
 *        - isElectronRenderer: boolean   环境标识
 *        - AINativeConfig: object   AI 原生配置（用于菜单栏 logo 等）
 *
 * @returns {Promise<void>} 无返回值，异步完成整个应用的初始化和启动过程
 *
 * 🔧 历史背景：
 * 为了兼顾开发环境与线上环境，通过 process.env.DEVELOPMENT 判断环境，从而配置不同的服务端口和路径。
 * 此方案源自早期需要快速切换配置本地测试与线上部署的需求。
 */
export async function renderApp(opts: IClientAppOpts): Promise<void> {
  // 创建依赖注入器实例，并向其中注册核心命令（CoreCommandContribution）
  const injector = new Injector();
  injector.addProviders(CoreCommandContribution); // 🔧 依赖注入：注册核心命令，便于后续组件解耦

  // 从浏览器获取当前主机名和 URL 查询参数，便于动态构造路径和端口
  const hostname = window.location.hostname;
  const query = new URLSearchParams(window.location.search);

  // 🔧 配置服务端口：
  // - 当处于开发模式（process.env.DEVELOPMENT为true）时使用预设端口
  // - 否则使用浏览器所提供的端口（window.location.port）
  const serverPort = process.env.DEVELOPMENT ? 8000 : window.location.port;
  const staticServerPort = process.env.DEVELOPMENT ? 8080 : window.location.port;
  const webviewEndpointPort = process.env.DEVELOPMENT ? 8899 : window.location.port;
  
  // 配置应用名称
  opts.appName = 'CodeFuse IDE';
  
  // 🎯 设置工作目录：
  // 优先使用 opts.workspaceDir，若未指定则依次尝试 URL 查询参数及环境变量 WORKSPACE_DIR
  opts.workspaceDir = opts.workspaceDir || query.get('workspaceDir') || process.env.WORKSPACE_DIR;

  // 设置扩展目录，若未指定则使用环境变量 EXTENSION_DIR
  opts.extensionDir = opts.extensionDir || process.env.EXTENSION_DIR;

  // ⚠️ 设置 WebSocket 连接地址：
  // - 优先使用环境变量 WS_PATH
  // - 否则，根据当前协议（https 或 http）构造相应地址，确保连接安全与兼容性
  opts.wsPath = process.env.WS_PATH || (window.location.protocol === 'https:' 
      ? `wss://${hostname}:${serverPort}` 
      : `ws://${hostname}:${serverPort}`);
  console.log(opts.wsPath);

  // 配置扩展工作者（Extension Worker）的地址：
  // - 若 opts.extWorkerHost 未定义，则使用环境变量 EXTENSION_WORKER_HOST，
  //   如果也未配置，则构造默认 URL，指向静态服务下特定的 worker-host.js 脚本
  opts.extWorkerHost = opts.extWorkerHost || process.env.EXTENSION_WORKER_HOST || `http://${hostname}:${staticServerPort}/ext-host/worker-host.js`;

  // 配置静态服务地址，基于当前主机名和服务端口构造 URL
  opts.staticServicePath = `http://${hostname}:${serverPort}`;

  // 获取用于 WebView 连接的主机名：
  // - 若存在环境变量 WEBVIEW_HOST，则使用其配置；否则默认使用当前主机名
  const anotherHostName = process.env.WEBVIEW_HOST || hostname;
  // 构造 WebView 终端地址 URL
  opts.webviewEndpoint = `http://${anotherHostName}:${webviewEndpointPort}/webview`;

  // 使用默认布局组件：如果 opts.layoutComponent 未提供，则使用 ToolbarActionBasedLayout
  opts.layoutComponent = opts.layoutComponent || ToolbarActionBasedLayout;

  // 将依赖注入器加入到应用的配置选项中
  opts.injector = injector;

  // 标识当前环境非 Electron Renderer，适用于纯 Web 环境
  opts.isElectronRenderer = false;

  // 配置 AI 原生设置，其中包含菜单栏 logo，用于界面美化及品牌显示
  opts.AINativeConfig = {
    layout: {
      menubarLogo: logo, // 🚀 使用 logo 配置菜单栏图标，确保视觉一致性
    }
  };

  // 创建客户端应用实例，并传入已配置的 opts
  const app = new ClientApp(opts);

  // 🎯 定义应用重载操作（fireOnReload），在需要刷新页面时触发
  app.fireOnReload = () => {
    // ⚠️ 注意：页面重载可能会导致未保存数据丢失，重载前应确保所有状态已妥善保存
    window.location.reload();
  };

  // 将客户端应用挂载到 ID 为 "main" 的 DOM 元素上，并指定运行环境为 "web"
  app.start(document.getElementById('main')!, 'web');
}
