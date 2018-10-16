// Whenever there is no localized translation, use the English version.
// Whenever this lines is not commented out, it means that there are
// still strings that need to be localized (just search for this function name).
import { getEnglishSubstitutesForNotYetTranslated } from './index';

export function getChineseSimplifiedStrings(): ClientStringsPerLanguage {
  // NOTE: Be sure to modify in both client and server code when
  //  adding/changing the shared strings!
  const sharedBetweenServerAndClient = {
    playgroundName: 'Script Lab',
    playgroundTagline: '代码 ● 编写 ● 共享',

    unexpectedError: '出现意外错误',

    snippetNotTrusted: '这个代码段来源于外部。在运行它之前，您需要信任它。',
    trust: '信任',

    error: '错误',
    cancel: '取消',
    dismiss: '关闭',
    refresh: '刷新',
  };

  const { playgroundName } = sharedBetweenServerAndClient;

  return {
    // Environment names
    alpha: 'Alpha',
    beta: 'Beta',
    production: 'Production',
    staging: getEnglishSubstitutesForNotYetTranslated().staging,

    userId: '用户 ID',

    run: '运行',
    runInThisPane: '在当前窗格中运行',
    runSideBySide: '两个窗口同时运行',
    share: '共享',
    delete: '删除',
    close: '关闭',
    about: '关于',
    feedback: '反馈',
    errors: '错误',
    dismiss: '关闭',
    refresh: '刷新',
    trustSnippetQuestionMark: '信任代码段?',

    ok: getEnglishSubstitutesForNotYetTranslated().ok,
    logout: '退出',
    logoutFromGraph: getEnglishSubstitutesForNotYetTranslated().logoutFromGraph,
    cancel: '取消',
    save: '保存',
    moreInfo: '更多信息',
    import: '导入',
    snippetImportExistingButtonLabel: '跳转到已存在的代码段',
    overwriteExistingButtonLabel: '覆盖已存在的代码段',
    createNewCopyButtonLabel: '创建一个副本',
    editorTriggerSuggestContextMenuLabel: '引发建议',

    failedToLoadCodeSnippet: '导入代码段失败。',

    snippetGistIdDuplicationError: '已存在一个和要导入代码段相同Gist ID的代码段。您想跳转到已存在的代码段还是创建一个副本?',
    snippetImportError: '导入代码段失败',
    snippetImportErrorTitle: '导入失败',
    snippetImportErrorBody: `我们不能导入指定的代码段`,
    cannotOpenSnippet: '无法打开代码段',
    requestedSnippetNoLongerExists: '请求的代码段不存在',
    reloadPrompt: '刷新这个任务窗格，然后尝试其他URL或者ID。',

    cannotImportSnippetCreatedForDifferentHost: getEnglishSubstitutesForNotYetTranslated()
      .cannotImportSnippetCreatedForDifferentHost,
    currentHostDoesNotSupportRequiredApiSet: getEnglishSubstitutesForNotYetTranslated()
      .currentHostDoesNotSupportRequiredApiSet,

    snippetSaveError: '保存代码段失败',
    snippetDupeError: '复制代码段失败',
    snippetDeleteError: '删除代码段失败',
    snippetDeleteAllError: '删除所有本地代码段失败',
    snippetLoadAllError: '加载本地代码段失败',
    snippetRunError: '运行代码段失败',
    snippetLoadDefaultsError: '加载默认示例失败',
    snippetOpenInPlaygroundError: getEnglishSubstitutesForNotYetTranslated()
      .snippetOpenInPlaygroundError,

    snippetNoOfficeTitle: '代码段不能正常运行',
    snippetNoOfficeMessage:
      '只能在Office插件中运行office代码段。免费获取 Script Lab 登录网站 https://aka.ms/getscriptlab。',

    snippetUpdateError: '更新代码段失败',

    snippetValidationEmpty: `您的代码段不能是空的`,
    snippetValidationNoTitle: '您的代码段需要一个标题',

    defaultSnippetTitle: '新的代码段',
    newSnippetTitle: '空白的代码段' /* string gets modified at runtime */,

    //ui.ts strings:
    dialogError: '对话框中发生了一个错误',
    dialogOpenError: '一个对话框已经打开了',

    //monaco.ts strings:
    intellisenseUpdateError: '更新IntelliSense失败',
    intellisenseClearError: '消除IntelliSense失败',
    intellisenseLoadError: '加载IntelliSense文件失败',

    //github.ts strings:
    githubLoginFailed: '登录GitHub失败',
    githubLogoutFailed: '退出GitHub失败',
    profileCheckFailed: '获取GitHub信息失败',
    gistRetrieveFailed: '检索GitHub gists失败',
    gistDescriptionAppendage: `与${playgroundName}共享`,

    gistShareFailedBody: '与GitHub gist共享失败',
    gistShareFailedTitle: '共享失败',

    gistSharedDialogStart: '您的GitHub gist URL是:',
    gistSharedDialogEnd: `要导入代码段，请选择${playgroundName}导入按钮和输入URL。`,
    gistSharedDialogTitle: '共享您的代码段',
    gistSharedDialogViewButton: '在GitHub上查看',
    gistUpdateUrlIsSameAsBefore: '更新后的GIST的URL与以前相同:',
    gistUpdateSuccess: '代码段已成功更新',

    snippetCopiedConfirmation: `代码段已被复制到剪贴板`,
    snippetCopiedFailed: '代码段复制到剪贴板失败',

    snippetExportFailed: '导出代码段失败',
    snippetExportNotSupported:
      '此版本的Office还不支持代码段导出. 支持的平台包括Windows和Office Online。',

    // Components strings
    // about.ts
    // Syntax of {0}, {1}... is used for placeholders and should not be localized
    aboutStorage: '存储:',
    aboutSnippets: '本地的代码段',
    aboutIntellisense: 'IntelliSense',
    aboutCurrentEnvironment: '当前环境:',
    aboutSwitchEnvironment: '从 {0} 转换到 {1}:',
    changeEnvironmentConfirm:
      '您将更改Script Lab工作平台，在返回当前的工作平台之前，将无法访问您保存的本地代码段. 您确定要继续吗?',
    showExperimentationFlags: getEnglishSubstitutesForNotYetTranslated()
      .showExperimentationFlags,
    invalidExperimentationFlags: getEnglishSubstitutesForNotYetTranslated()
      .invalidExperimentationFlags,

    //snippet.info.ts
    snippetInfoDialogTitle: '信息',
    nameLabel: '名称',
    descriptionLabel: '描述',
    namePlaceholder: '代码段名称',
    descriptionPlaceholder: '代码段描述',
    gistUrlLabel: 'Gist URL',
    gistUrlLinkLabel: '在浏览器中打开',

    // Containers strings
    //app.ts

    shareMenuPublic: '新的公开gist',
    shareMenuPrivate: '新的私有gist',
    updateMenu: '更新现存的gist',
    sharePublicSnippetConfirm: '您确定要将此代码段作为新的公开gist进行共享吗?',
    sharePrivateSnippetConfirm: '您确定要此代码段作为新的私有gist进行共享吗?',

    shareMenuClipboard: '复制到剪贴板',
    shareMenuExport: '导出并发布',

    loginGithub: '登录到GitHub',

    lightTheme: '浅色荧幕',
    darkTheme: '深色荧幕',

    deleteSnippetConfirm: '您确定要删除这段代码段吗?',

    tabDisplayNames: {
      script: '脚本',
      template: 'HTML',
      /* Changed from "Template" to "HTML" in english; should we use 'HTML' or the original Chinese: //'样本' */
      style: '样式',
      libraries: '资源库',
      customFunctions: getEnglishSubstitutesForNotYetTranslated().tabDisplayNames
        .customFunctions,
    },

    registerCustomFunctions: getEnglishSubstitutesForNotYetTranslated()
      .registerCustomFunctions,
    getTextForCustomFunctionsLastUpdated: getEnglishSubstitutesForNotYetTranslated()
      .getTextForCustomFunctionsLastUpdated,

    // Gallery.view strings

    snippetsTab: '代码段',
    samplesTab: '示例',

    noSnippetsMessage:
      '没有本地代码段. 您可以创建一个新的，选择一个示例，或从其他地方输入代码段。',
    noGistsMessage: `您还没有上传代码段到gist。创建或修改代码段后，可以选择共享上传它。`,

    newSnippetDescription: '创建新代码段',
    importDescription: '基于YAML或GitHub gist创建一个代码段',

    // view.mode.ts strings

    openInPlayground: '在Script Lab中打开',
    openInHost: getEnglishSubstitutesForNotYetTranslated().openInHost,
    openInGithub: '在GitHub中打开',
    downloadAsHostFile: getEnglishSubstitutesForNotYetTranslated().downloadAsHostFile,
    openTryIt: getEnglishSubstitutesForNotYetTranslated().openTryIt,

    // Outlook-only strings

    noRunInOutlook: getEnglishSubstitutesForNotYetTranslated().noRunInOutlook,

    // import.ts strings

    newSnippetLabel: '新的代码段',
    mySnippetsLabel: '我的代码段',
    samplesLabel: '示例',
    importLabel: '导入代码段',
    mySnippetsDescription: '选择您保存的代码段。',
    localSnippetsLabel: '我在这台电脑上的代码段',
    noLocalSnippets: `您在这个计算机上没有代码段。您可以创建一个新的代码段或导入代码段。`,
    sharedGistsLabel: '我在GitHub上共享的gists',
    sharedGistsSignIn: '登录以访问您在GitHub gists共享的代码段。',
    samplesDescription: '从下面的示例中选择一个。',
    noSamplesMessage: `这个主机还没有示例可供使用。`,
    importWarning: `导入的代码段可能包含恶意代码。除非您信任这些资源，否则不要运行代码段。`,
    importWarningAction: `不再显示这个警告。`,
    importSucceed: '代码段导入成功',

    localStorageWarning:
      `如果您清除浏览器缓存，则创建的代码段将被删除。 ` +
      `若要永久保存代码段，请从共享菜单中将它们导出为GIST。`,
    localStorageWarningAction: `不再显示这个警告。`,

    importInstructions: `在下方输入代码段的URL或粘贴YAML，然后选择`,
    importUrlOrYamlLabel: `代码段的URL或者YAML`,
    exampleAbbreviation: `例如`,

    pleaseWait: getEnglishSubstitutesForNotYetTranslated().pleaseWait,
    scriptLabIsReloading: getEnglishSubstitutesForNotYetTranslated().scriptLabIsReloading,

    Refresh: {
      /** Error if refresh URL is somehow misformed (should essentially never happen) */
      missingSnippetParameters: `配置问题阻止了代码段加载。`,

      /** Appends one of the following to the error message
       * (navigating back after a couple of seconds, if there is a return URL) */
      getTextToAppendToErrorMessage: (returnUrl: string) =>
        returnUrl ? '返回...' : '关闭此窗口再试一次。',
    },

    Runner: {
      snippetNoLongerExists: '该代码段不再存在。重新加载此页，或返回到以前的代码段。',

      reloadingOfficeJs: '重新加载 Office.js',

      noSnippetIsCurrentlyOpened: `编辑窗格中没有打开的代码段。`,

      getLoadingSnippetSubtitle: (snippetName?: string) => {
        return '加载 ' + (snippetName ? `"${snippetName}"` : '代码段');
      },

      runtimeErrorWhileLoadingTheSnippet: getEnglishSubstitutesForNotYetTranslated()
        .Runner.runtimeErrorWhileLoadingTheSnippet,
      goBackToEditorToFixError: getEnglishSubstitutesForNotYetTranslated().Runner
        .goBackToEditorToFixError,
    },

    /** Error strings served by the server and displayed in the Error page */
    ServerError: {
      moreDetails: '更多细节...',
      hideDetails: '隐藏细节...',
    },

    SideBySideInstructions: {
      title: '与编辑器并行运行',

      message: [
        '要与编辑器并排运行该代码段，在功能区中选择“运行”。',
        '',
        '运行并排提供更快的刷新和在编辑器中保留位置并撤消历史记录的额外优势。',
      ].join('\n'),

      gotIt: '了解',
    },

    HtmlPageStrings: {
      PageTitles: {
        code: '代码',
        run: '运行',
        tutorial: '教程',
      },

      chooseYourHost: '选择您的主机:',

      localStorageUnavailableMessage:
        '无法初始化Script Lab，因为浏览器的本地存储已禁用。 ' +
        ' 请尝试使用不同的浏览器或者电脑，或者检查您的网络设置。',

      loadingRunnerDotDotDot: '加载运行...',
      running: '运行',
      lastOpenedSnippet: '最后打开的代码段',
      noLastOpenedSnippets: '您没有最后打开的代码段。',
      toGetStartedCreateOrImportSnippet: '要开始，通过“代码”按钮创建或导入一个代码段。',
      mySavedSnippets: '我保存的代码段',
      noLocalSnippets: '没有本地代码段。',
      lastUpdated: '最新更新',
      clickToRefresh: '点击刷新',

      tutorialDescription: '这个Excel文件向您展示了如何在几个简单的步骤中使用Script Lab:',
      download: '下载',
      errorInitializingScriptLab: '初始化Script Lab时出错。',
    },

    Auth: {
      authenticatingOnBehalfOfSnippet: getEnglishSubstitutesForNotYetTranslated().Auth
        .authenticatingOnBehalfOfSnippet,
      loggingOutOnBehalfOfSnippet: getEnglishSubstitutesForNotYetTranslated().Auth
        .loggingOutOnBehalfOfSnippet,
      authenticationRedirect: getEnglishSubstitutesForNotYetTranslated().Auth
        .authenticationRedirect,
      authenticationError: getEnglishSubstitutesForNotYetTranslated().Auth
        .authenticationError,
      unrecognizedResource: getEnglishSubstitutesForNotYetTranslated().Auth
        .unrecognizedResource,
      invalidParametersPassedInForAuth: getEnglishSubstitutesForNotYetTranslated().Auth
        .invalidParametersPassedInForAuth,
      invalidAuthResponseReceived: getEnglishSubstitutesForNotYetTranslated().Auth
        .invalidAuthResponseReceived,
      yourAccessTokenIs: getEnglishSubstitutesForNotYetTranslated().Auth
        .yourAccessTokenIs,
    },

    ...sharedBetweenServerAndClient,
  };
}
