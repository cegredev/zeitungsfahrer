import ExcelJS from "exceljs";
import Big from "big.js";
import { getVendorCatalog } from "./vendors.service.js";
import { getArticleRecords } from "./records.service.js";
import { ArticleInfo } from "../models/articles.model.js";

export async function getArticleSalesReport(articleId: number, start: Date, end: Date) {}

interface ReportedArticle {
	supply: number;
	remissions: number;
	amountNetto: Big;
	amountBrutto: Big;
}

interface VendorSalesReport {
	articles: Map<number, string>;
	amountsByArticle: Map<number, ReportedArticle>;
}

export async function getVendorSalesReport(vendorId: number, start: Date, end: Date): Promise<VendorSalesReport> {
	const catalog = await getVendorCatalog(vendorId);
	const articles = catalog.entries.filter((entry) => entry.included);

	const amountsByArticle = new Map<number, ReportedArticle>();

	for (const { articleId, articleName } of articles) {
		const articleRecords = await getArticleRecords(vendorId, articleId, start, end);
		const records = articleRecords.records.filter((record) => !record.missing);

		const amountsByMwst = new Map<number, ReportedArticle>();
		let totalSupply = 0;
		let totalRemissions = 0;

		for (const { price, remissions, supply } of records) {
			let reportedArticle = amountsByMwst.get(price!.mwst);
			if (reportedArticle === undefined) {
				reportedArticle = {
					supply: 0,
					remissions: 0,
					amountNetto: new Big(0),
					amountBrutto: new Big(0),
				};

				amountsByMwst.set(price!.mwst, reportedArticle);
			}

			reportedArticle.amountNetto = reportedArticle.amountNetto.add(
				Big(supply - remissions).mul(Big(price!.sell))
			);

			totalSupply += supply;
			totalRemissions += remissions;
		}

		amountsByArticle.set(articleId, {
			amountNetto: [...amountsByMwst.values()]
				.map((article) => article.amountNetto)
				.reduce((a, b) => a.add(b), Big(0)),
			amountBrutto: [...amountsByMwst.entries()]
				.map(([mwst, article]) => article.amountNetto.mul(1 + mwst / 100))
				.reduce((prev, current) => current.add(prev), Big(0)),
			supply: totalSupply,
			remissions: totalRemissions,
		});

		console.log(articleId, JSON.stringify(amountsByArticle.get(articleId)));
	}

	return {
		articles: new Map(articles.map((article) => [article.articleId, article.articleName])),
		amountsByArticle,
	};
}

export async function createVendorSalesReportDoc(vendorId: number, start: Date, end: Date) {
	const { articles, amountsByArticle } = await getVendorSalesReport(vendorId, start, end);

	const workbook = new ExcelJS.Workbook();

	const sheet = workbook.addWorksheet("Sheet!", {
		pageSetup: {
			orientation: "portrait",
		},
	});

	sheet.columns = [
		{
			header: "Artikel",
			key: "article",
		},
		{
			header: "Lieferung",
			key: "supply",
		},
		{
			header: "Remission",
			key: "remissions",
		},
		{
			header: "Verkauf",
			key: "sales",
		},
		{
			header: "Betrag (Netto)",
			key: "valueNetto",
			style: { numFmt: '#,##0.00 "€"' },
		},
		{
			header: "Betrag (Brutto)",
			key: "valueBrutto",
			style: { numFmt: '#,##0.00 "€"' },
		},
	];

	const rowOffset = 1;

	let totalAmountNetto = new Big(0);
	let totalAmountBrutto = new Big(0);

	[...amountsByArticle.entries()].forEach(([articleId, article], i) => {
		const row = rowOffset + i + 1;

		const name = articles.get(articleId);
		const supply = article.supply;
		const remissions = article.remissions;
		const sales = supply - remissions;
		const valueNetto = article.amountNetto.round(2).toNumber();
		const valueBrutto = article.amountBrutto.round(2).toNumber();

		totalAmountNetto = totalAmountNetto.add(valueNetto);
		totalAmountBrutto = totalAmountBrutto.add(valueBrutto);

		sheet.insertRow(row, [name, supply, remissions, sales, valueNetto, valueBrutto]);
	});

	sheet.getCell(rowOffset + articles.size + 1, 5).value = totalAmountNetto.round(2).toNumber();
	sheet.getCell(rowOffset + articles.size + 1, 6).value = totalAmountBrutto.round(2).toNumber();

	workbook.xlsx.writeFile("export.xlsx");
}
