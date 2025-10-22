import css from '../../Home/AgridTable/DanhMuc/KeToanQuanTri.module.css';

export default function ActionHideEmptyRows({ isShowAll1 , handleIsShowAll1}) {
    return (
            <div className={`${css.headerActionButton} ${css.buttonOn}`} onClick={handleIsShowAll1}>
                <div className={css.buttonContent}>
                    <span>{ isShowAll1  ? "Bỏ ẩn dòng trống" : "Ẩn dòng trống" }</span>
                </div>
            </div>

    );
}
