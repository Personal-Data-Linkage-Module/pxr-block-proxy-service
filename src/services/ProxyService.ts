/** Copyright 2022 NEC Corporation
Released under the MIT license.
https://opensource.org/licenses/mit-license.php
*/
/* eslint-disable */
import { Request } from 'express';
import ProxyRequestDomain from '../domains/ProxyRequestDomain';
import {
    doPostRequest, doGetRequest, doPutRequest, doDeleteRequest
} from '../common/DoRequest';
import AppError from '../common/AppError';
import { applicationLogger, systemLogger } from '../common/logging';
import OperatorDomain from '../domains/OperatorDomain';
import ProxyServiceDTO from './dto/ProxyServiceDTO';
import ProxyReqDto from '../resources/dto/ProxyReqDto';
import CatalogService from './CatalogService';
import ProxyLog from '../repositories/postgres/ProxyLog';
import config = require('config');
import Config from '../common/Config';
import fs = require('fs');
import path = require('path');
import os = require('os');
const Message = Config.ReadConfig('./config/message.json');
const Permission = Config.ReadConfig('./config/permission.json');
const hostname = os.hostname();
/* eslint-enable */

/**
 * プロキシーサービスとの連携クラス
 */
export default class ProxyService {
    /**
     * Proxyサービス リバースプロキシーAPIをコールする
     * @param detail リクエスト明細
     * @param operator オペレーター情報
     */
    public static async call (detail: ProxyRequestDomain, method: string) {
        try {
            const url = `${detail.firstURI}?` +
                `block=${detail.toBlock}&` +
                `path=${detail.toPath}&` +
                `from_block=${detail.fromBlock}&` +
                `from_path=${detail.fromPath}`;
            let result;
            if (method === 'GET') {
                result = await doGetRequest(url, detail.options);
            } else if (method === 'POST') {
                result = await doPostRequest(url, detail.options);
            } else if (method === 'PUT') {
                result = await doPutRequest(url, detail.options);
            } else {
                result = await doDeleteRequest(url, detail.options);
            }
            systemLogger.debug('ProxyService.call method output this debug log.', result);
            return result;
        } catch (err) {
            throw new AppError(Message.FAILED_CALL_REVERSE_PROXY_API, 500, err);
        }
    }

    /**
     * リクエストの内容から、Proxyの情報を取得する
     * @param req リクエスト情報
     * @param dto リクエスト情報
     * @param method GET | POST | PUT | DELETE
     */
    public static async acquireVariousInformation (dto: ProxyReqDto, operator: OperatorDomain, method: 'GET' | 'POST' | 'PUT' | 'DELETE'): Promise<ProxyServiceDTO> {
        const serviceDto = new ProxyServiceDTO();
        serviceDto.method = method;
        serviceDto.fromCatalog = await CatalogService.get(dto.fromBlock || operator.blockCode, operator);
        applicationLogger.info('ProxyService.acquireVariousInformation serviceDto.fromCatalog: ' + JSON.stringify(serviceDto.fromCatalog));
        serviceDto.fromPath = !dto.fromPath
            ? '/pxr-block-proxy' : /^\/.*/.test(dto.fromPath)
                ? dto.fromPath : `/${dto.fromPath}`;
        serviceDto.toCatalog = await CatalogService.get(dto.toBlock || operator.blockCode, operator);
        applicationLogger.info('ProxyService.acquireVariousInformation serviceDto.toCatalog: ' + JSON.stringify(serviceDto.toCatalog));
        serviceDto.toPath = /^\/.*/.test(dto.toPath) ? dto.toPath : `/${dto.toPath}`;

        // 静的評価の実装
        if (!dto.fromPath) {
            let targetBlock: string = null;
            if (serviceDto.fromCatalog.code === serviceDto.toCatalog.code) {
                targetBlock = 'self';
            } else {
                targetBlock = serviceDto.toCatalog.rawData['template']['actor-type'];
            }

            const targetParmissions = Permission[targetBlock][method][operator.type];
            let isPermit = false;
            for (const targetParmission of targetParmissions) {
                const pattern = RegExp(targetParmission);
                if (pattern.test(serviceDto.toPath)) {
                    isPermit = true;
                    break;
                }
            }
            if (!isPermit) {
                throw new AppError(Message.REQUEST_OPERATION_NOT_PERMIT, 401);
            }
        }
        const entity = new ProxyLog();
        entity.type = 0;
        entity.apiMethod = method;
        entity.callerBlockCatalogCode = serviceDto.fromCatalog.code;
        entity.callerBlockCatalogVersion = serviceDto.fromCatalog.version;
        entity.callerApiUrl = serviceDto.fromPath;
        entity.destinationBlockCatalogCode = serviceDto.toCatalog.code;
        entity.destinationBlockCatalogVersion = serviceDto.toCatalog.version;
        entity.destinationApiUrl = serviceDto.toPath;
        entity.createdBy = operator.loginId;
        entity.updatedBy = operator.loginId;
        serviceDto.entity = entity;
        return serviceDto;
    }

