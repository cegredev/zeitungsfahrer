import ExcelJS from "exceljs";
import Big from "big.js";
import { getVendorCatalog } from "./vendors.service.js";
import { getArticleRecords } from "./records.service.js";

export async function getArticleSalesReport(articleId: number, start: Date, end: Date) {}

export async function getVendorSalesReport(vendorId: number, start: Date, end: Date) {
	const catalog = await getVendorCatalog(vendorId);
	const articles = catalog.entries.filter((entry) => entry.included);

	const amountsByArticle = new Map<number, Big>();

	for (const { articleId, articleName } of articles) {
		const articleRecords = await getArticleRecords(vendorId, articleId, start, end);
		const records = articleRecords.records.filter((record) => !record.missing);

		const amountsByMwst = new Map<number, Big>();

		for (const { price, remissions, supply } of records) {
			// console.log(price.se)

			let amountCounter = amountsByMwst.get(price!.mwst);
			if (amountCounter === undefined) {
				amountsByMwst.set(price!.mwst, (amountCounter = new Big(0)));
			}

			amountsByMwst.set(price!.mwst, amountCounter.add(Big(supply - remissions).mul(Big(price!.sell))));
		}

		console.log([...amountsByMwst.entries()]);

		amountsByArticle.set(
			articleId,
			[...amountsByMwst.entries()]
				.map(([mwst, amount]) => amount.mul(1 + mwst / 100))
				.reduce((prev, current) => current.add(prev), Big(0))
		);

		console.log(articleId, amountsByArticle.get(articleId)?.toString());
	}

	const totalAmount = [...amountsByArticle.values()].reduce((prev, current) => prev.add(current));
	console.log("total amount:", totalAmount);
}
