import { atom } from "jotai";
import { ArticleInfo } from "shared/src/models/article";

export const articlesListAtom = atom<ArticleInfo[]>([
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
]);
export const updateArticleTodo = atom(undefined, (get, set, updated: ArticleInfo) => {
	const articles = [...get(articlesListAtom)];
	const articleId = articles.findIndex((article) => article.data.id === updated.data.id);

	articles[articleId] = { ...articles[articleId], ...updated };

	set(articlesListAtom, articles);
});
