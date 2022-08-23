import "./App.css";
import ArticlesList from "./components/ArticlesList";
import { Provider as JotaiProvider } from "jotai";

function App() {
	return (
		<div className="App">
			<JotaiProvider>
				<div className="articles-page">
					<ArticlesList />
				</div>
				<div className="footer"></div>
			</JotaiProvider>
		</div>
	);
}

export default App;
