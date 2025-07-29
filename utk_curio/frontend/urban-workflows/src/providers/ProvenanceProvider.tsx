import React, { useState, useEffect } from "react";
import { Handle, Position } from "reactflow";
import "bootstrap/dist/css/bootstrap.min.css";
import { BoxType } from "../constants";
import { BoxContainer } from "./styles";
import DescriptionModal from "./DescriptionModal";
import Tab from "react-bootstrap/Tab";
import Tabs from "react-bootstrap/Tabs";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Paper from "@mui/material/Paper";
import { useFlowContext } from "../providers/FlowProvider";
import { fetchData } from '../services/api';

interface DataPoolBoxProps {
  data: any;
  isConnectable: boolean;
}

const DataPoolBox: React.FC<DataPoolBoxProps> = ({ data, isConnectable }) => {
  const [tabData, setTabData] = useState<any[]>([]);
  const [showDescriptionModal, setDescriptionModal] = useState(false);

  const promptDescription = () => setDescriptionModal(true);
  const closeDescription = () => setDescriptionModal(false);

  useEffect(() => {
    const processDataAsync = async () => {
      try {
        // Extract wrappers from merge or single input
        let wrappers: any[] = [];
        const raw = data.input;
        if (raw && raw.dataType === 'outputs' && Array.isArray(raw.data)) {
          wrappers = raw.data;
        } else if (raw) {
          wrappers = [raw];
        }

        const fetched = await Promise.all(
          wrappers.map(async (w) => {
            const fileId = w.filename ?? w.path;
            if (!fileId) return null;
            try {
              return await fetchData(fileId);
            } catch (err) {
              console.error('Fetch failed for', fileId, err);
              return null;
            }
          })
        );

        setTabData(fetched.filter((x) => x != null) as any[]);
      } catch (error) {
        console.error('Error processing data asynchronously:', error);
        setTabData([]);
      }
    };
    processDataAsync();
  }, [data.input]);

  const renderTable = (parsed: any) => {
    if (!parsed || typeof parsed.data !== 'object') return null;
    const columns = Object.keys(parsed.data);
    const indices = Object.keys(parsed.data[columns[0]] || {});
    return (
      <TableContainer component={Paper} style={{ maxHeight: 300 }}>
        <Table stickyHeader>
          <TableHead>
            <TableRow>
              {columns.map((col) => (
                <TableCell key={col}>{col}</TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {indices.map((idx) => (
              <TableRow key={idx}>
                {columns.map((col) => (
                  <TableCell key={col + idx}>{parsed.data[col][idx]}</TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    );
  };

  return (
    <>
      <Handle type="target" position={Position.Left} id="in" isConnectable={isConnectable} />
      <Handle type="source" position={Position.Right} id="out" isConnectable={isConnectable} />
      <Handle type="source" position={Position.Top} id="in/out" isConnectable={isConnectable} />

      <BoxContainer
        nodeId={data.nodeId}
        data={data}
        noContent
        setOutputCallback={() => {}}
        promptDescription={promptDescription}
      >
        <DescriptionModal
          nodeId={data.nodeId}
          boxType={BoxType.DATA_POOL}
          show={showDescriptionModal}
          handleClose={closeDescription}
        />
        <Tabs defaultActiveKey="0" id="data-pool-tabs">
          {tabData.map((d, i) => (
            <Tab eventKey={i.toString()} title={`Input ${i + 1}`} key={i}>
              {renderTable(d)}
            </Tab>
          ))}
        </Tabs>
      </BoxContainer>
    </>
  );
};

export default DataPoolBox;
