// ============================================
// GOOGLE APPS SCRIPT - MUTASI SISWA SMKN 1 PALOPO
// ============================================

var SPREADSHEET_ID = '1oyHRvYe3oMkKBU0DOK_JIBrfZ-yDiWuO8EEkOkTwwiY';
var DRIVE_FOLDER_ID = '1sGqbpA6uctgvOmYUwyxNP8pC5ORZUy56';

// ============================================
// TELEGRAM BOT CONFIGURATION
// ============================================
var TELEGRAM_BOT_TOKEN = '8798086610:AAHTiioEb5YqjiEU6K6YFAWdf0f-zmpyp-I';
var TELEGRAM_CHAT_ID = '1027594762';

// ============================================
// SEND TELEGRAM NOTIFICATION
// ============================================
function sendTelegramNotification(message) {
  try {
    var url = 'https://api.telegram.org/bot' + TELEGRAM_BOT_TOKEN + '/sendMessage';
    var payload = {
      chat_id: TELEGRAM_CHAT_ID,
      text: message,
      parse_mode: 'HTML'
    };
    
    var options = {
      method: 'post',
      contentType: 'application/json',
      payload: JSON.stringify(payload),
      muteHttpExceptions: true
    };
    
    var response = UrlFetchApp.fetch(url, options);
    var responseText = response.getContentText();
    var responseJson = JSON.parse(responseText);
    
    // Log untuk debugging
    Logger.log('Telegram Response: ' + responseText);
    
    if (!responseJson.ok) {
      Logger.log('Telegram Error: ' + responseJson.description);
    }
    
    return responseJson;
  } catch (error) {
    // Log error untuk debugging
    Logger.log('Error sending Telegram notification: ' + error.toString());
    return { ok: false, error: error.toString() };
  }
}

// ============================================
// TEST TELEGRAM NOTIFICATION - Jalankan fungsi ini untuk test
// ============================================
function testTelegramNotification() {
  var message = '🔔 <b>TEST NOTIFIKASI</b>\n\n';
  message += '✅ Bot Telegram SMKN 1 Palopo berfungsi dengan baik!\n\n';
  message += '📅 Waktu: ' + new Date().toLocaleString('id-ID', { timeZone: 'Asia/Makassar' }) + '\n\n';
  message += '— <b>SMKN 1 Palopo</b>';
  
  var result = sendTelegramNotification(message);
  Logger.log('Result: ' + JSON.stringify(result));
}

// ============================================
// FORMAT NOTIFICATION MESSAGE
// ============================================
function formatMutasiMasukNotification(data) {
  var today = new Date();
  var day = today.getDate().toString();
  if (day.length === 1) day = '0' + day;
  var month = (today.getMonth() + 1).toString();
  if (month.length === 1) month = '0' + month;
  var year = today.getFullYear();
  var dateStr = day + '/' + month + '/' + year;
  
  var message = '🔔 <b>NOTIFIKASI MUTASI BARU</b>\n\n';
  message += '📌 <b>Jenis:</b> Mutasi Masuk\n';
  message += '👤 <b>Nama:</b> ' + (data.nama_siswa || '-') + '\n';
  message += '🆔 <b>NISN:</b> ' + (data.nisn || '-') + '\n';
  message += '🏫 <b>Asal Sekolah:</b> ' + (data.nama_sekolah || '-') + '\n';
  message += '📍 <b>Rombel Tujuan:</b> ' + (data.rombel_tujuan || '-') + '\n';
  message += '📅 <b>Tanggal:</b> ' + dateStr + '\n\n';
  message += '— <b>SMKN 1 Palopo</b>';
  return message;
}

function formatMutasiKeluarNotification(data) {
  var message = '🔔 <b>NOTIFIKASI MUTASI BARU</b>\n\n';
  message += '📌 <b>Jenis:</b> Mutasi Keluar\n';
  message += '👤 <b>Nama:</b> ' + (data.nama || '-') + '\n';
  message += '🆔 <b>NISN:</b> ' + (data.nisn || '-') + '\n';
  message += '🏫 <b>Rombel:</b> ' + (data.rombel || '-') + '\n';
  message += '📝 <b>Ket. Mutasi:</b> ' + (data.ket_mutasi || '-') + '\n';
  message += '➡️ <b>Pindah Ke:</b> ' + (data.pindah_ke || '-') + '\n';
  message += '📅 <b>Tanggal Mutasi:</b> ' + (data.tgl_mutasi || '-') + '\n\n';
  message += '— <b>SMKN 1 Palopo</b>';
  return message;
}

