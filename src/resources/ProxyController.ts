/** Copyright 2022 NEC Corporation
Released under the MIT license.
https://opensource.org/licenses/mit-license.php
*/
/* eslint-disable */
import request = require('request');
import { Request, Response } from 'express';
import {
    JsonController,
    Get, Post, Put, Delete,
    UseBefore,
    Req, Res, Header, QueryParams
} from 'routing-controllers';
import EnableSimpleBackPressure from './backpressure/EnableSimpleBackPressure';
import ProxyService from '../services/ProxyService';
import OperatorService from '../services/OperatorService';
import AccessControlService from '../services/AccessControlService';
import ProxyValidator from './validator/ProxyValidator';
import ProxyReqDto from './dto/ProxyReqDto';
import EntityOperation from '../repositories/EntityOperation';
import { transformAndValidate } from 'class-transformer-validator';
import { applicationLogger } from '../common/logging';
/* eslint-enable */

@JsonController('/pxr-block-proxy')
export default class ProxyController {
    @Get('/')
    @Header('X-Content-Type-Options', 'nosniff')
    @Header('X-XSS-Protection', '1; mode=block')
    @Header('X-Frame-Options', 'deny')
    @EnableSimpleBackPressure()
    @UseBefore(ProxyValidator)
    async getMethodProxy (
        @Req() req: Request, @Res() res: Response
    ): Promise<any> {
        // DTOに変換する
        const dto = await transformAndValidate(ProxyReqDto, req.query) as ProxyReqDto;
        // オペレーター情報をヘッダー、もしくはクッキーを元に取得する
        const operator = await OperatorService.authMe(req);

        // このプロキシの操作権限があるかチェックする
        await ProxyService.checkOperatorType(operator, req.headers.session, 1);

        // リクエストされた内容を元にカタログ情報を取得、呼び出し内容の整合性を確認する
        const proxyServiceDto = await ProxyService
            .acquireVariousInformation(dto, operator, 'GET');

        // APIトークンを発行する
        const apiTokens = await AccessControlService
            .getToken(proxyServiceDto, operator, req.body._code, req);

        if (apiTokens.length === 1) {
            const apiToken = apiTokens[0];

            // toBlockに変更があれば、toCatalogを修正
            await ProxyService.checkToBlock(operator, proxyServiceDto, apiToken['blockCode']);

            // リクエスト明細を発行
            const detail = await ProxyService.issueDetail(
                req, apiToken['apiToken'], operator, proxyServiceDto);

            // 対象のBlockのReverseProxyAPIをコールする
            const result = await ProxyService.call(detail, 'GET');

            // ログとしてエンティティを保存する
            await EntityOperation.saveEntity(proxyServiceDto.entity);

            // レスポンスを生成、処理を終了する
            res
                .status(result.response.statusCode)
                .header(result.response.headers)
                .send(result.body);
        } else {
            const results: {
                response: request.Response;
                body: any[];
            } = {
                response: null,
                body: []
            };

            for (const apiToken of apiTokens) {
                // toBlockに変更があれば、toCatalogを修正
                await ProxyService.checkToBlock(operator, proxyServiceDto, apiToken['blockCode']);

                // リクエスト明細を発行
                const detail = await ProxyService.issueDetail(
                    req, apiToken['apiToken'], operator, proxyServiceDto);

                // 対象のBlockのReverseProxyAPIをコールする
                const result = await ProxyService.call(detail, 'GET');

                results.response = result.response;
                results.body.push(result.body);

                // ログとしてエンティティを保存する
                await EntityOperation.saveEntity(proxyServiceDto.entity);
            }

            // レスポンスを生成、処理を終了する
            res
                .status(results.response.statusCode)
                .header(results.response.headers)
                .send(results.body);
        }
    }