    /**
     * リクエストと宛先のBlock情報が異なっていた場合再度カタログを取得する
     * @param operator オペレーター情報
     * @param serviceDto リクエスト情報
     * @param toBlockCode 宛先Block情報
     */
    public static async checkToBlock (operator: OperatorDomain, serviceDto: ProxyServiceDTO, toBlockCode: number) {
        // 元々のリクエストコードと宛先が一致していれば、処理なし
        if (Number(serviceDto.toCatalog.code) === Number(toBlockCode)) {
            return;
        }
        // 一致していない場合、アクセス制御から返ってきたBlockコードで宛先カタログを取り直す
        serviceDto.toCatalog = await CatalogService.get(toBlockCode, operator);
        applicationLogger.info('ProxyService.checkToBlock serviceDto.toCatalog: ' + JSON.stringify(serviceDto.toCatalog));
        serviceDto.entity.destinationBlockCatalogCode = serviceDto.toCatalog.code;
        serviceDto.entity.destinationBlockCatalogVersion = serviceDto.toCatalog.version;
    }

    /**
     * リバースプロキシーへのリクエスト情報の明細を発行する
     * @param req リクエスト情報
     * @param token APIトークン
     * @param operator オペレーター情報
     * @param serviceDto リクエスト情報
     */
    public static async issueDetail (
        req: Request, token: string, operator: OperatorDomain, serviceDto: ProxyServiceDTO
    ): Promise<ProxyRequestDomain> {
        const data = req.body instanceof Buffer ? req.body : JSON.stringify(req.body);
        const domain = new ProxyRequestDomain();
        const hostSubstr = hostname.substring(0, hostname.indexOf('-api'));
        const toCatalogDomainSubstr = serviceDto.toCatalog.domain.substring(0, serviceDto.toCatalog.domain.indexOf('-service'));
        if (hostSubstr === toCatalogDomainSubstr) {
            domain.firstURI = `${config.get('proxyService.local.protocol')}://localhost:${config.get('proxyService.local.reverseProxyPort')}${config.get('proxyService.local.reverseProxyPath')}`;
            req.headers['host'] = `localhost:${config.get('proxyService.local.reverseProxyPort')}`;
        } else {
            domain.firstURI = `${config.get('proxyService.protocol')}://${serviceDto.toCatalog.domain}:${config.get('proxyService.reverseProxyPort')}${config.get('proxyService.reverseProxyPath')}`;
            req.headers['host'] = `${serviceDto.toCatalog.domain}:${config.get('proxyService.reverseProxyPort')}`;
        }
        req.headers['content-length'] = Buffer.byteLength(data) + '';
        delete req.headers['cookie'];
        domain.options = {
            headers: req.headers,
            body: data,
            rejectUnauthorized: false
        };
        domain.options.headers.session = operator.encoded;
        domain.options.headers.token = token;
        domain.fromPath = serviceDto.fromPath;
        domain.fromBlock = serviceDto.fromCatalog.code;
        domain.toPath = encodeURIComponent(serviceDto.toPath);
        domain.toBlock = serviceDto.toCatalog.code;
        // バイナリDL用の設定
        if (serviceDto.toPath.match(/^\/binary-manage\/download\/.+\/\d+\/?$|^\/info-account-manage\/proposal\/attach\/\d+\/?$/)) {
            domain.options.headers.accept = 'application/octet-stream';
            domain.options.encoding = null;
        }
        return domain;
    }

    /**
     * 各プロキシの操作権限をチェック
     * @param operator
     * @param proxyType
     */
    public static async checkOperatorType (operator: OperatorDomain, session: any, proxyType: number) {
        // proxyTypeが0（個人用からの呼出）かつオペレーターの種別が個人以外の場合、エラー
        if (proxyType === 0 && operator.type !== OperatorDomain.TYPE_PERSONAL_NUMBER && !session) {
            throw new AppError(Message.NOT_OPERATION_AUTH, 401);
        }
        // proxyTypeが0以外（個人用以外からの呼出）かつオペレーターの種別が個人の場合、エラー
        if (proxyType !== 0 && operator.type === OperatorDomain.TYPE_PERSONAL_NUMBER && !session) {
            throw new AppError(Message.NOT_OPERATION_AUTH, 401);
        }
    }
}
