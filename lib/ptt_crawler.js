'use strict';
const puppeteer = require('puppeteer');
const os = require('os');
const fmlog = require('@waynechang65/fml-consolelog').log;
const isInsideDocker = require('./is-docker.js');

let browser;
let page;
let scrapingBoard = '';
let scrapingPages = 1;
let skipBottomPosts = true;
let this_os = '';
const stopSelector = '#main-container > div.r-list-container.action-bar-margin.bbs-screen'; // const
const userAgent = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_14_1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/74.0.3723.0 Safari/537.36'; // const
let getContents = false;

async function _initialize(options) {
    const chromiumExecutablePath = isInsideDocker()
        ? '/usr/bin/chromium' : '/usr/bin/chromium-browser';

    this_os = os.platform();
    fmlog('event_msg', ['PTT-CRAWLER', 'The OS is ' + this_os,
        isInsideDocker() ? '[ Inside a container ]' : '[ Not inside a container ]']);

    const launchOptions = {
        headless: false, // Consider making this configurable via options
    };

    if (this_os === 'linux') {
        launchOptions.executablePath = chromiumExecutablePath;
        launchOptions.args = ['--no-sandbox', '--disable-setuid-sandbox'];
    }

    Object.assign(launchOptions, options); // Merge user options

    browser = await puppeteer.launch(launchOptions);

    page = await browser.newPage();
    await page.setDefaultNavigationTimeout(180 * 1000); // 3 mins

    // More efficient request interception
    await page.setRequestInterception(true);
    page.on('request', request => {
        request.resourceType() === 'image' ? request.abort() : request.continue();
    });

    await page.setUserAgent(userAgent);
}

async function _getResults(options) {
    let data_pages = [];
    let retObj;
    options = options || {};
    options.pages = options.pages || 1;
    scrapingBoard = options.board || 'Tos';
    scrapingPages = Math.max(1, options.pages); // Ensure at least 1 page
    skipBottomPosts = !!options.skipPBs; // Boolean coercion
    getContents = !!options.getContents; // Boolean coercion

    const pttUrl = `https://www.ptt.cc/bbs/${scrapingBoard}/index.html`; // Template literal

    try {
        await page.goto(pttUrl);
        const over18Button = await page.$('.over18-button-container');
        if (over18Button) {
            await over18Button.click();
        }
        await page.waitForSelector(stopSelector);

        data_pages.push(await page.evaluate(_scrapingOnePage, skipBottomPosts));

        for (let i = 1; i < scrapingPages; i++) {
            await page.evaluate(() => {
                const buttonPrePage = document.querySelector('#action-bar-container > div > div.btn-group.btn-group-paging > a:nth-child(2)');
                buttonPrePage?.click(); // Optional chaining for safety
            });
            await page.waitForSelector(stopSelector);
            data_pages.push(await page.evaluate(_scrapingOnePage, skipBottomPosts));
        }

        retObj = await _mergePages(data_pages);

        if (getContents) {
            retObj.contents = await _scrapingAllContents(retObj.urls);
        }
    } catch (e) {
        console.error('[ptt-crawler] ERROR!---getResults', e); // Use console.error
        await browser.close();
        throw e; // Re-throw the error to be handled by the caller
    }
    return retObj;
}


function _scrapingOnePage(skipBottomPosts) {
    // Use more efficient selectors if possible.  The current selectors are quite long.
    const titleSelectorAll = '#main-container > div.r-list-container.action-bar-margin.bbs-screen > div.r-ent > div.title > a';
    const authorSelectorAll = '#main-container > div.r-list-container.action-bar-margin.bbs-screen > div.r-ent div.meta div.author';
    const dateSelectorAll = '#main-container > div.r-list-container.action-bar-margin.bbs-screen > div.r-ent div.meta div.date';
    const markSelectorAll = '#main-container > div.r-list-container.action-bar-margin.bbs-screen > div.r-ent div.meta div.mark';
    const rateSelectorAll = '#main-container > div.r-list-container.action-bar-margin.bbs-screen > div.r-ent div.nrec';
    const cutOutSelector = '#main-container > div.r-list-container.action-bar-margin.bbs-screen > div.r-list-sep ~ div.r-ent';


    const aryResultTitleAll = Array.from(document.querySelectorAll(titleSelectorAll));
    const aryAuthorAll = Array.from(document.querySelectorAll(authorSelectorAll));
    const aryDateAll = Array.from(document.querySelectorAll(dateSelectorAll));
    const aryMarkAll = Array.from(document.querySelectorAll(markSelectorAll));
    const aryRateAll = Array.from(document.querySelectorAll(rateSelectorAll));


    const aryCutOutLength = skipBottomPosts ? document.querySelectorAll(cutOutSelector).length : 0;

    const results = {
        titles: [],
        hrefs: [],
        rates: [],
        authors: [],
        dates: [],
        marks: []
    };

    for (let i = 0; i < aryResultTitleAll.length - aryCutOutLength; i++) {
        results.titles.push(aryResultTitleAll[i].innerText);
        results.hrefs.push(aryResultTitleAll[i].href);
        results.rates.push(aryRateAll[i]?.innerText || ''); // Handle potential null/undefined
        results.authors.push(aryAuthorAll[i]?.innerText || '');
        results.dates.push(aryDateAll[i]?.innerText || '');
        results.marks.push(aryMarkAll[i]?.innerText || '');
    }

    return results;
}



function _mergePages(pages) {
    return new Promise(resolve => {
        const results = {
            titles: [],
            urls: [],
            rates: [],
            authors: [],
            dates: [],
            marks: []
        };

        for (const pageData of pages) {
            results.titles.push(...pageData.titles.reverse()); // Reverse order and spread
            results.urls.push(...pageData.hrefs.reverse());
            results.rates.push(...pageData.rates.reverse());
            results.authors.push(...pageData.authors.reverse());
            results.dates.push(...pageData.dates.reverse());
            results.marks.push(...pageData.marks.reverse());
        }
        resolve(results);
    });
}

async function _scrapingAllContents(aryHref) {
    const aryContent = [];
    const contentSelector = '#main-content';

    for (const href of aryHref) { // Use for...of loop
        try {
            await page.goto(href);
            await page.waitForSelector(contentSelector);
            const content = await page.evaluate(selector => { // Pass selector as argument
                const element = document.querySelector(selector);
                return element?.innerText || ''; // Handle cases where element might not exist
            }, contentSelector);
            aryContent.push(content);
        } catch (e) {
            console.error('<PTT> page.goto ERROR!---_scrapingAllContents', e);
            await browser.close();
            throw e; // Re-throw the error
        }
    }
    return aryContent;
}

async function _close() {
    if (browser) {
        await browser.close();
    }
}

module.exports = {
    initialize: _initialize,
    getResults: _getResults,
    close: _close
};