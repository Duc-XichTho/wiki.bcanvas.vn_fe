import css from "./Footer.module.css";
import TiptapChild from '../../../ComponentWarehouse/TiptapChild.jsx'
const Footer = ({ childElements, fetchData }) => {

  let items = [
    { name: "SWOT_CHILD_1", letter: "Điểm mạnh", subText: "", fileNotePad: null, headerBackground: '#128fe0', contentBackground: '#ebf7ff', colorText: '#fff' },
    { name: "SWOT_CHILD_2", letter: "Điểm yếu", subText: "", fileNotePad: null, headerBackground: '#f94e8d', contentBackground: '#fedde9', colorText: '#fff' },
    { name: "SWOT_CHILD_3", letter: "Thách thức", subText: "", fileNotePad: null, headerBackground: '#f9af4e', contentBackground: '#fff5e0', colorText: '#fff' },
    { name: "SWOT_CHILD_4", letter: "Cơ hội", subText: "", fileNotePad: null, headerBackground: '#259c63', contentBackground: '#e1e8e4', colorText: '#fff' },
  ];

  items = items.map((i) => {
    const fileNotePad = childElements.find((e) => e.name === i.name);
    return { ...i, fileNotePad };
  })

  return (
    <div className={css.main}>
      {items.map((item, index) => (
        <div key={index} className={css.item}>
          <div className={css.header} style={{ backgroundColor: item.headerBackground }}>
            <div className={css.letter}><span style={{ color: item.colorText }}>{item.letter}</span></div>
          </div>
          <div className={css.content} style={{ backgroundColor: item.contentBackground }}>
            <TiptapChild
              fileNotePad={item.fileNotePad}
              fetchData={fetchData}
            />
          </div>
        </div>
      ))}
    </div>
  )
}

export default Footer