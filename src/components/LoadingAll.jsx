import {Spin} from "antd";

export default function LoadingAll() {
    return (
        <div
            style={{
                width: "100%",
                height: "100%",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
            }}
        >
            <Spin size="large"/>
        </div>
    )
}