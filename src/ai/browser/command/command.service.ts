/**
 * AICommandService类用于处理与AI命令相关的逻辑，包括命令分类、请求模型响应等功能。
 * 
 * ⚙️ 功能描述：
 * - 该类负责管理命令组，处理用户输入的命令，并与AI服务交互以获取相应的命令或设置。
 * 
 * 🔧 配置项：
 * - commandGroups: 存储内部命令组的映射关系。
 * - commandRequestStep: 每次请求分类命令的步长，默认为50。
 * 
 * ⚠️ 注意事项：
 * - 确保在使用该服务之前，已正确配置AI服务和命令注册服务。
 */

import differenceWith from 'lodash/differenceWith'; // 引入lodash库中的differenceWith函数，用于比较两个数组的差异

import { Autowired, Injectable } from '@opensumi/di'; // 引入依赖注入相关的装饰器
import {
  AIBackSerivcePath,
  Command,
  CommandRegistry,
  CommandService, 
  Deferred, 
  IAIBackService, 
  IAIBackServiceOption, 
  IAIBackServiceResponse, 
  ILoggerManagerClient, 
  ILogServiceClient, 
  SupportLogNamespace
} from '@opensumi/ide-core-common'; // 引入核心命令相关的类型和服务
import { PreferenceService } from '@opensumi/ide-core-browser'; // 引入偏好设置服务
import { IFileServiceClient } from '@opensumi/ide-file-service'; // 引入文件服务客户端

import { AICommandPromptManager } from './command-prompt-manager'; // 引入AI命令提示管理器

/**
 * 内部命令组的定义，包含不同类别的命令。
 * 
 * 🔧 配置项说明：
 * - 每个键对应一个命令组，值为该组下的命令数组。
 */
