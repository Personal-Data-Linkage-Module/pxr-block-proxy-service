/** Copyright 2022 NEC Corporation
Released under the MIT license.
https://opensource.org/licenses/mit-license.php
*/
/* eslint-disable */
// テスト用モジュールのインポート
import * as supertest from 'supertest';
import Application from '../index';
import {
    StubService,
    StubAbnormalService,
    StubAccessControlService,
    StubOperatorService,
    StubCatalogService,
    StubReverseProxyAPI,
    StubCatalogServiceIsInferno
} from './StubServer';
/* eslint-enable */

// テスト対象のインスタンス化と起動
const expressApp = Application.express.app;

// Unit対象のURL（ベース）
const baseURI = '/pxr-block-proxy';

// 転送先・元のサービスの定義
let _fromServer: StubService;
let _toServer: StubService;
let _errorServer: StubAbnormalService;
let _mockAccessControl: StubAccessControlService;
let _mockOperatorService: StubOperatorService;
let _mockCatalogService: StubCatalogService;
let _mockReverseProxyAPI: StubReverseProxyAPI;

// PXR-Block-Proxy Service APIのユニットテスト
describe('PXR-Block-Proxy Service API', () => {
    // テストを開始する前に実行する事前処理
    beforeAll(async () => {
        // ファイル変更後にアプリケーション起動
        Application.start();

        // 転送先・元のサービスを起動
        _fromServer = new StubService(3333, '/service-A');
        _errorServer = new StubAbnormalService(5555, '/service-C');
        _mockAccessControl = new StubAccessControlService();
        _mockOperatorService = new StubOperatorService('8947a6a73a6c8f952fe73678d84c2684892921bbdbd3a10fe910a7a8d3bb5aa6');
        _mockCatalogService = new StubCatalogService();
        _mockReverseProxyAPI = new StubReverseProxyAPI();
    });
    // テストがすべて終了したら実行する事後処理
    afterAll(async () => {
        // アプリケーションの停止
        Application.stop();

        // モックサーバーの停止
        _errorServer.server.close();
        _fromServer.server.close();
        _mockAccessControl.server.close();
        _mockOperatorService.server.close();
        _mockCatalogService.server.close();
        _mockReverseProxyAPI.server.close();
    });

    // Proxy APIのテスト
    describe('プロキシーAPI (GET|POST|PUT|DELETE): ' + baseURI, () => {
        // 正常系: 自アクターのBlockへリクエスト
        test('正常系: 自アクターのBlockへリクエスト', async () => {
            _toServer = new StubService(3004, '/notification');
            const response = await supertest(expressApp)
                .get(baseURI)
                .set('Cookie', ['operator_type3_session=8947a6a73a6c8f952fe73678d84c2684892921bbdbd3a10fe910a7a8d3bb5aa6'])
                .query({
                    path: encodeURIComponent('/notification?is_send=false&is_unread=false&is_approval=false&type=1&num=0')
                })
                .set({
                    'Content-Type': 'application/json',
                    accept: 'application/json'
                });

            // Expect status Success code.
            expect(JSON.stringify(response.body)).toBe(JSON.stringify({}));
            expect(response.status).toBe(200);
            _toServer.server.close();
        });

        // 正常系: 自アクターのBlockへリクエスト
        test('正常系: 自アクターのBlockへリクエスト（パスの先頭に / がない場合）', async () => {
            _toServer = new StubService(3004, '/notification');
            const response = await supertest(expressApp)
                .get(baseURI)
                .set('Cookie', ['operator_type3_session=8947a6a73a6c8f952fe73678d84c2684892921bbdbd3a10fe910a7a8d3bb5aa6'])
                .query({
                    path: encodeURIComponent('notification?is_send=false&is_unread=false&is_approval=false&type=1&num=0')
                })
                .set({
                    'Content-Type': 'application/json',
                    accept: 'application/json'
                });

            // Expect status Success code.
            expect(JSON.stringify(response.body)).toBe(JSON.stringify({}));
            expect(response.status).toBe(200);
            _toServer.server.close();
        });

        // 正常系: pxr-rootへのBlockへリクエスト
        test('正常系: pxr-rootへのBlockへリクエスト', async () => {
            _toServer = new StubService(3005, '/book-manage');
            const response = await supertest(expressApp)
                .post(baseURI)
                .set('Cookie', ['operator_type3_session=8947a6a73a6c8f952fe73678d84c2684892921bbdbd3a10fe910a7a8d3bb5aa6'])
                .query({
                    block: 5555555,
                    path: encodeURIComponent('/book-manage')
                })
                .set({
                    'Content-Type': 'application/json',
                    accept: 'application/json'
                });

            // Expect status Success code.
            expect(JSON.stringify(response.body)).toBe(JSON.stringify({}));
            expect(response.status).toBe(200);
            _toServer.server.close();
        });

        // 正常系: pxr-rootへのBlockへリクエスト
        test('正常系: pxr-rootへのBlockへリクエスト（パスの先頭に / がない場合）', async () => {
            _toServer = new StubService(3005, '/book-manage');
            const response = await supertest(expressApp)
                .post(baseURI)
                .set('Cookie', ['operator_type3_session=8947a6a73a6c8f952fe73678d84c2684892921bbdbd3a10fe910a7a8d3bb5aa6'])
                .query({
                    from_block: 3333333,
                    from_path: encodeURIComponent('pxr-block-proxy'),
                    block: 5555555,
                    path: encodeURIComponent('book-manage')
                })
                .set({
                    'Content-Type': 'application/json',
                    accept: 'application/json'
                });

            // Expect status Success code.
            expect(JSON.stringify(response.body)).toBe(JSON.stringify({}));
            expect(response.status).toBe(200);
            _toServer.server.close();
        });
    });
});

