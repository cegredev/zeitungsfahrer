import { VendorCatalog } from "backend/src/models/vendors.model";
import React from "react";
import { POST } from "../api";
import { weekdaysShort } from "../consts";
import LabeledCheckbox from "./util/LabeledCheckbox";

function VendorCatalogSettings({ catalog: _catalog }: { catalog: VendorCatalog }) {
	const [catalog, setCatalog] = React.useState<VendorCatalog>(_catalog);

	return (
		<div style={{ maxWidth: 600 }}>
			{catalog &&
				catalog.entries.map((entry, entryIndex) => {
					return (
						<React.Fragment key={"article-supplies-" + entry.articleId}>
							<LabeledCheckbox
								text={entry.articleName}
								value={entry.included}
								setValue={() => {
									const newEntries = catalog.entries.map((e) =>
										e.articleId === entry.articleId ? { ...entry, included: !e.included } : e
									);

									setCatalog({
										...catalog,
										entries: newEntries,
									});

									POST("/vendors/" + catalog.vendorId, {
										vendorId: catalog.vendorId,
										entries: newEntries,
									});
								}}
							/>

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
												value={supply === -1 ? "" : supply}
												style={{ width: "80%" }}
												type="number"
												min={0}
												onChange={(evt) => {
													const value = evt.target.value;
													const isValid = value.length > 0;

													const newEntries = [...catalog.entries];
													const newSupplies = [...newEntries[entryIndex].supplies];
													newSupplies[i] = isValid ? parseInt(value) : -1;
													newEntries[entryIndex].supplies = newSupplies;
													setCatalog({
														...catalog,
														entries: newEntries,
													});

													if (isValid) POST("/vendors/" + catalog.vendorId, catalog);
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
