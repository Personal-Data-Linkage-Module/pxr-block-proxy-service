/** Copyright 2022 NEC Corporation
Released under the MIT license.
https://opensource.org/licenses/mit-license.php
*/
/* eslint-disable */
// スタブ構成用モジュールのインポート
import * as fs from 'fs';
// ポート管理するファイルを変更する
const beforeFileLines = fs.readFileSync('./config/port.json', { encoding: 'utf-8' });
const beforePermissionLines = fs.readFileSync('./config/permission.json', { encoding: 'utf-8' });
const changeLines = fs.readFileSync('./src/tests/mocks.port.json', { encoding: 'utf-8' });
const changePermissionLines = fs.readFileSync('./src/tests/mocks.permission.json', { encoding: 'utf-8' });
fs.writeFileSync('./config/port.json', changeLines);
// スタブ構成用モジュールのインポート
// テスト用モジュールのインポート
import * as supertest from 'supertest';
import Application from '../index';
import { StubCatalogService, StubOperatorService } from './StubServer';
/* eslint-enable */

// テスト対象のインスタンス化と起動
const expressApp = Application.express.app;

// Unit対象のURL（ベース）
const baseURI = '/pxr-block-proxy';
const indBaseURI = '/pxr-block-proxy/ind';

let _stubCatalogService: StubCatalogService;
let operatorService: StubOperatorService;

// PXR-Block Proxy Service APIのAbnormal End ユニットテスト（トークン生成）
describe('PXR-Block-Proxy Service Abnormal API', () => {
    beforeAll(async () => {
        // アプリケーション起動
        Application.start();

        _stubCatalogService = new StubCatalogService();
        operatorService = new StubOperatorService();
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

    // Proxy APIのテスト（権限エラー）
    describe('プロキシーAPI (GET|POST|PUT|DELETE): ' + baseURI, () => {
        // 異常系: 個人が個人以外用のProxyにアクセス
        test('異常系: 個人が個人以外用のProxyにアクセス', async () => {
            const response = await supertest(expressApp)
                .get(baseURI)
                .set('Cookie', ['operator_type0_session=a'])
                .query({
                    block: 5555555,
                    path: encodeURIComponent('/service-A')
                })
                .set({
                    'Content-Type': 'application/json',
                    accept: 'application/json'
                });

            // Expect status Internal error code.
            expect(JSON.stringify(response.body))
                .toBe(JSON.stringify({
                    status: 401, message: 'この操作をするための権限がありません'
                }));
            expect(response.status).toBe(401);
        });
    });
});

// PXR-Block Proxy Service APIのAbnormal End ユニットテスト（トークン生成）
describe('PXR-Block-Proxy Service Abnormal API', () => {
    beforeAll(async () => {
        // アプリケーション起動
        Application.start();

        _stubCatalogService = new StubCatalogService();
        operatorService = new StubOperatorService('8947a6a73a6c8f952fe73678d84c2684892921bbdbd3a10fe910a7a8d3bb5aa6');
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

    // Proxy APIのテスト（権限エラー）
    describe('プロキシーAPI (GET|POST|PUT|DELETE): ' + baseURI, () => {
        // 異常系: 個人以外が個人用のProxyにアクセス
        test('異常系: 個人以外が個人用のProxyにアクセス', async () => {
            const response = await supertest(expressApp)
                .post(indBaseURI)
                .set('Cookie', ['operator_type3_session=a'])
                .query({
                    block: 5555555,
                    path: encodeURIComponent('/service-A')
                })
                .set({
                    'Content-Type': 'application/json',
                    accept: 'application/json'
                });

            // Expect status Internal error code.
            expect(JSON.stringify(response.body))
                .toBe(JSON.stringify({
                    status: 401, message: 'この操作をするための権限がありません'
                }));
            expect(response.status).toBe(401);
        });
    });
});

// PXR-Block Proxy Service APIのAbnormal End ユニットテスト（トークン生成）
describe('PXR-Block-Proxy Service Abnormal API', () => {
    beforeAll(async () => {
        // アプリケーション起動
        Application.start();

        _stubCatalogService = new StubCatalogService();
        operatorService = new StubOperatorService('8947a6a73a6c8f952fe73678d84c2684892921bbdbd3a10fe910a7a8d3bb5aa6');
    });
    // テストがすべて終了したら実行する事後処理
    afterAll(async () => {
        // アプリケーション停止
        Application.stop();

        // スタブサーバーの停止
        _stubCatalogService.server.close();
        operatorService.server.close();
    });

    // Proxy APIのテスト（権限エラー）
    describe('プロキシーAPI (GET|POST|PUT|DELETE): ' + baseURI, () => {
        // 異常系: 個人以外が個人用のProxyにアクセス
        test('異常系: 静的認可が空', async () => {
            const response = await supertest(expressApp)
                .post(baseURI)
                .set('Cookie', ['operator_type3_session=a'])
                .query({
                    block: 5555555,
                    path: encodeURIComponent('/service-A')
                })
                .set({
                    'Content-Type': 'application/json',
                    accept: 'application/json'
                });

            // Expect status Internal error code.
            expect(JSON.stringify(response.body))
                .toBe(JSON.stringify({
                    status: 401, message: '指定されたAPIは、認可がありません'
                }));
            expect(response.status).toBe(401);
        });
    });
});

// PXR-Block Proxy Service APIのAbnormal End ユニットテスト（トークン生成）
describe('PXR-Block-Proxy Service Abnormal API', () => {
    beforeAll(async () => {
        fs.writeFileSync('./config/permission.json', changePermissionLines);

        // アプリケーション起動
        Application.start();

        _stubCatalogService = new StubCatalogService();
        operatorService = new StubOperatorService('8947a6a73a6c8f952fe73678d84c2684892921bbdbd3a10fe910a7a8d3bb5aa6');
    });
    // テストがすべて終了したら実行する事後処理
    afterAll(async () => {
        // アプリケーション停止
        Application.stop();

        // スタブサーバーの停止
        _stubCatalogService.server.close();
        operatorService.server.close();
        // 元のファイル状態に変更する
        fs.writeFileSync('./config/permission.json', beforePermissionLines);
    });

    // Proxy APIのテスト（権限エラー）
    describe('プロキシーAPI (GET|POST|PUT|DELETE): ' + baseURI, () => {
        // 異常系: 個人以外が個人用のProxyにアクセス
        test('異常系: 静的認可が空', async () => {
            const response = await supertest(expressApp)
                .post(baseURI)
                .set('Cookie', ['operator_type3_session=a'])
                .query({
                    block: 5555555,
                    path: encodeURIComponent('/service-A')
                })
                .set({
                    'Content-Type': 'application/json',
                    accept: 'application/json'
                });

            // Expect status Internal error code.
            expect(JSON.stringify(response.body))
                .toBe(JSON.stringify({
                    status: 401, message: '指定されたAPIは、認可がありません'
                }));
            expect(response.status).toBe(401);
        });
    });
});
