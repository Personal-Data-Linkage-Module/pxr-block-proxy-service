/** Copyright 2022 NEC Corporation
Released under the MIT license.
https://opensource.org/licenses/mit-license.php
*/
/* eslint-disable */
import { connectDatabase } from '../common/Connection';
import ProxyLog from './postgres/ProxyLog';
/* eslint-enable */

/**
 * 各エンティティ操作クラス
 */
export default class EntityOperation {
    /**
     * エンティティの登録|更新（共通）
     * @param entity
     */
    static async saveEntity (entity: ProxyLog): Promise<ProxyLog> {
        const connection = await connectDatabase();
        try {
            const repository = connection.getRepository(ProxyLog);
            const result = await repository.save(entity);
            return result;
        } finally {
        }
    }
}
