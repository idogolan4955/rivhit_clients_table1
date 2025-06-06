import React, { useEffect, useState } from 'react';
import { DataGrid } from '@mui/x-data-grid';
import { Box, Typography, TextField, Button, Stack } from '@mui/material';

const columns = [
  { field: 'id', headerName: 'מזהה', flex: 1, filterable: true },
  { field: 'Name', headerName: 'שם לקוח', flex: 2, filterable: true },
  { field: 'agent_name', headerName: 'שם סוכן', flex: 2, filterable: true },
  { field: 'balance', headerName: 'יתרה (₪)', flex: 1, filterable: true, type: 'number',
    valueFormatter: (params) => params.value !== null && params.value !== undefined ? params.value.toLocaleString('he-IL', { style: 'currency', currency: 'ILS' }) : '' },
  // Add more fields as needed
];

function App() {
  const [rows, setRows] = useState([]);
  const [filterName, setFilterName] = useState('');
  const [filterAgent, setFilterAgent] = useState('');
  const [filterBalance, setFilterBalance] = useState('');
  const [selectionModel, setSelectionModel] = useState([]);

  useEffect(() => {
    fetch('/api/clients')
      .then(res => res.json())
      .then(data => {
        const rowsWithStringId = data
          .filter(row => row.id !== undefined && row.id !== null)
          .map(row => ({
            ...row,
            id: String(row.id)
          }));
        setRows(rowsWithStringId);
        setSelectionModel([]);
      });
  }, []);

  // סינון נתונים
  const filteredRows = rows.filter(row => {
    const nameMatch = row.Name?.includes(filterName);
    const agentMatch = row.agent_name?.includes(filterAgent);
    const balanceMatch = filterBalance === '' || (row.balance !== undefined && row.balance !== null && row.balance.toString().includes(filterBalance));
    return nameMatch && agentMatch && balanceMatch;
  });

  // חישוב יתרה כוללת של הנבחרים (לא תלוי בפילטר)
  const selectedRows = rows.filter(row => selectionModel.includes(row.id));
  const totalBalance = selectedRows.reduce((sum, row) => sum + (row.balance || 0), 0);

  // הדפסה של הנבחרים בלבד
  const handlePrint = () => {
    const tableHtml = `
      <table border="1" dir="rtl" style="width:100%; border-collapse:collapse; font-family:inherit;">
        <thead>
          <tr>
            <th>מזהה</th>
            <th>שם לקוח</th>
            <th>שם סוכן</th>
            <th>יתרה (₪)</th>
          </tr>
        </thead>
        <tbody>
          ${selectedRows.map(row => `
            <tr>
              <td>${row.id}</td>
              <td>${row.Name}</td>
              <td>${row.agent_name}</td>
              <td>${row.balance?.toLocaleString('he-IL', { style: 'currency', currency: 'ILS' }) || ''}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;
    const printFrame = document.createElement('iframe');
    printFrame.style.display = 'none';
    document.body.appendChild(printFrame);
    printFrame.contentDocument.write('<html><head><title>הדפסת לקוחות</title></head><body>' + tableHtml + '</body></html>');
    printFrame.contentDocument.close();
    printFrame.contentWindow.print();
    setTimeout(() => {
      document.body.removeChild(printFrame);
    }, 1000);
  };

  // Add debug logs
  console.log('Selected Rows:', selectedRows);
  console.log('Total Balance:', totalBalance);
  console.log('selectionModel:', selectionModel);
  console.log('selectedRows:', selectedRows);

  return (
    <Box sx={{ direction: 'rtl', p: 4, bgcolor: '#f5f5f5', minHeight: '100vh' }}>
      <Typography variant="h4" gutterBottom align="right">דוח יתרות לקוחות</Typography>
      <Stack direction="row" spacing={2} sx={{ mb: 2 }}>
        <TextField label="חפש לפי שם לקוח" value={filterName} onChange={e => setFilterName(e.target.value)} size="small" />
        <TextField label="חפש לפי שם סוכן" value={filterAgent} onChange={e => setFilterAgent(e.target.value)} size="small" />
        <TextField label="חפש לפי יתרה" value={filterBalance} onChange={e => setFilterBalance(e.target.value)} size="small" />
        <Button variant="contained" color="primary" onClick={handlePrint} disabled={selectedRows.length === 0}>הדפס נבחרים</Button>
        <Typography variant="subtitle1" sx={{ ml: 2, alignSelf: 'center' }}>
          יתרה כוללת לנבחרים: {totalBalance.toLocaleString('he-IL', { style: 'currency', currency: 'ILS' })}
        </Typography>
      </Stack>
      <div id="print-area">
        <DataGrid
          rows={filteredRows}
          columns={columns}
          autoHeight
          checkboxSelection
          disableRowSelectionOnClick
          sx={{ bgcolor: 'white', borderRadius: 2, boxShadow: 2, fontFamily: 'inherit', direction: 'rtl' }}
          filterMode="client"
          onSelectionModelChange={ids => setSelectionModel(ids.map(String))}
          selectionModel={selectionModel}
        />
      </div>
    </Box>
  );
}

export default App;
