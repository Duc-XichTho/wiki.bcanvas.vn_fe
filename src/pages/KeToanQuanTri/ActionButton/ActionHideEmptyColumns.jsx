import css from '../../Home/AgridTable/DanhMuc/KeToanQuanTri.module.css';

export default function ActionHideEmptyColumns({ isHideEmptyColumns , handleHideEmptyColumns}) {
    return (
            <div className={`${css.headerActionButton} ${css.buttonOn}`} onClick={handleHideEmptyColumns}>
                <div className={css.buttonContent}>
                    <span>{ isHideEmptyColumns  ? "Bỏ ẩn cột trống" : "Ẩn cột trống" }</span>
                </div>
            </div>

    );
}
