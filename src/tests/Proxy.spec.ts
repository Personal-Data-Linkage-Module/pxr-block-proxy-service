/** Copyright 2022 NEC Corporation
Released under the MIT license.
https://opensource.org/licenses/mit-license.php
*/
/* eslint-disable */
// スタブ構成用モジュールのインポート
import * as fs from 'fs';
// ポート管理するファイルを変更する
const beforeFileLines = fs.readFileSync('./config/port.json', { encoding: 'utf-8' });
const changeLines = fs.readFileSync('./src/tests/mocks.port.json', { encoding: 'utf-8' });
fs.writeFileSync('./config/port.json', changeLines);
// テスト用モジュールのインポート
import * as supertest from 'supertest';
import Application from '../index';
import {
    BinaryResponseService,
    StubService,
    StubAbnormalService,
    StubAccessControlService,
    StubOperatorService,
    StubCatalogService,
    StubReverseProxyAPI
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
let _fromServerBinary: BinaryResponseService;

// PXR-Block-Proxy Service APIのユニットテスト
describe('PXR-Block-Proxy Service API', () => {
    // テストを開始する前に実行する事前処理
    beforeAll(async () => {
        // ファイル変更後にアプリケーション起動
        Application.start();

        // 転送先・元のサービスを起動
        _fromServer = new StubService(3333, '/service-A');
        _toServer = new StubService(4444, '/service-B');
        _errorServer = new StubAbnormalService(5555, '/service-C');
        _mockAccessControl = new StubAccessControlService();
        _mockOperatorService = new StubOperatorService('8947a6a73a6c8f952fe73678d84c2684892921bbdbd3a10fe910a7a8d3bb5aa6');
        _mockCatalogService = new StubCatalogService();
        _mockReverseProxyAPI = new StubReverseProxyAPI();
        _fromServerBinary = new BinaryResponseService(3018, '/binary-manage/download/:id/:chunkNo');
    });
    // テストがすべて終了したら実行する事後処理
    afterAll(async () => {
        // アプリケーションの停止
        Application.stop();

        // モックサーバーの停止
        _errorServer.server.close();
        _fromServer.server.close();
        _toServer.server.close();
        _mockAccessControl.server.close();
        _mockOperatorService.server.close();
        _mockCatalogService.server.close();
        _mockReverseProxyAPI.server.close();
        _fromServerBinary.server.close();

        // 元のファイル状態に変更する
        fs.writeFileSync('./config/port.json', beforeFileLines);
    });

    // Proxy APIのテスト
    describe('プロキシーAPI (GET|POST|PUT|DELETE): ' + baseURI, () => {
        // クエリーパラメーターがない
        test('クエリーパラメーターがない', async () => {
            const response = await supertest(expressApp)
                .get(baseURI)
                .query({})
                .set({
                    'Content-Type': 'application/json',
                    accept: 'application/json'
                });

            // Expect status Bad Request
            expect(JSON.stringify(response.body)).toBe(JSON.stringify(
                {
                    status: 400,
                    reasons: [
                        { property: 'toPath', value: null, message: 'この値は必須値です' }
                    ]
                }
            ));
            expect(response.status).toBe(400);
        });

        // 数値ではない
        test('数値を期待するものに、文字列', async () => {
            const response = await supertest(expressApp)
                .get(baseURI)
                .query({
                    block: '3',
                    from_block: 'string', // 変換できず、エラー
                    path: 'notification',
                    from_path: 'operator'
                })
                .set({
                    'Content-Type': 'application/json',
                    accept: 'application/json'
                });

            // Expect status Bad Request
            expect(JSON.stringify(response.body)).toBe(JSON.stringify({
                status: 400,
                reasons: [{ property: 'fromBlock', value: 'string', message: '数値ではありません' }]
            }));
            expect(response.status).toBe(400);
        });

        // API PATHのフォーマットエラー
        test('URI PATHのフォーマットではない', async () => {
            const response = await supertest(expressApp)
                .get(baseURI)
                .query({
                    block: 3,
                    from_block: 5,
                    path: encodeURIComponent('/notification?query=test&query'),
                    from_path: encodeURIComponent('//') // フォーマットエラー
                })
                .set({
                    'Content-Type': 'application/json',
                    accept: 'application/json'
                });

            // Expect status Bad Request
            expect(JSON.stringify(response.body)).toBe(JSON.stringify(
                { status: 400, message: 'このサービスへのアクセスを拒否します' }
            ));
            expect(response.status).toBe(400);
        });

        // クエリーパラメーターがない
        test('クエリーパラメーターがない', async () => {
            const response = await supertest(expressApp)
                .post(baseURI)
                .query({})
                .set({
                    'Content-Type': 'application/json',
                    accept: 'application/json'
                });

            // Expect status Bad Request
            expect(JSON.stringify(response.body)).toBe(JSON.stringify(
                {
                    status: 400,
                    reasons: [
                        { property: 'toPath', value: null, message: 'この値は必須値です' }
                    ]
                }
            ));
            expect(response.status).toBe(400);
        });

        // 数値ではない
        test('数値を期待するものに、文字列', async () => {
            const response = await supertest(expressApp)
                .post(baseURI)
                .query({
                    block: '3',
                    from_block: 'string', // 変換できず、エラー
                    path: 'notification',
                    from_path: 'operator'
                })
                .set({
                    'Content-Type': 'application/json',
                    accept: 'application/json'
                });

            // Expect status Bad Request
            expect(JSON.stringify(response.body)).toBe(JSON.stringify(
                {
                    status: 400,
                    reasons: [{ property: 'fromBlock', value: 'string', message: '数値ではありません' }]
                }
            ));
            expect(response.status).toBe(400);
        });

        // API PATHのフォーマットエラー
        test('URI PATHのフォーマットではない', async () => {
            const response = await supertest(expressApp)
                .post(baseURI)
                .query({
                    block: 3,
                    from_block: 5,
                    path: encodeURIComponent('/notification?query=test&query'),
                    from_path: encodeURIComponent('//') // フォーマットエラー
                })
                .set({
                    'Content-Type': 'application/json',
                    accept: 'application/json'
                });

            // Expect status Bad Request
            expect(JSON.stringify(response.body)).toBe(JSON.stringify(
                { status: 400, message: 'このサービスへのアクセスを拒否します' }
            ));
            expect(response.status).toBe(400);
        });

        // クエリーパラメーターがない
        test('クエリーパラメーターがない', async () => {
            const response = await supertest(expressApp)
                .put(baseURI)
                .query({})
                .set({
                    'Content-Type': 'application/json',
                    accept: 'application/json'
                });

            // Expect status Bad Request
            expect(JSON.stringify(response.body)).toBe(JSON.stringify(
                {
                    status: 400,
                    reasons: [
                        { property: 'toPath', value: null, message: 'この値は必須値です' }
                    ]
                }
            ));
            expect(response.status).toBe(400);
        });

        // 必須値の内、いずれかが未指定
        test('必須値の指定漏れ', async () => {
            const response = await supertest(expressApp)
                .put(baseURI)
                .query({
                    block: 3,
                    from_block: 4,
                    // path: '/operator' // 指定漏れでエラー
                    from_path: 'notification'
                })
                .set({
                    'Content-Type': 'application/json',
                    accept: 'application/json'
                });

            // Expect status Bad Request
            expect(JSON.stringify(response.body)).toBe(JSON.stringify(
                {
                    status: 400,
                    reasons: [{ property: 'toPath', value: null, message: 'この値は必須値です' }]
                }
            ));
            expect(response.status).toBe(400);
        });

        // 数値ではない
        test('数値を期待するものに、文字列', async () => {
            const response = await supertest(expressApp)
                .put(baseURI)
                .query({
                    block: '3',
                    from_block: 'string', // 変換できず、エラー
                    path: 'notification',
                    from_path: 'operator'
                })
                .set({
                    'Content-Type': 'application/json',
                    accept: 'application/json'
                });

            // Expect status Bad Request
            expect(JSON.stringify(response.body)).toBe(JSON.stringify(
                {
                    status: 400,
                    reasons: [{ property: 'fromBlock', value: 'string', message: '数値ではありません' }]
                }
            ));
            expect(response.status).toBe(400);
        });

        // API PATHのフォーマットエラー
        test('URI PATHのフォーマットではない', async () => {
            const response = await supertest(expressApp)
                .put(baseURI)
                .query({
                    block: 3,
                    from_block: 5,
                    path: encodeURIComponent('//'), // フォーマットエラー
                    from_path: encodeURIComponent('/notification?query=test&query')
                })
                .set({
                    'Content-Type': 'application/json',
                    accept: 'application/json'
                });

            // Expect status Bad Request
            expect(JSON.stringify(response.body)).toBe(JSON.stringify(
                { status: 400, message: 'PATHのクエリーパラメーターがHTTP URLパス形式ではありません' }
            ));
            expect(response.status).toBe(400);
        });

        // クエリーパラメーターがない
        test('クエリーパラメーターがない', async () => {
            const response = await supertest(expressApp)
                .delete(baseURI)
                .query({})
                .set({
                    'Content-Type': 'application/json',
                    accept: 'application/json'
                });

            // Expect status Bad Request
            expect(JSON.stringify(response.body)).toBe(JSON.stringify(
                {
                    status: 400,
                    reasons: [
                        { property: 'toPath', value: null, message: 'この値は必須値です' }
                    ]
                }
            ));
            expect(response.status).toBe(400);
        });

        // 必須値の内、いずれかが未指定
        test('必須値の指定漏れ', async () => {
            const response = await supertest(expressApp)
                .delete(baseURI)
                .query({
                    // block: 3, // 指定漏れでエラー
                    from_block: 4,
                    path: '/operator',
                    from_path: 'notification'
                })
                .set({
                    'Content-Type': 'application/json',
                    accept: 'application/json'
                });

            // Expect status Bad Request
            expect(JSON.stringify(response.body)).toBe(JSON.stringify(
                {
                    status: 400,
                    message: 'このサービスへのアクセスを拒否します'
                }
            ));
            expect(response.status).toBe(400);
        });

        // 数値ではない
        test('数値を期待するものに、文字列', async () => {
            const response = await supertest(expressApp)
                .delete(baseURI)
                .query({
                    block: 'string', // 変換できず、エラー
                    from_block: '5',
                    path: 'notification',
                    from_path: 'operator'
                })
                .set({
                    'Content-Type': 'application/json',
                    accept: 'application/json'
                });

            // Expect status Bad Request
            expect(JSON.stringify(response.body)).toBe(JSON.stringify(
                {
                    status: 400,
                    reasons: [{ property: 'toBlock', value: 'string', message: '数値ではありません' }]
                }
            ));
            expect(response.status).toBe(400);
        });

        // API PATHのフォーマットエラー
        test('URI PATHのフォーマットではない', async () => {
            const response = await supertest(expressApp)
                .delete(baseURI)
                .query({
                    block: 3,
                    from_block: 5,
                    path: encodeURIComponent('//'), // フォーマットエラー
                    from_path: encodeURIComponent('/notification?query=test&query')
                })
                .set({
                    'Content-Type': 'application/json',
                    accept: 'application/json'
                });

            // Expect status Bad Request
            expect(JSON.stringify(response.body)).toBe(JSON.stringify(
                { status: 400, message: 'PATHのクエリーパラメーターがHTTP URLパス形式ではありません' }
            ));
            expect(response.status).toBe(400);
        });

        // カタログがブロックのものではない
        test('カタログがブロックのものではない', async () => {
            const response = await supertest(expressApp)
                .delete(baseURI)
                .set('Cookie', ['operator_type3_session=8947a6a73a6c8f952fe73678d84c2684892921bbdbd3a10fe910a7a8d3bb5aa6'])
                .query({
                    block: 123,
                    from_block: 3333333,
                    path: encodeURIComponent('/service-A'),
                    from_path: encodeURIComponent('/service-B')
                })
                .set({
                    'Content-Type': 'application/json',
                    accept: 'application/json'
                });

            // Expect status Success code.
            expect(JSON.stringify(response.body)).toBe(JSON.stringify({
                status: 400,
                message: 'リクエストされたカタログは、ブロックのものではありません（コード: 123）'
            }));
            expect(response.status).toBe(400);
        });

        // 正常系のGETプロキシー
        test('正常系: GET', async () => {
            const response = await supertest(expressApp)
                .get(baseURI)
                .set('Cookie', ['operator_type3_session=8947a6a73a6c8f952fe73678d84c2684892921bbdbd3a10fe910a7a8d3bb5aa6'])
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

            // Expect status Success code.
            expect(JSON.stringify(response.body)).toBe(JSON.stringify({}));
            expect(response.status).toBe(200);
        });

        // 正常系のGETプロキシー(access-tokenあり)、toPathが'/binary-manage/download/:id/:chunkNo'の形
        test('正常系: GET', async () => {
            const response = await supertest(expressApp)
                .get(baseURI)
                .set('Cookie', ['operator_type3_session=8947a6a73a6c8f952fe73678d84c2684892921bbdbd3a10fe910a7a8d3bb5aa6'])
                .query({
                    block: 5555555,
                    from_block: 3333333,
                    path: encodeURIComponent('/binary-manage/download/990e8400-e29b-41d4-a716-446655440000/1'),
                    from_path: encodeURIComponent('/service-B')
                })
                .set({
                    'Content-Type': 'application/json',
                    accept: 'application/json',
                    'access-token': 'Ky7JmhfZ'
                });

            // Expect status Success code.
            expect(Buffer.isBuffer(response.body)).toBe(true);
            expect(response.status).toBe(200);
        });

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
                    'Content-Type': 'application/json',
                    accept: 'application/json'
                })
                .set('Cookie', ['operator_type3_session=8947a6a73a6c8f952fe73678d84c2684892921bbdbd3a10fe910a7a8d3bb5aa6'])
                .send({
                    _code: [
                        {
                            _value: 1,
                            _ver: 2
                        },
                        {
                            _value: 2,
                            _ver: 1
                        }
                    ]
                });

            // Expect status Success code.
            expect(JSON.stringify(response.body)).toBe(JSON.stringify({}));
            expect(response.status).toBe(200);
        });

        // 正常系のPUTプロキシー
        test('正常系: PUT', async () => {
            const response = await supertest(expressApp)
                .put(baseURI)
                .set('Cookie', ['operator_type3_session=8947a6a73a6c8f952fe73678d84c2684892921bbdbd3a10fe910a7a8d3bb5aa6'])
                .query({
                    block: 5555555,
                    from_block: 3333333,
                    path: encodeURIComponent('/service-A'),
                    from_path: encodeURIComponent('/service-B')
                })
                .set({
                    'Content-Type': 'application/json',
                    accept: 'application/json'
                })
                .send({
                    _code: {
                        _value: 1,
                        _ver: 2
                    }
                });

            // Expect status Success code.
            expect(JSON.stringify(response.body)).toBe(JSON.stringify({}));
            expect(response.status).toBe(200);
        });

        // 正常系のDELETEプロキシー
        test('正常系: DELETE', async () => {
            const response = await supertest(expressApp)
                .delete(baseURI)
                .set('Cookie', ['operator_type3_session=8947a6a73a6c8f952fe73678d84c2684892921bbdbd3a10fe910a7a8d3bb5aa6'])
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

            // Expect status Success code.
            expect(JSON.stringify(response.body)).toBe(JSON.stringify({}));
            expect(response.status).toBe(200);
        });

        // 異常系のGETプロキシー（相手サービスにて処理に失敗）
        test('異常系: GET（相手サービスにて処理に失敗）', async () => {
            const response = await supertest(expressApp)
                .get(baseURI)
                .query({
                    block: 5555555,
                    from_block: 3333333,
                    path: encodeURIComponent('/service-C'),
                    from_path: encodeURIComponent('/service-A')
                })
                .set('Cookie', ['operator_type0_session' + '=cf930faf40d879b87a550d59f26fa4d5c788bb45fa9c94cee6c597608cb46acc'])
                .set({
                    'Content-Type': 'application/json',
                    accept: 'application/json'
                });

            // Expect status Internal code.
            expect(JSON.stringify(response.body)).toBe(JSON.stringify({}));
            expect(response.status).toBe(503);
        });

        // 異常系のPOSTプロキシー（相手サービスにて処理に失敗）
        test('異常系: POST（相手サービスにて処理に失敗）', async () => {
            const response = await supertest(expressApp)
                .post(baseURI)
                .query({
                    block: 5555555,
                    from_block: 3333333,
                    path: encodeURIComponent('/service-C'),
                    from_path: encodeURIComponent('/service-A')
                })
                .set('Cookie', ['operator_type0_session' + '=cf930faf40d879b87a550d59f26fa4d5c788bb45fa9c94cee6c597608cb46acc'])
                .set({
                    'Content-Type': 'application/json',
                    accept: 'application/json'
                });

            // Expect status Internal code.
            expect(JSON.stringify(response.body)).toBe(JSON.stringify({}));
            expect(response.status).toBe(503);
        });

        // 異常系のPUTプロキシー（相手サービスにて処理に失敗）
        test('異常系: PUT（相手サービスにて処理に失敗）', async () => {
            const response = await supertest(expressApp)
                .put(baseURI)
                .query({
                    block: 5555555,
                    from_block: 3333333,
                    path: encodeURIComponent('/service-C'),
                    from_path: encodeURIComponent('/service-A')
                })
                .set('Cookie', ['operator_type0_session' + '=cf930faf40d879b87a550d59f26fa4d5c788bb45fa9c94cee6c597608cb46acc'])
                .set({
                    'Content-Type': 'application/json',
                    accept: 'application/json'
                });

            // Expect status Internal code.
            expect(JSON.stringify(response.body)).toBe(JSON.stringify({}));
            expect(response.status).toBe(503);
        });

        // 異常系のDELETEプロキシー（相手サービスにて処理に失敗）
        test('異常系: DELETE（相手サービスにて処理に失敗）', async () => {
            const response = await supertest(expressApp)
                .delete(baseURI)
                .query({
                    block: 5555555,
                    from_block: 3333333,
                    path: encodeURIComponent('/service-C'),
                    from_path: encodeURIComponent('/service-A')
                })
                .set('Cookie', ['operator_type0_session' + '=cf930faf40d879b87a550d59f26fa4d5c788bb45fa9c94cee6c597608cb46acc'])
                .set({
                    'Content-Type': 'application/json',
                    accept: 'application/json'
                });

            // Expect status Internal code.
            expect(JSON.stringify(response.body)).toBe(JSON.stringify({}));
            expect(response.status).toBe(503);
        });

        // 異常系のGETプロキシー（起動していないサービス）
        test('異常系: GET（サービスが起動していない）', async () => {
            const response = await supertest(expressApp)
                .get(baseURI)
                .query({
                    block: 5555555,
                    from_block: 3333333,
                    path: encodeURIComponent('/service-D'),
                    from_path: encodeURIComponent('/service-A')
                })
                .set('Cookie', ['operator_type0_session' + '=cf930faf40d879b87a550d59f26fa4d5c788bb45fa9c94cee6c597608cb46acc'])
                .set({
                    'Content-Type': 'application/json',
                    accept: 'application/json'
                });

            // Expect status Notfound code.
            expect(JSON.stringify(response.body)).toBe(JSON.stringify({
                status: 500, message: '対象のサービスとの接続に失敗しました'
            }));
            expect(response.status).toBe(500);
        });

        // 異常系のPOSTプロキシー（起動していないサービス）
        test('異常系: POST（サービスが起動していない）', async () => {
            const response = await supertest(expressApp)
                .post(baseURI)
                .query({
                    block: 5555555,
                    from_block: 3333333,
                    path: encodeURIComponent('/service-D'),
                    from_path: encodeURIComponent('/service-A')
                })
                .set('Cookie', ['operator_type0_session' + '=cf930faf40d879b87a550d59f26fa4d5c788bb45fa9c94cee6c597608cb46acc'])
                .set({
                    'Content-Type': 'application/json',
                    accept: 'application/json'
                });

            // Expect status Notfound code.
            expect(JSON.stringify(response.body)).toBe(JSON.stringify({
                status: 500, message: '対象のサービスとの接続に失敗しました'
            }));
            expect(response.status).toBe(500);
        });

        // 異常系のPUTプロキシー（起動していないサービス）
        test('異常系: PUT（サービスが起動していない）', async () => {
            const response = await supertest(expressApp)
                .put(baseURI)
                .query({
                    block: 5555555,
                    from_block: 3333333,
                    path: encodeURIComponent('/service-D'),
                    from_path: encodeURIComponent('/service-A')
                })
                .set('Cookie', ['operator_type0_session' + '=cf930faf40d879b87a550d59f26fa4d5c788bb45fa9c94cee6c597608cb46acc'])
                .set({
                    'Content-Type': 'application/json',
                    accept: 'application/json'
                });

            // Expect status Notfound code.
            expect(JSON.stringify(response.body)).toBe(JSON.stringify({
                status: 500, message: '対象のサービスとの接続に失敗しました'
            }));
            expect(response.status).toBe(500);
        });

        // 異常系のDELETEプロキシー（起動していないサービス）
        test('異常系: DELETE（サービスが起動していない）', async () => {
            const response = await supertest(expressApp)
                .delete(baseURI)
                .set('Cookie', ['operator_type3_session=8947a6a73a6c8f952fe73678d84c2684892921bbdbd3a10fe910a7a8d3bb5aa6'])
                .query({
                    block: 5555555,
                    from_block: 3333333,
                    path: encodeURIComponent('/service-D'),
                    from_path: encodeURIComponent('/service-A')
                })
                .set({
                    'Content-Type': 'application/json',
                    accept: 'application/json'
                });

            // Expect status Notfound code.
            expect(JSON.stringify(response.body)).toBe(JSON.stringify({
                status: 500, message: '対象のサービスとの接続に失敗しました'
            }));
            expect(response.status).toBe(500);
        });

        // 異常系のGETプロキシー（存在しないサービス）
        test('異常系: GET（サービスが存在していない）', async () => {
            const response = await supertest(expressApp)
                .get(baseURI)
                .query({
                    block: 5555555,
                    from_block: 3333333,
                    path: encodeURIComponent('/service-F'),
                    from_path: encodeURIComponent('/service-A')
                })
                .set('Cookie', ['operator_type0_session' + '=cf930faf40d879b87a550d59f26fa4d5c788bb45fa9c94cee6c597608cb46acc'])
                .set({
                    'Content-Type': 'application/json',
                    accept: 'application/json'
                });

            // Expect status Bad request.
            expect(JSON.stringify(response.body)).toBe(JSON.stringify(
                { status: 400, message: 'このサービスへのアクセスを拒否します' }
            ));
            expect(response.status).toBe(400);
        });

        // 異常系のPOSTプロキシー（存在しないサービス）
        test('異常系: POST（サービスが存在していない）', async () => {
            const response = await supertest(expressApp)
                .post(baseURI)
                .query({
                    block: 5555555,
                    from_block: 3333333,
                    path: encodeURIComponent('/service-F'),
                    from_path: encodeURIComponent('/service-A')
                })
                .set('Cookie', ['operator_type0_session' + '=cf930faf40d879b87a550d59f26fa4d5c788bb45fa9c94cee6c597608cb46acc'])
                .set({
                    'Content-Type': 'application/json',
                    accept: 'application/json'
                });

            // Expect status Bad request.
            expect(JSON.stringify(response.body)).toBe(JSON.stringify(
                { status: 400, message: 'このサービスへのアクセスを拒否します' }
            ));
            expect(response.status).toBe(400);
        });

        // 異常系のPUTプロキシー（存在しないサービス）
        test('異常系: PUT（サービスが存在していない）', async () => {
            const response = await supertest(expressApp)
                .put(baseURI)
                .query({
                    block: 5555555,
                    from_block: 3333333,
                    path: encodeURIComponent('/service-F'),
                    from_path: encodeURIComponent('/service-A')
                })
                .set('Cookie', ['operator_type0_session' + '=cf930faf40d879b87a550d59f26fa4d5c788bb45fa9c94cee6c597608cb46acc'])
                .set({
                    'Content-Type': 'application/json',
                    accept: 'application/json'
                });

            // Expect status Bad request.
            expect(JSON.stringify(response.body)).toBe(JSON.stringify(
                { status: 400, message: 'このサービスへのアクセスを拒否します' }
            ));
            expect(response.status).toBe(400);
        });

        // 異常系のDELETEプロキシー（存在しないサービス）
        test('異常系: DELETE（サービスが存在していない）', async () => {
            const response = await supertest(expressApp)
                .delete(baseURI)
                .set('Cookie', ['operator_type0_session' + '=cf930faf40d879b87a550d59f26fa4d5c788bb45fa9c94cee6c597608cb46acc'])
                .query({
                    block: 5555555,
                    from_block: 3333333,
                    path: encodeURIComponent('/service-F'),
                    from_path: encodeURIComponent('/service-A')
                })
                .set({
                    'Content-Type': 'application/json',
                    accept: 'application/json'
                });

            // Expect status Bad request.
            expect(JSON.stringify(response.body)).toBe(JSON.stringify(
                { status: 400, message: 'このサービスへのアクセスを拒否します' }
            ));
            expect(response.status).toBe(400);
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
        _toServer = new StubService(4444, '/service-B');
        _errorServer = new StubAbnormalService(5555, '/service-C');
        _mockAccessControl = new StubAccessControlService();
        _mockOperatorService = new StubOperatorService('8947a6a73a6c8f952fe73678d84c2684892921bbdbd3a10fe910a7a8d3bb5aa7');
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
        _toServer.server.close();
        _mockAccessControl.server.close();
        _mockOperatorService.server.close();
        _mockCatalogService.server.close();
        _mockReverseProxyAPI.server.close();

        // 元のファイル状態に変更する
        fs.writeFileSync('./config/port.json', beforeFileLines);
    });
    // Proxy APIのテスト
    describe('プロキシーAPI (GET|POST|PUT|DELETE): ' + baseURI, () => {
        // 正常系のGETプロキシー
        test('正常系: GET(ロールなし)', async () => {
            const response = await supertest(expressApp)
                .get(baseURI)
                .set('Cookie', ['operator_type3_session=8947a6a73a6c8f952fe73678d84c2684892921bbdbd3a10fe910a7a8d3bb5aa7'])
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

            // Expect status Success code.
            expect(JSON.stringify(response.body)).toBe(JSON.stringify({}));
            expect(response.status).toBe(200);
        });
    });
});
