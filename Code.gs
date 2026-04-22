function doGet() {
  return HtmlService.createHtmlOutputFromFile('Index')
      .setTitle('Plaque Control Record')
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

function saveRecord(data) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let sheet = ss.getSheetByName('Data');

    if (!sheet) {
      sheet = ss.insertSheet('Data');
      sheet.appendRow(['Timestamp', 'HN', 'Visit Date', 'Score', 'Chart Data', 'Patient Name']);
    }

    // Save date as simple string (YYYY-MM-DD) to prevent timezone shifts
    // Patient Name appended as last column for backward compatibility with existing data
    sheet.appendRow([
      new Date(),
      String(data.hn).trim(),
      String(data.date),
      String(data.score),
      JSON.stringify(data.chart),
      String(data.name || '').trim()
    ]);

    return "✅ Saved successfully!";
  } catch (e) {
    return "❌ Error saving: " + e.message;
  }
}

function searchByHN(hn) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName('Data');
    if (!sheet) return [];

    // Get raw values to ensure we handle dates correctly in frontend
    const data = sheet.getDataRange().getValues();

    const results = [];
    const searchHN = String(hn).trim().toLowerCase();

    // Loop through rows (skip header row 0)
    for (let i = 1; i < data.length; i++) {
      const rowHN = String(data[i][1]).trim().toLowerCase();

      if (rowHN === searchHN) {
        // Handle Date: Convert Object or String to YYYY-MM-DD for consistency
        let dateVal = data[i][2];
        let dateStr = "";

        if (dateVal instanceof Date) {
          // Convert JS Date object to YYYY-MM-DD manually to avoid timezone issues
          let y = dateVal.getFullYear();
          let m = String(dateVal.getMonth() + 1).padStart(2, '0');
          let d = String(dateVal.getDate()).padStart(2, '0');
          dateStr = `${y}-${m}-${d}`;
        } else {
          dateStr = String(dateVal); // It's already a string
        }

        results.push({
          date: dateStr,
          score: data[i][3],
          chart: data[i][4],
          name: data[i][5] || ''  // Patient Name (empty for records saved before this feature)
        });
      }
    }

    return results.reverse();

  } catch (e) {
    return [{ error: e.message }];
  }
}
