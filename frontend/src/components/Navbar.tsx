import { useAtom } from "jotai";
import { Link, useNavigate } from "react-router-dom";
import { authTokenAtom } from "../stores/utility.store";
import YesNoPrompt from "./util/YesNoPrompt";

interface Props {
	links: {
		name: string;
		url: string;
	}[];
}

function Navbar({ links }: Props) {
	const [, setToken] = useAtom(authTokenAtom);
	const navigate = useNavigate();

	return (
		<nav className="top-navbar" style={{ zIndex: 2, position: "sticky", top: 0 }}>
			<Link style={{ paddingLeft: 10 }} to={links[0].url}>
				{links[0].name}
			</Link>
			{links.slice(1).map((link, i) => (
				<Link key={i} to={link.url}>
					{link.name}
				</Link>
			))}
			<YesNoPrompt
				trigger={
					<button
						style={{
							float: "right",
							border: "none",
							backgroundColor: "transparent",
							fontSize: "1em",
							cursor: "pointer",
						}}
					>
						Ausloggen
					</button>
				}
				header="Ausloggen?"
				content="Wollen Sie sich wirklich ausloggen?"
				onYes={() => {
					setToken(undefined);
					navigate("/login");
				}}
			/>
		</nav>
	);
}

export default Navbar;