const InnerCommandGroups: { [key in string]: string[] } = {
  'File and Editor Management': [
    'file.new.untitled',
    'editor.saveCurrent',
    'editor.close',
    'editor.closeAllInGroup',
    'editor.closeSaved',
    'editor.closeOtherEditorsInGroup',
    'editor.closeToRight',
    'editor.document.revert',
    'editor.saveAll',
    'editor.closeAll',
    'filetree.focus.files',
    'filetree.copy.path',
    'workbench.action.quickOpen',
    'toolbar.showCustomizePanel',
    'connection.start.rtt',
    'connection.stop.rtt',
    'comments.panel.action.collapse',
    'comments.thread.action.close',
    'workbench.action.tasks.runTask',
    'workbench.action.tasks.reRunTask',
    'ai.suggest.documentation',
    'python.datascience.notebookeditor.undocells',
    'python.datascience.notebookeditor.redocells',
    'workbench.action.showEmmetCommands',
    'merge-conflict.accept.all-current',
    'merge-conflict.accept.all-incoming',
    'merge-conflict.accept.all-both',
    'merge-conflict.accept.current',
    'merge-conflict.accept.incoming',
    'merge-conflict.accept.selection',
    'merge-conflict.accept.both',
    'merge-conflict.next',
    'merge-conflict.previous',
    'merge-conflict.compare',
    'typescript.reloadProjects',
    'javascript.reloadProjects',
    'typescript.selectTypeScriptVersion',
    'typescript.goToProjectConfig',
    'javascript.goToProjectConfig',
    'typescript.openTsServerLog',
    'typescript.restartTsServer',
    'typescript.findAllFileReferences',
    'view-container.hide.test',
    'python_tests.focus',
    'jsBrowserBreakpoints.focus',
    'jsExcludedCallers.focus',
    'TREE_VIEW_COLLAPSE_ALL_WORKER',
    '_vscode_delegate_cmd_lowwqr3c',
    'TREE_VIEW_COLLAPSE_ALL',
    '_vscode_delegate_cmd_lowwqrp7',
    '_typescript.configurePlugin',
    '_typescript.learnMoreAboutRefactorings',
    '_typescript.projectStatus',
    'js.projectStatus.command',
    '_typescript.applyCompletionCodeAction',
    '_typescript.onCompletionAccepted',
    '_typescript.applyCompletionCommand',
    '_typescript.organizeImports',
    '_typescript.applyCodeActionCommand',
    '_typescript.applyFixAllCodeAction',
    '_typescript.didApplyRefactoring',
    '_typescript.selectRefactoring',
    'emmet.expandAbbreviation',
    'git.openResource',
  ],
  'Version Control and Git': [
    'git.setLogLevel',
    'git.clone',
    'git.cloneRecursive',
    'git.init',
    'git.openRepository',
    'git.close',
    'git.refresh',
    'git.openChange',
    'git.openAllChanges',
    'git.openFile',
    'git.openFile2',
    'git.openHEADFile',
    'git.stage',
    'git.stageAll',
    'git.stageAllTracked',
    'git.stageAllUntracked',
    'git.stageAllMerge',
    'git.stageSelectedRanges',
    'git.revertSelectedRanges',
    'git.stageChange',
    'git.revertChange',
    'git.unstage',
    'git.unstageAll',
    'git.unstageSelectedRanges',
    'git.clean',
    'git.cleanAll',
    'git.cleanAllTracked',
    'git.cleanAllUntracked',
    'git.rename',
    'git.commit',
    'git.commitStaged',
    'git.commitEmpty',
    'git.commitStagedSigned',
    'git.commitStagedAmend',
    'git.commitAll',
    'git.commitAllSigned',
    'git.commitAllAmend',
    'git.commitNoVerify',
    'git.commitStagedNoVerify',
    'git.commitEmptyNoVerify',
    'git.commitStagedSignedNoVerify',
    'git.commitStagedAmendNoVerify',
    'git.commitAllNoVerify',
    'git.commitAllSignedNoVerify',
    'git.commitAllAmendNoVerify',
    'git.restoreCommitTemplate',
    'git.undoCommit',
    'git.checkout',
    'git.checkoutDetached',
    'git.branch',
    'git.branchFrom',
    'git.deleteBranch',
    'git.renameBranch',
    'git.merge',
    'git.rebase',
    'git.createTag',
    'git.deleteTag',
    'git.fetch',
    'git.fetchPrune',
    'git.fetchAll',
    'git.pull',
    'git.pullRebase',
    'git.pullFrom',
    'git.push',
    'git.pushForce',
    'git.pushTo',
    'git.pushToForce',
    'git.pushTags',
    'git.pushWithTags',
    'git.pushWithTagsForce',
    'git.cherryPick',
    'git.addRemote',
    'git.removeRemote',
    'git.sync',
    'git.syncRebase',
    'git.publish',
    'git.showOutput',
    'git.ignore',
    'git.revealInExplorer',
    'git.revealFileInOS.linux',
    'git.revealFileInOS.mac',
    'git.revealFileInOS.windows',
    'git.stashIncludeUntracked',
    'git.stash',
    'git.stashPop',
    'git.stashPopLatest',
    'git.stashApply',
    'git.stashApplyLatest',
    'git.stashDrop',
    'git.stashDropAll',
    'git.timeline.openDiff',
    'git.timeline.copyCommitId',
    'git.timeline.copyCommitMessage',
    'git.timeline.selectForCompare',
    'git.timeline.compareWithSelected',
    'git.rebaseAbort',
    'git.closeAllDiffEditors',
    'git.api.getRepositories',
    'git.api.getRepositoryState',
    'git.api.getRemoteSources',
    'git.acceptMerge',
    '_git.openMergeEditor',
    'git._syncAll',
    'git.openResource',
  ],
  'Debugging and Testing': [
    'debug.edit.breakpoint',
    'debug.disable.breakpoint',
    'debug.enable.breakpoint',
    'debug.delete.breakpoint',
    'debug.add.conditional',
    'debug.add.logpoint',
    'debug.add.breakpoint',
    'debug.action.runToCursor',
    'debug.action.forceRunToCursor',
    'debug.console.clear',
    'debug.console.collapseAll',
    'testing.run.test',
    'testing.debug.test',
    'testing.goto.test',
    'testing.peek.test.error',
    'testing.peek.test.close',
    'testing.runCurrentFile',
    'testing.debugCurrentFile',
    'testing.goToPreviousMessage',
    'testing.goToNextMessage',
    'testing.clearTestResults',
    'testing.openMessageInEditor',
    'testing.refresshTests',
    'testing.runAll',
    'testing.debugAll',
  ],
  'Terminal and Command Line': [
    'terminal.search',
    'terminal.split',
    'terminal.clear',
    'terminal.add',
    'terminal.toggleTerminal',
    'terminal.search.next',
    'terminal.remove',
    'terminal.selectAllContent',
    'terminal.clearContent',
    'terminal.clearAllContent',
    'terminal.selectTypeZsh',
    'terminal.selectTypeBash',
    'terminal.selectTypeSh',
    'terminal.selectTypePowerShell',
    'terminal.selectTypeCMD',
    'terminal.moreSettings',
    'terminal.copy',
    'terminal.paste',
    'terminal.selectAll',
    'workbench.action.terminal.focusNextPane',
    'workbench.action.terminal.focusPreviousPane',
    'terminal.killProcess',
    'TerminalProfilesCommand:bash:bash',
    'TerminalProfilesCommand:zsh:zsh',
    'TerminalProfilesCommand:ms-vscode.js-debug:extension.js-debug.debugTerminal',
  ],
  'User Interface and Layout Management': [
    'container.show.explorer',
    'container.show.search',
    'container.show.scm',
    'container.show.extension',
    'container.show.debug',
    'main-layout.bottom-panel.expand',
    'main-layout.bottom-panel.retract',
    'main-layout.bottom-panel.toggle',
    'container.show.terminal',
    'container.show.output',
    'container.show.debug-console',
    'container.show.markers',
    'container.show.ai_chat',
    'main-layout.left-panel.hide',
    'main-layout.left-panel.show',
    'main-layout.left-panel.toggle',
    'main-layout.right-panel.hide',
    'main-layout.right-panel.show',
    'main-layout.right-panel.toggle',
    'workbench.action.closeSidebar',
    'main-layout.bottom-panel.show',
    'main-layout.bottom-panel.hide',
    'layout.action.openView',
    'editor.splitToLeft',
    'editor.splitToRight',
    'editor.splitToTop',
    'editor.splitToBottom',
    'editor.evenEditorGroups',
    'editor.closeOtherGroup',
    'theme.toggle',
    'theme.icon.toggle',
    'editor.action.fontZoomIn',
    'editor.action.fontZoomOut',
    'editor.action.fontZoomReset',
    'workbench.action.reloadWindow',
  ],
  'Code Editing and Refactoring': [
    'editor.undo',
    'editor.redo',
    'editor.selectAll',
    'editor.action.formatDocument',
    'editor.action.formatSelection',
    'editor.action.indentationToSpaces',
    'editor.action.indentationToTabs',
    'editor.action.indentUsingTabs',
    'editor.action.indentUsingSpaces',
    'editor.action.detectIndentation',
    'editor.action.reindentlines',
    'editor.action.reindentselectedlines',
    'editor.action.smartSelect.expand',
    'editor.action.smartSelect.shrink',
    'editor.action.forceRetokenize',
    'editor.action.toggleTabFocusMode',
    'editor.action.unicodeHighlight.disableHighlightingOfAmbiguousCharacters',
    'editor.action.unicodeHighlight.disableHighlightingOfInvisibleCharacters',
    'editor.action.unicodeHighlight.disableHighlightingOfNonBasicAsciiCharacters',
    'editor.action.unicodeHighlight.showExcludeOptions',
    'editor.action.wordHighlight.next',
    'editor.action.wordHighlight.prev',
    'editor.action.wordHighlight.trigger',
    'editor.emmet.action.wrapWithAbbreviation',
    'editor.emmet.action.removeTag',
    'editor.emmet.action.updateTag',
    'editor.emmet.action.matchTag',
    'editor.emmet.action.balanceIn',
    'editor.emmet.action.balanceOut',
    'editor.emmet.action.prevEditPoint',
    'editor.emmet.action.nextEditPoint',
    'editor.emmet.action.mergeLines',
    'editor.emmet.action.selectPrevItem',
    'editor.emmet.action.selectNextItem',
    'editor.emmet.action.splitJoinTag',
    'editor.emmet.action.toggleComment',
    'editor.emmet.action.evaluateMathExpression',
    'editor.emmet.action.updateImageSize',
    'editor.emmet.action.incrementNumberByOneTenth',
    'editor.emmet.action.incrementNumberByOne',
    'editor.emmet.action.incrementNumberByTen',
    'editor.emmet.action.decrementNumberByOneTenth',
    'editor.emmet.action.decrementNumberByOne',
    'editor.emmet.action.decrementNumberByTen',
    'editor.emmet.action.reflectCSSValue',
    'editor.action.clipboardCopyWithSyntaxHighlightingAction',
    'editor.action.commentLine',
    'editor.action.addCommentLine',
    'editor.action.removeCommentLine',
    'editor.action.blockComment',
    'editor.action.addSelectionToNextFindMatch',
    'editor.action.addSelectionToPreviousFindMatch',
    'editor.action.moveSelectionToNextFindMatch',
    'editor.action.moveSelectionToPreviousFindMatch',
    'editor.action.selectHighlights',
    'editor.action.changeAll',
    'editor.action.rename',
    'editor.action.transformToUppercase',
    'editor.action.transformToLowercase',
    'editor.action.transformToSnakecase',
    'editor.action.transformToTitlecase',
    'editor.action.transformToKebabcase',
    'editor.action.insertLineBefore',
    'editor.action.insertLineAfter',
    'editor.action.deleteLines',
    'editor.action.indentLines',
    'editor.action.outdentLines',
    'editor.action.duplicateSelection',
    'editor.action.copyLinesUpAction',
    'editor.action.copyLinesDownAction',
    'editor.action.moveLinesUpAction',
    'editor.action.moveLinesDownAction',
    'editor.action.sortLinesAscending',
    'editor.action.sortLinesDescending',
    'editor.action.trimTrailingWhitespace',
    'editor.action.deleteAllLeft',
    'editor.action.deleteAllRight',
    'editor.action.joinLines',
    'editor.action.transpose',
    'editor.action.toggleWordWrap',
    'editor.action.formatDocument.multiple',
    'editor.action.formatSelection.multiple',
    'dialog.ensure',
    'editor.action.diffReview.next',
    'editor.action.diffReview.prev',
    'editor.action.showContextMenu',
    'editor.action.triggerSuggest',
    'editor.action.resetSuggestSize',
    'editor.action.setSelectionAnchor',
    'editor.action.goToSelectionAnchor',
    'editor.action.selectFromAnchorToCursor',
    'editor.action.cancelSelectionAnchor',
    'editor.action.selectToBracket',
    'editor.action.jumpToBracket',
    'editor.action.moveCarretLeftAction',
    'editor.action.moveCarretRightAction',
    'editor.action.transposeLetters',
    'editor.action.quickFix',
    'editor.action.refactor',
    'editor.action.refactor.preview',
    'editor.action.sourceAction',
    'editor.action.organizeImports',
    'editor.action.autoFix',
    'editor.action.fixAll',
    'codelens.showLensesInCurrentLine',
    'editor.action.revealDefinitionAside',
    'editor.action.inlineSuggest.trigger',
    'editor.action.inlineSuggest.showNext',
    'editor.action.inlineSuggest.showPrevious',
    'editor.action.inPlaceReplace.up',
    'editor.action.inPlaceReplace.down',
    'expandLineSelection',
    'editor.action.removeDuplicateLines',
    'deleteAllLeft',
    'deleteAllRight',
    'editor.action.linkedEditing',
    'editor.action.insertCursorAbove',
    'editor.action.insertCursorBelow',
    'editor.action.insertCursorAtEndOfEachLineSelected',
    'editor.action.addCursorsToBottom',
    'editor.action.addCursorsToTop',
    'editor.action.focusNextCursor',
    'editor.action.focusPreviousCursor',
    'editor.action.gotoLine',
    'editor.toggleWordWrap',
    'editor.action.copyPath',
    'editor.action.copyRelativePath',
    'editor.action.fontZoomIn',
    'editor.action.fontZoomOut',
    'editor.action.fontZoomReset',
    'editor.tokenize.test',
    'editor.action.openLink',
  ],
  'Search and Navigation': [
    'workbench.action.gotoSymbol',
    'editor.action.startFindReplaceAction',
    'editor.actions.findWithArgs',
    'actions.findWithSelection',
    'editor.action.nextMatchFindAction',
    'editor.action.previousMatchFindAction',
    'editor.action.nextSelectionMatchFindAction',
    'editor.action.previousSelectionMatchFindAction',
    'editor.unfold',
    'editor.unfoldRecursively',
    'editor.fold',
    'editor.foldRecursively',
    'editor.foldAll',
    'editor.unfoldAll',
    'editor.foldAllBlockComments',
    'editor.foldAllMarkerRegions',
    'editor.unfoldAllMarkerRegions',
    'editor.foldAllExcept',
    'editor.unfoldAllExcept',
    'editor.toggleFold',
    'editor.gotoParentFold',
    'editor.gotoPreviousFold',
    'editor.gotoNextFold',
    'editor.createFoldingRangeFromSelection',
    'editor.removeManualFoldingRanges',
    'editor.foldLevel1',
    'editor.foldLevel2',
    'editor.foldLevel3',
    'editor.foldLevel4',
    'editor.foldLevel5',
    'editor.foldLevel6',
    'editor.foldLevel7',
    'editor.gotoLine',
    'editor.action.revealDefinition',
    'editor.action.peekDefinition',
    'editor.action.revealDeclaration',
    'editor.action.peekDeclaration',
    'editor.action.goToTypeDefinition',
    'editor.action.peekTypeDefinition',
    'editor.action.goToImplementation',
    'editor.action.peekImplementation',
    'editor.action.goToReferences',
    'editor.action.referenceSearch.trigger',
    'editor.action.showHover',
    'editor.action.marker.next',
    'editor.action.marker.prev',
    'editor.action.marker.nextInFiles',
    'editor.action.marker.prevInFiles',
    'editor.workspaceSymbol.quickopen',
    'editor.workspaceSymbolClass.quickopen',
    'content-search.openSearch',
    'search.menu.replace',
    'search.menu.replaceAll',
    'search.menu.hide',
    'search.menu.copy',
    'search.menu.copyAll',
    'search.menu.copyPath',
    'editor.action.triggerParameterHints',
    'editor.action.inlineSuggest.trigger',
    'editor.action.inlineSuggest.showNext',
    'editor.action.inlineSuggest.showPrevious',
    'actions.find',
    'deleteInsideWord',
    'editor.focusIfNotActivateElement',
    'editor.mergeEditor.reset',
    'workbench.action.gotoSymbol',
    'cursorUndo',
    'cursorRedo',
    'file-search.refresh',
    'file-search.clean',
    'output.channel.clear',
    'workspace.addFolderToWorkspace',
    'workspace.saveWorkspaceAsFile',
    'outline.collapse.all',
    'outline.follow.cursor',
    'outline.sort.kind',
    'outline.sort.name',
    'outline.sort.position',
    'walkthroughs.get.started',
    '_vscode_delegate_cmd_lowzug5h',
    '_vscode_delegate_cmd_lowzugai',
    'core.launchConfiguration.open',
    'ext.restart',
    'copyFilePath',
  ],
  'Extensions and Customization': [
    'container.show.extension',
    'extension.js-debug.prettyPrint',
    'extension.js-debug.toggleSkippingFile',
    'extension.js-debug.addCustomBreakpoints',
    'extension.js-debug.removeCustomBreakpoint',
    'extension.js-debug.removeAllCustomBreakpoints',
    'extension.pwa-node-debug.attachNodeProcess',
    'extension.js-debug.npmScript',
    'extension.js-debug.createDebuggerTerminal',
    'extension.js-debug.startProfile',
    'extension.js-debug.stopProfile',
    'extension.js-debug.revealPage',
    'extension.js-debug.debugLink',
    'extension.js-debug.createDiagnostics',
    'extension.node-debug.startWithStopOnEntry',
    'extension.js-debug.openEdgeDevTools',
    'extension.js-debug.callers.add',
    'extension.js-debug.callers.remove',
    'extension.js-debug.callers.removeAll',
    'extension.js-debug.callers.goToCaller',
    'extension.js-debug.callers.gotToTarget',
    'vscode-icons.activateIcons',
    'vscode-icons.regenerateIcons',
    'vscode-icons.ngPreset',
    'vscode-icons.nestPreset',
    'vscode-icons.jsPreset',
    'vscode-icons.tsPreset',
    'vscode-icons.jsonPreset',
    'vscode-icons.hideFoldersPreset',
    'vscode-icons.foldersAllDefaultIconPreset',
    'vscode-icons.hideExplorerArrowsPreset',
    'vscode-icons.restoreIcons',
    'vscode-icons.resetProjectDetectionDefaults',
    'workbench.action.showRuntimeExtensions',
    'workbench.action.extensionHostProfiler.start',
    'workbench.action.extensionHostProfiler.stop',
    'sumi-extension.toolbar.btn.setState',
    'sumi-extension.toolbar.btn.setContext',
    'sumi-extension.toolbar.btn.connectHandle',
    'sumi-extension.toolbar.select.setState',
    'sumi-extension.toolbar.select.setOptions',
    'sumi-extension.toolbar.select.setSelect',
    'sumi-extension.toolbar.select.connectHandle',
    'sumi-extension.toolbar.showPopover',
    'sumi-extension.toolbar.hidePopover',
  ],
  'Data Science and Notebooks': [
    'python.analysis.clearCache',
    'python.enableSourceMapSupport',
    'python.sortImports',
    'python.startREPL',
    'python.createTerminal',
    'python.buildWorkspaceSymbols',
    'python.openTestNodeInEditor',
    'python.runTestNode',
    'python.debugTestNode',
    'python.runtests',
    'python.debugtests',
    'python.execInTerminal',
    'python.execInTerminal-icon',
    'python.setInterpreter',
    'python.switchOffInsidersChannel',
    'python.switchToDailyChannel',
    'python.switchToWeeklyChannel',
    'python.refactorExtractVariable',
    'python.refactorExtractMethod',
    'python.viewTestOutput',
    'python.viewLanguageServerOutput',
    'python.viewOutput',
    'python.selectAndRunTestMethod',
    'python.selectAndDebugTestMethod',
    'python.selectAndRunTestFile',
    'python.runCurrentTestFile',
    'python.runFailedTests',
    'python.discoverTests',
    'python.discoveringTests',
    'python.stopTests',
    'python.configureTests',
    'python.execSelectionInTerminal',
    'python.execSelectionInDjangoShell',
    'python.goToPythonObject',
    'python.setLinter',
    'python.enableLinting',
    'python.runLinting',
  ],
  'Accessibility and Help': [
    'editor.action.showAccessibilityHelp',
    'editor.action.inspectTokens',
    'editor.action.showHover',
    'editor.action.showDefinitionPreviewHover',
    'core.about',
    'core.keymaps.open',
    'keymaps.open.source',
    'keyboard.chooseKeyboardLayout',
    'ai.explain.terminal',
    'ai.explain.debug',
    'authentication.noAccounts',
    'preference.open.user',
    'preference.open.workspace',
    'preference.open.source',
    'core.openpreference',
    'variable.list',
  ],
};

