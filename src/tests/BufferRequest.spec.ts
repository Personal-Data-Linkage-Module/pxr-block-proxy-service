/** Copyright 2022 NEC Corporation
Released under the MIT license.
https://opensource.org/licenses/mit-license.php
*/
/* eslint-disable */
import fs = require('fs');
const beforeFileLines = fs.readFileSync('./config/port.json', { encoding: 'utf-8' });
const changeLines = fs.readFileSync('./src/tests/mocks.port.json', { encoding: 'utf-8' });
fs.writeFileSync('./config/port.json', changeLines);

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
    BinaryResponseService
} from './StubServer';
/* eslint-enable */

// テスト対象のインスタンス化と起動
const expressApp = Application.express.app;

// Unit対象のURL（ベース）
const baseURI = '/pxr-block-proxy/ind';

// 転送先・元のサービスを起動
const _fromServer = new BinaryResponseService(3333, '/service-A');
const _toServer = new StubService(4444, '/service-B');
const _mockAccessControl = new StubAccessControlService();
const _mockOperatorService = new StubOperatorService();
const _mockCatalogService = new StubCatalogService();

// PXR-Block-Proxy Service APIのユニットテスト
describe('PXR-Block-Proxy Service API', () => {
    // テストを開始する前に実行する事前処理
    beforeAll(async () => {
        // ファイル変更後にアプリケーション起動
        Application.start();
    });
    // テストがすべて終了したら実行する事後処理
    afterAll(async () => {
        // アプリケーションの停止
        Application.stop();

        // モックサーバーの停止
        _fromServer.server.close();
        _toServer.server.close();
        _mockAccessControl.server.close();
        _mockOperatorService.server.close();
        _mockCatalogService.server.close();
        fs.writeFileSync('./config/port.json', beforeFileLines);
    });

    // Proxy APIのテスト
    describe('プロキシーAPI (GET|POST|PUT|DELETE): ' + baseURI, () => {
        // 正常系のPOSTプロキシー
        test('正常系: POST', async () => {
            const response = await supertest(expressApp)
                .post(baseURI)
                .query({
                    block: 5555555,
                    from_block: 3333333,
                    path: encodeURIComponent('/service-A'),
                    from_path: encodeURIComponent('/service-B')
                })
                .set({
                    'Content-Type': 'application/octet-stream',
                    accept: 'application/octet-stream'
                })
                .set('Cookie', ['operator_type0_session=8947a6a73a6c8f952fe73678d84c2684892921bbdbd3a10fe910a7a8d3bb5aa5'])
                .buffer(true)
                .send(fs.readFileSync('./src/tests/binary/req1.jpg'));

            // Expect status Success code.
            expect(Buffer.isBuffer(response.body)).toBe(true);
            expect(response.status).toBe(200);
        });
    });
});
