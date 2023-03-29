/** Copyright 2022 NEC Corporation
Released under the MIT license.
https://opensource.org/licenses/mit-license.php
*/
/* eslint-disable */
import CatalogDomain from '../../domains/CatalogDomain';
import ProxyLog from '../../repositories/postgres/ProxyLog';
/* eslint-enable */

/**
 * プロキシーサービス DTO
 */
export default class ProxyServiceDTO {
    /** 宛先API PATH */
    toPath: string;

    /** 宛先カタログ オブジェクト */
    toCatalog: CatalogDomain;

    /** 呼出元API PATH */
    fromPath: string;

    /** 呼出元カタログ オブジェクト */
    fromCatalog: CatalogDomain;

    /** HTTP Method */
    method: string;

    /** 保存するエンティティ */
    entity: ProxyLog;
}
