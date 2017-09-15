// Whenever there is no localized translation, use the English version.
// Whenever this lines is not commented out, it means that there are
// still strings that need to be localized (just search for this function name).

import { getEnglishSubstitutesForNotYetTranslated } from './index';

export function getChineseSimplifiedStrings(): ServerStrings {
    const unexpectedError = '出现意外错误';

    return {
        error: '错误',
        unexpectedError: unexpectedError,
        invalidHost: '无效的主机',
        invalidId: '无效的ID',
        receivedInvalidAuthCode: '收到验证码无效',
        failedToAuthenticateUser: '无法验证用户身份',
        receivedInvalidSnippetData: '接收无效的代码片段数据',
        unrecognizedScriptLanguage: '无法识别的脚本语言',
        line: '线条',

        getLoadingSnippetSubtitle: (snippetName: string) => `加载 "${snippetName}"`,

        loadingSnippetDotDotDot: '加载代码片段...',

        getSyntaxErrorsTitle: (count: number) => (count === 1 ? '句法误差' : '句法误差'),

        getGoBackToEditor: (editorUrl: string) =>
            `欢迎到 Script Lab – 但您可能希望查看编辑器，而不是查看页面。 请返回到 ${editorUrl}`,

        createdWithScriptLab: 'Script Lab创造',

        scriptLabRunner: 'Script Lab 应用',
        versionInfo: '版本信息',

        manifestDefaults: {
            nameIfEmpty: '代码片段',
            descriptionIfEmpty: 'Script Lab创造'
        },

        run: '运行',
        runPageTitle: '运行代码片段',
        back: '返回',
        snippetNotTrusted: getEnglishSubstitutesForNotYetTranslated().snippetNotTrusted,
        trust: getEnglishSubstitutesForNotYetTranslated().trust,
        cancel: getEnglishSubstitutesForNotYetTranslated().cancel,
        switchToSnippet: `切换到您正在编辑的代码段。`,
        snippetCodeChanged: '你改变在这段代码段。刷新此窗格运行新版本。',
        refresh: '刷新',
        dismiss: '解散',
        editingDifferentSnippet1: `您现在正在编辑一个不同的代码段`,
        editingDifferentSnippet2: `刷新此窗格以运行它`,
        loadLatestSnippet: '下载最新代码段',

        RuntimeHelpers: {
            unexpectedError: unexpectedError,
            authenticationWasCancelledByTheUser: getEnglishSubstitutesForNotYetTranslated().RuntimeHelpers.authenticationWasCancelledByTheUser,
            officeVersionDoesNotSupportAuthentication: getEnglishSubstitutesForNotYetTranslated().RuntimeHelpers.officeVersionDoesNotSupportAuthentication
        }
    };
}