function doGet(e) {
  var action = e && e.parameter ? e.parameter.action : null;
  
  try {
    if (action === 'searchSiswa') {
      return searchSiswa(e.parameter.nipd);
    } else if (action === 'getMasuk') {
      return getMasuk();
    } else if (action === 'getKeluar') {
      return getKeluar();
    } else if (action === 'deleteKeluar') {
      return deleteKeluar(e.parameter.row);
    } else if (action === 'deleteMasuk') {
      return deleteMasuk(e.parameter.row);
    } else if (action === 'getRombel') {
      return getRombel();
    } else if (action === 'verifyLogin') {
      return verifyLogin(e.parameter.password);
    } else if (action === 'loginUser') {
      return loginUser(e.parameter.password);
    } else if (action === 'uploadFile') {
      return uploadFileToDrive(e);
    } else {
      return ContentService.createTextOutput(JSON.stringify({
        success: false,
        error: 'Action tidak valid'
      })).setMimeType(ContentService.MimeType.JSON);
    }
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      error: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

function doPost(e) {
  try {
    // Check if it's a file upload (multipart/form-data)
    if (e.postData && e.postData.type && e.postData.type.indexOf('multipart/form-data') !== -1) {
      return uploadFileToDrive(e);
    }
    
    var data = JSON.parse(e.postData.contents);
    var action = data.action;
    
    if (action === 'addMasuk') {
      return addMasuk(data);
    } else if (action === 'addKeluar') {
      return addKeluar(data);
    } else if (action === 'updateKeluar') {
      return updateKeluar(data);
    } else if (action === 'updateMasuk') {
      return updateMasuk(data);
    } else if (action === 'uploadFile') {
      return uploadFileToDrive(e);
    } else {
      return ContentService.createTextOutput(JSON.stringify({
        success: false,
        error: 'Action tidak valid'
      })).setMimeType(ContentService.MimeType.JSON);
    }
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      error: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

// ============================================
// UPLOAD FILE TO GOOGLE DRIVE
// ============================================
function uploadFileToDrive(e) {
  try {
    var folder = DriveApp.getFolderById(DRIVE_FOLDER_ID);
    
    // Handle base64 file upload via JSON
    var data;
    if (e.postData && e.postData.contents) {
      data = JSON.parse(e.postData.contents);
    } else if (e.parameter) {
      data = {
        fileName: e.parameter.fileName,
        mimeType: e.parameter.mimeType,
        fileData: e.parameter.fileData,
        nisn: e.parameter.nisn,
        nama: e.parameter.nama,
        oldFileUrl: e.parameter.oldFileUrl
      };
    } else {
      return ContentService.createTextOutput(JSON.stringify({
        success: false,
        error: 'Data tidak ditemukan'
      })).setMimeType(ContentService.MimeType.JSON);
    }
    
    if (!data.fileData) {
      return ContentService.createTextOutput(JSON.stringify({
        success: false,
        error: 'File data tidak ditemukan'
      })).setMimeType(ContentService.MimeType.JSON);
    }
    
    // Delete old file if exists (for replacement)
    if (data.oldFileUrl && data.oldFileUrl.indexOf('drive.google.com/file/d/') !== -1) {
      try {
        var oldFileIdMatch = data.oldFileUrl.match(/\/d\/([a-zA-Z0-9_-]+)/);
        if (oldFileIdMatch && oldFileIdMatch[1]) {
          var oldFileId = oldFileIdMatch[1];
          var oldFile = DriveApp.getFileById(oldFileId);
          if (oldFile) {
            oldFile.setTrashed(true);
          }
        }
      } catch (oldFileError) {
        // Ignore error if old file not found, continue with upload
      }
    }
    
    // Decode base64 data
    var base64Data = data.fileData;
    if (base64Data.indexOf('base64,') !== -1) {
      base64Data = base64Data.split('base64,')[1];
    }
    
    // Create filename with format: nisn_nama.extension
    var originalFileName = data.fileName || 'file';
    var fileExtension = '';
    if (originalFileName.indexOf('.') !== -1) {
      fileExtension = originalFileName.substring(originalFileName.lastIndexOf('.'));
    }
    
    var newFileName;
    if (data.nisn && data.nama) {
      // Sanitize nama (remove special characters)
      var sanitizedNama = data.nama.toString().replace(/[^a-zA-Z0-9]/g, '_');
      newFileName = data.nisn + '_' + sanitizedNama + fileExtension;
    } else {
      newFileName = originalFileName;
    }
    
    var decoded = Utilities.base64Decode(base64Data);
    var blob = Utilities.newBlob(decoded, data.mimeType || 'application/octet-stream', newFileName);
    
    // Create file in Drive
    var file = folder.createFile(blob);
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    
    var fileId = file.getId();
    var fileUrl = 'https://drive.google.com/file/d/' + fileId + '/view';
    
    return ContentService.createTextOutput(JSON.stringify({
      success: true,
      fileId: fileId,
      fileName: newFileName,
      fileUrl: fileUrl,
      webViewLink: fileUrl
    })).setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      error: 'Gagal upload file: ' + error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

// ============================================
// SEARCH SISWA
// ============================================
function searchSiswa(nipd) {
  // Cek apakah nipd valid
  if (!nipd) {
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      error: 'NIPD tidak diberikan'
    })).setMimeType(ContentService.MimeType.JSON);
  }
  
  var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  var sheet = ss.getSheetByName('Data');
  
  if (!sheet) {
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      error: 'Sheet Data tidak ditemukan'
    })).setMimeType(ContentService.MimeType.JSON);
  }
  
  var HEADER_ROW = 5;
  var DATA_START_ROW = 6;
  var COL_NIPD = 4;
  var COL_NISN = 5;
  var COL_NAMA = 6;
  var COL_TEMPAT_LAHIR = 8;
  var COL_TGL_LAHIR = 9;
  var COL_ROMBEL = 2;
  
  var lastRow = sheet.getLastRow();
  
  if (lastRow < DATA_START_ROW) {
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      error: 'Tidak ada data siswa'
    })).setMimeType(ContentService.MimeType.JSON);
  }
  
  var dataRange = sheet.getRange(DATA_START_ROW, 1, lastRow - DATA_START_ROW + 1, 9);
  var allData = dataRange.getValues();
  
  var searchNipd = nipd.toString().trim();
  var foundData = null;
  
  for (var i = 0; i < allData.length; i++) {
    var rowNipd = allData[i][COL_NIPD - 1];
    
    if (rowNipd && rowNipd.toString().trim() === searchNipd) {
      foundData = {
        nipd: allData[i][COL_NIPD - 1] || '',
        nisn: allData[i][COL_NISN - 1] || '',
        nama: allData[i][COL_NAMA - 1] || '',
        tempat_lahir: allData[i][COL_TEMPAT_LAHIR - 1] || '',
        tgl_lahir: formatDate(allData[i][COL_TGL_LAHIR - 1]),
        rombel: allData[i][COL_ROMBEL - 1] || ''
      };
      break;
    }
  }
  
  if (foundData) {
    return ContentService.createTextOutput(JSON.stringify({
      success: true,
      data: foundData
    })).setMimeType(ContentService.MimeType.JSON);
  } else {
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      error: 'Siswa dengan NIPD tidak ditemukan'
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

// ============================================
// FORMAT DATE
// ============================================
function formatDate(dateValue) {
  if (!dateValue) return '';
  
  try {
    if (typeof dateValue === 'object' && dateValue instanceof Date) {
      var day = dateValue.getDate().toString();
      if (day.length === 1) day = '0' + day;
      var month = (dateValue.getMonth() + 1).toString();
      if (month.length === 1) month = '0' + month;
      var year = dateValue.getFullYear();
      return day + '/' + month + '/' + year;
    }
    
    if (typeof dateValue === 'string') {
      if (dateValue.indexOf('/') > -1) {
        return dateValue;
      }
      var date = new Date(dateValue);
      if (!isNaN(date.getTime())) {
        var day = date.getDate().toString();
        if (day.length === 1) day = '0' + day;
        var month = (date.getMonth() + 1).toString();
        if (month.length === 1) month = '0' + month;
        var year = date.getFullYear();
        return day + '/' + month + '/' + year;
      }
    }
    
    return dateValue.toString();
  } catch (e) {
    return dateValue ? dateValue.toString() : '';
  }
}

// ============================================
// GET MUTASI KELUAR
// ============================================
function getKeluar() {
  var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  var sheet = ss.getSheetByName('mutasikeluar');
  
  if (!sheet) {
    return ContentService.createTextOutput(JSON.stringify([])).setMimeType(ContentService.MimeType.JSON);
  }
  
  var lastRow = sheet.getLastRow();
  if (lastRow <= 1) {
    return ContentService.createTextOutput(JSON.stringify([])).setMimeType(ContentService.MimeType.JSON);
  }
  
  var lastCol = sheet.getLastColumn();
  var headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0];
  var data = sheet.getRange(2, 1, lastRow - 1, lastCol).getValues();
  
  var result = [];
  for (var i = 0; i < data.length; i++) {
    var obj = {};
    // Tambahkan rowIndex (actual row number in sheet)
    obj['_rowIndex'] = i + 2; // +2 karena row 1 adalah header, dan i mulai dari 0
    for (var j = 0; j < headers.length; j++) {
      if (headers[j]) {
        var key = headers[j].toString().toLowerCase().replace(/ /g, '_');
        obj[key] = data[i][j];
      }
    }
    result.push(obj);
  }
  
  return ContentService.createTextOutput(JSON.stringify(result)).setMimeType(ContentService.MimeType.JSON);
}

