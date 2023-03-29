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
// スタブ構成用モジュールのインポート
import * as express from 'express';
import { Server } from 'net';
// テスト用モジュールのインポート
import * as supertest from 'supertest';
import Application from '../index';
import { StubCatalogService, StubOperatorService } from './StubServer';
/* eslint-enable */

// テスト対象のインスタンス化と起動
const expressApp = Application.express.app;

// Unit対象のURL（ベース）
const baseURI = '/pxr-block-proxy/ind';

// テスト用アクセス制御サービス（内部エラー）
class _StubAccessControlServiceRejection {
    _app: express.Express;
    _server: Server;

    constructor (port: number) {
        this._app = express();

        const handler = (req: express.Request, res: express.Response) => {
            res.status(503);
            res.end();
        };
        this._app.post('/access-control/token', handler);
        this._app.post('/access-control/collate', (req: express.Request, res: express.Response) => {
            res.status(200).json('').end();
        });
        this._server = this._app.listen(port);
    }
}
class _StubAccessControlServiceReject {
    _app: express.Express;
    _server: Server;

    constructor (port: number) {
        this._app = express();

        const handler = (req: express.Request, res: express.Response) => {
            res.status(500);
            res.end();
        };
        this._app.post('/access-control/token', handler);
        this._app.post('/access-control/collate', (req: express.Request, res: express.Response) => {
            res.status(200).json('').end();
        });
        this._server = this._app.listen(port);
    }
}
class _StubAccessControlNotPermit {
    _app: express.Express;
    _server: Server;

    constructor (port: number) {
        this._app = express();

        const handler = (req: express.Request, res: express.Response) => {
            res.status(401);
            res.end();
        };
        this._app.post('/access-control/token', handler);
        this._app.post('/access-control/collate', (req: express.Request, res: express.Response) => {
            res.status(200).json('').end();
        });
        this._server = this._app.listen(port);
    }
}
const _stubCatalogService = new StubCatalogService();
const operatorService = new StubOperatorService();

// PXR-Block Proxy Service APIのAbnormal End ユニットテスト（トークン生成）
describe('PXR-Block-Proxy Service Abnormal API', () => {
    beforeAll(async () => {
        // アプリケーション起動
        Application.start();
    });
    // テストがすべて終了したら実行する事後処理
    afterAll(async () => {
        // アプリケーション停止
        Application.stop();

        // スタブサーバーの停止
        _stubCatalogService.server.close();
        operatorService.server.close();
        // 元のファイル状態に変更する
        fs.writeFileSync('./config/port.json', beforeFileLines);
    });

    // Proxy APIのテスト（APIトークン取得 API側にて処理失敗）
    describe('プロキシーAPI (GET|POST|PUT|DELETE): ' + baseURI, () => {
        // テスト前後に、スタブサーバーの起動と停止処理
        let _stubAccessControlService: _StubAccessControlServiceRejection;
        beforeAll(async () => {
            _stubAccessControlService = new _StubAccessControlServiceRejection(3015);
        });
        afterAll(async () => {
            _stubAccessControlService._server.close();
        });

        // 異常系（アクセス制御サービス 内部エラー）
        test('異常系: GET（アクセス制御サービス 内部エラー）', async () => {
            const response = await supertest(expressApp)
                .get(baseURI)
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

            // Expect status Internal error code.
            expect(JSON.stringify(response.body))
                .toBe(JSON.stringify({
                    status: 500, message: 'アクセス制御サービスの内部処理で失敗しました'
                }));
            expect(response.status).toBe(500);
        });

        // 異常系（アクセス制御サービス 内部エラー）
        test('異常系: POST（アクセス制御サービス 内部エラー）', async () => {
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

            // Expect status Internal error code.
            expect(JSON.stringify(response.body))
                .toBe(JSON.stringify({
                    status: 500, message: 'アクセス制御サービスの内部処理で失敗しました'
                }));
            expect(response.status).toBe(500);
        });

        // 異常系（アクセス制御サービス 内部エラー）
        test('異常系: PUT（アクセス制御サービス 内部エラー）', async () => {
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

            // Expect status Internal error code.
            expect(JSON.stringify(response.body))
                .toBe(JSON.stringify({
                    status: 500, message: 'アクセス制御サービスの内部処理で失敗しました'
                }));
            expect(response.status).toBe(500);
        });

        // 異常系（アクセス制御サービス 内部エラー）
        test('異常系: DELETE（アクセス制御サービス 内部エラー）', async () => {
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

            // Expect status Internal error code.
            expect(JSON.stringify(response.body))
                .toBe(JSON.stringify({
                    status: 500, message: 'アクセス制御サービスの内部処理で失敗しました'
                }));
            expect(response.status).toBe(500);
        });
    });

    // Proxy APIのテスト（APIトークン取得 API側にて処理失敗）
    describe('プロキシーAPI (GET|POST|PUT|DELETE): ' + baseURI, () => {
        // テスト前後に、スタブサーバーの起動と停止処理
        let _stubAccessControlService: _StubAccessControlServiceReject;
        beforeAll(async () => {
            _stubAccessControlService = new _StubAccessControlServiceReject(3015);
        });
        afterAll(async () => {
            _stubAccessControlService._server.close();
        });

        // 異常系（アクセス制御サービス 内部エラー）
        test('異常系: GET（アクセス制御サービス 内部エラー）', async () => {
            const response = await supertest(expressApp)
                .get(baseURI)
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

            // Expect status Internal error code.
            expect(JSON.stringify(response.body))
                .toBe(JSON.stringify({
                    status: 500, message: 'アクセス制御サービスの内部処理で失敗しました'
                }));
            expect(response.status).toBe(500);
        });
    });

    // Proxy APIのテスト（APIトークン取得 API側にて処理失敗）
    describe('プロキシーAPI (GET|POST|PUT|DELETE): ' + baseURI, () => {
        // テスト前後に、スタブサーバーの起動と停止処理
        let _stubAccessControlService: _StubAccessControlNotPermit;
        beforeAll(async () => {
            _stubAccessControlService = new _StubAccessControlNotPermit(3015);
        });
        afterAll(async () => {
            _stubAccessControlService._server.close();
        });

        // 異常系（アクセス制御サービス 内部エラー）
        test('異常系: GET（アクセス制御サービス 内部エラー）', async () => {
            const response = await supertest(expressApp)
                .get(baseURI)
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

            // Expect status Internal error code.
            expect(JSON.stringify(response.body))
                .toBe(JSON.stringify({ status: 401, message: 'このリクエストは許可されませんでした' }));
            expect(response.status).toBe(401);
        });
    });

    // Proxy APIのテスト（アクセス制御サービスとの接続に失敗）
    describe('プロキシーAPI (GET|POST|PUT|DELETE): ' + baseURI, () => {
        // 異常系（アクセス制御サービス 内部エラー）
        test('異常系: GET（アクセス制御サービス 内部エラー）', async () => {
            const response = await supertest(expressApp)
                .get(baseURI)
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

            // Expect status Internal error code.
            expect(JSON.stringify(response.body))
                .toBe(JSON.stringify({
                    status: 500, message: 'アクセス制御サービスとの接続に失敗しました'
                }));
            expect(response.status).toBe(500);
        });
    });
});
