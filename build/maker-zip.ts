/**
 * MakerZip类用于创建ZIP格式的应用程序打包工具。
 * 该类继承自MakerBase，提供了在macOS平台上构建应用程序的功能。
 * 
 * @interface MakerZipConfig - 配置接口，当前未定义具体属性。
 */
interface MakerZipConfig {}

/**
 * MakerZip类实现了ZIP格式的打包逻辑。
 * 
 * @extends MakerBase<MakerZipConfig>
 */
export default class MakerZip extends MakerBase<MakerZipConfig> {
  name = 'zip'; // 🔧 安装程序名称

  defaultPlatforms: ForgePlatform[] = ['darwin']; // 🔧 默认支持的平台

  /**
   * 检查当前平台是否支持ZIP构建。
   * 
   * @returns {boolean} - 如果支持返回true，否则返回false。
   */
  isSupportedOnCurrentPlatform(): boolean {
    return true; // 当前实现始终返回true，表示支持所有平台
  }

  /**
   * 创建ZIP格式的应用程序包。
   * 
   * @param {MakerOptions} options - 构建选项。
   * @param {string} options.dir - 应用程序源目录。
   * @param {string} options.makeDir - 构建输出目录。
   * @param {string} options.targetArch - 目标架构（如x64或ia32）。
   * @param {string} options.appName - 应用程序名称。
   * @returns {Promise<string[]>} - 返回构建生成的文件路径数组。
   * 
   * ⚠️ 注意：确保在调用此方法之前，应用程序已正确打包为.app格式。
   */
  async make({ dir, makeDir, targetArch, appName }: MakerOptions): Promise<string[]> {
    return build(
      {
        prepackaged: path.resolve(dir, `${appName}.app`), // 🔧 预打包的应用程序路径
        mac: [`zip:${targetArch}`], // 🔧 macOS平台的构建目标
        config: {
          productName, // 🔧 产品名称
          artifactName: `${applicationName}-\${os}-\${arch}.\${ext}`, // 🔧 生成的安装包名称格式
          directories: {
            output: path.join(makeDir, 'zip', targetArch), // 🔧 输出目录
          },
          publish: {
            provider: 'generic', // 🔧 发布提供者
            url: '', // 🔧 发布URL
            channel: 'latest' // 🔧 发布频道
          }
        },
      }
    )
  }
}

export { MakerZip };