// ============================================
// GET MUTASI MASUK
// ============================================
function getMasuk() {
  var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  var sheet = ss.getSheetByName('mutasimasuk');
  
  if (!sheet) {
    return ContentService.createTextOutput(JSON.stringify([])).setMimeType(ContentService.MimeType.JSON);
  }
  
  var lastRow = sheet.getLastRow();
  if (lastRow <= 1) {
    return ContentService.createTextOutput(JSON.stringify([])).setMimeType(ContentService.MimeType.JSON);
  }
  
  var lastCol = sheet.getLastColumn();
  var headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0];
  var data = sheet.getRange(2, 1, lastRow - 1, lastCol).getValues();
  
  var result = [];
  for (var i = 0; i < data.length; i++) {
    var obj = {};
    // Tambahkan rowIndex (actual row number in sheet)
    obj['_rowIndex'] = i + 2; // +2 karena row 1 adalah header, dan i mulai dari 0
    for (var j = 0; j < headers.length; j++) {
      if (headers[j]) {
        var key = headers[j].toString().toLowerCase().replace(/ /g, '_');
        obj[key] = data[i][j];
      }
    }
    result.push(obj);
  }
  
  return ContentService.createTextOutput(JSON.stringify(result)).setMimeType(ContentService.MimeType.JSON);
}

