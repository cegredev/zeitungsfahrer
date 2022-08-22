import "./App.css";
import Article from "./components/Article";
import ArticlesList from "./components/ArticlesList";

const articles = [
	{
		id: 1,
		name: "Test",
		mwst: 7,
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
		id: 2,
		name: "Test",
		mwst: 7,
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
		id: 3,
		name: "Test",
		mwst: 7,
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

function App() {
	return (
		<div className="App">
			<div className="articles-page">
				<ArticlesList articles={articles} />
			</div>
		</div>
	);
}

export default App;
