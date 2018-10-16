// Whenever there is no localized translation, use the English version.
// Whenever this lines is not commented out, it means that there are
// still strings that need to be localized (just search for this function name).

import { getEnglishSubstitutesForNotYetTranslated } from './index';

export function getChineseSimplifiedStrings(): ServerStrings {
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

  return {
    invalidHost: '无效的主机',
    invalidId: '无效的ID',
    receivedInvalidAuthCode: '收到了无效的验证码',
    failedToAuthenticateUser: '无法验证用户身份',
    receivedInvalidSnippetData: '收到了无效的代码段数据',
    unrecognizedScriptLanguage: '无法识别的脚本语言',
    line: 'line',

    getLoadingSnippetSubtitle: (snippetName: string) => `加载 "${snippetName}"`,

    getSyntaxErrorsTitle: (count: number) => (count === 1 ? '语法错误' : '语法错误'),

    createdWithScriptLab: 'Script Lab创造',

    scriptLabRunner: 'Script Lab 应用',
    tryItPageTitle: getEnglishSubstitutesForNotYetTranslated().tryItPageTitle,

    versionInfo: '版本信息',

    manifestDefaults: {
      nameIfEmpty: '代码段',
      descriptionIfEmpty: 'Script Lab创造',
    },

    run: '运行',
    runPageTitle: '运行代码段',
    back: '返回',
    switchToSnippet: `切换到您正在编辑的代码段。`,
    snippetCodeChanged: '您修改了这个代码段的代码。刷新此窗格以运行新版本的代码。',
    editingDifferentSnippet1: `您正在编辑一个不同的代码段`,
    editingDifferentSnippet2: `刷新此窗格以运行它`,
    loadLatestSnippet: '下载最新代码段',
    registeringCustomFunctions: getEnglishSubstitutesForNotYetTranslated()
      .registeringCustomFunctions,

    RuntimeHelpers: {
      unexpectedError: sharedBetweenServerAndClient.unexpectedError,
      authenticationWasCancelledByTheUser: getEnglishSubstitutesForNotYetTranslated()
        .RuntimeHelpers.authenticationWasCancelledByTheUser,
      officeVersionDoesNotSupportAuthentication: getEnglishSubstitutesForNotYetTranslated()
        .RuntimeHelpers.officeVersionDoesNotSupportAuthentication,
    },

    ...sharedBetweenServerAndClient,
  };
}
