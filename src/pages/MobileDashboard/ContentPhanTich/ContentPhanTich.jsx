import React from 'react';
import { Button } from 'antd';
import { AiOutlineDown, AiOutlineRight } from 'react-icons/ai';
import css from './ContentPhanTich.module.css';

export default function ContentPhanTich({
											toggleSection,
											openSection,
											renderSpeakerIcon,
											listAnswer,
										}) {
	return (
		<div className={css.accordionSection}>
			{listAnswer.map((item, index) => {
				const isOpen = openSection[index];
				return (
					<div key={index} className={css.accordionItem}>
						<button
							className={css.accordionHeader}
							onClick={() => toggleSection(index)}
						>
							<span>{item.title}</span>
							<span className={css.arrow}>
								{isOpen ? <AiOutlineDown /> : <AiOutlineRight />}
							</span>
						</button>

						{isOpen && (
							<div className={css.accordionContent}>
								<div className={css.contentHeader}>
									{/*<h4>{item.title}</h4>*/}
										{renderSpeakerIcon(index , item.answer)}
								</div>

								{item.answer ? (
									item.answer.split('\n\n').map((paragraph, i) => (
										<p key={i} className={css.answerParagraph}>
											{paragraph}
										</p>
									))
								) : (
									<p className={css.noContent}>[Chưa chọn nội dung]</p>
								)}
							</div>
						)}
					</div>
				);
			})}
		</div>
	);
}
