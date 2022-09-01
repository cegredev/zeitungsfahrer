import { atom } from "jotai";
import { Article } from "backend/src/models/article.model";

function createEmptyArticle(): Article {
	return {
		name: "Neuer Artikel",
		prices: Array(7)
			.fill(null)
			.map((_, index) => ({
				weekday: index,
				sell: 0.3,
				purchase: 0.2,
				marketSell: 0.4,
				mwst: 7,
				startDate: new Date(),
			})),
	};
}

export const articlesListAtom = atom<Article[]>([]);

export const setArticlesAtom = atom(undefined, (_get, set, articles: Article[]) => {
	set(articlesListAtom, articles);
});

export const removeArticleAtom = atom(undefined, (get, set, id: number) => {
	set(
		articlesListAtom,
		get(articlesListAtom).filter((article) => article.id !== id)
	);
});

export const cancelArticleDraftAtom = atom(undefined, (get, set) => {
	set(
		articlesListAtom,
		get(articlesListAtom).filter((article) => article.id != null)
	);
});

export const draftArticleAtom = atom(undefined, (get, set) => {
	set(articlesListAtom, [...get(articlesListAtom), createEmptyArticle()]);
});

export const finishArticleAtom = atom(undefined, (get, set, updated: Article) => {
	set(
		articlesListAtom,
		get(articlesListAtom).map((article) => (article.id == null ? updated : article))
	);
});

export const updateArticleAtom = atom(undefined, (get, set, updated: Article) => {
	const articles = [...get(articlesListAtom)];
	const articleId = articles.findIndex((article) => article.id === updated.id);

	articles[articleId] = { ...articles[articleId], ...updated };

	set(articlesListAtom, articles);
});