// ============================================
// DELETE MUTASI KELUAR
// ============================================
function deleteKeluar(rowNum) {
  var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  var sheet = ss.getSheetByName('mutasikeluar');
  
  if (!sheet) {
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      error: 'Sheet tidak ditemukan'
    })).setMimeType(ContentService.MimeType.JSON);
  }
  
  var row = parseInt(rowNum);
  var lastRow = sheet.getLastRow();
  
  // Validasi row number
  if (isNaN(row) || row < 1 || row > lastRow) {
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      error: 'Nomor baris tidak valid: ' + rowNum + ' (total baris: ' + lastRow + ')'
    })).setMimeType(ContentService.MimeType.JSON);
  }
  
  sheet.deleteRow(row);
  
  return ContentService.createTextOutput(JSON.stringify({
    success: true,
    message: 'Data berhasil dihapus'
  })).setMimeType(ContentService.MimeType.JSON);
}

// ============================================
// DELETE MUTASI MASUK
// ============================================
function deleteMasuk(rowNum) {
  var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  var sheet = ss.getSheetByName('mutasimasuk');
  
  if (!sheet) {
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      error: 'Sheet tidak ditemukan'
    })).setMimeType(ContentService.MimeType.JSON);
  }
  
  var row = parseInt(rowNum);
  var lastRow = sheet.getLastRow();
  
  // Validasi row number
  if (isNaN(row) || row < 1 || row > lastRow) {
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      error: 'Nomor baris tidak valid: ' + rowNum + ' (total baris: ' + lastRow + ')'
    })).setMimeType(ContentService.MimeType.JSON);
  }
  
  sheet.deleteRow(row);
  
  return ContentService.createTextOutput(JSON.stringify({
    success: true,
    message: 'Data berhasil dihapus'
  })).setMimeType(ContentService.MimeType.JSON);
}

