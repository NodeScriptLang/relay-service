import { AuxHttpServer, BaseApp, JwtService } from '@nodescript/microframework';
import { dep, Mesh } from 'mesh-ioc';

import { MainHttpServer } from './global/MainHttpServer.js';
import { Metrics } from './global/Metrics.js';

export class App extends BaseApp {

    @dep() private mainHttpServer!: MainHttpServer;
    @dep() private auxHttpServer!: AuxHttpServer;

    constructor() {
        super(new Mesh('App'));
        this.mesh.service(AuxHttpServer);
        this.mesh.service(JwtService);
        this.mesh.service(MainHttpServer);
        this.mesh.service(Metrics);
    }

    override async start() {
        await super.start();
        await this.mainHttpServer.start();
        await this.auxHttpServer.start();
    }

    override async stop() {
        await super.stop();
        await this.mainHttpServer.stop();
        await this.auxHttpServer.stop();
    }

}
