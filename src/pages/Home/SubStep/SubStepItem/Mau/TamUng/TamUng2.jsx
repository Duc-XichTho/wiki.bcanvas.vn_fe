import css from './../Mau.module.css'
import { useParams } from "react-router-dom";
import React, { useContext, useEffect, useState } from "react";
import { MyContext } from "../../../../../../MyContext.jsx";
import { ADD } from "../PHIEU.js";
import { CreateCardIcon, LienQuanIcon } from "../../../../../../icon/IconSVG.js";
import { PhieuXuatDetail } from "../PhieuXuat/PhieuXuatDetail.jsx";
import { getPhieuXuatByCardId } from "../../../../../../apis/phieuXuatService.jsx";
import { TamUngDetail } from "./TamUngDetail.jsx";
import TaoTamUng from "../../../../formCreate/TaoTamUng.jsx";
import { getTamUngByCardId } from "../../../../../../apis/tamUngService.jsx";

export function TamUng2() {
  const { id, idCard, idStep } = useParams();
  const { loadData, setLoadData } = useContext(MyContext);
  const [itemSelected, setItemSelected] = useState({
    type: '',
    data: null,
  });

  function fetchTamUng() {
    getTamUngByCardId(idCard).then(data => {
      if (data?.length > 0) {
        setItemSelected({
          type: 'phieu',
          data: data[0]
        })
      } else {
        setItemSelected({
          type: 'phieu_moi',
          data: null
        })
      }
    })
  }

  useEffect(() => {
    fetchTamUng()
  }, [loadData, idCard]);

  return (<>
    <div className={css.phieu}>
      {itemSelected?.type === 'phieu_moi' && <TaoTamUng fetchTamUng={fetchTamUng} />}
      {itemSelected?.type === 'phieu' && <TamUngDetail phieu={itemSelected.data} fetchTamUng={fetchTamUng} />}
    </div>
  </>)
}
