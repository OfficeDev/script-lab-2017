import { Utilities } from '../helpers';
import { Storage } from '@microsoft/office-js-helpers';

export enum ContextType {
    Unknown,
    Excel,
    Word,
    PowerPoint,
    OneNote
}

export class ContextUtil {
    static get themeColor() {
        switch (ContextUtil.context) {
            case ContextType.Excel:
                return '#217346';
            case ContextType.Word:
                return '#2b579a';
            case ContextType.PowerPoint:
                return '#d04526';
            case ContextType.OneNote:
                return '#80397b';
            default:
                return '#0478d7';
        }
    }

    static get themeColorDarker() {
        switch (ContextUtil.context) {
            case ContextType.Excel:
                return '#164b2e';
            case ContextType.Word:
                return '#204072';
            case ContextType.PowerPoint:
                return '#a5371e';
            case ContextType.OneNote:
                return '#5d2959';
            default:
                return '#0360AF';
        }
    }

    static applyTheme() {
        $('body').removeClass('excel');
        $('body').removeClass('word');
        $('body').removeClass('powerpoint');
        $('body').removeClass('onenote');
        $('body').removeClass('generic');

        switch (ContextUtil.context) {
            case ContextType.Excel: $('body').addClass('excel'); break;
            case ContextType.Word: $('body').addClass('word'); break;
            case ContextType.PowerPoint: $('body').addClass('powerpoint'); break;
            case ContextType.OneNote: $('body').addClass('onenote'); break;

            default: $('body').addClass('generic'); break;
        }
    }
}