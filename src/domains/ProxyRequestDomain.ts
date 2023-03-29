/** Copyright 2022 NEC Corporation
Released under the MIT license.
https://opensource.org/licenses/mit-license.php
*/
/* eslint-disable */
import request = require('request');
/* eslint-enable */

/**
 * プロキシーサービス連携内容ドメイン
 */
export default class ProxyRequestDomain {
    /** 呼び出し先Blockコード */
    toBlock?: number;

    /** 呼び出し先パス */
    toPath?: string;

    /** 呼び出し元Blockコード */
    fromBlock?: number;

    /** 呼び出し元パス */
    fromPath?: string;

    /** HTTP URIの初め */
    firstURI: string;

    /** リクエストオプション */
    options?: request.CoreOptions;
}