/**
 * ISumiCommandModelResp接口定义了AI模型响应的命令类型。
 * 
 * 🔧 参数说明：
 * - type: 'command' - 表示该响应为命令类型。
 * - commandKey: string - 命令的唯一标识符。
 * - answer: string - AI的回答内容。
 */
export interface ISumiCommandModelResp {
  type: 'command';
  commandKey: string;
  answer: string;
}

/**
 * ISumiSettingModelResp接口定义了AI模型响应的设置类型。
 * 
 * 🔧 参数说明：
 * - type: 'setting' - 表示该响应为设置类型。
 * - settingKey: string - 设置的唯一标识符。
 * - answer: string - AI的回答内容。
 */
export interface ISumiSettingModelResp {
  type: 'setting';
  settingKey: string;
  answer: string;
}

/**
 * INullModelResp接口定义了AI模型响应的空类型。
 * 
 * 🔧 参数说明：
 * - type: 'null' - 表示该响应为空类型。
 * - answer: string - AI的回答内容。
 */
export interface INullModelResp {
  type: 'null';
  answer: string;
}

/**
 * ISumiModelResp类型定义了AI模型响应的联合类型。
 * 
 * 🔧 类型说明：
 * - 包含ISumiCommandModelResp、ISumiSettingModelResp和INullModelResp三种类型。
 */
