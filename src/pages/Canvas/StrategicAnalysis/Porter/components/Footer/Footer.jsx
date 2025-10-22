import css from "./Footer.module.css";
import TiptapChild from '../../../ComponentWarehouse/TiptapChild.jsx'
const Footer = ({ childElements, fetchData }) => {

  let items = [
    { name: "PORTER_CHILD_1", letter: "Đối thủ cạnh tranh", subText: "", fileNotePad: null },
    { name: "PORTER_CHILD_2", letter: "Sản phẩm thay thế", subText: "", fileNotePad: null },
    { name: "PORTER_CHILD_3", letter: "Quyền lực khách hàng", subText: "", fileNotePad: null },
    { name: "PORTER_CHILD_4", letter: "Quyền lực Nhà cung cấp", subText: "", fileNotePad: null },
    { name: "PORTER_CHILD_5", letter: "Đối thủ (tiềm năng) gia nhập ngành", subText: "", fileNotePad: null },
  ];

  items = items.map((i) => {
    const fileNotePad = childElements.find((e) => e.name === i.name);
    return { ...i, fileNotePad };
  })

  return (
    <div className={css.main}>
      {items.map((item, index) => (
        <div key={index} className={css.item}>
          <div className={css.header}>
            <div className={css.letter}><span>{item.letter}</span></div>
          </div>
          <div className={css.content}>
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