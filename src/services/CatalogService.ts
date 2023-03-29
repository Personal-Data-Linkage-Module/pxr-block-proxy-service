/** Copyright 2022 NEC Corporation
Released under the MIT license.
https://opensource.org/licenses/mit-license.php
*/
/* eslint-disable */
import CatalogDomain from '../domains/CatalogDomain';
import config = require('config');
import { applicationLogger, systemLogger } from '../common/logging';
import { doGetRequest } from '../common/DoRequest';
import AppError from '../common/AppError';
import { sprintf } from 'sprintf-js';
import Config from '../common/Config';
import OperatorDomain from 'domains/OperatorDomain';
const Message = Config.ReadConfig('./config/message.json');
/* eslint-enable */

/**
 * カタログサービスとの連携クラス
 */
export default class CatalogService {
    /**
     * カタログコードから、カタログサービスよりカタログ情報を取得する
     * @param code カタログコード
     */
    public static async get (code: number, operator: OperatorDomain): Promise<CatalogDomain> {
        if (code === parseInt(config.get('pxr-root.blockCode'))) {
            const domain = new CatalogDomain();
            domain.domain = config.get('pxr-root.domain');
            domain.code = code;
            domain.version = 0;
            domain.blockName = config.get('pxr-root.name');
            domain.rawData = {
                template: {
                    'actor-type': 'pxr-root'
                }
            };
            return domain;
        }

        let url = config.get('catalogService.get') + '' + code;
        url = url.replace('{root_block}', config.get('pxr-root.blockCode'));

        try {
            const result = await doGetRequest(url, {
                headers: {
                    session: operator.encoded,
                    accept: 'application/json'
                }
            });
            const { statusCode } = result.response;
            if (statusCode === 204 || statusCode === 400) {
                throw new AppError(sprintf(Message.NOT_EXISTS_CATALOG, code), 400);
            } else if (statusCode !== 200) {
                applicationLogger.info('statusCode: ' + statusCode);
                applicationLogger.info('url: ' + url);
                throw new AppError(Message.FAILED_CATALOG_SERVICE, 500);
            }
            const domain = CatalogDomain.parseRawData(result.body, code);
            return domain;
        } catch (err) {
            if (err instanceof AppError) {
                throw err;
            }
            throw new AppError(Message.FAILED_CONNECT_TO_CATALOG, 500, err);
        }
    }
}
