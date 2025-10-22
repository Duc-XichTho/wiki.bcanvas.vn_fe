import React from "react";
import css from "./Footer.module.css";
import TiptapChild2 from "../../../ComponentWarehouse/TiptapChild2.jsx";

const items = [
	{ name: "PESTEL_CHILD_1", letter: "P", subText: "Chính trị" },
	{ name: "PESTEL_CHILD_2", letter: "E", subText: "Kinh tế" },
	{ name: "PESTEL_CHILD_3", letter: "S", subText: "Xã hội" },
	{ name: "PESTEL_CHILD_4", letter: "T", subText: "Công nghệ" },
	{ name: "PESTEL_CHILD_5", letter: "E", subText: "Môi trường" },
	{ name: "PESTEL_CHILD_6", letter: "L", subText: "Pháp lý" }
];

const Footer = () => {
	return (
		<div className={css.main}>
			{items.map((item, index) => (
				<div key={index} className={css.item}>
					<div className={css.header}>
						<span>{item.letter} - {item.subText}</span>
					</div>
					<div className={css.content}>
						<TiptapChild2 tableName={item.name} />
					</div>
				</div>
			))}
		</div>
	);
};

export default Footer;
