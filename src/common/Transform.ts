/** Copyright 2022 NEC Corporation
Released under the MIT license.
https://opensource.org/licenses/mit-license.php
*/
/* eslint-disable */
import moment = require('moment');
import config = require('config');
/* eslint-enable */

/**
 * 文字列であれば、true | falseの文字列か判別し、真偽値へ変換する
 * @param t ターゲット
 */
export function transformToBooleanFromString (t: any) {
    if (typeof t !== 'string' || !t) {
        return t;
    } else if (t.toLowerCase() === 'true') {
        return true;
    } else if (t.toLowerCase() === 'false') {
        return false;
    } else {
        return t;
    }
}

/**
 * 数値へ変換
 * @param t ターゲット
 */
export function transformToNumber (t: any) {
    const result = parseInt(t);
    if (isNaN(result)) {
        return t;
    }
    return result;
}

/**
 * 数値へ変換（宛先Blockコード専用
 * @param t ターゲット
 */
export function transformToNumberOnlyToBlock (t: any) {
    const result = parseInt(t);
    const isRoot = config.get('pxr-root.isString');
    if (t === isRoot) {
        return parseInt(config.get('pxr-root.blockCode'));
    }
    if (isNaN(result)) {
        return t;
    }
    return result;
}

export const DateFormatString = 'YYYY-MM-DD';
/**
 * 日付型への変換
 * @param t ターゲット
 */
export function transformToDate (t: any) {
    if (typeof t !== 'string' || !t) {
        return t;
    }
    const date = moment(t, DateFormatString, true);
    if (!date.isValid()) {
        return t;
    }
    return date.toDate();
}

export const DateTimeFormatString = 'YYYY-MM-DDTHH:mm:ss.SSS+09:00';
/**
 * 日時型への変換
 * @param t ターゲット
 */
export function transformToDateTime (t: any) {
    if (typeof t !== 'string' || !t) {
        return t;
    }
    const dateTime = moment(t, DateTimeFormatString, true);
    if (!dateTime.isValid()) {
        return t;
    }
    return dateTime.toDate();
}

/**
 * URIエンコードされていることを期待する文字列をデコード
 * @param t ターゲット
 */
export function transformToStringFromURIEncodedStr (t: any) {
    if (typeof t !== 'string' || !t) {
        return t;
    }
    return decodeURIComponent(t);
}
