import { atom } from "jotai";
import { ArticleInfo } from "shared/src/models/article";

const x = [
	{
		data: { id: 1, name: "Test", mwst: 7 },
		prices: [
			{
				purchase: 2000,
				sell: 3000,
			},
			{
				purchase: 2000,
				sell: 3000,
			},
			{
				purchase: 2000,
				sell: 3000,
			},
			{
				purchase: 2000,
				sell: 3000,
			},
			{
				purchase: 2000,
				sell: 3000,
			},
			{
				purchase: 2000,
				sell: 3000,
			},
			{
				purchase: 2000,
				sell: 3000,
			},
		],
	},
	{
		data: { id: 2, name: "Test", mwst: 7 },
		prices: [
			{
				purchase: 2000,
				sell: 3000,
			},
			{
				purchase: 2000,
				sell: 3000,
			},
			{
				purchase: 2000,
				sell: 3000,
			},
			{
				purchase: 2000,
				sell: 3000,
			},
			{
				purchase: 2000,
				sell: 3000,
			},
			{
				purchase: 2000,
				sell: 3000,
			},
			{
				purchase: 2000,
				sell: 3000,
			},
		],
	},
	{
		data: { id: 3, name: "Test", mwst: 7 },
		prices: [
			{
				purchase: 2000,
				sell: 3000,
			},
			{
				purchase: 2000,
				sell: 3000,
			},
			{
				purchase: 2000,
				sell: 3000,
			},
			{
				purchase: 2000,
				sell: 3000,
			},
			{
				purchase: 2000,
				sell: 3000,
			},
			{
				purchase: 2000,
				sell: 3000,
			},
			{
				purchase: 2000,
				sell: 3000,
			},
		],
	},
];

export const articlesListAtom = atom<ArticleInfo[]>([]);
export const setArticlesAtom = atom(undefined, (get, set, articles: ArticleInfo[]) => {
	set(articlesListAtom, articles);
});
export const updateArticleAtom = atom(undefined, (get, set, updated: ArticleInfo) => {
	const articles = [...get(articlesListAtom)];
	const articleId = articles.findIndex((article) => article.data.id === updated.data.id);

	articles[articleId] = { ...articles[articleId], ...updated };

	set(articlesListAtom, articles);
});