// ============================================
// ADD MUTASI KELUAR
// ============================================
function addKeluar(data) {
  var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  var sheet = ss.getSheetByName('mutasikeluar');
  
  if (!sheet) {
    sheet = ss.insertSheet('mutasikeluar');
    sheet.appendRow(['No', 'NIPD', 'NISN', 'Nama', 'Tempat_Lahir', 'tgl_Lahir', 'Rombel', 'Ket_Mutasi', 'Pindah_Ke', 'tgl_mutasi', 'alasan_mutasi', 'upload_berkas', 'timestamp', 'Ket']);
    sheet.getRange('B:B').setNumberFormat('@');
    sheet.getRange('C:C').setNumberFormat('@');
  }
  
  sheet.getRange('B:B').setNumberFormat('@');
  sheet.getRange('C:C').setNumberFormat('@');
  
  var lastRow = sheet.getLastRow();
  var nextNo = lastRow;
  var newRowNum = lastRow + 1;
  
  var rowData = [
    nextNo,
    data.nipd ? String(data.nipd) : '',
    data.nisn ? String(data.nisn) : '',
    data.nama || '',
    data.tempat_lahir || '',
    data.tgl_lahir || '',
    data.rombel || '',
    data.ket_mutasi || '',
    data.pindah_ke || '',
    data.tgl_mutasi || '',
    data.alasan_mutasi || '',
    data.upload_berkas || '',
    new Date().toISOString(),
    data.ket || ''
  ];
  
  sheet.getRange(newRowNum, 1, 1, 14).setValues([rowData]);
  sheet.getRange(newRowNum, 2, 1, 2).setNumberFormat('@');
  
  // Kirim notifikasi Telegram
  sendTelegramNotification(formatMutasiKeluarNotification(data));
  
  return ContentService.createTextOutput(JSON.stringify({
    success: true,
    message: 'Data mutasi keluar berhasil disimpan',
    no: nextNo
  })).setMimeType(ContentService.MimeType.JSON);
}

// ============================================
// UPDATE MUTASI KELUAR
// ============================================
function updateKeluar(data) {
  var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  var sheet = ss.getSheetByName('mutasikeluar');
  
  if (!sheet) {
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      error: 'Sheet tidak ditemukan'
    })).setMimeType(ContentService.MimeType.JSON);
  }
  
  var rowNum = parseInt(data.row);
  
  var rowData = [
    data.nipd ? String(data.nipd) : '',
    data.nisn ? String(data.nisn) : '',
    data.nama || '',
    data.tempat_lahir || '',
    data.tgl_lahir || '',
    data.rombel || '',
    data.ket_mutasi || '',
    data.pindah_ke || '',
    data.tgl_mutasi || '',
    data.alasan_mutasi || '',
    data.upload_berkas || '',
    new Date().toISOString(),
    data.ket || ''
  ];
  
  sheet.getRange(rowNum, 2, 1, 13).setValues([rowData]);
  sheet.getRange(rowNum, 2, 1, 2).setNumberFormat('@');
  
  return ContentService.createTextOutput(JSON.stringify({
    success: true,
    message: 'Data berhasil diupdate'
  })).setMimeType(ContentService.MimeType.JSON);
}

