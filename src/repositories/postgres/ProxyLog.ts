/** Copyright 2022 NEC Corporation
Released under the MIT license.
https://opensource.org/licenses/mit-license.php
*/
import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn
} from 'typeorm';

/**
 * プロキシーログ内容テーブル エンティティクラス
 */
@Entity('log_called_api')
export default class ProxyLog {
    /** ID */
    @PrimaryGeneratedColumn({ type: 'bigint' })
    readonly id: number;

    /** Proxy: 0, Reverse Proxy: 1 */
    @Column({ type: 'smallint' })
    type: number = 0;

    /** 実行HTTPメソッド */
    @Column({ type: 'varchar', length: 255, name: 'api_method', nullable: false })
    apiMethod: string = '';

    /** 呼出元Blockのカタログコード */
    @Column({ type: 'bigint', name: 'caller_block_catalog_code', nullable: false })
    callerBlockCatalogCode: number = 0;

    /** 呼出元Blockのカタログバージョン */
    @Column({ type: 'bigint', name: 'caller_block_catalog_version', nullable: false })
    callerBlockCatalogVersion: number = 0;

    /** 呼出元API URL */
    @Column({ type: 'varchar', length: '255', name: 'caller_api_url' })
    callerApiUrl: string = '';

    /** 宛先Blockのカタログコード */
    @Column({ type: 'bigint', name: 'destination_block_catalog_code', nullable: false })
    destinationBlockCatalogCode: number = 0;

    /** 宛先Blockのカタログバージョン */
    @Column({ type: 'bigint', name: 'destination_block_catalog_version', nullable: false })
    destinationBlockCatalogVersion: number = 0;

    /** 宛先API URL */
    @Column({ type: 'varchar', length: 255, name: 'destination_api_url', nullable: false })
    destinationApiUrl: string = '';

    /** 無効フラグ */
    @Column({ type: 'boolean', nullable: false, default: false, name: 'is_disabled' })
    isDisabled: boolean = false;

    /** 登録者 */
    @Column({ type: 'varchar', length: 255, nullable: false, name: 'created_by' })
    createdBy: string = '';

    /** 登録日時 */
    @CreateDateColumn({ type: 'timestamp without time zone', name: 'created_at' })
    readonly createdAt!: Date;

    /** 更新者 */
    @Column({ type: 'varchar', length: 255, nullable: false, name: 'updated_by' })
    updatedBy: string = '';

    /** 更新日時 */
    @UpdateDateColumn({ type: 'timestamp without time zone', name: 'updated_at', onUpdate: 'now()' })
    readonly updatedAt!: Date;
}
