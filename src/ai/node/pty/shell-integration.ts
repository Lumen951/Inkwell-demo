// 此文件用于实现Shell集成功能，主要负责创建和写入bash初始化文件。
// 该文件的路径由用户的主目录和环境变量IDE_DATA_FOLDER_NAME组合而成。

import * as fs from 'node:fs/promises'; // 导入文件系统模块以进行文件操作
import * as path from 'node:path'; // 导入路径模块以处理文件路径
import * as os from 'node:os'; // 导入操作系统模块以获取用户主目录

// 生成Shell集成目录的路径
const shellIntegrationDirPath = path.join(os.homedir(), process.env.IDE_DATA_FOLDER_NAME!, 'shell-integration');

// 生成bash集成文件的完整路径
export const bashIntegrationPath = path.join(shellIntegrationDirPath, 'bash-integration.bash');

/**
 * bash初始化文件内容，用于Shell集成功能的搭建。
 * 该内容会在初始化时写入到指定的bash集成文件中。
 * 
 * @type {string} bash初始化文件的内容
 * @returns {string} 返回bash初始化文件的内容
 * 
 * ⚠️ 注意事项：确保用户的bash配置文件存在，以便正确加载。
 */
export const bashIntegrationContent = String.raw`

if [ -r /etc/profile ]; then
    . /etc/profile  # 加载系统级的bash配置
fi
if [ -r ~/.bashrc ]; then
    . ~/.bashrc  # 加载用户级的bash配置
fi
if [ -r ~/.bash_profile ]; then
    . ~/.bash_profile  # 加载用户的bash登录配置
elif [ -r ~/.bash_login ]; then
    . ~/.bash_login  # 加载用户的bash登录配置（备选）
elif [ -r ~/.profile ]; then
    . ~/.profile  # 加载用户的profile配置（备选）
fi

# 定义函数以标记提示符的开始
__is_prompt_start() {
	builtin printf '\e]6973;PS\a'  # 发送开始提示符的信号
}

# 定义函数以标记提示符的结束
__is_prompt_end() {
	builtin printf '\e]6973;PE\a'  # 发送结束提示符的信号
}

# 更新提示符的函数
__is_update_prompt() {
	// 检查自定义提示符是否为空或与当前提示符不同
	if [[ "$__is_custom_PS1" == "" || "$__is_custom_PS1" != "$PS1" ]]; then
        __is_original_PS1=$PS1  // 保存原始提示符
        __is_custom_PS1="\[$(__is_prompt_start)\]$__is_original_PS1\[$(__is_prompt_end)\]"  // 设置自定义提示符
        export PS1="$__is_custom_PS1"  // 导出自定义提示符
    fi
}

// 调用更新提示符的函数
__is_update_prompt
`;

/**
 * 初始化Shell集成文件的异步函数。
 * 该函数会创建Shell集成目录并写入bash初始化文件内容。
 * 
 * @async
 * @function initShellIntegrationFile
 * @returns {Promise<void>} 无返回值
 * 
 * 🔧 配置项：确保目录创建成功，以便后续写入文件。
 */
export const initShellIntegrationFile = async () => {
  await fs.mkdir(shellIntegrationDirPath, { recursive: true }); // 创建目录，若已存在则不报错
  await fs.writeFile(bashIntegrationPath, bashIntegrationContent); // 写入bash初始化文件内容
};
