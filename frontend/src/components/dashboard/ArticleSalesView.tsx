import { ArticleInfo } from "backend/src/models/articles.model";
import { ArticleSales } from "backend/src/models/records.model";
import { ReportType } from "backend/src/models/reports.model";
import dayjs from "dayjs";
import { useAtom } from "jotai";
import React from "react";
import { GET } from "../../api";
import { invoiceSystems } from "../../consts";
import { authTokenAtom } from "../../stores/utility.store";
import DateSelection from "../time/DateSelection";
import MonthSelection from "../time/MonthSelection";
import WeekSelection from "../time/WeekSelection";
import YearSelection from "../time/YearSelection";
import ReportButton from "./ReportButton";
import ReportTypeSelection from "./ReportTypeSelection";

function ArticleSalesView() {
	const [articleSales, setArticleSales] = React.useState<ArticleSales | undefined>(undefined);
	const [articleId, setArticleId] = React.useState(1);
	const [articleInfo, setArticleInfo] = React.useState<ArticleInfo[]>([]);
	const [articleIndex, setArticleIndex] = React.useState(0);
	const [date, setDate] = React.useState(new Date());
	const [loading, setLoading] = React.useState(false);
	const [reportType, setReportType] = React.useState<ReportType>("pdf");

	const [token] = useAtom(authTokenAtom);

	React.useEffect(() => {
		async function fetchData() {
			setLoading(true);

			const response = await GET<ArticleSales>(
				"/auth/main/articles/sales?id=" + articleId + "&end=" + dayjs(date).format("YYYY-MM-DD"),
				token!
			);

			const info = await GET<ArticleInfo[]>("/auth/main/articles/info", token!);
			setArticleSales(response.data);

			setArticleInfo(info.data);

			setLoading(false);
		}

		fetchData();
	}, [token, articleId, date]);

	const dateSelections = [
		<YearSelection date={date} setDate={setDate} />,
		<MonthSelection date={date} setDate={setDate} />,
		<WeekSelection date={date} setDate={setDate} />,
		<DateSelection date={date} setDate={setDate} />,
	];

	return (
		<table
			className="dashboard-sales"
			style={{
				backgroundColor: "lightgray",
				borderRadius: 5,
				padding: 10,
			}}
		>
			<thead>
				<tr>
					<th>
						<select
							value={articleIndex}
							onChange={(evt) => {
								const index = parseInt(evt.target.value);
								setArticleIndex(index);
								setArticleId(articleInfo[index].id);
							}}
						>
							{articleInfo.map((info, i) => (
								<option key={info.name + info.id} value={i}>
									{info.name}
								</option>
							))}
						</select>
					</th>
					<th>Zeitraum</th>
					<th>Lieferung</th>
					<th>Remission</th>
					<th>Verkauf</th>
					<th>
						<ReportTypeSelection reportType={reportType} setReportType={setReportType} />
					</th>
				</tr>
			</thead>
			<tbody>
				{loading ? (
					<tr>
						<td colSpan={5} style={{ textAlign: "center" }}>
							Laden...
						</td>
					</tr>
				) : (
					articleSales?.sales.map((sales, index) => {
						return (
							<tr key={"article-sales-db-" + index}>
								<td style={{ fontWeight: "bold" }}>
									{invoiceSystems[invoiceSystems.length - index - 1]}
								</td>
								<td style={{ textAlign: "center" }}>{dateSelections[index]}</td>
								<td style={{ textAlign: "center" }}>{sales.supply}</td>
								<td style={{ textAlign: "center" }}>{sales.remissions}</td>
								<td style={{ textAlign: "center" }}>{sales.supply - sales.remissions}</td>
								<td>
									<ReportButton
										date={date}
										filePrefix={articleInfo.find((article) => article.id === articleId)!.name}
										reportsPath={"article/" + articleId}
										invoiceSystem={3 - index}
										type={reportType}
									/>
								</td>
							</tr>
						);
					})
				)}
			</tbody>
		</table>
	);
}

export default ArticleSalesView;
