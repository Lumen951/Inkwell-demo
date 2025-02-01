// 该组件用于显示更新信息，并处理更新的下载和安装过程。
// 它通过与 Electron 的 ipcRenderer 进行通信来获取更新状态和进度信息。

import { ipcRenderer, shell } from 'electron'
import React, { useEffect, useMemo, useState } from 'react'
import { marked } from '@opensumi/ide-components/lib/utils';
import logo from '@/core/browser/assets/logo.svg'
import styles from './style.module.less'
import { IPC_CHANNEL, ProgressInfo, InitialState, UpdateInfo, UpdateState, EventData } from '../common'

/**
 * UpdateView 组件
 * 
 * 功能描述：
 * 该组件负责显示更新信息、下载进度，并提供安装更新的功能。
 * 
 * 参数说明：
 * 无
 * 
 * 返回值说明：
 * JSX.Element - 渲染的更新视图组件
 */
export const UpdateView = () => {
  const [ updateInfo, setUpdateInfo ] = useState<UpdateInfo | null | undefined>() // 更新信息状态
  const [ progressInfo, setProgressInfo ] = useState<ProgressInfo | null>(null) // 下载进度状态
  const [ updateState, setUpdateState ] = useState<UpdateState | null>(null) // 更新状态

  // 使用 useMemo 计算更新日志的 HTML 内容
  const releaseHtml = useMemo(() => {
    const releaseNotes = updateInfo?.releaseNotes // 获取更新日志
    if (!releaseNotes) return '' // 如果没有更新日志，返回空字符串
    const releaseNote = Array.isArray(releaseNotes) ? releaseNotes[0]?.note : releaseNotes as string // 处理更新日志格式
    return marked(releaseNote || '无更新日志') // 将更新日志转换为 HTML
  }, [updateInfo])

  // 计算下载进度百分比
  const progressPercent = useMemo(() => {
    return (progressInfo?.percent || 0).toFixed(2) // 保留两位小数
  }, [progressInfo])

  /**
   * 安装应用程序
   * 
   * 功能描述：
   * 该函数负责触发下载和安装更新的过程。
   * 
   * 参数说明：
   * 无
   * 
   * 返回值说明：
   * Promise<void> - 无返回值
   */
  const installApp = async () => {
    setUpdateState(UpdateState.Downloading) // 设置更新状态为下载中
    try {
      await ipcRenderer.invoke(IPC_CHANNEL.downloadAndInstall) // 调用 IPC 通道进行下载和安装
      setUpdateState(UpdateState.Downloaded) // 下载完成，更新状态
    } catch {
      setUpdateState(UpdateState.DownloadError) // 下载出错，更新状态
    }
  }

  /**
   * 忽略当前版本
   * 
   * 功能描述：
   * 该函数负责发送忽略当前版本的请求。
   * 
   * 参数说明：
   * 无
   * 
   * 返回值说明：
   * void - 无返回值
   */
  const ignoreVersion = () => {
    ipcRenderer.send(IPC_CHANNEL.ignoreVersion) // 发送忽略版本的 IPC 消息
  }

  // 使用 useEffect 获取初始状态和监听事件
  useEffect(() => {
    ipcRenderer.invoke(IPC_CHANNEL.initialState) // 请求初始状态
      .then((initialData: InitialState) => {
        setUpdateState(initialData.updateState) // 设置更新状态
        setProgressInfo(initialData.progressInfo) // 设置进度信息
        setUpdateInfo(initialData.updateInfo) // 设置更新信息
      })
      .catch(() => {
        setUpdateInfo(null) // 获取失败，设置更新信息为 null
      })

    // 监听下载进度和错误事件
    ipcRenderer.on(IPC_CHANNEL.eventData, (event, data: EventData) => {
      if (data.event === 'download-progress') {
        setProgressInfo(data.data) // 更新进度信息
      } else if (data.event === 'error') {
        setUpdateState(UpdateState.UpdateError) // 更新状态为错误
      }
    })
  }, [])

  if (typeof updateInfo === 'undefined') return null // 如果更新信息未定义，返回 null

  if (updateInfo === null) {
    return (
      <div className={`${styles.container} ${styles.error}`}>
        获取更新信息失败，请稍后重试
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.icon}>
        <img src={logo} alt="logo" />
      </div>
      <div className={styles.body}>
        <div className={styles.title}>CodeFuse IDE 有新版本更新</div>
        <div className={styles.subtitle}>CodeFuse IDE {updateInfo.version} 可供下载，您现在的版本是 {process.env.IDE_VERSION}。</div>
        <div className={styles.changelogTitle}>更新日志：</div>
        <div
          className={styles.changelog}
          dangerouslySetInnerHTML={{ __html: releaseHtml }} // 使用 dangerouslySetInnerHTML 渲染 HTML
          onClickCapture={e => {
            const target = e.target as HTMLAnchorElement; // 获取事件目标
            if (target && target.tagName === 'A' && target.href) {
              shell.openExternal(target.href); // 打开外部链接
              e.preventDefault(); // 阻止默认行为
            }
          }}
        />
        <div className={styles.footer}>
          <div className={`${styles.progress} ${(updateState === UpdateState.DownloadError || updateState === UpdateState.UpdateError) ? styles.error : ''}`}>
            {updateState === UpdateState.Downloading ? `正在下载更新 (${progressPercent}%) ...` : ''}
            {updateState === UpdateState.Downloaded ? '下载完成，准备重启' : ''}
            {updateState === UpdateState.DownloadError ? '下载失败，请稍后重试' : ''}
            {updateState === UpdateState.UpdateError ? '更新失败，请稍后重试' : ''}
          </div>
          <div className={styles.btn}>
            <button onClick={ignoreVersion}>跳过此版本</button>
            <button className={styles.installBtn} disabled={updateState === UpdateState.Downloading || updateState === UpdateState.Downloaded} onClick={installApp}>安装更新并重启</button>
          </div>
        </div>
      </div>
    </div>
  )
}