// PXR-Block-Proxy Service APIのユニットテスト
describe('PXR-Block-Proxy Service API', () => {
    // テストを開始する前に実行する事前処理
    beforeAll(async () => {
        // ファイル変更後にアプリケーション起動
        Application.start();

        // 転送先・元のサービスを起動
        _fromServer = new StubService(3333, '/service-A');
        _errorServer = new StubAbnormalService(5555, '/service-C');
        _mockAccessControl = new StubAccessControlService();
        _mockOperatorService = new StubOperatorService('8947a6a73a6c8f952fe73678d84c2684892921bbdbd3a10fe910a7a8d3bb5aa6');
        _mockCatalogService = new StubCatalogServiceIsInferno();
        _mockReverseProxyAPI = new StubReverseProxyAPI();
    });
    // テストがすべて終了したら実行する事後処理
    afterAll(async () => {
        // アプリケーションの停止
        Application.stop();

        // モックサーバーの停止
        _errorServer.server.close();
        _fromServer.server.close();
        _mockAccessControl.server.close();
        _mockOperatorService.server.close();
        _mockCatalogService.server.close();
        _mockReverseProxyAPI.server.close();
    });

    // Proxy APIのテスト
    describe('プロキシーAPI (GET|POST|PUT|DELETE): ' + baseURI, () => {
        // 正常系: 自アクターのBlockへリクエスト
        test('異常系: 自アクターのBlockへリクエスト', async () => {
            const response = await supertest(expressApp)
                .get(baseURI)
                .set('Cookie', ['operator_type3_session=8947a6a73a6c8f952fe73678d84c2684892921bbdbd3a10fe910a7a8d3bb5aa6'])
                .query({
                    path: encodeURIComponent('/notification?is_send=false&is_unread=false&is_approval=false&type=1&num=0'),
                    block: 3333333
                })
                .set({
                    'Content-Type': 'application/json',
                    accept: 'application/json'
                });

            expect(JSON.stringify(response.body)).toBe(JSON.stringify({
                status: 500,
                message: '宛先ブロックのリバースプロキシーAPIの呼び出しに失敗しました'
            }));
            expect(response.status).toBe(500);
        });
    });
});