export type ISumiModelResp = ISumiCommandModelResp | ISumiSettingModelResp | INullModelResp;

@Injectable() // 使用@Injectable装饰器标记该类为可注入的服务
export class AICommandService {
  private commandGroups = InnerCommandGroups; // 存储内部命令组
  protected commandRequestStep = 50; // 每次请求分类命令的步长

  private classifyCommandDeferred: Deferred<void> | null = null; // 用于延迟处理命令分类的Deferred对象

  @Autowired(AIBackSerivcePath) // 自动注入AI后端服务路径
  private aiBackService: IAIBackService; // AI后端服务

  @Autowired(CommandService) // 自动注入命令服务
  protected readonly commandService: CommandService; // 命令服务

  @Autowired(CommandRegistry) // 自动注入命令注册服务
  protected readonly commandRegistryService: CommandRegistry; // 命令注册服务

  @Autowired(IFileServiceClient) // 自动注入文件服务客户端
  protected fileService: IFileServiceClient; // 文件服务客户端

  @Autowired(AICommandPromptManager) // 自动注入AI命令提示管理器
  protected promptManager: AICommandPromptManager; // AI命令提示管理器

  @Autowired(ILoggerManagerClient) // 自动注入日志管理客户端
  private readonly loggerManagerClient: ILoggerManagerClient; // 日志管理客户端

