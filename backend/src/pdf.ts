import Handlebars from "handlebars";
import Puppeteer from "puppeteer";

export function populateTemplateHtml(template: string, data: any, options?: any) {
	const html = Handlebars.compile(template);
	return encodeURIComponent(html(data));
}

export async function generatePDF(html: string): Promise<Buffer> {
	const browser = await Puppeteer.launch({
		args: ["--no-sandbox", "--disable-setuid-sandbox"],
		headless: true,
	});

	const page = await browser.newPage();
	await page.goto(`data:text/html;charset=UTF-8,${html}`, {
		waitUntil: "networkidle0",
	});

	const buffer = await page.pdf({
		format: "A4",
	});

	await browser.close();

	return buffer;
}
