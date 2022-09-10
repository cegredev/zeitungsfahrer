import { Article } from "backend/src/models/article.model";
import { VendorCatalog } from "backend/src/models/vendorCatalog.model";
import dayjs from "dayjs";
import React from "react";
import { GET, POST } from "../api";
import { weekdaysShort } from "../consts";

function VendorCatalogSettings({ catalog: _catalog }: { catalog: VendorCatalog }) {
	const [catalog, setCatalog] = React.useState<VendorCatalog>(_catalog);

	// React.useEffect(() => {
	// 	const fetchArticles = async () => {
	// 		const response = await GET("/vendors/1");
	// 		setCatalog(await response.json());
	// 	};

	// 	fetchArticles();
	// }, [setCatalog]);

	console.log(catalog);

	return (
		<div style={{ maxWidth: 600 }}>
			{catalog &&
				catalog.entries.map((entry, entryIndex) => {
					return (
						<React.Fragment key={"article-supplies-" + entry.articleId}>
							<div style={{ display: "flex", flexDirection: "row" }}>
								<input
									type="checkbox"
									checked={entry.included}
									onChange={() => {
										const newEntries = catalog.entries.map((e) =>
											e.articleId === entry.articleId ? { ...entry, included: !e.included } : e
										);

										setCatalog({
											...catalog,
											entries: newEntries,
										});

										console.log(newEntries);
										POST("/vendors/" + catalog.vendorId, {
											vendorId: catalog.vendorId,
											entries: newEntries,
										});
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
										<label key={"supplies-day-label-" + name}>{name}</label>
									))}
									{entry.supplies!.map((supply, i) => (
										<div key={"supply-input-" + i} className="centering-div">
											<input
												value={supply}
												style={{ width: "80%" }}
												type="number"
												min={0}
												onChange={(evt) => {
													const newEntries = [...catalog.entries];
													const newSupplies = [...newEntries[entryIndex].supplies];
													newSupplies[i] = parseInt(evt.target.value);
													newEntries[entryIndex].supplies = newSupplies;
													setCatalog({
														...catalog,
														entries: newEntries,
													});

													POST("/vendors/" + catalog.vendorId, catalog);
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

export default VendorCatalogSettings;