  @Autowired(PreferenceService) // 自动注入偏好设置服务
  preferenceService: PreferenceService; // 偏好设置服务

  protected logger: ILogServiceClient; // 日志服务客户端
  private findCommandRequestErrorCode = 0; // 用于记录查找命令时的错误代码

  constructor() {
    this.logger = this.loggerManagerClient.getLogger(SupportLogNamespace.Browser); // 初始化日志服务
  }

  /**
   * 向AI模型发送请求以获取响应。
   * 
   * 🔧 参数说明：
   * - prompt: string - 要发送的提示信息。
   * 
   * 🚀 返回值说明：
   * - Promise<IAIBackServiceResponse<IAIBackServiceOption & { maxTokens: number }>> - AI模型的响应。
   */
  async requestToModel(prompt: string) {
    return this.aiBackService.request<IAIBackServiceOption & { maxTokens: number }>(prompt, { maxTokens: 2000 });
  }

  /**
   * 分类命令，识别未分组的命令并请求AI进行分类。
   * 
   * 🚀 返回值说明：
   * - Promise<void> - 无返回值，异步执行。
   */
  async classifyCommand() {
    const allCommand = this.commandRegistryService
      .getCommands()
      .filter((command) => command.labelLocalized?.localized || command.label); // 获取所有命令并过滤

    const innerCommands = Object.keys(this.commandGroups).reduce(
      (array, curGroup) => array.concat(this.commandGroups[curGroup]),
      [] as string[],
    ); // 获取所有内部命令

    const unGroupCommands = differenceWith(
      allCommand,
      innerCommands,
      (command, innerCommand) => command.id === innerCommand,
    ); // 找到未分组的命令

    if (unGroupCommands.length) {
      const partCommands = Array.from(
        { length: Math.round(unGroupCommands.length / this.commandRequestStep) || 1 },
        (_, index) => index,
      ).map((i) => unGroupCommands.slice(i * this.commandRequestStep, (i + 1) * this.commandRequestStep)); // 将未分组命令分块

      for (const commands of partCommands) {
        await this.requestForClassifyCommand(commands); // 请求分类
      }
    }
  }

