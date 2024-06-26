const { searchOption } = require('./data');
const ptt_crawler = require('./lib/ptt_crawler.js');
const fs = require('node:fs');

main();

async function main() {
	// *** Initialize ***
	await ptt_crawler.initialize();

	let content = '';
	for (let item of searchOption) {
		const ptt = await ptt_crawler.getResults({
			board: item.boardName,
			pages: item.pages,
			skipPBs: true,
		});

		// filter data
		const filteredData = FilterOption(TransformToObject(ptt), item.option)
		// generate log content
		content += filteredData.length > 0 ? `---${item.boardName}---\n` : ``;
		for (let item of filteredData) {
			content += item.approval + ' 推 - ' + item.title + ' - 日期:' + item.date + ' - ' + item.author + ' - ' + item.url + '\n';
		}
	}

	fs.writeFileSync('./log/crawler_log.txt', content)

	// *** Close      ***
	await ptt_crawler.close();
}

//////////////////////////////////////////
///           Console Out              ///
////////////////////////////////////////// 
function consoleOut(boardName, ptt) {
	console.log('\n');
	console.log('Board Name = ' + boardName);

	for (let item of ptt) {
		console.log(
			item.approval + ' 推 - ' + item.title + ' - 日期:' + item.date +
			' - ' + item.author + ' - ' + item.url
		)
	}
}

/**
 * @param {*} ptt: PTTResponse
 * @returns PTTResult[]
 */
function TransformToObject(ptt) {
	let result = [];
	for (let i = 0; i < ptt.titles.length; i++) {
		result.push({
			approval: ptt.rates[i] === '爆' ? 9999 : parseInt(ptt.rates[i]),
			title: ptt.titles[i],
			date: ptt.dates[i],
			author: ptt.authors[i],
			mark: ptt.marks[i],
			url: ptt.urls[i],
		});
	}

	return result;
}

/**
 * @param {*} ptt: PTTResult[]
 * @return {*} PTTResult[]
 */
function FilterOption(ptt, options){
	return ptt
		// 推文數
		// 若沒設定 approval default = 0
		.filter(x => x.approval >= (options.approval || 0))
		// 作者
		.filter(x => options.authors ? options.authors.includes(x.author) : true)
		// 標題
		.filter(x => options.title_Includes ? x.title.includes(options.title_Includes) : true)
}

module.exports = {
	FilterOption,
	TransformToObject
};

// FilterOption(testData, {})

// interface PTTResponse {
//   titles: string[];
//   urls: string[];
//   rates: string[];
//   authors: string[];
//   dates: string[];
//   marks: string[];
// }

// interface PTTResult {
//   approval: number;
//   title: string;
//   date: string;
//   author: string;
//   mark: string;
//   url: string;
// }