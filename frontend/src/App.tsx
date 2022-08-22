import "./App.css";
import Article from "./components/Article";
import ArticlesList from "./components/ArticlesList";
import { Provider as JotaiProvider } from "jotai";

function App() {
	return (
		<div className="App">
			<JotaiProvider>
				<div className="articles-page">
					<ArticlesList />
				</div>
			</JotaiProvider>
		</div>
	);
}

export default App;