  /**
   * 一次性分类命令，确保只执行一次分类操作。
   * 
   * 🚀 返回值说明：
   * - Promise<Deferred<void>> - 返回一个Deferred对象。
   */
  async classifyCommandOnce() {
    if (!this.classifyCommandDeferred) {
      this.classifyCommandDeferred = new Deferred(); // 初始化Deferred对象
      try {
        await this.classifyCommand(); // 执行分类命令
      } finally {
        this.classifyCommandDeferred.resolve(); // 解析Deferred对象
      }
    }
    return this.classifyCommandDeferred; // 返回Deferred对象
  }

  /**
   * 请求AI对给定命令进行分类。
   * 
   * 🔧 参数说明：
   * - commands: Command[] - 要分类的命令数组。
   * 
   * 🚀 返回值说明：
   * - Promise<void> - 无返回值，异步执行。
   */
  async requestForClassifyCommand(commands: Command[]) {
    const prompt = this.promptManager.groupCommand(commands.map((c) => c.id).join(',')); // 生成分组命令的提示
    const groupReply = await this.requestToModel(prompt); // 请求AI模型

    const groupReg = new RegExp(
      `\\[(?<groupName>${Object.keys(this.commandGroups).join('|')})\\]:\\s?(?<commandList>.*)`,
    ); // 正则表达式用于匹配命令组

    const groupArray = groupReply.data?.split('\n') || []; // 分割AI返回的命令组
    groupArray.forEach((groupLine) => {
      const match = groupReg.exec(groupLine); // 匹配命令组
      if (match && match.groups?.commandList) {
        const { groupName, commandList } = match.groups || {};
        const commandArray = commandList.split(','); // 分割命令列表
        this.commandGroups[groupName] = this.commandGroups[groupName]
          ? this.commandGroups[groupName].concat(commandArray) // 合并命令
          : commandArray; // 初始化命令组
      }
    });
  }

