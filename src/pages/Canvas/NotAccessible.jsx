import {Typography} from "antd";
import {KHONG_THE_TRUY_CAP} from "../../Consts/TITLE_HEADER.js";
import "./RainbowText.css"; // Import file CSS
const NotAccessible = ({NotAccessible, view}) => {
    return (
        NotAccessible === KHONG_THE_TRUY_CAP &&
        <>
            {view === 'KTQT' ?
                <>
                    <div style={{
                        display: "flex",
                        justifyContent: "center",
                        alignItems: "center",
                        position: "fixed",
                        top:'40px',
                        left:0,
                        zIndex: 99999,
                        width: '100%',
                        height: 'calc(100% - 80px)',
                    }}>
                        <div>
                            <div style={{width: '100%', display: "flex", justifyContent: "center"}}>
                                <img style={{width: '200px'}} src="/locked.svg" alt=""/>
                            </div>

                            <Typography.Title style={{textAlign: "center"}} className="rainbow-text" level={4}>Chưa cấp
                                quyền
                                truy cập!</Typography.Title>
                        </div>

                    </div>
                </>
                :
                <div style={{
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    position: "absolute",
                    zIndex: 99999,
                    width: '100%',
                    height: '100%',
                    backgroundColor: '#FCFCFC',
                }}>
                    <div>
                        <div style={{width: '100%', display: "flex", justifyContent: "center"}}>
                            <img style={{width: '200px'}} src="/locked.svg" alt=""/>
                        </div>

                        <Typography.Title style={{textAlign: "center"}} className="rainbow-text" level={4}>Chưa cấp
                            quyền
                            truy cập!</Typography.Title>
                    </div>

            </div>
            }


        </>

    )
}
export default NotAccessible