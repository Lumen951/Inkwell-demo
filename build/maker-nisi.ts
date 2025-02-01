/**
 * MakerNsis类用于创建NSIS安装程序的构建工具。 相当于是一个打包工具。 自动化生成安装程序，简化手动创建安装包的过程。
 * 该类继承自MakerBase，提供了在Windows平台上构建应用程序的功能。
 * 
 * @interface MakerNsisConfig - 配置接口，当前未定义具体属性。
 */
interface MakerNsisConfig {}

/**
 * MakerNsis类实现了NSIS安装程序的构建逻辑。
 * 
 * @extends MakerBase<MakerNsisConfig>
 */
export default class MakerNsis extends MakerBase<MakerNsisConfig> {
  name = 'nsis'; // 🔧 安装程序名称

  defaultPlatforms: ForgePlatform[] = ['win32']; // 🔧 默认支持的平台

  /**
   * 检查当前平台是否支持NSIS构建。
   * 
   * @returns {boolean} - 如果支持返回true，否则返回false。
   */
  isSupportedOnCurrentPlatform(): boolean {
    return true; // 当前实现始终返回true，表示支持所有平台
  }

  /**
   * 创建NSIS安装程序。
   * 
   * @param {MakerOptions} options - 构建选项。
   * @param {string} options.dir - 应用程序源目录。
   * @param {string} options.makeDir - 构建输出目录。
   * @param {string} options.targetArch - 目标架构（如x64或ia32）。
   * @returns {Promise<string[]>} - 返回构建生成的文件路径数组。
   */
  async make({ dir, makeDir, targetArch }: MakerOptions): Promise<string[]> {
    return buildForge(
      { dir }, // 🔧 源目录
      {
        win: [`nsis:${targetArch}`], // 🔧 Windows平台的构建目标
        prepackaged: dir, // 🔧 预打包的应用程序目录
        config: {
          productName, // 🔧 产品名称
          artifactName: `${applicationName}Setup-\${os}-\${arch}.\${ext}`, // 🔧 生成的安装包名称格式
          directories: {
            output: path.join(makeDir, 'nsis', targetArch), // 🔧 输出目录
          },
          win: {
            sign: ({ path }) => signWinApp(path) // 🔧 Windows签名处理
          },
          nsis: {
            oneClick: false, // 🔧 是否支持一键安装
            allowToChangeInstallationDirectory: true, // 🔧 是否允许更改安装目录
            perMachine: true, // 🔧 安装为所有用户
            installerIcon: path.join(__dirname, '../assets/icon/icon.ico') // 🔧 安装程序图标路径
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

// 导出MakerNsis类
export { MakerNsis };