  /**
   * 根据用户输入获取AI模型的响应。
   * 
   * 🔧 参数说明：
   * - input: string - 用户输入的命令。
   * 
   * 🚀 返回值说明：
   * - Promise<IAIBackServiceResponse<ISumiModelResp>> - AI模型的响应。
   */
  public async getModelResp(input: string): Promise<IAIBackServiceResponse<ISumiModelResp>> {
    const inputMatchedCommand = this.searchWithoutAI(input); // 直接匹配输入的命令

    if (inputMatchedCommand) {
      const { labelLocalized, label, id } = inputMatchedCommand;

      return {
        data: {
          type: 'command',
          commandKey: id,
          answer: `已在系统内找到适合功能: ${labelLocalized?.localized || label}，您可以使用 (\`${id}\`) 命令`,
        },
      };
    }

    await this.classifyCommandOnce(); // 确保命令已分类

    const modelReply = await this.searchCommand(input); // 搜索命令
    if (modelReply.errorCode || !modelReply.data) {
      this.logger.error('[agent] IDE agent failed: ', modelReply.errorCode); // 记录错误

      if (!modelReply.errorMsg) {
        modelReply.errorMsg = 'AI 模型调用失败'; // 设置默认错误信息
      }

      return {
        ...modelReply,
        data: {
          type: 'null',
          answer: modelReply.errorMsg,
        },
      };
    }

    const { data } = modelReply;
    
    let sumiData: ISumiModelResp = { type: 'null', answer: data.label! };

    if (data.id) {
      if (this.commandRegistryService.getCommand(data.id)) {
        sumiData = {
          type: 'command',
          commandKey: data.id,
          answer: `您可以执行 (\`${data.id}\`) 命令：${data.label}`,
        };
      }

      if ((this.preferenceService as any).has(data.id)) {
        sumiData = {
          type: 'setting',
          settingKey: data.id,
          answer: `您可以通过 ${data.id} 配置`,
        };
      }
    }

    return { ...modelReply, data: sumiData }; // 返回AI模型的响应
  }

  /**
   * 根据用户输入搜索命令。
   * 
   * 🔧 参数说明：
   * - input: string - 用户输入的命令。
   * 
   * 🚀 返回值说明：
   * - Promise<IAIBackServiceResponse<Command>> - AI模型的响应。
   */
  public async searchCommand(input: string): Promise<IAIBackServiceResponse<Command>> {
    this.findCommandRequestErrorCode = 0; // 重置错误代码

    const command = this.searchWithoutAI(input); // 搜索未使用AI的命令
    if (command) {
      return { data: command }; // 返回找到的命令
    }

    try {
      return this.searchGroup(input); // 搜索命令组
    } catch {
      return { errorCode: 1 }; // 返回错误代码
    }
  }

