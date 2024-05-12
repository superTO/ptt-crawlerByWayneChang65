const { FilterOption } = require("../script");

let data = [
	{
		approval: 3,
		title: "[其它] 小富士刀盤裝不回去",
		date: "5/12",
		author: "smallta",
		mark: "",
		url: "https://www.ptt.cc/bbs/Coffee/M.1715514993.A.EE9.html",
		content: null,
	},
	{
		approval: 3,
		title: "[器材] Flair Pro2升級58～",
		date: "5/12",
		author: "BelugaJ",
		mark: "",
		url: "https://www.ptt.cc/bbs/Coffee/M.1715511962.A.D85.html",
		content: null,
	},
	{
		approval: 3,
		title: "Re: [器材] 分享便宜入手niche的方式",
		date: "5/12",
		author: "BelugaJ",
		mark: "",
		url: "https://www.ptt.cc/bbs/Coffee/M.1715497984.A.1B4.html",
		content: null,
	},
	{
		approval: 38,
		title: "[廣宣]五間厝咖啡 母親節與大家分享愛",
		date: "5/12",
		author: "wesiy",
		mark: "",
		url: "https://www.ptt.cc/bbs/Coffee/M.1715497321.A.92C.html",
		content: null,
	},
	{
		approval: 9999,
		title: "[情報] 送！精品咖啡分享包！直接送!有夠送！",
		date: "5/12",
		author: "allpafighter",
		mark: "",
		url: "https://www.ptt.cc/bbs/Coffee/M.1715482137.A.BFC.html",
		content: null,
	},
	{
		approval: 8,
		title: "[其它] 求推咖啡有關的podcast",
		date: "5/12",
		author: "benevolent96",
		mark: "",
		url: "https://www.ptt.cc/bbs/Coffee/M.1715458440.A.75C.html",
		content: null,
	},
];

test("{}", () => {
	expect({ a: 1 }).toStrictEqual({ a: 1 });
});

test("{}", () => {
	expect({ a: 1 }).toEqual({ a: 1 });
});

test("filter no options", () => {
	expect(FilterOption(data, {})).toStrictEqual(data);
});

test("filter by approval", () => {
	expect(
		FilterOption(data, {
			approval: 20,
		})
	).toStrictEqual(data.filter((x) => x.approval >= 20));
});

test("filter by authors", () => {
	expect(
		FilterOption(data, {
			authors: ["smallta"],
		})
	).toStrictEqual(data.filter((x) => x.author === "smallta"));
});

test("filter by two authors", () => {
	expect(
		FilterOption(data, {
			authors: ["smallta", "BelugaJ"],
		})
	).toStrictEqual(
		data.filter((x) => x.author === "smallta" || x.author === "BelugaJ")
	);
});

test("filter by title", () => {
	expect(
		FilterOption(data, {
			title_Includes: "小富士",
		})
	).toStrictEqual(data.filter((x) => x.title.includes("小富士")));
});

test("filter by multiple options", () => {
	expect(
		FilterOption(data, {
			title_Includes: "小富士",
			approval: 20,
		})
	).toStrictEqual([]);
});