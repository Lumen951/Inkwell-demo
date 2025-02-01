/**
 * @class WelcomeContribution
 * @summary 🚀 类功能：欢迎页扩展模块，用于设置欢迎页面的编辑器组件和资源，同时在启动时触发欢迎页打开。
 * 
 * 该类主要实现了 BrowserEditorContribution 和 ClientAppContribution 接口，
 * 提供了编辑器组件注册、资源提供以及启动时展示欢迎页的功能。
 */
import { Autowired } from '@opensumi/di';
import { ClientAppContribution, Domain, RecentFilesManager, URI, localize } from '@opensumi/ide-core-browser';
import { IResource, ResourceService, WorkbenchEditorService } from '@opensumi/ide-editor';
import {
  BrowserEditorContribution,
  EditorComponentRegistry,
  EditorComponentRenderMode,
  EditorOpenType,
} from '@opensumi/ide-editor/lib/browser';
import { IWorkspaceService } from '@opensumi/ide-workspace';

import { IWelcomeMetaData } from './common';
import { EditorWelcomeComponent } from './welcome.component';

@Domain(BrowserEditorContribution, ClientAppContribution)
export class WelcomeContribution implements BrowserEditorContribution, ClientAppContribution {
  // 🔧 注入 IWorkspaceService 服务，用于工作区管理（历史背景：依赖注入使代码模块化）
  @Autowired(IWorkspaceService)
  private readonly workspaceService: IWorkspaceService;

  // 🔧 注入 WorkbenchEditorService，用于编辑器操作管理
  @Autowired(WorkbenchEditorService)
  private readonly editorService: WorkbenchEditorService;

  // 🔧 注入 RecentFilesManager，用于管理最近打开的文件记录
  @Autowired(RecentFilesManager)
  private readonly recentFilesManager: RecentFilesManager;

  /**
   * @function registerEditorComponent
   * @summary 🚀 功能描述：注册欢迎页编辑器组件及其解析器
   * @param {EditorComponentRegistry} registry - 🛠️ 参数：编辑器组件注册器，用于注册和查询组件
   * @returns {void} 返回值：无
   * 
   * 详细说明：此方法先调用 registry.registerEditorComponent() 注册组件，
   * 然后调用 registry.registerEditorComponentResolver() 注册对应组件解析器，
   * 保证"welcome" scheme 的资源能够正确映射到欢迎页组件。
   */
  registerEditorComponent(registry: EditorComponentRegistry) {
    // 注册欢迎页编辑器组件，设置唯一标识与渲染模式
    registry.registerEditorComponent({
      uid: 'welcome',
      scheme: 'welcome',
      component: EditorWelcomeComponent,
      renderMode: EditorComponentRenderMode.ONE_PER_WORKBENCH,
    });
    // 注册组件解析器，确保当请求"welcome"类型资源时能够返回对应的组件标识
    registry.registerEditorComponentResolver('welcome', (resource, results) => {
      // ⚠️ 注意：使用 results.push 添加解析结果，便于后续处理
      results.push({
        type: EditorOpenType.component,
        componentId: 'welcome',
      });
    });
  }

  /**
   * @function registerResource
   * @summary 🚀 功能描述：为欢迎页注册对应的资源提供者（Resource Provider）
   * @param {ResourceService} service - 🛠️ 参数：资源服务，用于管理和提供资源
   * @returns {void} 返回值：无
   * 
   * 详细说明：该方法通过 service.registerResourceProvider() 注册资源提供者，
   * 当请求"welcome" scheme 的资源时，异步获取最近使用的工作区和最近打开的文件，
   * 然后构造资源对象返回。
   */
  registerResource(service: ResourceService) {
    service.registerResourceProvider({
      scheme: 'welcome',
      provideResource: async (uri: URI): Promise<IResource<IWelcomeMetaData>> =>
        // 利用 Promise.all 并行获取最近工作区和文件信息，降低请求延迟 🚀
        Promise.all([
          this.workspaceService.getMostRecentlyUsedWorkspaces(),
          this.recentFilesManager.getMostRecentlyOpenedFiles(),
        ]).then(([workspaces, files]) => ({
          uri,
          name: localize('welcome.title'),
          icon: '',
          metadata: {
            // ⚠️ 注意：确保工作区和文件信息即使为空也返回数组，防止后续操作异常
            recentWorkspaces: workspaces || [],
            recentFiles: files || [],
          },
        })),
    });
  }

  /**
   * @function onDidStart
   * @summary 🚀 功能描述：系统启动后执行，如果当前无打开工作区则自动打开欢迎页
   * @returns {void} 返回值：无
   * 
   * 详细说明：判断是否存在活动工作区，如果不存在，
   * 则调用 editorService.open() 打开默认的欢迎页 URI，改善新用户体验。
   */
  onDidStart() {
    // 检查当前是否存在工作区，若不存在则打开欢迎页
    if (!this.workspaceService.workspace) {
      // 🚀 性能优化：直接使用 URI 方案构造欢迎页地址，避免额外解析
      this.editorService.open(new URI('welcome://'));
    }
  }
}
