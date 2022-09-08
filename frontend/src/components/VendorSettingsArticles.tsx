import { Article } from "backend/src/models/article.model";
import { VendorCatalogEntry } from "backend/src/models/vendorCatalog.model";
import { VendorSupply } from "backend/src/models/vendors.model";
import dayjs from "dayjs";
import React from "react";
import { GET } from "../api";
import { weekdaysShort } from "../consts";

interface Props {}

function VendorSettingsArticles() {
	const [entries, setEntries] = React.useState<VendorCatalogEntry[]>([]);

	React.useEffect(() => {
		const fetchArticles = async () => {
			const response = await GET("/vendors/1");
			setEntries(await response.json());
		};

		fetchArticles();
	}, [setEntries]);

	console.log(entries);

	return (
		<div style={{ maxWidth: 600 }}>
			{entries.map((entry, entryIndex) => {
				return (
					<React.Fragment key={"article-supplies-" + entry.articleId}>
						<div style={{ display: "flex", flexDirection: "row" }}>
							<input
								type="checkbox"
								checked={entry.included}
								onChange={(evt) => {
									setEntries(
										entries.map((e) =>
											e.articleId === entry.articleId ? { ...entry, included: !e.included } : e
										)
									);
								}}
							/>
							<div>{entry.articleName}</div>
						</div>

						{entry.included && (
							<div
								style={{
									display: "grid",
									gridTemplateColumns: "repeat(7, 1fr)",
									textAlign: "center",
								}}
							>
								{weekdaysShort.map((name) => (
									<div key={"supplies-day-label-" + name}>{name}</div>
								))}
								{entry.supplies!.map((supply, i) => (
									<div key={"supply-input-" + i} className="centering-div">
										<input
											value={supply}
											style={{ width: "80%" }}
											type="number"
											min={0}
											onChange={(evt) => {
												const newEntries = [...entries];
												const newSupplies = [...newEntries[entryIndex].supplies];
												newSupplies[i] = parseInt(evt.target.value);
												newEntries[entryIndex].supplies = newSupplies;
												setEntries(newEntries);
											}}
										/>
									</div>
								))}
							</div>
						)}
					</React.Fragment>
				);
			})}
		</div>
	);
}

export default VendorSettingsArticles;
