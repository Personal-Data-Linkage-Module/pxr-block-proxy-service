/** Copyright 2022 NEC Corporation
Released under the MIT license.
https://opensource.org/licenses/mit-license.php
*/
/* eslint-disable */
import * as fs from 'fs';
const beforeFileLines = fs.readFileSync('./config/port.json', { encoding: 'utf-8' });
const changeLines = fs.readFileSync('./src/tests/mocks.port.json', { encoding: 'utf-8' });
fs.writeFileSync('./config/port.json', changeLines);
import * as supertest from 'supertest';
import Application from '../index';
import { StubAccessControlServiceWithRejection, StubOperatorService, StubCatalogService } from './StubServer';
/* eslint-enable */

// テスト対象のインスタンス化と起動
const expressApp = Application.express.app;

// Unit対象のURL（ベース）
const baseURI = '/pxr-block-proxy/reverse';

// 連携サービスの起動
let stubAccessControlService: StubAccessControlServiceWithRejection;
const _mockCatalogService = new StubCatalogService();
const _mockOperatorService = new StubOperatorService();

// PXR-Block Proxy Service APIのAbnormal End ユニットテスト（トークン認証）
describe('PXR-Block-Proxy Service Abnormal API', () => {
    // テストを開始する前に実行する事前処理
    beforeAll(async () => {
        // ファイル変更後にアプリケーション起動
        Application.start();
    });
    // テストがすべて終了したら実行する事後処理
    afterAll(async () => {
        // アプリケーションの停止
        Application.stop();
        _mockCatalogService.server.close();
        _mockOperatorService.server.close();

        // 元のファイル状態に変更する
        fs.writeFileSync('./config/port.json', beforeFileLines);
    });

    // Reverse-Proxy APIのテスト
    describe('リバースプロキシーAPI: ' + baseURI, () => {
        beforeAll(async () => {
            stubAccessControlService = new StubAccessControlServiceWithRejection();
        });
        afterAll(async () => {
            stubAccessControlService.server.close();
        });
        // 異常系（内部エラー、DB接続エラー）
        test('異常系: GET（トークン認証失敗）', async () => {
            const response = await supertest(expressApp)
                .get(baseURI)
                .set('Cookie', ['operator_type0_session' + '=cf930faf40d879b87a550d59f26fa4d5c788bb45fa9c94cee6c597608cb46acc'])
                .set({
                    accept: 'application/json'
                })
                .query({
                    block: 5555555,
                    from_block: 3333333,
                    path: encodeURIComponent('/service-A'),
                    from_path: encodeURIComponent('/service-B')
                });

            // Expect status Internal error code.
            expect(JSON.stringify(response.body))
                .toBe(JSON.stringify(
                    { status: 400, message: 'APIトークンの認証に失敗しました' }
                ));
            expect(response.status).toBe(400);
        });
    });

    // Reverse-Proxy APIのテスト
    describe('リバースプロキシーAPI: ' + baseURI, () => {
        test('異常系: GET（アクセス制御サービスが起動していない）', async () => {
            const response = await supertest(expressApp)
                .get(baseURI)
                .set('Cookie', ['operator_type0_session' + '=cf930faf40d879b87a550d59f26fa4d5c788bb45fa9c94cee6c597608cb46acc'])
                .set({
                    accept: 'application/json'
                })
                .query({
                    block: 5555555,
                    from_block: 3333333,
                    path: encodeURIComponent('/service-A'),
                    from_path: encodeURIComponent('/service-B')
                });

            // Expect status Internal error code.
            expect(JSON.stringify(response.body))
                .toBe(JSON.stringify({
                    status: 500, message: 'アクセス制御サービスとの接続に失敗しました'
                }));
            expect(response.status).toBe(500);
        });
    });
});