// ============================================
// ADD MUTASI MASUK
// ============================================
function addMasuk(data) {
  var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  var sheet = ss.getSheetByName('mutasimasuk');
  
  if (!sheet) {
    sheet = ss.insertSheet('mutasimasuk');
    sheet.appendRow(['No', 'NISN', 'Nama_Siswa', 'Provinsi', 'Kab_kota', 'Kecamatan', 'Nama_Sekolah', 'Rombel_Tujuan', 'Timestamp', 'Ket']);
    sheet.getRange('B:B').setNumberFormat('@');
  }
  
  sheet.getRange('B:B').setNumberFormat('@');
  
  var lastRow = sheet.getLastRow();
  var nextNo = lastRow;
  var newRowNum = lastRow + 1;
  
  var rowData = [
    nextNo,
    data.nisn ? String(data.nisn) : '',
    data.nama_siswa || '',
    data.provinsi || '',
    data.kab_kota || '',
    data.kecamatan || '',
    data.nama_sekolah || '',
    data.rombel_tujuan || '',
    new Date().toISOString(),
    ''
  ];
  
  sheet.getRange(newRowNum, 1, 1, 10).setValues([rowData]);
  sheet.getRange(newRowNum, 2).setNumberFormat('@');
  
  // Kirim notifikasi Telegram
  sendTelegramNotification(formatMutasiMasukNotification(data));
  
  return ContentService.createTextOutput(JSON.stringify({
    success: true,
    message: 'Data mutasi masuk berhasil disimpan',
    no: nextNo
  })).setMimeType(ContentService.MimeType.JSON);
}

// ============================================
// UPDATE MUTASI MASUK
// ============================================
function updateMasuk(data) {
  var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  var sheet = ss.getSheetByName('mutasimasuk');
  
  if (!sheet) {
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      error: 'Sheet tidak ditemukan'
    })).setMimeType(ContentService.MimeType.JSON);
  }
  
  var rowNum = parseInt(data.row);
  
  var rowData = [
    data.nisn ? String(data.nisn) : '',
    data.nama_siswa || '',
    data.provinsi || '',
    data.kab_kota || '',
    data.kecamatan || '',
    data.nama_sekolah || '',
    data.rombel_tujuan || '',
    new Date().toISOString(),
    data.ket || ''
  ];
  
  sheet.getRange(rowNum, 2, 1, 9).setValues([rowData]);
  sheet.getRange(rowNum, 2).setNumberFormat('@');
  
  return ContentService.createTextOutput(JSON.stringify({
    success: true,
    message: 'Data berhasil diupdate'
  })).setMimeType(ContentService.MimeType.JSON);
}

// ============================================
// GET ROMBEL FROM WALIKELAS
// ============================================
function getRombel() {
  var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  var sheet = ss.getSheetByName('walikelas');
  
  if (!sheet) {
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      error: 'Sheet walikelas tidak ditemukan'
    })).setMimeType(ContentService.MimeType.JSON);
  }
  
  var lastRow = sheet.getLastRow();
  if (lastRow <= 1) {
    return ContentService.createTextOutput(JSON.stringify({
      success: true,
      data: []
    })).setMimeType(ContentService.MimeType.JSON);
  }
  
  // Cari kolom Rombel
  var lastCol = sheet.getLastColumn();
  var headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0];
  var rombelColIndex = -1;
  
  for (var i = 0; i < headers.length; i++) {
    if (headers[i] && headers[i].toString().toLowerCase() === 'rombel') {
      rombelColIndex = i + 1;
      break;
    }
  }
  
  if (rombelColIndex === -1) {
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      error: 'Kolom Rombel tidak ditemukan'
    })).setMimeType(ContentService.MimeType.JSON);
  }
  
  // Ambil data rombel
  var rombelData = sheet.getRange(2, rombelColIndex, lastRow - 1, 1).getValues();
  var rombelList = [];
  
  for (var j = 0; j < rombelData.length; j++) {
    var rombel = rombelData[j][0];
    if (rombel && rombel.toString().trim() !== '') {
      rombelList.push(rombel.toString().trim());
    }
  }
  
  return ContentService.createTextOutput(JSON.stringify({
    success: true,
    data: rombelList
  })).setMimeType(ContentService.MimeType.JSON);
}

