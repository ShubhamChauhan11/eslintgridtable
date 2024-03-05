import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { AgGridReact } from "ag-grid-react"; // AG Grid Component
import "ag-grid-community/styles/ag-grid.css"; // Mandatory CSS required by the grid
import "ag-grid-community/styles/ag-theme-quartz.css";
import { AgChartsReact } from "ag-charts-react";

import { Select } from "antd";

function Grid() {
  const [rowData, setRowData] = useState([]);
  const [chartOptions, setChartOptions] = useState({});

  // Column Definitions: Defines & controls grid columns.
  const [colDefs, setColDefs] = useState([]);

  function fetchGridData() {
    fetch(
      `https://api.etherscan.io/api?module=account&action=txlist&address=0x6Fb447Ae94F5180254D436A693907a1f57696900&startblock=16689267&endblock=18982605&sort=asc&apikey=RC6QPVNIWMFSAHCNKCHKKQV8PU4HPA31JJ`
    )
      .then((response) => response.json())
      .then((data) => {
        fetch(
          "https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd"
        )
          .then((res) => res.json())
          .then((usdValue) => {
            let value = usdValue["ethereum"]["usd"];
            // //console.log("usdData", data["ethereum"]["usd"]);
            // console.log("data and usd", data, data["ethereum"]["usd"]);
            setColDefs([
              { field: "blockHash", filter: true, hide: false },
              { field: "blockNumber", filter: true, hide: false },
              { field: "to", filter: true, hide: false },
              { field: "value", filter: true, hide: false },
              { field: "gas", filter: true, hide: false },
              { field: "gasPrice", filter: true, hide: false },
              { field: "gasUsed", filter: true, hide: false },
              {
                field: "functionName",
                filter: true,
                chartDataType: "category",
                hide: false,
              },
              {
                field: "Gas Left",
                filter: true,
                hide: false,
              },
              {
                field: "Total Gas",
                filter: true,
                hide: false,
              },
              {
                field: "Total Gas (in $) ",
                filter: true,
                hide: false,
              },
            ]);
            let numbervalues = ["gasPrice", "gasUsed", "value", "gas"];
            let finaldata = data.result.map((ele) => {
              numbervalues.forEach((key) => {
                ele[key] = parseFloat(ele[key]);
              });
              ele["Gas Left"] = ele.gas - ele.gasUsed;
              //Gas Used * Gas Price)/10e18

              ele["Total Gas"] = (
                (ele.gasUsed * ele.gasPrice) /
                Math.pow(10, 18)
              ).toFixed(4);
              ele["Total Gas (in $) "] = (
                ((ele.gasUsed * ele.gasPrice) / Math.pow(10, 18)).toFixed(4) *
                value
              ).toFixed(2);
              return ele;
            });
            console.log("final data", finaldata);

            setRowData(finaldata);
            setChartOptions({
              data: finaldata,
              // Series: Defines which chart type and data to use
              series: [{ type: "bar", xKey: "blockNumber", yKey: "gasUsed" }],
            });
          });
      });
  }
  useEffect(() => {
    fetchGridData();
  }, []);
  const ref = useRef(null);

  const onBtnExport = useCallback(() => {
    const date = new Date().toLocaleDateString();

    ref.current.api.exportDataAsCsv({
      fileName: `transactions_${date}`,
    });
  }, []);

  const chartThemeOverrides = useMemo(() => {
    return {
      common: {
        title: {
          enabled: true,
          text: "gasUsed by blockNumber",
        },
      },
      bar: {
        axes: {
          category: {
            label: {
              rotation: 0,
            },
          },
        },
      },
    };
  }, []);
  const popupParent = useMemo(() => {
    return document.body;
  }, []);

  let [showChart, setShowChart] = useState(false);
  function showHideChart() {
    setShowChart(!showChart);
  }

  return (
    <div
      className="ag-theme-quartz-dark   flex flex-col gap-2"
      style={{ width: "90vw", height: "90vh" }}
    >
      <div className="flex gap-2">
        <button type="button" onClick={onBtnExport}>
          Download CSV file
        </button>

        <button type="button" onClick={showHideChart}>
          Show/Hide Chart
        </button>

        <Select
          mode="multiple"
          className="bg-gray-800"
          allowClear
          style={{
            width: "50%",
            background: "transparent",
          }}
          placeholder="Hide Show Columns"
          defaultValue={colDefs.map((ele) => {
            return {
              label: ele.field,
              value: ele.field,
            };
          })}
          onChange={(val) => {
            const newColDefs = colDefs.map((ele) => {
              if (val.includes(ele.field)) {
                ele.hide = true;
              } else {
                ele.hide = false;
              }
              return ele;
            });
            setColDefs(newColDefs);
          }}
          options={colDefs.map((ele) => {
            return {
              label: ele.field,
              value: ele.field,
            };
          })}
        />
      </div>
      <div className="flex   gap-2 w-full h-full">
        <AgGridReact
          className="w-[100%] h-[100vw]"
          ref={ref}
          rowData={rowData}
          columnDefs={colDefs}
          popupParent={popupParent}
        />
        {showChart ? (
          <AgChartsReact
            options={chartOptions}
            themeOverrides={chartThemeOverrides}
            className="w-[50%] h-[100vw]"
          />
        ) : null}
      </div>
    </div>
  );
}
export default Grid;
