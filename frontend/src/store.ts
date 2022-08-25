import { atom } from "jotai";
import { ArticleInfo } from "backend/src/models/article.model";

function createEmptyArticle() {
	return {
		data: {
			mwst: 7,
			name: "Neuer Artikel",
		},
		prices: Array(7)
			.fill(null)
			.map(() => ({
				sell: 0.3,
				purchase: 0.2,
			})),
	};
}

export const articlesListAtom = atom<ArticleInfo[]>([]);

export const setArticlesAtom = atom(undefined, (_get, set, articles: ArticleInfo[]) => {
	set(articlesListAtom, articles);
});

export const removeArticleAtom = atom(undefined, (get, set, id: number) => {
	set(
		articlesListAtom,
		get(articlesListAtom).filter((article) => article.data.id !== id)
	);
});

export const cancelDraftAtom = atom(undefined, (get, set) => {
	set(
		articlesListAtom,
		get(articlesListAtom).filter((article) => article.data.id != null)
	);
});

export const draftArticleAtom = atom(undefined, (get, set) => {
	set(articlesListAtom, [...get(articlesListAtom), createEmptyArticle()]);
});

export const finishArticleAtom = atom(undefined, (get, set, updated: ArticleInfo) => {
	set(
		articlesListAtom,
		get(articlesListAtom).map((article) => (article.data.id == null ? updated : article))
	);
});

export const updateArticleAtom = atom(undefined, (get, set, updated: ArticleInfo) => {
	const articles = [...get(articlesListAtom)];
	const articleId = articles.findIndex((article) => article.data.id === updated.data.id);

	articles[articleId] = { ...articles[articleId], ...updated };

	set(articlesListAtom, articles);
});
