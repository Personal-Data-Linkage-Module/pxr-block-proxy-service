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
import { StubService, StubAbnormalService, StubAccessControlService, StubOperatorService, StubCatalogService} from './StubServer';

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
    });
});
