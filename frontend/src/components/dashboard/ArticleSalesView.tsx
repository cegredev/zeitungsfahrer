import { ArticleInfo } from "backend/src/models/articles.model";
import { ArticleSales } from "backend/src/models/records.model";
import dayjs from "dayjs";
import { useAtom } from "jotai";
import React from "react";
import { GET } from "../../api";
import { dateAsTextWithSystem, invoiceSystems, normalizeDate } from "../../consts";
import { authTokenAtom } from "../stores/utility.store";

function ArticleSalesView() {
	const [articleSales, setArticleSales] = React.useState<ArticleSales | undefined>(undefined);
	const [articleId, setArticleId] = React.useState(1);
	const [articleInfo, setArticleInfo] = React.useState<ArticleInfo[]>([]);
	const [articleIndex, setArticleIndex] = React.useState(0);

	const [token] = useAtom(authTokenAtom);

	const today = new Date();

	React.useEffect(() => {
		async function fetchData() {
			const response = await GET(
				"/auth/articles/sales?id=" + articleId + "&end=" + dayjs(today).format("YYYY-MM-DD"),
				token!
			);
			setArticleSales(await response.json());

			const info = await GET("/auth/articles/info", token!);
			setArticleInfo(await info.json());
		}

		fetchData();
	}, [token, articleId]);

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
				</tr>
			</thead>
			<tbody>
				{articleSales?.sales.map((sales, index) => {
					return (
						<tr key={"article-sales-db-" + index}>
							<td style={{ fontWeight: "bold" }}>{invoiceSystems[invoiceSystems.length - index - 1]}</td>
							<td style={{ textAlign: "center" }}>{dateAsTextWithSystem(today, 3 - index)}</td>
							<td style={{ textAlign: "center" }}>{sales.supply}</td>
							<td style={{ textAlign: "center" }}>{sales.remissions}</td>
							<td style={{ textAlign: "center" }}>{sales.supply - sales.remissions}</td>
						</tr>
					);
				})}
			</tbody>
		</table>
	);
}

export default ArticleSalesView;