    @Post('/')
    @Header('X-Content-Type-Options', 'nosniff')
    @Header('X-XSS-Protection', '1; mode=block')
    @Header('X-Frame-Options', 'deny')
    @EnableSimpleBackPressure()
    @UseBefore(ProxyValidator)
    async postMethodProxy (
        @Req() req: Request, @Res() res: Response
    ): Promise<any> {
        // DTOに変換する
        const dto = await transformAndValidate(ProxyReqDto, req.query) as ProxyReqDto;
        // オペレーター情報をヘッダー、もしくはクッキーを元に取得する
        const operator = await OperatorService.authMe(req);

        // このプロキシの操作権限があるかチェックする
        await ProxyService.checkOperatorType(operator, req.headers.session, 1);

        // リクエストされた内容を元にカタログ情報を取得、呼び出し内容の整合性を確認する
        const proxyServiceDto = await ProxyService
            .acquireVariousInformation(dto, operator, 'POST');

        // APIトークンを発行する
        // applicationLogger.info('ProxyController.postMethodProxy proxyServiceDto: ' + JSON.stringify(proxyServiceDto));
        // applicationLogger.info('ProxyController.postMethodProxy operator: ' + JSON.stringify(operator));
        // applicationLogger.info('ProxyController.postMethodProxy req.body: ' + JSON.stringify(req.body));
        const apiTokens = await AccessControlService
            .getToken(proxyServiceDto, operator, req.body._code, req);

        if (apiTokens.length === 1) {
            const apiToken = apiTokens[0];

            // applicationLogger.info('ProxyController.postMethodProxy proxyServiceDto: ' + JSON.stringify(proxyServiceDto));
            // toBlockに変更があれば、toCatalogを修正
            await ProxyService.checkToBlock(operator, proxyServiceDto, apiToken['blockCode']);

            // リクエスト明細を発行
            const detail = await ProxyService.issueDetail(
                req, apiToken['apiToken'], operator, proxyServiceDto);

            // 対象のBlockのReverseProxyAPIをコールする
            const result = await ProxyService.call(detail, 'POST');

            // ログとしてエンティティを保存する
            await EntityOperation.saveEntity(proxyServiceDto.entity);

            // レスポンスを生成、処理を終了する
            res
                .status(result.response.statusCode)
                .header(result.response.headers)
                .send(result.body);
        } else {
            const results: {
                response: request.Response;
                body: any[];
            } = {
                response: null,
                body: []
            };

            for (const apiToken of apiTokens) {
                // applicationLogger.info('ProxyController.postMethodProxy for proxyServiceDto: ' + JSON.stringify(proxyServiceDto));
                // toBlockに変更があれば、toCatalogを修正
                await ProxyService.checkToBlock(operator, proxyServiceDto, apiToken['blockCode']);

                // リクエスト明細を発行
                const detail = await ProxyService.issueDetail(
                    req, apiToken['apiToken'], operator, proxyServiceDto);

                // 対象のBlockのReverseProxyAPIをコールする
                const result = await ProxyService.call(detail, 'POST');

                results.response = result.response;
                results.body.push(result.body);

                // ログとしてエンティティを保存する
                await EntityOperation.saveEntity(proxyServiceDto.entity);
            }

            // レスポンスを生成、処理を終了する
            res
                .status(results.response.statusCode)
                .header(results.response.headers)
                .send(results.body);
        }
    }

