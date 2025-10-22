import { useState, useRef } from "react";
import { AgCharts } from "ag-charts-react";
import vietnamGeoJson from "./vn.json";
import css from "./Geo.module.css";

const generateData = () => {
  const northern = [
    "Hà Nội", "Bắc Ninh", "Bắc Giang", "Hải Phòng", "Quảng Ninh", "Thái Bình",
    "Nam Định", "Hà Nam", "Ninh Bình", "Vĩnh Phúc", "Phú Thọ", "Tuyên Quang",
    "Yên Bái", "Lào Cai", "Hòa Bình", "Sơn La", "Điện Biên", "Lai Châu", "Cao Bằng",
    "Bắc Kạn", "Lạng Sơn", "Hà Giang"
  ];

  const central = [
    "Thanh Hóa", "Nghệ An", "Hà Tĩnh", "Quảng Bình", "Quảng Trị",
    "Thừa Thiên Huế", "Đà Nẵng", "Quảng Nam", "Quảng Ngãi", "Bình Định",
    "Phú Yên", "Khánh Hòa", "Ninh Thuận", "Bình Thuận", "Kon Tum", "Gia Lai",
    "Đắk Lắk", "Đắk Nông", "Lâm Đồng"
  ];

  const southern = [
    "TP Hồ Chí Minh", "Bình Dương", "Bình Phước", "Tây Ninh", "Bà Rịa - Vũng Tàu",
    "Long An", "Tiền Giang", "Bến Tre", "Trà Vinh", "Vĩnh Long", "Đồng Tháp",
    "An Giang", "Cần Thơ", "Hậu Giang", "Sóc Trăng", "Kiên Giang", "Bạc Liêu",
    "Cà Mau"
  ];

  const provincesWithZero = ["Hà Nội", "Đà Nẵng", "TP Hồ Chí Minh"];

  return [
    ...northern.map((name) => ({
      name,
      region: "Miền Bắc",
      value: provincesWithZero.includes(name) ? 0 : Math.floor(Math.random() * 1010),
    })),
    ...central.map((name) => ({
      name,
      region: "Miền Trung",
      value: provincesWithZero.includes(name) ? 0 : Math.floor(Math.random() * 1010),
    })),
    ...southern.map((name) => ({
      name,
      region: "Miền Nam",
      value: provincesWithZero.includes(name) ? 0 : Math.floor(Math.random() * 1010),
    })),
  ];
};

const regionColors = {
  "Miền Bắc": ["rgba(79,142,247,0)", "#4f8ef7"], // light to dark blue
  "Miền Trung": ["rgba(245,124,0,0)", "#f57c00"], // light to dark orange
  "Miền Nam": ["rgba(46,125,50,0)", "#2e7d32"], // light to dark green
};

const Geo = () => {
  const originalData = generateData();
  const [regionData, setRegionData] = useState(originalData);
  const [hoveredProvince, setHoveredProvince] = useState(null);
  const maxValue = 1009;
  const hoverValue = maxValue * 10;
  const [mapData, setMapData] = useState(generateData);
  const [displayData] = useState(generateData);
  const handleMouseOver = (provinceName) => {
    setHoveredProvince(provinceName);
    setRegionData((prevData) =>
        prevData.map((data) =>
            data.name === provinceName ? { ...data, value: hoverValue } : data
        )
    );
  };

  const handleMouseOut = () => {
    setHoveredProvince(null);
    setRegionData((prevData) =>
        prevData.map((data) =>
            data.name === hoveredProvince
                ? {
                  ...data,
                  value: originalData.find((d) => d.name === data.name).value,
                }
                : data
        )
    );
  };

  const chartOptions = {
    title: {
      text: "Bản Đồ Việt Nam",
    },
    topology: vietnamGeoJson,
    series: ["Miền Bắc", "Miền Trung", "Miền Nam"].map((region) => ({
      type: "map-shape",
      idKey: "name",
      data: vietnamGeoJson.features
          .filter((f) =>
              regionData.find((d) => d.region === region && d.name === f.properties?.name)
          )
          .map((feature) => {
            const name = feature.properties?.name;
            const datum = regionData.find((d) => d.name === name);
            const displayMatched = displayData.find((p) => p.name === name);
            const displayValue = displayMatched ? displayMatched.value : 0;
            const mapMatched = mapData.find((p) => p.name === name);
            const value = mapMatched ? mapMatched.value : 0;
            return {
              id: name || feature.id,
              name,
              value: datum?.value || 0,
              // label: `${datum?.value || 0}`,
              label: displayMatched ? `${displayValue}` : "",
            };
          }),
      colorKey: "value",
      colorRange: regionColors[region],
      stroke: "#000",
      strokeWidth: 0.5,
      labelKey: "label",
      label: {
        enabled: true,
        color: "#000",
        fontSize: 10,
        fontWeight: "bold",
      },
      tooltip: {
        renderer: ({ datum }) => ({
          content: `${datum.name}: ${datum.value}`,
        }),
      },
      highlightStyle: {
        item: {
          fill: "#00fff7",
          stroke: "#000",
          strokeWidth: 1,
        },
      },
      title: region,
    })),
    legend: {
      item: {
        label: {
          formatter: ({ series }) => series.title,
        },
      },
    },
  };

  return (
      <div className={css.container}>
        <div className={css.chart}>
          <AgCharts
              options={chartOptions}
              className={css.componentAgCharts}
          />
        </div>
        <div className={css.table}>
          <table>
            <thead>
            <tr>
              <th>Tỉnh/Thành</th>
              <th>Vùng</th>
              <th>Giá trị</th>
            </tr>
            </thead>
            <tbody>
            {regionData.map((data) => (
                <tr
                    key={data.name}
                    onMouseOver={() => handleMouseOver(data.name)}
                    onMouseOut={handleMouseOut}
                    className={css.tableRow}
                >
                  <td>{data.name}</td>
                  <td>{data.region}</td>
                  <td>{data.value}</td>
                </tr>
            ))}
            </tbody>
          </table>
        </div>
        </div>
  );
};

export default Geo;