// ============================================
// VERIFY LOGIN FOR KETERANGAN ACCESS
// ============================================
function verifyLogin(password) {
  var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  var sheet = ss.getSheetByName('loginmutasi');
  
  if (!sheet) {
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      error: 'Sheet loginmutasi tidak ditemukan'
    })).setMimeType(ContentService.MimeType.JSON);
  }
  
  var lastRow = sheet.getLastRow();
  if (lastRow <= 1) {
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      error: 'Data login tidak ditemukan'
    })).setMimeType(ContentService.MimeType.JSON);
  }
  
  // Cari kolom login dan kelas
  var lastCol = sheet.getLastColumn();
  var headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0];
  var loginColIndex = -1;
  var kelasColIndex = -1;
  
  for (var i = 0; i < headers.length; i++) {
    var headerName = headers[i] ? headers[i].toString().toLowerCase() : '';
    if (headerName === 'login') {
      loginColIndex = i + 1;
    } else if (headerName === 'kelas') {
      kelasColIndex = i + 1;
    }
  }
  
  if (loginColIndex === -1 || kelasColIndex === -1) {
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      error: 'Header login atau kelas tidak ditemukan'
    })).setMimeType(ContentService.MimeType.JSON);
  }
  
  // Cek password
  var data = sheet.getRange(2, 1, lastRow - 1, lastCol).getValues();
  
  for (var j = 0; j < data.length; j++) {
    var rowLogin = data[j][loginColIndex - 1];
    var rowKelas = data[j][kelasColIndex - 1];
    
    if (rowLogin && rowLogin.toString() === password) {
      // Cek jika kelas = 1 (allowed)
      if (rowKelas && rowKelas.toString() === '1') {
        return ContentService.createTextOutput(JSON.stringify({
          success: true,
          message: 'Login berhasil'
        })).setMimeType(ContentService.MimeType.JSON);
      } else {
        return ContentService.createTextOutput(JSON.stringify({
          success: false,
          error: 'Tidak memiliki akses'
        })).setMimeType(ContentService.MimeType.JSON);
      }
    }
  }
  
  return ContentService.createTextOutput(JSON.stringify({
    success: false,
    error: 'Password salah'
  })).setMimeType(ContentService.MimeType.JSON);
}

// ============================================
// LOGIN USER - Returns nama for welcome message
// ============================================
function loginUser(password) {
  var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  var sheet = ss.getSheetByName('loginmutasi');
  
  if (!sheet) {
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      error: 'Sheet loginmutasi tidak ditemukan'
    })).setMimeType(ContentService.MimeType.JSON);
  }
  
  var lastRow = sheet.getLastRow();
  if (lastRow <= 1) {
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      error: 'Data login tidak ditemukan'
    })).setMimeType(ContentService.MimeType.JSON);
  }
  
  // Cari kolom login, kelas, dan nama
  var lastCol = sheet.getLastColumn();
  var headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0];
  var loginColIndex = -1;
  var kelasColIndex = -1;
  var namaColIndex = -1;
  
  for (var i = 0; i < headers.length; i++) {
    var headerName = headers[i] ? headers[i].toString().toLowerCase() : '';
    if (headerName === 'login') {
      loginColIndex = i + 1;
    } else if (headerName === 'kelas') {
      kelasColIndex = i + 1;
    } else if (headerName === 'nama') {
      namaColIndex = i + 1;
    }
  }
  
  if (loginColIndex === -1) {
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      error: 'Header login tidak ditemukan'
    })).setMimeType(ContentService.MimeType.JSON);
  }
  
  // Cek password
  var data = sheet.getRange(2, 1, lastRow - 1, lastCol).getValues();
  
  for (var j = 0; j < data.length; j++) {
    var rowLogin = data[j][loginColIndex - 1];
    var rowKelas = kelasColIndex > 0 ? data[j][kelasColIndex - 1] : '';
    var rowNama = namaColIndex > 0 ? data[j][namaColIndex - 1] : '';
    
    if (rowLogin && rowLogin.toString() === password) {
      return ContentService.createTextOutput(JSON.stringify({
        success: true,
        message: 'Login berhasil',
        nama: rowNama ? rowNama.toString() : 'User',
        kelas: rowKelas ? rowKelas.toString() : ''
      })).setMimeType(ContentService.MimeType.JSON);
    }
  }
  
  return ContentService.createTextOutput(JSON.stringify({
    success: false,
    error: 'Password salah'
  })).setMimeType(ContentService.MimeType.JSON);
}
