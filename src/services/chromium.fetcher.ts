import {FileData, FileDataList, UnpackerConfig} from '../shared/interfaces';
import {Utils} from '../shared/utils';
import {Browser, Page, Headers, Request} from 'puppeteer';
import puppeteer from 'puppeteer-extra';

const StealthPlugin = require('puppeteer-extra-plugin-stealth')
const AdBlockerPlugin = require('puppeteer-extra-plugin-adblocker');
import {Logger} from './logger';

export interface ChromiumJsFile {
    url: string;
    data: string;
    headers?: Headers;
    map?: string
}

export class ChromiumFetcher {
    private utils: Utils;
    logger = Logger.get('chromium-fetcher');
    private sourceMapsToLoad: FileData[] = [];

    private inMemoryJsFiles: FileDataList = {};
    collectedFiles: string[] = [];
    visited: string[] = [];
    pupeteerArgs: any;
    private browser: Browser;
    launched: boolean;
    agents: string[] = [
        'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/77.0.3865.90 Safari/537.36',
        //"Mozilla/5.0 (Windows NT 6.1; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/67.0.3396.99 Safari/537.36",
        //"Mozilla/5.0 (Windows NT 6.2; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/67.0.3396.99 Safari/537.36",
        //"Mozilla/5.0 (Macintosh; Intel Mac OS X 10.10; rv:34.0) Gecko/20100101 Firefox/34.0",
        //"Mozilla/5.0 (Macintosh; Intel Mac OS X 10_13_4) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/67.0.3396.99 Safari/537.36",
        //"Mozilla/5.0 (Windows NT 6.3; WOW64; rv:34.0) Gecko/20100101 Firefox/34.0",
        //"Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/67.0.3396.99 Safari/537.36",
        //"Mozilla/5.0 (Windows NT 6.2; WOW64; rv:34.0) Gecko/20100101 Firefox/34.0",
        //"Mozilla/5.0 (Windows NT 6.1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/67.0.3396.99 Safari/537.36"
    ];

    constructor(private config: UnpackerConfig) {

        puppeteer.use(StealthPlugin());
        // puppeteer.use(AdBlockerPlugin());
        this.utils = new Utils(this.config);

        this.pupeteerArgs = Object.assign({
                headless: false,
                args: ['--no-sandbox']
            },
            // this.config.puppeteerArgs
        );
    }

    async getAllJsFiles() {
        this.collectedFiles = [];
        this.visited = [];
        const jsFiles: string[] = [];

        const res = await this.collectRequestedFiles(this.config.page, this.config.recursiveLinkClick ? true : false);
        await this.browser.close();
        return res;
    }


    private openPage = async (): Promise<Page> => {

        const page: Page = await this.browser.newPage();
        await page.setRequestInterception(true);
        if (this.config.cookies) {
            page.setCookie(...this.config.cookies);
        }

        // await page.setUserAgent(this.agents[Math.floor(Math.random() * this.agents.length)]);

        await page.setExtraHTTPHeaders({'Accept-Language': 'en-GB,en-US;q=0.9,en;q=0.8'});

        await page.setViewport({
            width: 1920,
            height: 1080
        });

        return page;

    }

    launch = async () => {

        this.browser = await puppeteer.launch(this.pupeteerArgs);
        this.launched = true;

        this.browser.on('disconnected', (e) => {
            this.logger.info(`pupeteer crashed.. restarting!`);
            // this.launch();
        });

        this.logger.info(`Started chromium with pid ${this.browser.process().pid}`);
    }

    visitedPreRoute = (route: string, baseUrl: string) => {
        return this.visited.includes(route);
    }
    collectRequestedFiles = async (url: string, collectForAllSubLinks, waitUntil = 'networkidle0'): Promise<ChromiumJsFile[]> => {
        if (!this.launched) {
            await this.launch();
        }
        const page = await this.openPage();

        let results: ChromiumJsFile[] = []; // collects all results

        let paused = false;
        let pausedRequests = [];

        const nextRequest = () => { // continue the next request or "unpause"
            if (pausedRequests.length === 0) {
                paused = false;
            } else {
                // continue first request in "queue"
                (pausedRequests.shift())(); // calls the request.continue function
            }
        };

        await page.setRequestInterception(true);
        page.on('request', (request: Request) => {
            if (request.url().endsWith('.js') || request.url().endsWith('.js.map')) {
                if (paused) {
                    pausedRequests.push(() => request.continue());
                } else {
                    paused = true; // pause, as we are processing a request now
                    request.continue();
                }

            } else {
                request.continue();
            }
        });

        page.on('requestfinished', async (request) => {
            const response = await request.response();

            const responseHeaders = response.headers();
            let responseBody;
            if (request.redirectChain().length === 0) {
                // body can only be access for non-redirect responses
                responseBody = await response.text();
            }
            if (request.url().endsWith('.js') || request.url().endsWith('.js.map')) {

                const information: ChromiumJsFile = {
                    url: request.url(),
                    data: responseBody,
                    headers: request.headers(),
                    /*requestHeaders: request.headers(),
                    requestPostData: request.postData(),
                    responseHeaders: responseHeaders,
                    responseSize: responseHeaders['content-length'],
                    responseBody,*/
                };
                if (!this.collectedFiles.includes(request.url())) {
                    this.collectedFiles.push(request.url());
                    results.push(information);
                } else {
                    console.log('File allready cached', request.url());
                }
            }
            nextRequest(); // continue with next request
        });
        page.on('requestfailed', (request) => {
            // handle failed request
            nextRequest();
        });
        try {
            await page.goto(url, {waitUntil: waitUntil as any}); /*: 'domcontentloaded'*/
        } catch (e) {
            await page.close();
            throw (e);
        }
        let allLinks: string[] = await page.evaluate((section: string | undefined, page: string) => {
            return Array.prototype.slice.call((section ? document.querySelector(section) : document).querySelectorAll('[href]')).filter(e => {
                const isInternal = typeof e.href === 'string' && e.href.includes(page) && e.href !== page;
                if (isInternal) {
                    const href = e.href;
                    return !href.endsWith('.jpg') && !href.endsWith('.png') && !href.endsWith('.svg') && !href.endsWith('.js') &&
                        !href.endsWith('.json') && !href.endsWith('.css')
                }
            }).map(e => e.href);
        }, this.config.recursiveClickSection, this.config.page.replace('http://', '').replace('https://', '').replace('www.', '').split('.')[0]);

        allLinks = allLinks.filter(link => !link.includes('facebook') && !link.includes('instagram') && !link.includes('twitter'));
        await page.close();
        if (collectForAllSubLinks) {
            console.log('collecting for sublinks');
            process.exit(1);
            for (let link of allLinks) {
                if (!this.visitedPreRoute(link, this.config.page)) {
                    this.visited.push(link);
                    try {
                        console.log('processing ', link);
                        results = [...results, ...await this.collectRequestedFiles(link, false)]
                        await new Promise((res) => {
                            setTimeout(() => {
                                res(true)
                            }, this.config.recursiveClickTimeout);
                        })
                    } catch (e) {
                        console.log('cannot process ' + link);
                    }
                } else {
                    console.log('visited ', link);
                }
            }
        }
        return results;
    }


    createPageFromContent = async (content: string): Promise<Page> => {
        if (!this.launched) {
            await this.launch();
        }

        const page = await this.openPage();
        await page.setContent(content);
        return page;

    }
}
