/** Copyright 2022 NEC Corporation
Released under the MIT license.
https://opensource.org/licenses/mit-license.php
*/
/**
 *
 *
 *
 * $Date$
 * $Revision$
 * $Author$
 *
 * TEMPLATE VERSION :  76463
 */
/* eslint-disable */
import 'reflect-metadata';
import * as express from 'express';
import * as bodyParser from 'body-parser';
import * as helmet from 'helmet';
import { useExpressServer, useContainer } from 'routing-controllers';
import { Container } from 'typedi';

import setupLogging from './Logging';
import setupHealthCheck from "./HealthCheck";
import GlobalValidate from '../validator/GlobalValidate';
import GlobalErrorHandler from '../handler/GlobalErrorHandler';
import CSRFCheckHandler from '../handler/CSRFCheckHandler';
import SwaggerUi = require('swagger-ui-express');
import ProxyController from '../ProxyController';
import ReverseProxyController from '../ReverseProxyController';
import IndProxyController from '../IndProxyController';
import cookieParser = require('cookie-parser');
import Config from '../../common/Config';
/* eslint-enable */

export class ExpressConfig {
    app: express.Express;

    constructor () {
        this.app = express();

        setupLogging(this.app);
        // SDE-MSA-PRIN 監視に優しい設計にする （MSA-PRIN-CD-04）
        setupHealthCheck(this.app);
        // SDE-MSA-PRIN ステートレスにする （MSA-PRIN-SD-01）

        this.app.use(bodyParser.json({ limit: '800mb' }));
        this.app.use(bodyParser.urlencoded({ extended: false }));
        this.app.use(cookieParser());
        this.app.use(bodyParser.raw({
            type: 'application/octet-stream',
            limit: '800mb'
        }));

        /**
         * HelmetによるHTTPヘッダーのセキュリティ対策設定
         */
        this.app.use(helmet());

        // SDE-IMPL-RECOMMENDED Content-Security-Policyの設定は以下で行ってください
        this.app.use(helmet.contentSecurityPolicy({
            directives: {
                defaultSrc: ["'self'"],
                styleSrc: ["'self'", "'unsafe-inline'"],
                imgSrc: ["'self'", 'data:']
            }
        }));

        // Swaggaer設定ファイルを読込
        const swaggerDocument = Config.ReadConfig('./config/openapi.json');

        // Swagger UIのセットアップ
        this.app.use('/api-docs', SwaggerUi.serve, SwaggerUi.setup(swaggerDocument));
        // SwaggerUIのアセットを静的に配布する設定
        this.app.use('/api-docs-assets', express.static('api-docs'));

        this.setupControllers();
    }

    setupControllers () {
        useContainer(Container);

        useExpressServer(this.app, {
            // SDE-IMPL-RECOMMENDED CORS（Cross-Origin Resource Sharing）設定は以下で行ってください。
            defaultErrorHandler: false,
            controllers: [
                ProxyController,
                ReverseProxyController,
                IndProxyController
            ],
            middlewares: [GlobalValidate, GlobalErrorHandler, CSRFCheckHandler],
            development: false
        });
    }
}