  /**
   * 在命令注册服务中查找与输入匹配的命令。
   * 
   * 🔧 参数说明：
   * - input: string - 用户输入的命令。
   * 
   * 🚀 返回值说明：
   * - Command | undefined - 返回找到的命令或未定义。
   */
  private searchWithoutAI(input: string) {
    return this.commandRegistryService
      .getCommands()
      .find((command) => command.labelLocalized?.localized === input || command.label === input); // 查找匹配的命令
  }

  /**
   * 根据用户输入搜索命令组。
   * 
   * 🔧 参数说明：
   * - input: string - 用户输入的命令。
   * 
   * 🚀 返回值说明：
   * - Promise<IAIBackServiceResponse<Command>> - AI模型的响应。
   */
  public async searchGroup(input: string) {
    const enPrompt = this.promptManager.searchGroup(input, { useCot: true }); // 生成搜索组的提示

    const groupReply = await this.requestToModel(enPrompt); // 请求AI模型

    if (groupReply?.errorCode) {
      return { errorCode: groupReply.errorCode, errorMsg: groupReply.errorMsg }; // 返回错误信息
    }

    const groups = Object.keys(this.commandGroups); // 获取命令组
    const groupReg = new RegExp(`(?<group>${groups.join('|')})`); // 正则表达式匹配命令组
    const match = groupReg.exec(groupReply.data || ''); // 匹配命令组
    const group = match && match.groups?.group; // 获取匹配的组

    return this.findCommand(input, group); // 查找命令
  }

  /**
   * 查找指定组中的命令。
   * 
   * 🔧 参数说明：
   * - input: string - 用户输入的命令。
   * - group?: string | null - 可选的命令组。
   * 
   * 🚀 返回值说明：
   * - Promise<IAIBackServiceResponse<Command>> - AI模型的响应。
   */
  public async findCommand(input: string, group?: string | null): Promise<IAIBackServiceResponse<Command>> {
    const commandsInGroup = this.commandGroups[group || '']; // 获取指定组中的命令

    if (!commandsInGroup) {
      return { errorCode: 0 }; // 返回错误代码
    }

    const commands = this.commandRegistryService
      .getCommands()
      .filter((c) => commandsInGroup.includes(c.id) || (c.delegate && commandsInGroup.includes(c.delegate))); // 过滤命令

    const partCommands = Array.from(
      { length: Math.round(commands.length / this.commandRequestStep) },
      (_, index) => index,
    ).map((i) => commands.slice(i * this.commandRequestStep, (i + 1) * this.commandRequestStep)); // 将命令分块

    try {
      const command = await Promise.any(partCommands.map((c) => this.requestCommand(c, input))); // 请求命令

      return { data: commands.find((c) => c.id === command?.data) }; // 返回找到的命令
    } catch (e: any) {
      this.logger.error('Find command failed: ', e.message); // 记录错误
      return { errorCode: this.findCommandRequestErrorCode }; // 返回错误代码
    }
  }

  /**
   * 请求特定命令的响应。
   * 
   * 🔧 参数说明：
   * - commands: Command[] - 要请求的命令数组。
   * - question: string - 用户提问。
   * 
   * 🚀 返回值说明：
   * - Promise<{ data: string }> - 返回找到的命令。
   */
  private async requestCommand(commands: Command[], question: string) {
    const prompt = this.promptManager.findCommand({
      commands: commands.map((c) => `{${c.id}}-{${c.labelLocalized?.localized! || c.label || ''}}`).join('\n'), // 生成命令提示
      question,
    });

    const commandReply = await this.requestToModel(prompt); // 请求AI模型

    if (commandReply.errorCode) {
      this.findCommandRequestErrorCode = commandReply.errorCode; // 记录错误代码
    }

    const answerCommand = this.matchCommand(commandReply.data || ''); // 匹配命令

    if (answerCommand && commands.find((c) => c.id === answerCommand)) {
      return { data: answerCommand }; // 返回找到的命令
    }

    await Promise.reject('Command not found'); // 拒绝Promise
  }

  /**
   * 匹配AI模型返回的命令。
   * 
   * 🔧 参数说明：
   * - answer: string - AI模型的回答。
   * 
   * 🚀 返回值说明：
   * - string - 匹配到的命令。
   */
  private matchCommand(answer: string): string {
    const commandReg = /`(?<command>\S+)`/; // 正则表达式匹配命令
    const command = commandReg.exec(answer); // 执行匹配

    return command?.groups?.command || ''; // 返回匹配的命令
  }
}
