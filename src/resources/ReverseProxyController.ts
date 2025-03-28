/** Copyright 2022 NEC Corporation
Released under the MIT license.
https://opensource.org/licenses/mit-license.php
*/
/* eslint-disable */
import { Request, Response } from 'express';
import {
    Get, Post, Put, Delete,
    Req, QueryParams, Res, Header,
    UseBefore, JsonController
} from 'routing-controllers';
import ProxyReqDto from './dto/ProxyReqDto';
import ProxyValidator from './validator/ProxyValidator';
import EnableSimpleBackPressure from './backpressure/EnableSimpleBackPressure';
import OperatorService from '../services/OperatorService';
import AccessControlService from '../services/AccessControlService';
import ReverseProxyService from '../services/ReverseProxyService';
import { transformAndValidate } from 'class-transformer-validator';
import { applicationLogger } from '../common/logging';
/* eslint-enable */

@JsonController('/pxr-block-proxy/reverse')
export default class ReverseProxyController {
    @Get('/')
    @Header('X-Content-Type-Options', 'nosniff')
    @Header('X-XSS-Protection', '1; mode=block')
    @Header('X-Frame-Options', 'deny')
    @EnableSimpleBackPressure()
    @UseBefore(ProxyValidator)
    async getMethodReverseProxy (
        @Req() req: Request, @Res() res: Response
    ): Promise<any> {
        // DTOに変換する
        const dto = await transformAndValidate(ProxyReqDto, req.query) as ProxyReqDto;

        // オペレーター情報をヘッダーから取得する
        const operator = await OperatorService.authMe(req);

        // APIトークンを認証させる
        await AccessControlService.certifyToken(
            req.headers.token + '',
            'GET',
            dto.toPath,
            dto.fromPath,
            operator
        );

        // リクエストされた内容を元に、呼び出しサービスへのリクエスト明細を発行する
        const detail = await ReverseProxyService.issueDetail(req, dto);

        // 対象のサービスへのリクエストを実行する
        const result = await ReverseProxyService.call(detail, 'GET');

        // データベースへ登録する
        await ReverseProxyService.saveLog(dto, operator, 'GET');

        // レスポンスを生成、処理を終了する
        res
            .status(result.response.statusCode)
            .header(result.response.headers)
            .send(result.body);
    }

    @Post('/')
    @Header('X-Content-Type-Options', 'nosniff')
    @Header('X-XSS-Protection', '1; mode=block')
    @Header('X-Frame-Options', 'deny')
    @EnableSimpleBackPressure()
    @UseBefore(ProxyValidator)
    async postMethodReverseProxy (
        @Req() req: Request, @Res() res: Response
    ): Promise<any> {
        // DTOに変換する
        const dto = await transformAndValidate(ProxyReqDto, req.query) as ProxyReqDto;

        // オペレーター情報をヘッダーから取得する
        const operator = await OperatorService.authMe(req);

        // APIトークンを認証させる
        const { parameter } = await AccessControlService.certifyToken(
            req.headers.token + '',
            'POST',
            dto.toPath,
            dto.fromPath,
            operator
        );
        applicationLogger.info('access-token:' + req.headers['access-token']);

        // toPath が /book-operate/thing/bulk または /book-operate/sourceid-store の場合はリクエストのフィルタ処理を行う
        if (dto.toPath.startsWith('/book-operate/thing/bulk')) {
            req.body = ReverseProxyService.filterStoreRequest(req.body, parameter, ReverseProxyService.THING_BULK);
        } else if (dto.toPath.startsWith('/book-operate/sourceid-store')) {
            req.body = ReverseProxyService.filterStoreRequest(req.body, parameter, ReverseProxyService.SOURCEID_STORE);
        }

        // リクエストされた内容を元に、呼び出しサービスへのリクエスト明細を発行する
        const detail = await ReverseProxyService.issueDetail(req, dto);

        // 対象のサービスへのリクエストを実行する
        const result = await ReverseProxyService.call(detail, 'POST');

        // データベースへ登録する
        await ReverseProxyService.saveLog(dto, operator, 'POST');

        // toPath が /book-operate/share/search の場合はレスポンスのフィルタ処理を行う
        if (dto.toPath === '/book-operate/share/search') {
            result.body = ReverseProxyService.filterShareResponse(result.body, parameter);
        }

        // レスポンスを生成、処理を終了する
        res
            .status(result.response.statusCode)
            .header(result.response.headers)
            .send(result.body);
    }

    @Put('/')
    @Header('X-Content-Type-Options', 'nosniff')
    @Header('X-XSS-Protection', '1; mode=block')
    @Header('X-Frame-Options', 'deny')
    @EnableSimpleBackPressure()
    @UseBefore(ProxyValidator)
    async putMethodReverseProxy (
        @Req() req: Request, @Res() res: Response
    ): Promise<any> {
        // DTOに変換する
        const dto = await transformAndValidate(ProxyReqDto, req.query) as ProxyReqDto;

        // オペレーター情報をヘッダーから取得する
        const operator = await OperatorService.authMe(req);

        // APIトークンを認証させる
        const { parameter } = await AccessControlService.certifyToken(
            req.headers.token + '',
            'PUT',
            dto.toPath,
            dto.fromPath,
            operator
        );
        applicationLogger.info('access-token:' + req.headers['access-token']);

        // toPath が /book-operate/sourceid-store の場合はリクエストのフィルタ処理を行う
        if (dto.toPath.startsWith('/book-operate/sourceid-store')) {
            req.body = ReverseProxyService.filterStoreRequest(req.body, parameter, ReverseProxyService.SOURCEID_STORE);
        }

        // リクエストされた内容を元に、呼び出しサービスへのリクエスト明細を発行する
        const detail = await ReverseProxyService.issueDetail(req, dto);

        // 対象のサービスへのリクエストを実行する
        const result = await ReverseProxyService.call(detail, 'PUT');

        // データベースへ登録する
        await ReverseProxyService.saveLog(dto, operator, 'PUT');

        // レスポンスを生成、処理を終了する
        res
            .status(result.response.statusCode)
            .header(result.response.headers)
            .send(result.body);
    }

    @Delete('/')
    @Header('X-Content-Type-Options', 'nosniff')
    @Header('X-XSS-Protection', '1; mode=block')
    @Header('X-Frame-Options', 'deny')
    @EnableSimpleBackPressure()
    @UseBefore(ProxyValidator)
    async deleteMethodReverseProxy (
        @Req() req: Request, @Res() res: Response
    ): Promise<any> {
        // DTOに変換する
        const dto = await transformAndValidate(ProxyReqDto, req.query) as ProxyReqDto;

        // オペレーター情報をヘッダーから取得する
        const operator = await OperatorService.authMe(req);

        // APIトークンを認証させる
        await AccessControlService.certifyToken(
            req.headers.token + '',
            'DELETE',
            dto.toPath,
            dto.fromPath,
            operator
        );
        applicationLogger.info('access-token:' + req.headers['access-token']);
        // リクエストされた内容を元に、呼び出しサービスへのリクエスト明細を発行する
        const detail = await ReverseProxyService.issueDetail(req, dto);

        // 対象のサービスへのリクエストを実行する
        const result = await ReverseProxyService.call(detail, 'DELETE');

        // データベースへ登録する
        await ReverseProxyService.saveLog(dto, operator, 'DELETE');

        // レスポンスを生成、処理を終了する
        res
            .status(result.response.statusCode)
            .header(result.response.headers)
            .send(result.body);
    }
}