    @Put('/')
    @Header('X-Content-Type-Options', 'nosniff')
    @Header('X-XSS-Protection', '1; mode=block')
    @Header('X-Frame-Options', 'deny')
    @EnableSimpleBackPressure()
    @UseBefore(ProxyValidator)
    async putMethodProxy (
        @Req() req: Request, @Res() res: Response
    ): Promise<any> {
        // DTOに変換する
        const dto = await transformAndValidate(ProxyReqDto, req.query) as ProxyReqDto;
        // オペレーター情報をヘッダー、もしくはクッキーを元に取得する
        const operator = await OperatorService.authMe(req);

        // このプロキシの操作権限があるかチェックする
        await ProxyService.checkOperatorType(operator, req.headers.session, 1);

        // リクエストされた内容を元にカタログ情報を取得、呼び出し内容の整合性を確認する
        const proxyServiceDto = await ProxyService
            .acquireVariousInformation(dto, operator, 'PUT');

        // APIトークンを発行する
        const apiTokens = await AccessControlService
            .getToken(proxyServiceDto, operator, req.body._code, req);

        if (apiTokens.length === 1) {
            const apiToken = apiTokens[0];

            // toBlockに変更があれば、toCatalogを修正
            await ProxyService.checkToBlock(operator, proxyServiceDto, apiToken['blockCode']);

            // リクエスト明細を発行
            const detail = await ProxyService.issueDetail(
                req, apiToken['apiToken'], operator, proxyServiceDto);

            // 対象のBlockのReverseProxyAPIをコールする
            const result = await ProxyService.call(detail, 'PUT');

            // ログとしてエンティティを保存する
            await EntityOperation.saveEntity(proxyServiceDto.entity);

            // レスポンスを生成、処理を終了する
            res
                .status(result.response.statusCode)
                .header(result.response.headers)
                .send(result.body);
        } else {
            const results: {
                response: request.Response;
                body: any[];
            } = {
                response: null,
                body: []
            };

            for (const apiToken of apiTokens) {
                // toBlockに変更があれば、toCatalogを修正
                await ProxyService.checkToBlock(operator, proxyServiceDto, apiToken['blockCode']);

                // リクエスト明細を発行
                const detail = await ProxyService.issueDetail(
                    req, apiToken['apiToken'], operator, proxyServiceDto);

                // 対象のBlockのReverseProxyAPIをコールする
                const result = await ProxyService.call(detail, 'PUT');

                results.response = result.response;
                results.body.push(result.body);

                // ログとしてエンティティを保存する
                await EntityOperation.saveEntity(proxyServiceDto.entity);
            }

            // レスポンスを生成、処理を終了する
            res
                .status(results.response.statusCode)
                .header(results.response.headers)
                .send(results.body);
        }
    }

    @Delete('/')
    @Header('X-Content-Type-Options', 'nosniff')
    @Header('X-XSS-Protection', '1; mode=block')
    @Header('X-Frame-Options', 'deny')
    @EnableSimpleBackPressure()
    @UseBefore(ProxyValidator)
    async deleteMethodProxy (
        @Req() req: Request, @Res() res: Response
    ): Promise<any> {
        // DTOに変換する
        const dto = await transformAndValidate(ProxyReqDto, req.query) as ProxyReqDto;
        applicationLogger.info('access-token:' + req.headers['access-token']);
        // オペレーター情報をヘッダー、もしくはクッキーを元に取得する
        const operator = await OperatorService.authMe(req);

        // このプロキシの操作権限があるかチェックする
        await ProxyService.checkOperatorType(operator, req.headers.session, 1);

        // リクエストされた内容を元にカタログ情報を取得、呼び出し内容の整合性を確認する
        const proxyServiceDto = await ProxyService
            .acquireVariousInformation(dto, operator, 'DELETE');

        // APIトークンを発行する
        const apiTokens = await AccessControlService
            .getToken(proxyServiceDto, operator, req.body._code, req);

        if (apiTokens.length === 1) {
            const apiToken = apiTokens[0];

            // toBlockに変更があれば、toCatalogを修正
            await ProxyService.checkToBlock(operator, proxyServiceDto, apiToken['blockCode']);

            // リクエスト明細を発行
            const detail = await ProxyService.issueDetail(
                req, apiToken['apiToken'], operator, proxyServiceDto);

            // 対象のBlockのReverseProxyAPIをコールする
            const result = await ProxyService.call(detail, 'DELETE');

            // ログとしてエンティティを保存する
            await EntityOperation.saveEntity(proxyServiceDto.entity);

            // レスポンスを生成、処理を終了する
            res
                .status(result.response.statusCode)
                .header(result.response.headers)
                .send(result.body);
        } else {
            const results: {
                response: request.Response;
                body: any[];
            } = {
                response: null,
                body: []
            };

            for (const apiToken of apiTokens) {
                // toBlockに変更があれば、toCatalogを修正
                await ProxyService.checkToBlock(operator, proxyServiceDto, apiToken['blockCode']);

                // リクエスト明細を発行
                const detail = await ProxyService.issueDetail(
                    req, apiToken['apiToken'], operator, proxyServiceDto);

                // 対象のBlockのReverseProxyAPIをコールする
                const result = await ProxyService.call(detail, 'DELETE');

                results.response = result.response;
                results.body.push(result.body);

                // ログとしてエンティティを保存する
                await EntityOperation.saveEntity(proxyServiceDto.entity);
            }

            // レスポンスを生成、処理を終了する
            res
                .status(results.response.statusCode)
                .header(results.response.headers)
                .send(results.body);
        }
    }
}
