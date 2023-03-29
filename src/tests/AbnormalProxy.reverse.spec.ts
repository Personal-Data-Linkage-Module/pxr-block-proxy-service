/** Copyright 2022 NEC Corporation
Released under the MIT license.
https://opensource.org/licenses/mit-license.php
*/

/* eslint-disable */
import * as fs from 'fs';
// ポート管理するファイルを変更する
const beforeFileLines = fs.readFileSync('./config/port.json', { encoding: 'utf-8' });
const changeLines = fs.readFileSync('./src/tests/mocks.port.json', { encoding: 'utf-8' });
fs.writeFileSync('./config/port.json', changeLines);
// テスト用モジュールのインポート
import * as supertest from 'supertest';
import Application from '../index';
import { StubCatalogService, StubAccessControlService, StubOperatorService, StubService } from './StubServer';
/* eslint-enable */

const expressApp = Application.express.app;

// 転送先・元のサービスを起動
// const _fromServer = new StubService(3333, '/service-A');
const _toServer = new StubService(4444, '/service-B');
const _mockAccessControl = new StubAccessControlService();
const _mockOperatorService = new StubOperatorService();
const _mockCatalogService = new StubCatalogService();

// PXR-Block Proxy Service APIのAbnormal End ユニットテスト（相手先のプロキシーサービス）
describe('PXR-Block-Proxy Service Abnormal API', () => {
    const baseURI = '/pxr-block-proxy/ind';
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
        // _fromServer.server.close();
        _toServer.server.close();
        _mockAccessControl.server.close();
        _mockCatalogService.server.close();
        _mockOperatorService.server.close();

        // 元のファイル状態に変更する
        fs.writeFileSync('./config/port.json', beforeFileLines);
    });

    // Proxy APIのテスト（連携先Blockのプロキシーサービスがエラー）
    describe('プロキシーAPI (GET|POST|PUT|DELETE): ' + baseURI, () => {
        // 異常系（連携先APIが起動していない）
        test('異常系: GET（連携先BlockのリバースプロキシーAPIが起動していない）', async () => {
            const response = await supertest(expressApp)
                .get(baseURI)
                .set('Cookie', ['operator_type0_session=a'])
                .set({
                    accept: 'application/json'
                })
                .query({
                    block: 5555555,
                    from_block: 3333333,
                    path: encodeURIComponent('/service-A'),
                    from_path: encodeURIComponent('/service-B')
                });

            // Expect status Not found code.
            expect(JSON.stringify(response.body))
                .toBe(JSON.stringify({
                    status: 500, message: '対象のサービスとの接続に失敗しました'
                }));
            expect(response.status).toBe(500);
        });

        // 異常系（連携先APIが起動していない）
        test('異常系: POST（連携先BlockのリバースプロキシーAPIが起動していない', async () => {
            const response = await supertest(expressApp)
                .post(baseURI)
                .set('Cookie', ['operator_type0_session=a'])
                .query({
                    block: 5555555,
                    from_block: 3333333,
                    path: encodeURIComponent('/service-A'),
                    from_path: encodeURIComponent('/service-B')
                })
                .set({
                    'Content-Type': 'application/json',
                    accept: 'application/json'
                });

            // Expect status Not found code.
            expect(JSON.stringify(response.body))
                .toBe(JSON.stringify({
                    status: 500, message: '対象のサービスとの接続に失敗しました'
                }));
            expect(response.status).toBe(500);
        });

        // 異常系（連携先APIが起動していない）
        test('異常系: PUT（連携先BlockのリバースプロキシーAPIが起動していない', async () => {
            const response = await supertest(expressApp)
                .put(baseURI)
                .set('Cookie', ['operator_type0_session=a'])
                .query({
                    block: 5555555,
                    from_block: 3333333,
                    path: encodeURIComponent('/service-A'),
                    from_path: encodeURIComponent('/service-B')
                })
                .set({
                    'Content-Type': 'application/json',
                    accept: 'application/json'
                });

            // Expect status Not found code.
            expect(JSON.stringify(response.body))
                .toBe(JSON.stringify({
                    status: 500, message: '対象のサービスとの接続に失敗しました'
                }));
            expect(response.status).toBe(500);
        });

        // 異常系（連携先APIが起動していない）
        test('異常系: DELETE（連携先BlockのリバースプロキシーAPIが起動していない', async () => {
            const response = await supertest(expressApp)
                .delete(baseURI)
                .set('Cookie', ['operator_type0_session=a'])
                .query({
                    block: 5555555,
                    from_block: 3333333,
                    path: encodeURIComponent('/service-A'),
                    from_path: encodeURIComponent('/service-B')
                })
                .set({
                    'Content-Type': 'application/json',
                    accept: 'application/json'
                });

            // Expect status Not found code.
            expect(JSON.stringify(response.body))
                .toBe(JSON.stringify({
                    status: 500, message: '対象のサービスとの接続に失敗しました'
                }));
            expect(response.status).toBe(500);
        });
    });
});
