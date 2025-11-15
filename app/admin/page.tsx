'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import ExcelJS from 'exceljs';

interface FormSubmission {
  id: string;
  employee_id: string;
  employee_name: string;
  full_name: string;
  sector?: string;
  department?: string;
  division?: string;
  position?: string;
  program_studi: string;
  instagram: string;
  birth_place: string;
  birth_date: string;
  quotes: string;
  created_at: string;
}

interface DepartmentStats {
  department: string;
  count: number;
}

export default function AdminPage() {
  const [submissions, setSubmissions] = useState<FormSubmission[]>([]);
  const [stats, setStats] = useState<DepartmentStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalSubmissions, setTotalSubmissions] = useState(0);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const ADMIN_PASSWORD = 'akuNgoding21.'; // Ganti dengan password yang Anda inginkan

  // Check localStorage on mount
  useEffect(() => {
    const savedAuth = localStorage.getItem('adminAuthenticated');
    if (savedAuth === 'true') {
      setIsAuthenticated(true);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      fetchData();
    }
  }, [isAuthenticated]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === ADMIN_PASSWORD) {
      setIsAuthenticated(true);
      localStorage.setItem('adminAuthenticated', 'true');
      setError('');
    } else {
      setError('Password salah!');
      setPassword('');
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    localStorage.removeItem('adminAuthenticated');
  };

  const fetchData = async () => {
    try {
      setLoading(true);

      // Fetch all submissions
      const { data, error } = await supabase
        .from('form_submissions')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      setSubmissions(data || []);
      setTotalSubmissions(data?.length || 0);

      // Calculate department stats
      const deptMap = new Map<string, number>();
      data?.forEach((submission) => {
        const dept = submission.position || submission.department || 'Unknown';
        const count = deptMap.get(dept) || 0;
        deptMap.set(dept, count + 1);
      });

      const statsArray = Array.from(deptMap.entries()).map(([department, count]) => ({
        department,
        count,
      })).sort((a, b) => b.count - a.count);

      setStats(statsArray);
    } catch (error) {
      console.error('Error fetching data:', error);
      alert('Gagal mengambil data');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadExcel = async () => {
    if (submissions.length === 0) {
      alert('Tidak ada data untuk didownload');
      return;
    }

    try {
      // Create workbook
      const workbook = new ExcelJS.Workbook();
      workbook.creator = 'Admin';
      workbook.created = new Date();

      // Group by department/position
      const grouped = new Map<string, typeof submissions>();
      submissions.forEach(sub => {
        const key = sub.position || sub.department || 'Unknown';
        if (!grouped.has(key)) {
          grouped.set(key, []);
        }
        grouped.get(key)?.push(sub);
      });

      const sortedDepts = Array.from(grouped.entries()).sort((a, b) => a[0].localeCompare(b[0]));

      // Create Summary Sheet
      const summarySheet = workbook.addWorksheet('Summary');
      summarySheet.columns = [
        { width: 40 },
        { width: 15 }
      ];

      summarySheet.addRow(['Form Data Panitia', '']);
      summarySheet.addRow(['Total Data:', submissions.length]);
      summarySheet.addRow(['Total Departemen:', grouped.size]);
      summarySheet.addRow(['Tanggal Export:', new Date().toLocaleString('id-ID', { dateStyle: 'full', timeStyle: 'short' })]);
      summarySheet.addRow(['', '']);
      summarySheet.addRow(['Departemen/Posisi', 'Jumlah']);

      // Add department counts
      sortedDepts.forEach(([deptName, deptData]) => {
        summarySheet.addRow([deptName, deptData.length]);
      });

      // Style summary sheet
      summarySheet.eachRow((row, rowNumber) => {
        row.eachCell((cell) => {
          cell.border = {
            top: { style: 'thin' },
            left: { style: 'thin' },
            bottom: { style: 'thin' },
            right: { style: 'thin' }
          };
          if (rowNumber === 1 || rowNumber === 6) {
            cell.fill = {
              type: 'pattern',
              pattern: 'solid',
              fgColor: { argb: 'FF667eea' }
            };
            cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
          }
        });
      });

      // Create sheet for each department
      sortedDepts.forEach(([deptName, deptData]) => {
        const sheetName = deptName.replace(/[:\\\\/?*\[\]]/g, '-').substring(0, 31);
        const worksheet = workbook.addWorksheet(sheetName);

        // Set column widths
        worksheet.columns = [
          { width: 5 },   // No
          { width: 20 },  // Nama
          { width: 25 },  // Nama Lengkap
          { width: 20 },  // Posisi
          { width: 15 },  // Sektor
          { width: 20 },  // Departemen
          { width: 20 },  // Divisi
          { width: 25 },  // Program Studi
          { width: 20 },  // Instagram
          { width: 20 },  // Tempat Lahir
          { width: 15 },  // Tanggal Lahir
          { width: 40 },  // Quotes
          { width: 20 }   // Tanggal Input
        ];

        // Add header rows
        worksheet.addRow([deptName]);
        worksheet.addRow([`Total: ${deptData.length} orang`]);
        worksheet.addRow([]);

        // Add table header
        const headerRow = worksheet.addRow([
          'No', 'Nama', 'Nama Lengkap', 'Posisi', 'Sektor', 'Departemen', 
          'Divisi', 'Program Studi', 'Instagram', 'Tempat Lahir', 
          'Tanggal Lahir', 'Quotes', 'Tanggal Input'
        ]);

        // Style header row
        headerRow.eachCell((cell) => {
          cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FF667eea' }
          };
          cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
          cell.border = {
            top: { style: 'thin' },
            left: { style: 'thin' },
            bottom: { style: 'thin' },
            right: { style: 'thin' }
          };
        });

        // Add data rows
        deptData.forEach((sub, index) => {
          const dataRow = worksheet.addRow([
            index + 1,
            sub.employee_name,
            sub.full_name,
            sub.position || '-',
            sub.sector || '-',
            sub.department || '-',
            sub.division || '-',
            sub.program_studi,
            sub.instagram,
            sub.birth_place,
            sub.birth_date,
            sub.quotes,
            new Date(sub.created_at).toLocaleString('id-ID')
          ]);

          // Add borders to data cells
          dataRow.eachCell((cell) => {
            cell.border = {
              top: { style: 'thin' },
              left: { style: 'thin' },
              bottom: { style: 'thin' },
              right: { style: 'thin' }
            };
          });
        });

        // Style title rows
        worksheet.getRow(1).eachCell((cell) => {
          cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FF667eea' }
          };
          cell.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 14 };
          cell.border = {
            top: { style: 'thin' },
            left: { style: 'thin' },
            bottom: { style: 'thin' },
            right: { style: 'thin' }
          };
        });

        worksheet.getRow(2).eachCell((cell) => {
          cell.border = {
            top: { style: 'thin' },
            left: { style: 'thin' },
            bottom: { style: 'thin' },
            right: { style: 'thin' }
          };
        });
      });

      // Generate Excel file
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Form_Panitia_Per_Departemen_${new Date().toISOString().split('T')[0]}.xlsx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      alert('✅ File Excel berhasil didownload!');
    } catch (error) {
      console.error('Error creating Excel:', error);
      alert('Gagal membuat file Excel');
    }
  };

  const handleDownloadSpreadsheet = async () => {
    if (submissions.length === 0) {
      alert('Tidak ada data untuk didownload');
      return;
    }

    // Group by department/position
    const grouped = new Map<string, typeof submissions>();
    submissions.forEach(sub => {
      const key = sub.position || sub.department || 'Unknown';
      if (!grouped.has(key)) {
        grouped.set(key, []);
      }
      grouped.get(key)?.push(sub);
    });

    const headers = ['No', 'Nama', 'Nama Lengkap', 'Posisi', 'Sektor', 'Departemen', 'Divisi', 'Program Studi', 'Instagram', 'Tempat Lahir', 'Tanggal Lahir', 'Quotes', 'Tanggal Input'];
    
    // Create sections for each department
    let tableContent = '';
    let deptIndex = 0;
    const sortedDepts = Array.from(grouped.entries()).sort((a, b) => a[0].localeCompare(b[0]));
    
    sortedDepts.forEach(([deptName, deptData]) => {
      const allData = deptData.map((sub, index) => [
        index + 1,
        sub.employee_name,
        sub.full_name,
        sub.position || '-',
        sub.sector || '-',
        sub.department || '-',
        sub.division || '-',
        sub.program_studi,
        sub.instagram,
        sub.birth_place,
        sub.birth_date,
        sub.quotes,
        new Date(sub.created_at).toLocaleString('id-ID'),
      ]);

      tableContent += `
        <div class="department-section" id="dept-${deptIndex}">
          <h2 class="dept-header">${deptName} (${deptData.length} orang)</h2>
          <table class="data-table">
            <thead>
              <tr>${headers.map(h => `<th>${h}</th>`).join('')}</tr>
            </thead>
            <tbody>
              ${allData.map(row => 
                `<tr>${row.map(cell => `<td>${cell}</td>`).join('')}</tr>`
              ).join('')}
            </tbody>
          </table>
        </div>
      `;
      deptIndex++;
    });

    // Create navigation menu
    const navMenu = sortedDepts.map(([deptName], idx) => 
      `<a href="#dept-${idx}" class="nav-link">${deptName}</a>`
    ).join('');
    
    // Create HTML table
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Form Data Panitia - Per Departemen</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; 
            background: #f3f4f6;
            padding-bottom: 50px;
          }
          .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 30px 20px;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
            position: sticky;
            top: 0;
            z-index: 100;
          }
          h1 { font-size: 28px; margin-bottom: 10px; }
          .header p { opacity: 0.9; }
          .toolbar {
            display: flex;
            gap: 10px;
            margin-top: 20px;
            flex-wrap: wrap;
          }
          .export-btn {
            background: white;
            color: #667eea;
            padding: 12px 24px;
            border: none;
            border-radius: 8px;
            cursor: pointer;
            font-weight: 600;
            font-size: 14px;
            transition: all 0.2s;
            display: inline-flex;
            align-items: center;
            gap: 8px;
          }
          .export-btn:hover { 
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
          }
          .navigation {
            background: white;
            padding: 20px;
            margin: 20px;
            border-radius: 12px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          }
          .nav-title {
            font-size: 18px;
            font-weight: 600;
            margin-bottom: 15px;
            color: #1f2937;
          }
          .nav-links {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
            gap: 10px;
          }
          .nav-link {
            display: block;
            padding: 10px 15px;
            background: #f3f4f6;
            border-radius: 8px;
            text-decoration: none;
            color: #4b5563;
            font-weight: 500;
            transition: all 0.2s;
            border: 2px solid transparent;
          }
          .nav-link:hover {
            background: #e0e7ff;
            color: #667eea;
            border-color: #667eea;
          }
          .department-section {
            margin: 20px;
            background: white;
            border-radius: 12px;
            padding: 20px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            scroll-margin-top: 100px;
          }
          .dept-header {
            color: #667eea;
            font-size: 20px;
            margin-bottom: 15px;
            padding-bottom: 10px;
            border-bottom: 3px solid #667eea;
          }
          .data-table { 
            border-collapse: collapse; 
            width: 100%; 
            font-size: 14px;
          }
          .data-table th, .data-table td { 
            border: 1px solid #e5e7eb; 
            padding: 12px; 
            text-align: left; 
          }
          .data-table th { 
            background-color: #667eea; 
            color: white; 
            font-weight: 600;
            position: sticky;
            top: 95px;
            z-index: 10;
          }
          .data-table tr:nth-child(even) { background-color: #f9fafb; }
          .data-table tr:hover { background-color: #e0e7ff; }
          .back-to-top {
            position: fixed;
            bottom: 30px;
            right: 30px;
            background: #667eea;
            color: white;
            width: 50px;
            height: 50px;
            border-radius: 50%;
            border: none;
            cursor: pointer;
            font-size: 24px;
            box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
            display: none;
          }
          .back-to-top:hover {
            background: #5568d3;
            transform: translateY(-2px);
          }
          @media print {
            .header, .navigation, .export-btn, .back-to-top { display: none !important; }
            .data-table th { position: relative; }
            .department-section { page-break-inside: avoid; margin: 20px 0; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>📊 Form Data Panitia - Per Departemen</h1>
          <p>Total: ${submissions.length} data | ${grouped.size} departemen | ${new Date().toLocaleDateString('id-ID', { dateStyle: 'full' })}</p>
          <div class="toolbar">
            <button class="export-btn" onclick="copyAllData()">📋 Copy Semua Data</button>
            <button class="export-btn" onclick="window.print()">🖨️ Print</button>
            <button class="export-btn" onclick="exportAllToGoogleSheets()">📊 Buka di Google Sheets</button>
          </div>
        </div>

        <div class="navigation">
          <div class="nav-title">📑 Navigasi Cepat - Pilih Departemen:</div>
          <div class="nav-links">
            ${navMenu}
          </div>
        </div>

        ${tableContent}

        <button class="back-to-top" id="backToTop" onclick="window.scrollTo({top: 0, behavior: 'smooth'})">↑</button>

        <script>
          // Show back to top button
          window.addEventListener('scroll', () => {
            const btn = document.getElementById('backToTop');
            btn.style.display = window.scrollY > 300 ? 'block' : 'none';
          });

          function copyAllData() {
            const tables = document.querySelectorAll('.data-table');
            let allText = '';
            tables.forEach((table, idx) => {
              const deptName = document.querySelectorAll('.dept-header')[idx].textContent;
              allText += deptName + '\\n\\n';
              const rows = table.querySelectorAll('tr');
              rows.forEach(row => {
                const cells = row.querySelectorAll('th, td');
                allText += Array.from(cells).map(cell => cell.textContent).join('\\t') + '\\n';
              });
              allText += '\\n\\n';
            });
            
            navigator.clipboard.writeText(allText).then(() => {
              alert('✅ Semua data telah disalin ke clipboard!\\n\\nAnda bisa paste ke Excel atau Google Sheets.');
            });
          }

          function exportAllToGoogleSheets() {
            copyAllData();
            setTimeout(() => {
              window.open('https://docs.google.com/spreadsheets/create', '_blank');
            }, 500);
          }
        </script>
      </body>
      </html>
    `;

    // Open in new window
    const newWindow = window.open('', '_blank');
    if (newWindow) {
      newWindow.document.write(htmlContent);
      newWindow.document.close();
    }
  };

  // Login page
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-linear-to-br from-blue-50 to-indigo-100 flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md">
          <div className="text-center mb-8">
            <div className="bg-indigo-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-indigo-600" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-800">Admin Login</h1>
            <p className="text-gray-600 mt-2">Masukkan password untuk mengakses dashboard</p>
          </div>

          <form onSubmit={handleLogin}>
            <div className="mb-6">
              <label htmlFor="password" className="block text-sm font-semibold text-gray-700 mb-2">
                Password
              </label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-indigo-200 focus:border-indigo-400 transition"
                placeholder="Masukkan password"
                required
              />
              {error && (
                <p className="text-red-500 text-sm mt-2 flex items-center gap-1">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  {error}
                </p>
              )}
            </div>

            <button
              type="submit"
              className="w-full bg-indigo-600 text-white py-3 rounded-xl font-semibold hover:bg-indigo-700 focus:ring-4 focus:ring-indigo-300 transition-all"
            >
              Login
            </button>
          </form>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-linear-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-blue-50 to-indigo-100 py-6 md:py-12 px-3 md:px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-xl p-4 md:p-8 mb-4 md:mb-6">
          <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
            <div className="text-center md:text-left">
              <h1 className="text-2xl md:text-3xl font-bold text-gray-800">Admin Dashboard</h1>
              <p className="text-gray-600 mt-1 md:mt-2 text-sm md:text-base">Form Data Panitia</p>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 md:gap-3">
              <button
                onClick={handleDownloadExcel}
                className="bg-green-600 text-white px-4 md:px-6 py-2.5 md:py-3 rounded-xl text-sm md:text-base font-semibold hover:bg-green-700 focus:ring-4 focus:ring-green-300 transition-all flex items-center justify-center gap-2"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 md:h-5 md:w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
                <span className="hidden sm:inline">Download Excel</span>
                <span className="sm:hidden">Excel</span>
              </button>
              <button
                onClick={handleDownloadSpreadsheet}
                className="bg-blue-600 text-white px-4 md:px-6 py-2.5 md:py-3 rounded-xl text-sm md:text-base font-semibold hover:bg-blue-700 focus:ring-4 focus:ring-blue-300 transition-all flex items-center justify-center gap-2"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 md:h-5 md:w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
                  <path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd" />
                </svg>
                <span className="hidden sm:inline">Lihat Spreadsheet</span>
                <span className="sm:hidden">Spreadsheet</span>
              </button>
              <button
                onClick={handleLogout}
                className="bg-red-600 text-white px-4 md:px-6 py-2.5 md:py-3 rounded-xl text-sm md:text-base font-semibold hover:bg-red-700 focus:ring-4 focus:ring-red-300 transition-all flex items-center justify-center gap-2"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 md:h-5 md:w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M3 3a1 1 0 00-1 1v12a1 1 0 102 0V4a1 1 0 00-1-1zm10.293 9.293a1 1 0 001.414 1.414l3-3a1 1 0 000-1.414l-3-3a1 1 0 10-1.414 1.414L14.586 9H7a1 1 0 100 2h7.586l-1.293 1.293z" clipRule="evenodd" />
                </svg>
                Logout
              </button>
            </div>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 mb-4 md:mb-6">
          <div className="bg-white rounded-2xl shadow-lg p-4 md:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-xs md:text-sm">Total Submissions</p>
                <p className="text-2xl md:text-4xl font-bold text-indigo-600 mt-1 md:mt-2">{totalSubmissions}</p>
              </div>
              <div className="bg-indigo-100 p-3 md:p-4 rounded-full">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 md:h-8 md:w-8 text-indigo-600" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-4 md:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-xs md:text-sm">Total Departments</p>
                <p className="text-2xl md:text-4xl font-bold text-green-600 mt-1 md:mt-2">{stats.length}</p>
              </div>
              <div className="bg-green-100 p-3 md:p-4 rounded-full">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 md:h-8 md:w-8 text-green-600" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-4 md:p-6">
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <p className="text-gray-600 text-xs md:text-sm">Last Updated</p>
                <p className="text-sm md:text-lg font-semibold text-gray-800 mt-1 md:mt-2 truncate">
                  {submissions.length > 0 
                    ? new Date(submissions[0].created_at).toLocaleString('id-ID', { 
                        dateStyle: 'short', 
                        timeStyle: 'short' 
                      })
                    : '-'}
                </p>
              </div>
              <div className="bg-blue-100 p-3 md:p-4 rounded-full shrink-0">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 md:h-8 md:w-8 text-blue-600" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Department Statistics */}
        <div className="bg-white rounded-2xl shadow-xl p-4 md:p-8 mb-4 md:mb-6">
          <h2 className="text-xl md:text-2xl font-bold text-gray-800 mb-4 md:mb-6">Statistik per Departemen</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
            {stats.map((stat) => (
              <div key={stat.department} className="border-2 border-indigo-100 rounded-xl p-3 md:p-4 hover:border-indigo-300 transition">
                <div className="flex justify-between items-center">
                  <p className="font-semibold text-gray-800 text-sm md:text-base truncate pr-2">{stat.department}</p>
                  <span className="bg-indigo-100 text-indigo-700 px-2 md:px-3 py-1 rounded-full text-xs md:text-sm font-bold shrink-0">
                    {stat.count}
                  </span>
                </div>
                <div className="mt-2 bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-indigo-600 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${(stat.count / totalSubmissions) * 100}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Submissions Table */}
        <div className="bg-white rounded-2xl shadow-xl p-4 md:p-8">
          <h2 className="text-xl md:text-2xl font-bold text-gray-800 mb-4 md:mb-6">Data Terbaru</h2>
          <div className="overflow-x-auto -mx-4 md:mx-0">
            <div className="inline-block min-w-full align-middle">
              <table className="min-w-full">
                <thead>
                  <tr className="bg-indigo-50 border-b-2 border-indigo-200">
                    <th className="px-2 md:px-4 py-2 md:py-3 text-left text-xs md:text-sm font-semibold text-gray-700">No</th>
                    <th className="px-2 md:px-4 py-2 md:py-3 text-left text-xs md:text-sm font-semibold text-gray-700">Nama</th>
                    <th className="hidden sm:table-cell px-2 md:px-4 py-2 md:py-3 text-left text-xs md:text-sm font-semibold text-gray-700">Posisi/Dept</th>
                    <th className="hidden lg:table-cell px-2 md:px-4 py-2 md:py-3 text-left text-xs md:text-sm font-semibold text-gray-700">Divisi</th>
                    <th className="px-2 md:px-4 py-2 md:py-3 text-left text-xs md:text-sm font-semibold text-gray-700">Instagram</th>
                    <th className="hidden md:table-cell px-2 md:px-4 py-2 md:py-3 text-left text-xs md:text-sm font-semibold text-gray-700">Tanggal</th>
                  </tr>
                </thead>
                <tbody>
                  {submissions.slice(0, 20).map((submission, index) => (
                    <tr key={submission.id} className="border-b border-gray-200 hover:bg-gray-50 transition">
                      <td className="px-2 md:px-4 py-2 md:py-3 text-xs md:text-sm text-gray-600">{index + 1}</td>
                      <td className="px-2 md:px-4 py-2 md:py-3 text-xs md:text-sm font-medium text-gray-900">
                        <div className="max-w-[120px] md:max-w-none truncate">{submission.employee_name}</div>
                        <div className="sm:hidden text-xs text-gray-500 mt-0.5">
                          {submission.position || submission.department || '-'}
                        </div>
                      </td>
                      <td className="hidden sm:table-cell px-2 md:px-4 py-2 md:py-3 text-xs md:text-sm text-gray-600">
                        {submission.position ? (
                          <span className="text-indigo-600 font-semibold">{submission.position}</span>
                        ) : (
                          <span className="truncate block max-w-[150px]">{submission.department || '-'}</span>
                        )}
                      </td>
                      <td className="hidden lg:table-cell px-2 md:px-4 py-2 md:py-3 text-xs md:text-sm text-gray-600">
                        <span className="truncate block max-w-[150px]">{submission.division || '-'}</span>
                      </td>
                      <td className="px-2 md:px-4 py-2 md:py-3 text-xs md:text-sm text-indigo-600">
                        <span className="truncate block max-w-[100px] md:max-w-none">@{submission.instagram}</span>
                      </td>
                      <td className="hidden md:table-cell px-2 md:px-4 py-2 md:py-3 text-xs md:text-sm text-gray-600 whitespace-nowrap">
                        {new Date(submission.created_at).toLocaleString('id-ID', { 
                          dateStyle: 'short', 
                          timeStyle: 'short' 
                        })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          {submissions.length > 20 && (
            <p className="text-center text-gray-500 text-xs md:text-sm mt-3 md:mt-4 px-2">
              Menampilkan 20 dari {totalSubmissions} data. Klik "Lihat Spreadsheet" untuk melihat & export semua data.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
