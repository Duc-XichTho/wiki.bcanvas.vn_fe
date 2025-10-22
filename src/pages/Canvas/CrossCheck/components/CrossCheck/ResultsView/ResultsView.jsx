import css from './ResultsView.module.css';

const ResultsView = ({ mockResults, toggleResults }) => (
    <div className={css.resultsContainer}>
        <div className={css.resultHeader}>
            <h2 className={css.resultTitle}>Kết Quả Kiểm Tra: Kiểm tra doanh thu tháng 3</h2>
            <div className={mockResults.status === 'Khớp' ? css.statusSuccess : css.statusError}>
                {mockResults.status}
            </div>
        </div>

        <div className={css.summaryCards}>
            <div className={css.summaryCard}>
                <div className={css.cardTitle}>Giá trị nguồn cần kiểm soát làm sạch</div>
                <div className={css.cardValue}>{mockResults.primaryValue}</div>
            </div>
            <div className={css.summaryCard}>
                <div className={css.cardTitle}>Giá trị nguồn kiểm tra</div>
                <div className={css.cardValue}>{mockResults.checkingValue}</div>
            </div>
            <div className={css.summaryCard}>
                <div className={css.cardTitle}>Chênh lệch</div>
                <div className={mockResults.status === 'Khớp' ? css.cardValueSuccess : css.cardValueError}>
                    {mockResults.difference}
                </div>
            </div>
        </div>

        <div className={css.tableContainer}>
            <h3 className={css.tableTitle}>Chi Tiết Kiểm Tra Theo Ngày</h3>
            <table className={css.resultsTable}>
                <thead>
                    <tr>
                        <th>Ngày</th>
                        <th>Báo Cáo Kế Toán</th>
                        <th>Báo Cáo Bán Hàng</th>
                        <th>Chênh Lệch</th>
                        <th>Trạng Thái</th>
                    </tr>
                </thead>
                <tbody>
                    {mockResults.details.map((detail, index) => (
                        <tr key={index} className={index % 2 === 0 ? css.tableRowEven : css.tableRowOdd}>
                            <td>{detail.date}</td>
                            <td>{detail.primary}</td>
                            <td>{detail.checking}</td>
                            <td className={detail.status === 'Khớp' ? "" : css.errorText}>{detail.difference}</td>
                            <td>
                                <div className={detail.status === 'Khớp' ? css.statusTagSuccess : css.statusTagError}>
                                    {detail.status}
                                </div>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>

        <div className={css.actionButtons}>
            <button className={css.secondaryButton} onClick={toggleResults}>Quay Lại</button>
            <button className={css.primaryButton}>Xuất Báo Cáo</button>
            <button className={css.warningButton}>Đánh Dấu Vấn Đề</button>
        </div>
    </div>
);

export default ResultsView;