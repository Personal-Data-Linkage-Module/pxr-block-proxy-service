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
import { StubService, StubAbnormalService, StubAccessControlService, StubOperatorService, StubCatalogService, BookOperateResponseService } from './StubServer';

/* eslint-enable */

// テスト対象のインスタンス化と起動
const expressApp = Application.express.app;

// Unit対象のURL（ベース）
const baseURI = '/pxr-block-proxy/reverse';

// 転送先・元のサービスを起動
const _fromServer = new StubService(3333, '/service-A');
const _toServer = new StubService(4444, '/service-B');
const _errorServer = new StubAbnormalService(5555, '/service-C');
const _mockAccessControl = new StubAccessControlService();
const _mockOperatorService = new StubOperatorService();
const _mockCatalogService = new StubCatalogService();
const _mockBookOperateService = new BookOperateResponseService(3006, 0);

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
        _errorServer.server.close();
        _fromServer.server.close();
        _toServer.server.close();
        _mockAccessControl.server.close();
        _mockOperatorService.server.close();
        _mockCatalogService.server.close();
        if (_mockBookOperateService) {
            _mockBookOperateService.server.close();
        }

        // 元のファイル状態に変更する
        fs.writeFileSync('./config/port.json', beforeFileLines);
    });

    // Proxy Reverse APIのテスト
    describe('リバースプロキシーAPI (GET|POST|PUT|DELETE): ' + baseURI, () => {
        // クエリーパラメーターがない
        test('クエリーパラメーターがない', async () => {
            const response = await supertest(expressApp)
                .get(baseURI)
                .set('Cookie', ['operator_type0_session=8947a6a73a6c8f952fe73678d84c2684892921bbdbd3a10fe910a7a8d3bb5aa5'])
                .query({})
                .set({
                    'Content-Type': 'application/json',
                    accept: 'application/json'
                });

            // Expect status Bad Request
            expect(JSON.stringify(response.body)).toBe(JSON.stringify({
                status: 400,
                reasons: [
                    { property: 'toPath', value: null, message: 'この値は必須値です' }
                ]
            }));
            expect(response.status).toBe(400);
        });

        // 数値ではない
        test('数値を期待するものに、文字列', async () => {
            const response = await supertest(expressApp)
                .get(baseURI)
                .set('Cookie', ['operator_type0_session=8947a6a73a6c8f952fe73678d84c2684892921bbdbd3a10fe910a7a8d3bb5aa5'])
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
                .set('Cookie', ['operator_type0_session=8947a6a73a6c8f952fe73678d84c2684892921bbdbd3a10fe910a7a8d3bb5aa5'])
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
                .set('Cookie', ['operator_type0_session=8947a6a73a6c8f952fe73678d84c2684892921bbdbd3a10fe910a7a8d3bb5aa5'])
                .query({})
                .set({
                    'Content-Type': 'application/json',
                    accept: 'application/json'
                });

            // Expect status Bad Request
            expect(JSON.stringify(response.body)).toBe(JSON.stringify({
                status: 400,
                reasons: [
                    { property: 'toPath', value: null, message: 'この値は必須値です' }
                ]
            }));
            expect(response.status).toBe(400);
        });

        // 数値ではない
        test('数値を期待するものに、文字列', async () => {
            const response = await supertest(expressApp)
                .post(baseURI)
                .set('Cookie', ['operator_type0_session=8947a6a73a6c8f952fe73678d84c2684892921bbdbd3a10fe910a7a8d3bb5aa5'])
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
                .post(baseURI)
                .set('Cookie', ['operator_type0_session=8947a6a73a6c8f952fe73678d84c2684892921bbdbd3a10fe910a7a8d3bb5aa5'])
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
                .set('Cookie', ['operator_type0_session=8947a6a73a6c8f952fe73678d84c2684892921bbdbd3a10fe910a7a8d3bb5aa5'])
                .query({})
                .set({
                    'Content-Type': 'application/json',
                    accept: 'application/json'
                });

            // Expect status Bad Request
            expect(JSON.stringify(response.body)).toBe(JSON.stringify({
                status: 400,
                reasons: [
                    { property: 'toPath', value: null, message: 'この値は必須値です' }
                ]
            }));
            expect(response.status).toBe(400);
        });

        // 必須値の内、いずれかが未指定
        test('必須値の指定漏れ', async () => {
            const response = await supertest(expressApp)
                .put(baseURI)
                .set('Cookie', ['operator_type0_session=8947a6a73a6c8f952fe73678d84c2684892921bbdbd3a10fe910a7a8d3bb5aa5'])
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
            expect(JSON.stringify(response.body)).toBe(JSON.stringify({
                status: 400,
                reasons: [{ property: 'toPath', value: null, message: 'この値は必須値です' }]
            }));
            expect(response.status).toBe(400);
        });

        // 数値ではない
        test('数値を期待するものに、文字列', async () => {
            const response = await supertest(expressApp)
                .put(baseURI)
                .set('Cookie', ['operator_type0_session=8947a6a73a6c8f952fe73678d84c2684892921bbdbd3a10fe910a7a8d3bb5aa5'])
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
                .put(baseURI)
                .set('Cookie', ['operator_type0_session=8947a6a73a6c8f952fe73678d84c2684892921bbdbd3a10fe910a7a8d3bb5aa5'])
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
            expect(JSON.stringify(response.body)).toBe(JSON.stringify({ status: 400, message: 'PATHのクエリーパラメーターがHTTP URLパス形式ではありません' }));
            expect(response.status).toBe(400);
        });

        // クエリーパラメーターがない
        test('クエリーパラメーターがない', async () => {
            const response = await supertest(expressApp)
                .delete(baseURI)
                .set('Cookie', ['operator_type0_session=8947a6a73a6c8f952fe73678d84c2684892921bbdbd3a10fe910a7a8d3bb5aa5'])
                .query({})
                .set({
                    'Content-Type': 'application/json',
                    accept: 'application/json'
                });

            // Expect status Bad Request
            expect(JSON.stringify(response.body)).toBe(JSON.stringify({
                status: 400,
                reasons: [
                    { property: 'toPath', value: null, message: 'この値は必須値です' }
                ]
            }));
            expect(response.status).toBe(400);
        });

        // 必須値の内、いずれかが未指定
        test('必須値の指定漏れ', async () => {
            const response = await supertest(expressApp)
                .delete(baseURI)
                .set('Cookie', ['operator_type0_session=8947a6a73a6c8f952fe73678d84c2684892921bbdbd3a10fe910a7a8d3bb5aa5'])
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
            expect(JSON.stringify(response.body)).toBe(JSON.stringify({
                status: 400,
                message: 'このサービスへのアクセスを拒否します'
            }));
            expect(response.status).toBe(400);
        });

        // 数値ではない
        test('数値を期待するものに、文字列', async () => {
            const response = await supertest(expressApp)
                .delete(baseURI)
                .set('Cookie', ['operator_type0_session=8947a6a73a6c8f952fe73678d84c2684892921bbdbd3a10fe910a7a8d3bb5aa5'])
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
            expect(JSON.stringify(response.body)).toBe(JSON.stringify({
                status: 400,
                reasons: [{ property: 'toBlock', value: 'string', message: '数値ではありません' }]
            }));
            expect(response.status).toBe(400);
        });

        // API PATHのフォーマットエラー
        test('URI PATHのフォーマットではない', async () => {
            const response = await supertest(expressApp)
                .delete(baseURI)
                .set('Cookie', ['operator_type0_session=8947a6a73a6c8f952fe73678d84c2684892921bbdbd3a10fe910a7a8d3bb5aa5'])
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
            expect(JSON.stringify(response.body)).toBe(JSON.stringify({ status: 400, message: 'PATHのクエリーパラメーターがHTTP URLパス形式ではありません' }));
            expect(response.status).toBe(400);
        });

        // 正常系のGETリバースプロキシー
        test('正常系: GET', async () => {
            const response = await supertest(expressApp)
                .get(baseURI)
                .set('Cookie', ['operator_type0_session=8947a6a73a6c8f952fe73678d84c2684892921bbdbd3a10fe910a7a8d3bb5aa5'])
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

        // 正常系のPOSTリバースプロキシー
        test('正常系: POST', async () => {
            const response = await supertest(expressApp)
                .post(baseURI)
                .set('Cookie', ['operator_type0_session=8947a6a73a6c8f952fe73678d84c2684892921bbdbd3a10fe910a7a8d3bb5aa5'])
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

        // 正常系のPUTリバースプロキシー
        test('正常系: PUT', async () => {
            const response = await supertest(expressApp)
                .put(baseURI)
                .set('Cookie', ['operator_type0_session=8947a6a73a6c8f952fe73678d84c2684892921bbdbd3a10fe910a7a8d3bb5aa5'])
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

        // 正常系のDELETEリバースプロキシー
        test('正常系: DELETE', async () => {
            const response = await supertest(expressApp)
                .delete(baseURI)
                .set('Cookie', ['operator_type0_session=8947a6a73a6c8f952fe73678d84c2684892921bbdbd3a10fe910a7a8d3bb5aa5'])
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

        // 異常系のGETリバースプロキシー（相手サービスにて処理に失敗）
        test('異常系: GET（相手サービスにて処理に失敗）', async () => {
            const response = await supertest(expressApp)
                .get(baseURI)
                .set('Cookie', ['operator_type0_session=8947a6a73a6c8f952fe73678d84c2684892921bbdbd3a10fe910a7a8d3bb5aa5'])
                .query({
                    block: 5555555,
                    from_block: 3333333,
                    path: encodeURIComponent('/service-C'),
                    from_path: encodeURIComponent('/service-A')
                })
                .set({
                    'Content-Type': 'application/json',
                    accept: 'application/json'
                });

            // Expect status Internal code.
            expect(JSON.stringify(response.body)).toBe(JSON.stringify({}));
            expect(response.status).toBe(503);
        });

        // 異常系のPOSTリバースプロキシー（相手サービスにて処理に失敗）
        test('異常系: POST（相手サービスにて処理に失敗）', async () => {
            const response = await supertest(expressApp)
                .post(baseURI)
                .set('Cookie', ['operator_type0_session=8947a6a73a6c8f952fe73678d84c2684892921bbdbd3a10fe910a7a8d3bb5aa5'])
                .query({
                    block: 5555555,
                    from_block: 3333333,
                    path: encodeURIComponent('/service-C'),
                    from_path: encodeURIComponent('/service-A')
                })
                .set({
                    'Content-Type': 'application/json',
                    accept: 'application/json'
                });

            // Expect status Internal code.
            expect(JSON.stringify(response.body)).toBe(JSON.stringify({}));
            expect(response.status).toBe(503);
        });

        // 異常系のPUTリバースプロキシー（相手サービスにて処理に失敗）
        test('異常系: PUT（相手サービスにて処理に失敗）', async () => {
            const response = await supertest(expressApp)
                .put(baseURI)
                .set('Cookie', ['operator_type0_session=8947a6a73a6c8f952fe73678d84c2684892921bbdbd3a10fe910a7a8d3bb5aa5'])
                .query({
                    block: 5555555,
                    from_block: 3333333,
                    path: encodeURIComponent('/service-C'),
                    from_path: encodeURIComponent('/service-A')
                })
                .set({
                    'Content-Type': 'application/json',
                    accept: 'application/json'
                });

            // Expect status Internal code.
            expect(JSON.stringify(response.body)).toBe(JSON.stringify({}));
            expect(response.status).toBe(503);
        });

        // 異常系のDELETEリバースプロキシー（相手サービスにて処理に失敗）
        test('異常系: DELETE（相手サービスにて処理に失敗）', async () => {
            const response = await supertest(expressApp)
                .delete(baseURI)
                .set('Cookie', ['operator_type0_session=8947a6a73a6c8f952fe73678d84c2684892921bbdbd3a10fe910a7a8d3bb5aa5'])
                .query({
                    block: 5555555,
                    from_block: 3333333,
                    path: encodeURIComponent('/service-C'),
                    from_path: encodeURIComponent('/service-A')
                })
                .set({
                    'Content-Type': 'application/json',
                    accept: 'application/json'
                });

            // Expect status Internal code.
            expect(JSON.stringify(response.body)).toBe(JSON.stringify({}));
            expect(response.status).toBe(503);
        });

        // 異常系のGETリバースプロキシー（起動していないサービス）
        test('異常系: GET（サービスが起動していない）', async () => {
            const response = await supertest(expressApp)
                .get(baseURI)
                .set('Cookie', ['operator_type0_session=8947a6a73a6c8f952fe73678d84c2684892921bbdbd3a10fe910a7a8d3bb5aa5'])
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
            expect(JSON.stringify(response.body)).toBe(JSON.stringify(
                { status: 500, message: '対象のサービスとの接続に失敗しました' }
            ));
            expect(response.status).toBe(500);
        });

        // 異常系のPOSTリバースプロキシー（起動していないサービス）
        test('異常系: POST（サービスが起動していない）', async () => {
            const response = await supertest(expressApp)
                .post(baseURI)
                .set('Cookie', ['operator_type0_session=8947a6a73a6c8f952fe73678d84c2684892921bbdbd3a10fe910a7a8d3bb5aa5'])
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
            expect(JSON.stringify(response.body)).toBe(JSON.stringify(
                { status: 500, message: '対象のサービスとの接続に失敗しました' }
            ));
            expect(response.status).toBe(500);
        });

        // 異常系のPUTリバースプロキシー（起動していないサービス）
        test('異常系: PUT（サービスが起動していない）', async () => {
            const response = await supertest(expressApp)
                .put(baseURI)
                .set('Cookie', ['operator_type0_session=8947a6a73a6c8f952fe73678d84c2684892921bbdbd3a10fe910a7a8d3bb5aa5'])
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
            expect(JSON.stringify(response.body)).toBe(JSON.stringify(
                { status: 500, message: '対象のサービスとの接続に失敗しました' }
            ));
            expect(response.status).toBe(500);
        });

        // 異常系のDELETEリバースプロキシー（起動していないサービス）
        test('異常系: DELETE（サービスが起動していない）', async () => {
            const response = await supertest(expressApp)
                .delete(baseURI)
                .set('Cookie', ['operator_type0_session=8947a6a73a6c8f952fe73678d84c2684892921bbdbd3a10fe910a7a8d3bb5aa5'])
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
            expect(JSON.stringify(response.body)).toBe(JSON.stringify(
                { status: 500, message: '対象のサービスとの接続に失敗しました' }
            ));
            expect(response.status).toBe(500);
        });

        // 異常系のDELETEプロキシー（起動していないサービス）
        test('異常系: DELETE（サービスが起動していない）', async () => {
            const response = await supertest(expressApp)
                .delete(baseURI)
                .set('Cookie', ['operator_type0_session=8947a6a73a6c8f952fe73678d84c2684892921bbdbd3a10fe910a7a8d3bb5aa5'])
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
            expect(JSON.stringify(response.body)).toBe(JSON.stringify(
                { status: 500, message: '対象のサービスとの接続に失敗しました' }
            ));
            expect(response.status).toBe(500);
        });

        // 異常系のGETプロキシー（存在しないサービス）
        test('異常系: GET（サービスが存在していない）', async () => {
            const response = await supertest(expressApp)
                .get(baseURI)
                .set('Cookie', ['operator_type0_session=8947a6a73a6c8f952fe73678d84c2684892921bbdbd3a10fe910a7a8d3bb5aa5'])
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

        // 異常系のPOSTプロキシー（存在しないサービス）
        test('異常系: POST（サービスが存在していない）', async () => {
            const response = await supertest(expressApp)
                .post(baseURI)
                .set('Cookie', ['operator_type0_session=8947a6a73a6c8f952fe73678d84c2684892921bbdbd3a10fe910a7a8d3bb5aa5'])
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

        // 異常系のPUTプロキシー（存在しないサービス）
        test('異常系: PUT（サービスが存在していない）', async () => {
            const response = await supertest(expressApp)
                .put(baseURI)
                .set('Cookie', ['operator_type0_session=8947a6a73a6c8f952fe73678d84c2684892921bbdbd3a10fe910a7a8d3bb5aa5'])
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

        // 異常系のDELETEプロキシー（存在しないサービス）
        test('異常系: DELETE（サービスが存在していない）', async () => {
            const response = await supertest(expressApp)
                .delete(baseURI)
                .set('Cookie', ['operator_type0_session=8947a6a73a6c8f952fe73678d84c2684892921bbdbd3a10fe910a7a8d3bb5aa5'])
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
        // POSTリバースプロキシー(パラメータエンコード)
        test('正常系: POST', async () => {
            const response = await supertest(expressApp)
                .post(baseURI)
                .set('Cookie', ['operator_type0_session=8947a6a73a6c8f952fe73678d84c2684892921bbdbd3a10fe910a7a8d3bb5aa5'])
                .query({
                    block: 5555555,
                    from_block: 3333333,
                    path: encodeURIComponent('/service-A/proposal/attach/1486/画像データ１.jpeg'),
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
        // POSTリバースプロキシー(パラメータエンコード影響なし)
        test('正常系: POST', async () => {
            const response = await supertest(expressApp)
                .post(baseURI)
                .set('Cookie', ['operator_type0_session=8947a6a73a6c8f952fe73678d84c2684892921bbdbd3a10fe910a7a8d3bb5aa5'])
                .query({
                    block: 5555555,
                    from_block: 3333333,
                    path: encodeURIComponent('/service-A/proposal/attach/1486/image1.jpeg'),
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

        // POSTリバースプロキシー
        describe('SNS通知バグ対応追加ケース)', () => {
            // DoRequestメソッドのmock化
            const doRequet = require('../common/DoRequest');
            const mockDoPostRequest = jest.spyOn(doRequet, 'doPostRequest');
            const mockDoPutRequest = jest.spyOn(doRequet, 'doPutRequest');
            afterAll(async () => {
                mockDoPostRequest.mockRestore();
                mockDoPutRequest.mockRestore();
            });
            beforeEach(async () => {
                mockDoPostRequest.mockClear();
                mockDoPutRequest.mockClear();
            });
            test('正常系: POST 共有のレスポンスに共有が許可されていないドキュメントが含まれていた場合にフィルタされることの確認', async () => {
                const response = await supertest(expressApp)
                    .post(baseURI)
                    .set('Cookie', ['operator_type2_session=8947a6a73a6c8f952fe73678d84c2684892921bbdbd3a10fe910a7a8d3bb5aa5'])
                    .query({
                        block: 5555555,
                        from_block: 3333333,
                        path: encodeURIComponent('/book-operate/share/search'),
                        from_path: encodeURIComponent('/book-operate/share_1')
                    })
                    .set({
                        'Content-Type': 'application/json',
                        accept: 'application/json'
                    });
                // ドキュメントがフィルタされていることの確認
                expect(JSON.stringify(response.body)).toBe(JSON.stringify({
                    document: [],
                    event: [
                        {
                            id: {
                                index: '3_1_1',
                                value: 'doc01-eve01-8eb5-9b57-ac1980208f21'
                            },
                            code: {
                                index: '3_1_2',
                                value: {
                                    _value: 1000811,
                                    _ver: 1
                                }
                            },
                            start: {
                                index: '3_2_1',
                                value: '2020-02-20 00:00:00'
                            },
                            end: {
                                index: '3_2_2',
                                value: '2020-02-21 00:00:00'
                            },
                            location: {
                                index: '3_3_1',
                                value: 'location'
                            },
                            sourceId: '20200221-1',
                            env: null,
                            wf: null,
                            app: {
                                code: {
                                    index: '3_5_1',
                                    value: {
                                        _value: 1000438,
                                        _ver: 1
                                    }
                                },
                                app: {
                                    index: '3_5_5',
                                    value: {
                                        _value: 1000481,
                                        _ver: 1
                                    }
                                }
                            },
                            thing: [
                                {
                                    acquired_time: {
                                        index: '4_2_2_4',
                                        value: null
                                    },
                                    code: {
                                        index: '4_1_2',
                                        value: {
                                            _value: 1000814,
                                            _ver: 1
                                        }
                                    },
                                    env: null,
                                    sourceId: '20200221-1',
                                    id: {
                                        index: '4_1_1',
                                        value: 'doc01-eve01-thi01-c4e0-130b2788dcf4'
                                    },
                                    wf: null,
                                    app: {
                                        code: {
                                            index: '3_5_1',
                                            value: {
                                                _value: 1000438,
                                                _ver: 1
                                            }
                                        },
                                        app: {
                                            index: '3_5_5',
                                            value: {
                                                _value: 1000481,
                                                _ver: 1
                                            }
                                        }
                                    },
                                    'x-axis': {
                                        index: '4_2_2_1',
                                        value: null
                                    },
                                    'y-axis': {
                                        index: '4_2_2_2',
                                        value: null
                                    },
                                    'z-axis': {
                                        index: '4_2_2_3',
                                        value: null
                                    }
                                },
                                {
                                    acquired_time: {
                                        index: '4_2_2_4',
                                        value: null
                                    },
                                    code: {
                                        index: '4_1_2',
                                        value: {
                                            _value: 1000815,
                                            _ver: 1
                                        }
                                    },
                                    env: null,
                                    sourceId: '20200221-1',
                                    id: {
                                        index: '4_1_1',
                                        value: 'doc01-eve01-thi01-1171a3b52499'
                                    },
                                    wf: null,
                                    app: {
                                        code: {
                                            index: '3_5_1',
                                            value: {
                                                _value: 1000438,
                                                _ver: 1
                                            }
                                        },
                                        app: {
                                            index: '3_5_5',
                                            value: {
                                                _value: 1000481,
                                                _ver: 1
                                            }
                                        }
                                    },
                                    'x-axis': {
                                        index: '4_2_2_1',
                                        value: null
                                    },
                                    'y-axis': {
                                        index: '4_2_2_2',
                                        value: null
                                    },
                                    'z-axis': {
                                        index: '4_2_2_3',
                                        value: null
                                    }
                                }
                            ]
                        }
                    ],
                    thing: [
                        {
                            acquired_time: {
                                index: '4_2_2_4',
                                value: null
                            },
                            code: {
                                index: '4_1_2',
                                value: {
                                    _value: 1000818,
                                    _ver: 1
                                }
                            },
                            env: null,
                            sourceId: '20200221-1',
                            id: {
                                index: '4_1_1',
                                value: 'doc01-eve01-thi01-c4e0-130b2788dcf4'
                            },
                            wf: null,
                            app: {
                                code: {
                                    index: '3_5_1',
                                    value: {
                                        _value: 1000438,
                                        _ver: 1
                                    }
                                },
                                app: {
                                    index: '3_5_5',
                                    value: {
                                        _value: 1000481,
                                        _ver: 1
                                    }
                                }
                            },
                            'x-axis': {
                                index: '4_2_2_1',
                                value: null
                            },
                            'y-axis': {
                                index: '4_2_2_2',
                                value: null
                            },
                            'z-axis': {
                                index: '4_2_2_3',
                                value: null
                            }
                        }
                    ]
                }));
                expect(response.status).toBe(200);
            });

            test('正常系: POST 共有のレスポンスに共有が許可されていないイベントが含まれていた場合にフィルタされることの確認', async () => {
                const response = await supertest(expressApp)
                    .post(baseURI)
                    .set('Cookie', ['operator_type2_session=8947a6a73a6c8f952fe73678d84c2684892921bbdbd3a10fe910a7a8d3bb5aa5'])
                    .query({
                        block: 5555555,
                        from_block: 3333333,
                        path: encodeURIComponent('/book-operate/share/search'),
                        from_path: encodeURIComponent('/book-operate/share_2')
                    })
                    .set({
                        'Content-Type': 'application/json',
                        accept: 'application/json'
                    });
                // イベントがフィルタされていることの確認
                expect(JSON.stringify(response.body)).toBe(JSON.stringify({
                    document: [
                        {
                            id: {
                                index: '2_1_1',
                                value: 'doc01-89bb-f8f2-74a0-dc517da60653'
                            },
                            code: {
                                index: '2_1_2',
                                value: {
                                    _value: 1001010,
                                    _ver: 1
                                }
                            },
                            createdAt: {
                                index: '2_2_1',
                                value: '2020-02-20 00:00:00'
                            },
                            sourceId: '20200221-1',
                            wf: null,
                            app: {
                                code: {
                                    index: '2_3_1',
                                    value: {
                                        _value: 1000438,
                                        _ver: 1
                                    }
                                },
                                app: {
                                    index: '2_3_5',
                                    value: {
                                        _value: 1000481,
                                        _ver: 1
                                    }
                                },
                                staffId: {
                                    index: '2_3_4',
                                    value: 'staffId'
                                }
                            },
                            chapter: [
                                {
                                    title: 'タイトル１',
                                    event: [
                                        'doc01-eve01-8eb5-9b57-ac1980208f21',
                                        'doc01-eve02-e230-930c-c43d5050b9d3'
                                    ]
                                }
                            ]
                        }
                    ],
                    event: [],
                    thing: [
                        {
                            acquired_time: {
                                index: '4_2_2_4',
                                value: null
                            },
                            code: {
                                index: '4_1_2',
                                value: {
                                    _value: 1000818,
                                    _ver: 1
                                }
                            },
                            env: null,
                            sourceId: '20200221-1',
                            id: {
                                index: '4_1_1',
                                value: 'doc01-eve01-thi01-c4e0-130b2788dcf4'
                            },
                            wf: null,
                            app: {
                                code: {
                                    index: '3_5_1',
                                    value: {
                                        _value: 1000438,
                                        _ver: 1
                                    }
                                },
                                app: {
                                    index: '3_5_5',
                                    value: {
                                        _value: 1000481,
                                        _ver: 1
                                    }
                                }
                            },
                            'x-axis': {
                                index: '4_2_2_1',
                                value: null
                            },
                            'y-axis': {
                                index: '4_2_2_2',
                                value: null
                            },
                            'z-axis': {
                                index: '4_2_2_3',
                                value: null
                            }
                        }
                    ]
                }));
                expect(response.status).toBe(200);
            });

            test('正常系: POST 共有のレスポンスに共有が許可されていないモノが含まれていた場合にフィルタされることの確認', async () => {
                const response = await supertest(expressApp)
                    .post(baseURI)
                    .set('Cookie', ['operator_type2_session=8947a6a73a6c8f952fe73678d84c2684892921bbdbd3a10fe910a7a8d3bb5aa5'])
                    .query({
                        block: 5555555,
                        from_block: 3333333,
                        path: encodeURIComponent('/book-operate/share/search'),
                        from_path: encodeURIComponent('/book-operate/share_3')
                    })
                    .set({
                        'Content-Type': 'application/json',
                        accept: 'application/json'
                    });
                // モノがフィルタされていることの確認
                expect(JSON.stringify(response.body)).toBe(JSON.stringify({
                    document: [
                        {
                            id: {
                                index: '2_1_1',
                                value: 'doc01-89bb-f8f2-74a0-dc517da60653'
                            },
                            code: {
                                index: '2_1_2',
                                value: {
                                    _value: 1001010,
                                    _ver: 1
                                }
                            },
                            createdAt: {
                                index: '2_2_1',
                                value: '2020-02-20 00:00:00'
                            },
                            sourceId: '20200221-1',
                            wf: null,
                            app: {
                                code: {
                                    index: '2_3_1',
                                    value: {
                                        _value: 1000438,
                                        _ver: 1
                                    }
                                },
                                app: {
                                    index: '2_3_5',
                                    value: {
                                        _value: 1000481,
                                        _ver: 1
                                    }
                                },
                                staffId: {
                                    index: '2_3_4',
                                    value: 'staffId'
                                }
                            },
                            chapter: [
                                {
                                    title: 'タイトル１',
                                    event: [
                                        'doc01-eve01-8eb5-9b57-ac1980208f21',
                                        'doc01-eve02-e230-930c-c43d5050b9d3'
                                    ]
                                }
                            ]
                        }
                    ],
                    event: [
                        {
                            id: {
                                index: '3_1_1',
                                value: 'doc01-eve01-8eb5-9b57-ac1980208f21'
                            },
                            code: {
                                index: '3_1_2',
                                value: {
                                    _value: 1000811,
                                    _ver: 1
                                }
                            },
                            start: {
                                index: '3_2_1',
                                value: '2020-02-20 00:00:00'
                            },
                            end: {
                                index: '3_2_2',
                                value: '2020-02-21 00:00:00'
                            },
                            location: {
                                index: '3_3_1',
                                value: 'location'
                            },
                            sourceId: '20200221-1',
                            env: null,
                            wf: null,
                            app: {
                                code: {
                                    index: '3_5_1',
                                    value: {
                                        _value: 1000438,
                                        _ver: 1
                                    }
                                },
                                app: {
                                    index: '3_5_5',
                                    value: {
                                        _value: 1000481,
                                        _ver: 1
                                    }
                                }
                            },
                            thing: [
                                {
                                    acquired_time: {
                                        index: '4_2_2_4',
                                        value: null
                                    },
                                    code: {
                                        index: '4_1_2',
                                        value: {
                                            _value: 1000814,
                                            _ver: 1
                                        }
                                    },
                                    env: null,
                                    sourceId: '20200221-1',
                                    id: {
                                        index: '4_1_1',
                                        value: 'doc01-eve01-thi01-c4e0-130b2788dcf4'
                                    },
                                    wf: null,
                                    app: {
                                        code: {
                                            index: '3_5_1',
                                            value: {
                                                _value: 1000438,
                                                _ver: 1
                                            }
                                        },
                                        app: {
                                            index: '3_5_5',
                                            value: {
                                                _value: 1000481,
                                                _ver: 1
                                            }
                                        }
                                    },
                                    'x-axis': {
                                        index: '4_2_2_1',
                                        value: null
                                    },
                                    'y-axis': {
                                        index: '4_2_2_2',
                                        value: null
                                    },
                                    'z-axis': {
                                        index: '4_2_2_3',
                                        value: null
                                    }
                                },
                                {
                                    acquired_time: {
                                        index: '4_2_2_4',
                                        value: null
                                    },
                                    code: {
                                        index: '4_1_2',
                                        value: {
                                            _value: 1000815,
                                            _ver: 1
                                        }
                                    },
                                    env: null,
                                    sourceId: '20200221-1',
                                    id: {
                                        index: '4_1_1',
                                        value: 'doc01-eve01-thi01-1171a3b52499'
                                    },
                                    wf: null,
                                    app: {
                                        code: {
                                            index: '3_5_1',
                                            value: {
                                                _value: 1000438,
                                                _ver: 1
                                            }
                                        },
                                        app: {
                                            index: '3_5_5',
                                            value: {
                                                _value: 1000481,
                                                _ver: 1
                                            }
                                        }
                                    },
                                    'x-axis': {
                                        index: '4_2_2_1',
                                        value: null
                                    },
                                    'y-axis': {
                                        index: '4_2_2_2',
                                        value: null
                                    },
                                    'z-axis': {
                                        index: '4_2_2_3',
                                        value: null
                                    }
                                }
                            ]
                        }
                    ],
                    thing: []
                }));
                expect(response.status).toBe(200);
            });

            test('正常系: POST 共有のレスポンスのイベント配下に共有が許可されていないモノが含まれていた場合にフィルタされることの確認', async () => {
                const response = await supertest(expressApp)
                    .post(baseURI)
                    .set('Cookie', ['operator_type2_session=8947a6a73a6c8f952fe73678d84c2684892921bbdbd3a10fe910a7a8d3bb5aa5'])
                    .query({
                        block: 5555555,
                        from_block: 3333333,
                        path: encodeURIComponent('/book-operate/share/search'),
                        from_path: encodeURIComponent('/book-operate/share_4')
                    })
                    .set({
                        'Content-Type': 'application/json',
                        accept: 'application/json'
                    });
                // イベント配下のモノがフィルタされていることの確認
                expect(JSON.stringify(response.body)).toBe(JSON.stringify({
                    document: [
                        {
                            id: {
                                index: '2_1_1',
                                value: 'doc01-89bb-f8f2-74a0-dc517da60653'
                            },
                            code: {
                                index: '2_1_2',
                                value: {
                                    _value: 1001010,
                                    _ver: 1
                                }
                            },
                            createdAt: {
                                index: '2_2_1',
                                value: '2020-02-20 00:00:00'
                            },
                            sourceId: '20200221-1',
                            wf: null,
                            app: {
                                code: {
                                    index: '2_3_1',
                                    value: {
                                        _value: 1000438,
                                        _ver: 1
                                    }
                                },
                                app: {
                                    index: '2_3_5',
                                    value: {
                                        _value: 1000481,
                                        _ver: 1
                                    }
                                },
                                staffId: {
                                    index: '2_3_4',
                                    value: 'staffId'
                                }
                            },
                            chapter: [
                                {
                                    title: 'タイトル１',
                                    event: [
                                        'doc01-eve01-8eb5-9b57-ac1980208f21',
                                        'doc01-eve02-e230-930c-c43d5050b9d3'
                                    ]
                                }
                            ]
                        }
                    ],
                    event: [
                        {
                            id: {
                                index: '3_1_1',
                                value: 'doc01-eve01-8eb5-9b57-ac1980208f21'
                            },
                            code: {
                                index: '3_1_2',
                                value: {
                                    _value: 1000811,
                                    _ver: 1
                                }
                            },
                            start: {
                                index: '3_2_1',
                                value: '2020-02-20 00:00:00'
                            },
                            end: {
                                index: '3_2_2',
                                value: '2020-02-21 00:00:00'
                            },
                            location: {
                                index: '3_3_1',
                                value: 'location'
                            },
                            sourceId: '20200221-1',
                            env: null,
                            wf: null,
                            app: {
                                code: {
                                    index: '3_5_1',
                                    value: {
                                        _value: 1000438,
                                        _ver: 1
                                    }
                                },
                                app: {
                                    index: '3_5_5',
                                    value: {
                                        _value: 1000481,
                                        _ver: 1
                                    }
                                }
                            },
                            thing: [
                                {
                                    acquired_time: {
                                        index: '4_2_2_4',
                                        value: null
                                    },
                                    code: {
                                        index: '4_1_2',
                                        value: {
                                            _value: 1000814,
                                            _ver: 1
                                        }
                                    },
                                    env: null,
                                    sourceId: '20200221-1',
                                    id: {
                                        index: '4_1_1',
                                        value: 'doc01-eve01-thi01-c4e0-130b2788dcf4'
                                    },
                                    wf: null,
                                    app: {
                                        code: {
                                            index: '3_5_1',
                                            value: {
                                                _value: 1000438,
                                                _ver: 1
                                            }
                                        },
                                        app: {
                                            index: '3_5_5',
                                            value: {
                                                _value: 1000481,
                                                _ver: 1
                                            }
                                        }
                                    },
                                    'x-axis': {
                                        index: '4_2_2_1',
                                        value: null
                                    },
                                    'y-axis': {
                                        index: '4_2_2_2',
                                        value: null
                                    },
                                    'z-axis': {
                                        index: '4_2_2_3',
                                        value: null
                                    }
                                }
                            ]
                        }
                    ],
                    thing: [
                        {
                            acquired_time: {
                                index: '4_2_2_4',
                                value: null
                            },
                            code: {
                                index: '4_1_2',
                                value: {
                                    _value: 1000818,
                                    _ver: 1
                                }
                            },
                            env: null,
                            sourceId: '20200221-1',
                            id: {
                                index: '4_1_1',
                                value: 'doc01-eve01-thi01-c4e0-130b2788dcf4'
                            },
                            wf: null,
                            app: {
                                code: {
                                    index: '3_5_1',
                                    value: {
                                        _value: 1000438,
                                        _ver: 1
                                    }
                                },
                                app: {
                                    index: '3_5_5',
                                    value: {
                                        _value: 1000481,
                                        _ver: 1
                                    }
                                }
                            },
                            'x-axis': {
                                index: '4_2_2_1',
                                value: null
                            },
                            'y-axis': {
                                index: '4_2_2_2',
                                value: null
                            },
                            'z-axis': {
                                index: '4_2_2_3',
                                value: null
                            }
                        }
                    ]
                }));
                expect(response.status).toBe(200);
            });

            test('正常系: POST アクセス制御サービスから取得したフィルタ情報がJSON形式でない場合、フィルタされないことを確認', async () => {
                const response = await supertest(expressApp)
                    .post(baseURI)
                    .set('Cookie', ['operator_type2_session=8947a6a73a6c8f952fe73678d84c2684892921bbdbd3a10fe910a7a8d3bb5aa5'])
                    .query({
                        block: 5555555,
                        from_block: 3333333,
                        path: encodeURIComponent('/book-operate/share/search'),
                        from_path: encodeURIComponent('/book-operate/share_5')
                    })
                    .set({
                        'Content-Type': 'application/json',
                        accept: 'application/json'
                    });
                // イベント配下のモノがフィルタされていないことの確認
                expect(JSON.stringify(response.body)).toBe(JSON.stringify({
                    document: [
                        {
                            id: {
                                index: '2_1_1',
                                value: 'doc01-89bb-f8f2-74a0-dc517da60653'
                            },
                            code: {
                                index: '2_1_2',
                                value: {
                                    _value: 1001010,
                                    _ver: 1
                                }
                            },
                            createdAt: {
                                index: '2_2_1',
                                value: '2020-02-20 00:00:00'
                            },
                            sourceId: '20200221-1',
                            wf: null,
                            app: {
                                code: {
                                    index: '2_3_1',
                                    value: {
                                        _value: 1000438,
                                        _ver: 1
                                    }
                                },
                                app: {
                                    index: '2_3_5',
                                    value: {
                                        _value: 1000481,
                                        _ver: 1
                                    }
                                },
                                staffId: {
                                    index: '2_3_4',
                                    value: 'staffId'
                                }
                            },
                            chapter: [
                                {
                                    title: 'タイトル１',
                                    event: [
                                        'doc01-eve01-8eb5-9b57-ac1980208f21',
                                        'doc01-eve02-e230-930c-c43d5050b9d3'
                                    ]
                                }
                            ]
                        }
                    ],
                    event: [
                        {
                            id: {
                                index: '3_1_1',
                                value: 'doc01-eve01-8eb5-9b57-ac1980208f21'
                            },
                            code: {
                                index: '3_1_2',
                                value: {
                                    _value: 1000811,
                                    _ver: 1
                                }
                            },
                            start: {
                                index: '3_2_1',
                                value: '2020-02-20 00:00:00'
                            },
                            end: {
                                index: '3_2_2',
                                value: '2020-02-21 00:00:00'
                            },
                            location: {
                                index: '3_3_1',
                                value: 'location'
                            },
                            sourceId: '20200221-1',
                            env: null,
                            wf: null,
                            app: {
                                code: {
                                    index: '3_5_1',
                                    value: {
                                        _value: 1000438,
                                        _ver: 1
                                    }
                                },
                                app: {
                                    index: '3_5_5',
                                    value: {
                                        _value: 1000481,
                                        _ver: 1
                                    }
                                }
                            },
                            thing: [
                                {
                                    acquired_time: {
                                        index: '4_2_2_4',
                                        value: null
                                    },
                                    code: {
                                        index: '4_1_2',
                                        value: {
                                            _value: 1000814,
                                            _ver: 1
                                        }
                                    },
                                    env: null,
                                    sourceId: '20200221-1',
                                    id: {
                                        index: '4_1_1',
                                        value: 'doc01-eve01-thi01-c4e0-130b2788dcf4'
                                    },
                                    wf: null,
                                    app: {
                                        code: {
                                            index: '3_5_1',
                                            value: {
                                                _value: 1000438,
                                                _ver: 1
                                            }
                                        },
                                        app: {
                                            index: '3_5_5',
                                            value: {
                                                _value: 1000481,
                                                _ver: 1
                                            }
                                        }
                                    },
                                    'x-axis': {
                                        index: '4_2_2_1',
                                        value: null
                                    },
                                    'y-axis': {
                                        index: '4_2_2_2',
                                        value: null
                                    },
                                    'z-axis': {
                                        index: '4_2_2_3',
                                        value: null
                                    }
                                },
                                {
                                    acquired_time: {
                                        index: '4_2_2_4',
                                        value: null
                                    },
                                    code: {
                                        index: '4_1_2',
                                        value: {
                                            _value: 1000815,
                                            _ver: 1
                                        }
                                    },
                                    env: null,
                                    sourceId: '20200221-1',
                                    id: {
                                        index: '4_1_1',
                                        value: 'doc01-eve01-thi01-1171a3b52499'
                                    },
                                    wf: null,
                                    app: {
                                        code: {
                                            index: '3_5_1',
                                            value: {
                                                _value: 1000438,
                                                _ver: 1
                                            }
                                        },
                                        app: {
                                            index: '3_5_5',
                                            value: {
                                                _value: 1000481,
                                                _ver: 1
                                            }
                                        }
                                    },
                                    'x-axis': {
                                        index: '4_2_2_1',
                                        value: null
                                    },
                                    'y-axis': {
                                        index: '4_2_2_2',
                                        value: null
                                    },
                                    'z-axis': {
                                        index: '4_2_2_3',
                                        value: null
                                    }
                                }
                            ]
                        }
                    ],
                    thing: [
                        {
                            acquired_time: {
                                index: '4_2_2_4',
                                value: null
                            },
                            code: {
                                index: '4_1_2',
                                value: {
                                    _value: 1000818,
                                    _ver: 1
                                }
                            },
                            env: null,
                            sourceId: '20200221-1',
                            id: {
                                index: '4_1_1',
                                value: 'doc01-eve01-thi01-c4e0-130b2788dcf4'
                            },
                            wf: null,
                            app: {
                                code: {
                                    index: '3_5_1',
                                    value: {
                                        _value: 1000438,
                                        _ver: 1
                                    }
                                },
                                app: {
                                    index: '3_5_5',
                                    value: {
                                        _value: 1000481,
                                        _ver: 1
                                    }
                                }
                            },
                            'x-axis': {
                                index: '4_2_2_1',
                                value: null
                            },
                            'y-axis': {
                                index: '4_2_2_2',
                                value: null
                            },
                            'z-axis': {
                                index: '4_2_2_3',
                                value: null
                            }
                        }
                    ]
                }));
            });

            test('正常系: POST モノ一括蓄積のリクエストに蓄積が許可されていないデータ種が含まれる場合、リクエストのデータ種がフィルタされることを確認', async () => {
                const response = await supertest(expressApp)
                    .post(baseURI)
                    .set('Cookie', ['operator_type2_session=8947a6a73a6c8f952fe73678d84c2684892921bbdbd3a10fe910a7a8d3bb5aa5'])
                    .query({
                        block: 5555555,
                        from_block: 3333333,
                        path: encodeURIComponent('/book-operate/thing/bulk/test_user_id/event_identifier?allowPartialStore=true'),
                        from_path: encodeURIComponent('/book-operate/thing/bulk')
                    })
                    .set({
                        'Content-Type': 'application/json',
                        accept: 'application/json'
                    })
                    .send(JSON.stringify([
                        {
                            id: {
                                index: '3_1_1',
                                value: null
                            },
                            code: {
                                index: '3_1_2',
                                value: {
                                    _value: 1000008,
                                    _ver: 1
                                }
                            },
                            sourceId: '20200221-1',
                            env: null,
                            app: null,
                            wf: {
                                code: {
                                    index: '3_5_1',
                                    value: {
                                        _value: 1000004,
                                        _ver: 1
                                    }
                                },
                                app: {
                                    index: '3_5_5',
                                    value: {
                                        _value: 1000007,
                                        _ver: 1
                                    }
                                }
                            }
                        },
                        {
                            id: {
                                index: '3_1_1',
                                value: null
                            },
                            code: {
                                index: '3_1_2',
                                value: {
                                    _value: 1000018,
                                    _ver: 1
                                }
                            },
                            sourceId: '20200221-1',
                            env: null,
                            app: null,
                            wf: {
                                code: {
                                    index: '3_5_1',
                                    value: {
                                        _value: 1000004,
                                        _ver: 1
                                    }
                                },
                                app: {
                                    index: '3_5_5',
                                    value: {
                                        _value: 1000007,
                                        _ver: 1
                                    }
                                }
                            }
                        }
                    ]));

                expect(response.status).toBe(200);

                // Book運用サービス.モノ一括登録API へのリクエストの確認
                const bookOperateApiInfos = mockDoPostRequest.mock.calls.filter(elem => (elem[0] as string).startsWith('http://localhost:3006/book-operate/thing/bulk/'));
                const bookOperateRequest = JSON.parse(bookOperateApiInfos[0][1]['body'] as string);
                expect(bookOperateRequest).toMatchObject([
                    {
                        id: {
                            index: '3_1_1',
                            value: null
                        },
                        code: {
                            index: '3_1_2',
                            value: {
                                _value: 1000008,
                                _ver: 1
                            }
                        },
                        sourceId: '20200221-1',
                        env: null,
                        app: null,
                        wf: {
                            code: {
                                index: '3_5_1',
                                value: {
                                    _value: 1000004,
                                    _ver: 1
                                }
                            },
                            app: {
                                index: '3_5_5',
                                value: {
                                    _value: 1000007,
                                    _ver: 1
                                }
                            }
                        }
                    }
                ]);
            });

            test('正常系: POST ソースIDによるデータ蓄積のリクエストに蓄積が許可されていないデータ種が含まれる場合、リクエストのデータ種がフィルタされることを確認', async () => {
                const response = await supertest(expressApp)
                    .post(baseURI)
                    .set('Cookie', ['operator_type2_session=8947a6a73a6c8f952fe73678d84c2684892921bbdbd3a10fe910a7a8d3bb5aa5'])
                    .query({
                        block: 5555555,
                        from_block: 3333333,
                        path: encodeURIComponent('/book-operate/sourceid-store/test_user_id?allowPartialStore=true'),
                        from_path: encodeURIComponent('/book-operate/sourceid-store')
                    })
                    .set({
                        'Content-Type': 'application/json',
                        accept: 'application/json'
                    })
                    .send(JSON.stringify([
                        {
                            sourceId: 'test-dev-0001',
                            document: {
                                code: {
                                    index: '2_1_2',
                                    value: {
                                        _value: 1000008,
                                        _ver: 1
                                    }
                                },
                                createdAt: {
                                    index: '2_2_1',
                                    value: '2020-02-20T00:00:00.000+0900'
                                },
                                wf: {
                                    code: {
                                        index: '2_3_1',
                                        value: {
                                            _value: 1000117,
                                            _ver: 1
                                        }
                                    },
                                    wf: {
                                        index: '2_3_2',
                                        value: {
                                            _value: 1000007,
                                            _ver: 1
                                        }
                                    },
                                    role: {
                                        index: '2_3_3',
                                        value: {
                                            _value: 1000005,
                                            _ver: 1
                                        }
                                    },
                                    staffId: {
                                        index: '2_3_4',
                                        value: 'wf01'
                                    }
                                },
                                userId: {
                                    index: '2_4_1',
                                    value: 'test_user_id1'
                                },
                                chapter: [
                                    {
                                        title: 'イベント識別子',
                                        sourceId: [
                                            'test-dev-0001'
                                        ]
                                    }
                                ]
                            },
                            event: [
                                {
                                    code: {
                                        index: '3_1_2',
                                        value: {
                                            _value: 1000009,
                                            _ver: 1
                                        }
                                    },
                                    start: {
                                        index: '3_2_1',
                                        value: null
                                    },
                                    end: {
                                        index: '3_2_2',
                                        value: null
                                    },
                                    location: {
                                        index: '3_3_1',
                                        value: null
                                    },
                                    env: null,
                                    app: null,
                                    wf: {
                                        code: {
                                            index: '3_5_1',
                                            value: {
                                                _value: 1000004,
                                                _ver: 1
                                            }
                                        },
                                        wf: {
                                            index: '3_5_2',
                                            value: {
                                                _value: 1000007,
                                                _ver: 1
                                            }
                                        },
                                        role: {
                                            index: '3_5_3',
                                            value: {
                                                _value: 1000005,
                                                _ver: 1
                                            }
                                        },
                                        staffId: {
                                            index: '3_5_4',
                                            value: 'staffId'
                                        }
                                    },
                                    thing: [
                                        {
                                            _code: {
                                                _value: 1000010,
                                                _ver: 1
                                            },
                                            acquired_time: {
                                                index: '4_2_2_4',
                                                value: null
                                            },
                                            code: {
                                                index: '4_1_2',
                                                value: {
                                                    _value: 1000010,
                                                    _ver: 1
                                                }
                                            },
                                            env: {
                                                id: '',
                                                code: {
                                                    _value: 1000058,
                                                    _ver: 1
                                                }
                                            },
                                            'x-axis': {
                                                index: '4_2_2_1',
                                                value: null
                                            },
                                            'y-axis': {
                                                index: '4_2_2_2',
                                                value: null
                                            },
                                            'z-axis': {
                                                index: '4_2_2_3',
                                                value: null
                                            }
                                        },
                                        {
                                            _code: {
                                                _value: 1000011,
                                                _ver: 1
                                            },
                                            acquired_time: {
                                                index: '4_2_2_4',
                                                value: null
                                            },
                                            code: {
                                                index: '4_1_2',
                                                value: {
                                                    _value: 1000011,
                                                    _ver: 1
                                                }
                                            },
                                            env: {
                                                id: '',
                                                code: {
                                                    _value: 1000058,
                                                    _ver: 1
                                                }
                                            },
                                            'x-axis': {
                                                index: '4_2_2_1',
                                                value: null
                                            },
                                            'y-axis': {
                                                index: '4_2_2_2',
                                                value: null
                                            },
                                            'z-axis': {
                                                index: '4_2_2_3',
                                                value: null
                                            }
                                        }
                                    ]
                                }
                            ]
                        }
                    ]));

                expect(response.status).toBe(200);

                // Book運用サービス.ソースIDによる蓄積API へのリクエストの確認
                const bookOperateApiInfos = mockDoPostRequest.mock.calls.filter(elem => (elem[0] as string).startsWith('http://localhost:3006/book-operate/sourceid-store/'));
                const bookOperateRequest = JSON.parse(bookOperateApiInfos[0][1]['body'] as string);
                expect(bookOperateRequest).toMatchObject([
                    {
                        sourceId: 'test-dev-0001',
                        document: {
                            code: {
                                index: '2_1_2',
                                value: {
                                    _value: 1000008,
                                    _ver: 1
                                }
                            },
                            createdAt: {
                                index: '2_2_1',
                                value: '2020-02-20T00:00:00.000+0900'
                            },
                            wf: {
                                code: {
                                    index: '2_3_1',
                                    value: {
                                        _value: 1000117,
                                        _ver: 1
                                    }
                                },
                                wf: {
                                    index: '2_3_2',
                                    value: {
                                        _value: 1000007,
                                        _ver: 1
                                    }
                                },
                                role: {
                                    index: '2_3_3',
                                    value: {
                                        _value: 1000005,
                                        _ver: 1
                                    }
                                },
                                staffId: {
                                    index: '2_3_4',
                                    value: 'wf01'
                                }
                            },
                            userId: {
                                index: '2_4_1',
                                value: 'test_user_id1'
                            },
                            chapter: [
                                {
                                    title: 'イベント識別子',
                                    sourceId: [
                                        'test-dev-0001'
                                    ]
                                }
                            ]
                        },
                        event: [
                            {
                                code: {
                                    index: '3_1_2',
                                    value: {
                                        _value: 1000009,
                                        _ver: 1
                                    }
                                },
                                start: {
                                    index: '3_2_1',
                                    value: null
                                },
                                end: {
                                    index: '3_2_2',
                                    value: null
                                },
                                location: {
                                    index: '3_3_1',
                                    value: null
                                },
                                env: null,
                                app: null,
                                wf: {
                                    code: {
                                        index: '3_5_1',
                                        value: {
                                            _value: 1000004,
                                            _ver: 1
                                        }
                                    },
                                    wf: {
                                        index: '3_5_2',
                                        value: {
                                            _value: 1000007,
                                            _ver: 1
                                        }
                                    },
                                    role: {
                                        index: '3_5_3',
                                        value: {
                                            _value: 1000005,
                                            _ver: 1
                                        }
                                    },
                                    staffId: {
                                        index: '3_5_4',
                                        value: 'staffId'
                                    }
                                },
                                thing: [
                                    {
                                        _code: {
                                            _value: 1000010,
                                            _ver: 1
                                        },
                                        acquired_time: {
                                            index: '4_2_2_4',
                                            value: null
                                        },
                                        code: {
                                            index: '4_1_2',
                                            value: {
                                                _value: 1000010,
                                                _ver: 1
                                            }
                                        },
                                        env: {
                                            id: '',
                                            code: {
                                                _value: 1000058,
                                                _ver: 1
                                            }
                                        },
                                        'x-axis': {
                                            index: '4_2_2_1',
                                            value: null
                                        },
                                        'y-axis': {
                                            index: '4_2_2_2',
                                            value: null
                                        },
                                        'z-axis': {
                                            index: '4_2_2_3',
                                            value: null
                                        }
                                    }
                                ]
                            }
                        ]
                    }
                ]);
            });

            test('正常系: PUT ソースIDによるデータ更新のリクエストに蓄積が許可されていないデータ種が含まれる場合、リクエストのデータ種がフィルタされることを確認', async () => {
                const response = await supertest(expressApp)
                    .put(baseURI)
                    .set('Cookie', ['operator_type2_session=8947a6a73a6c8f952fe73678d84c2684892921bbdbd3a10fe910a7a8d3bb5aa5'])
                    .query({
                        block: 5555555,
                        from_block: 3333333,
                        path: encodeURIComponent('/book-operate/sourceid-store/test_user_id?allowPartialStore=true'),
                        from_path: encodeURIComponent('/book-operate/sourceid-store')
                    })
                    .set({
                        'Content-Type': 'application/json',
                        accept: 'application/json'
                    })
                    .send(JSON.stringify([
                        {
                            sourceId: 'test-dev-0001',
                            document: {
                                code: {
                                    index: '2_1_2',
                                    value: {
                                        _value: 1000008,
                                        _ver: 1
                                    }
                                },
                                createdAt: {
                                    index: '2_2_1',
                                    value: '2020-02-20T00:00:00.000+0900'
                                },
                                wf: {
                                    code: {
                                        index: '2_3_1',
                                        value: {
                                            _value: 1000117,
                                            _ver: 1
                                        }
                                    },
                                    wf: {
                                        index: '2_3_2',
                                        value: {
                                            _value: 1000007,
                                            _ver: 1
                                        }
                                    },
                                    role: {
                                        index: '2_3_3',
                                        value: {
                                            _value: 1000005,
                                            _ver: 1
                                        }
                                    },
                                    staffId: {
                                        index: '2_3_4',
                                        value: 'wf01'
                                    }
                                },
                                userId: {
                                    index: '2_4_1',
                                    value: 'test_user_id1'
                                },
                                chapter: [
                                    {
                                        title: 'イベント識別子',
                                        sourceId: [
                                            'test-dev-0001'
                                        ]
                                    }
                                ]
                            },
                            event: [
                                {
                                    code: {
                                        index: '3_1_2',
                                        value: {
                                            _value: 1000009,
                                            _ver: 1
                                        }
                                    },
                                    start: {
                                        index: '3_2_1',
                                        value: null
                                    },
                                    end: {
                                        index: '3_2_2',
                                        value: null
                                    },
                                    location: {
                                        index: '3_3_1',
                                        value: null
                                    },
                                    env: null,
                                    app: null,
                                    wf: {
                                        code: {
                                            index: '3_5_1',
                                            value: {
                                                _value: 1000004,
                                                _ver: 1
                                            }
                                        },
                                        wf: {
                                            index: '3_5_2',
                                            value: {
                                                _value: 1000007,
                                                _ver: 1
                                            }
                                        },
                                        role: {
                                            index: '3_5_3',
                                            value: {
                                                _value: 1000005,
                                                _ver: 1
                                            }
                                        },
                                        staffId: {
                                            index: '3_5_4',
                                            value: 'staffId'
                                        }
                                    },
                                    thing: [
                                        {
                                            _code: {
                                                _value: 1000010,
                                                _ver: 1
                                            },
                                            acquired_time: {
                                                index: '4_2_2_4',
                                                value: null
                                            },
                                            code: {
                                                index: '4_1_2',
                                                value: {
                                                    _value: 1000010,
                                                    _ver: 1
                                                }
                                            },
                                            env: {
                                                id: '',
                                                code: {
                                                    _value: 1000058,
                                                    _ver: 1
                                                }
                                            },
                                            'x-axis': {
                                                index: '4_2_2_1',
                                                value: null
                                            },
                                            'y-axis': {
                                                index: '4_2_2_2',
                                                value: null
                                            },
                                            'z-axis': {
                                                index: '4_2_2_3',
                                                value: null
                                            }
                                        },
                                        {
                                            _code: {
                                                _value: 1000011,
                                                _ver: 1
                                            },
                                            acquired_time: {
                                                index: '4_2_2_4',
                                                value: null
                                            },
                                            code: {
                                                index: '4_1_2',
                                                value: {
                                                    _value: 1000011,
                                                    _ver: 1
                                                }
                                            },
                                            env: {
                                                id: '',
                                                code: {
                                                    _value: 1000058,
                                                    _ver: 1
                                                }
                                            },
                                            'x-axis': {
                                                index: '4_2_2_1',
                                                value: null
                                            },
                                            'y-axis': {
                                                index: '4_2_2_2',
                                                value: null
                                            },
                                            'z-axis': {
                                                index: '4_2_2_3',
                                                value: null
                                            }
                                        }
                                    ]
                                }
                            ]
                        }
                    ]));

                expect(response.status).toBe(200);

                // Book運用サービス.ソースIDによる蓄積API へのリクエストの確認
                const bookOperateApiInfos = mockDoPutRequest.mock.calls.filter(elem => (elem[0] as string).startsWith('http://localhost:3006/book-operate/sourceid-store/'));
                const bookOperateRequest = JSON.parse(bookOperateApiInfos[0][1]['body'] as string);
                expect(bookOperateRequest).toMatchObject([
                    {
                        sourceId: 'test-dev-0001',
                        document: {
                            code: {
                                index: '2_1_2',
                                value: {
                                    _value: 1000008,
                                    _ver: 1
                                }
                            },
                            createdAt: {
                                index: '2_2_1',
                                value: '2020-02-20T00:00:00.000+0900'
                            },
                            wf: {
                                code: {
                                    index: '2_3_1',
                                    value: {
                                        _value: 1000117,
                                        _ver: 1
                                    }
                                },
                                wf: {
                                    index: '2_3_2',
                                    value: {
                                        _value: 1000007,
                                        _ver: 1
                                    }
                                },
                                role: {
                                    index: '2_3_3',
                                    value: {
                                        _value: 1000005,
                                        _ver: 1
                                    }
                                },
                                staffId: {
                                    index: '2_3_4',
                                    value: 'wf01'
                                }
                            },
                            userId: {
                                index: '2_4_1',
                                value: 'test_user_id1'
                            },
                            chapter: [
                                {
                                    title: 'イベント識別子',
                                    sourceId: [
                                        'test-dev-0001'
                                    ]
                                }
                            ]
                        },
                        event: [
                            {
                                code: {
                                    index: '3_1_2',
                                    value: {
                                        _value: 1000009,
                                        _ver: 1
                                    }
                                },
                                start: {
                                    index: '3_2_1',
                                    value: null
                                },
                                end: {
                                    index: '3_2_2',
                                    value: null
                                },
                                location: {
                                    index: '3_3_1',
                                    value: null
                                },
                                env: null,
                                app: null,
                                wf: {
                                    code: {
                                        index: '3_5_1',
                                        value: {
                                            _value: 1000004,
                                            _ver: 1
                                        }
                                    },
                                    wf: {
                                        index: '3_5_2',
                                        value: {
                                            _value: 1000007,
                                            _ver: 1
                                        }
                                    },
                                    role: {
                                        index: '3_5_3',
                                        value: {
                                            _value: 1000005,
                                            _ver: 1
                                        }
                                    },
                                    staffId: {
                                        index: '3_5_4',
                                        value: 'staffId'
                                    }
                                },
                                thing: [
                                    {
                                        _code: {
                                            _value: 1000010,
                                            _ver: 1
                                        },
                                        acquired_time: {
                                            index: '4_2_2_4',
                                            value: null
                                        },
                                        code: {
                                            index: '4_1_2',
                                            value: {
                                                _value: 1000010,
                                                _ver: 1
                                            }
                                        },
                                        env: {
                                            id: '',
                                            code: {
                                                _value: 1000058,
                                                _ver: 1
                                            }
                                        },
                                        'x-axis': {
                                            index: '4_2_2_1',
                                            value: null
                                        },
                                        'y-axis': {
                                            index: '4_2_2_2',
                                            value: null
                                        },
                                        'z-axis': {
                                            index: '4_2_2_3',
                                            value: null
                                        }
                                    }
                                ]
                            }
                        ]
                    }
                ]);
            });
        });
    });
});
