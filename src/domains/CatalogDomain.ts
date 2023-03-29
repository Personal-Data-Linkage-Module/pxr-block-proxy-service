/** Copyright 2022 NEC Corporation
Released under the MIT license.
https://opensource.org/licenses/mit-license.php
*/
/* eslint-disable */
import AppError from '../common/AppError';
import { sprintf } from 'sprintf-js';
import Config from '../common/Config';
const Message = Config.ReadConfig('./config/message.json');
/* eslint-enable */

/**
 * カタログ ドメインオブジェクト
 */
export default class CatalogDomain {
    /** Block名称 */
    blockName: string;

    /** カタログコード */
    code: number;

    /** カタログバージョン */
    version: number;

    /** ドメイン */
    domain: string;

    /** レスポンスデータ */
    rawData: any;

    /**
     * レスポンスをパース、自身を生成する
     * @param data カタログサービスからのレスポンス
     */
    static parseRawData (data: any, code: number): CatalogDomain {
        const { ns } = data.catalogItem;
        if (
            typeof ns !== 'string' ||
            !/^catalog\/ext\/[a-zA-Z_0-9.-]*\/block\/[/a-zA-Z_0-9.-]*$/.test(ns)
        ) {
            throw new AppError(sprintf(Message.IS_NOT_BLOCK_CATALOG, code), 400);
        }
        const domain = new CatalogDomain();
        domain.blockName = data.catalogItem.name;
        domain.code = data.template._code._value;
        domain.version = data.template._code._ver;
        domain.domain = data.template['service-name'];
        domain.rawData = data;
        return domain;
    }
}
