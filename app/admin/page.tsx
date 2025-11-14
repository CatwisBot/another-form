'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import * as XLSX from 'xlsx';

interface FormSubmission {
  id: string;
  employee_id: string;
  employee_name: string;
  full_name: string;
  sector: string;
  department: string;
  division: string;
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

  useEffect(() => {
    if (isAuthenticated) {
      fetchData();
    }
  }, [isAuthenticated]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === ADMIN_PASSWORD) {
      setIsAuthenticated(true);
      setError('');
    } else {
      setError('Password salah!');
      setPassword('');
    }
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
        const count = deptMap.get(submission.department) || 0;
        deptMap.set(submission.department, count + 1);
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

  const handleDownloadExcel = () => {
    if (submissions.length === 0) {
      alert('Tidak ada data untuk didownload');
      return;
    }

    // Create a new workbook
    const workbook = XLSX.utils.book_new();

    // Group submissions by department
    const departmentGroups = new Map<string, FormSubmission[]>();
    submissions.forEach((submission) => {
      const dept = submission.department;
      if (!departmentGroups.has(dept)) {
        departmentGroups.set(dept, []);
      }
      departmentGroups.get(dept)?.push(submission);
    });

    // Create a sheet for each department
    departmentGroups.forEach((deptSubmissions, department) => {
      const worksheetData = deptSubmissions.map((sub, index) => ({
        No: index + 1,
        'Nama': sub.employee_name,
        'Nama Lengkap': sub.full_name,
        'Sektor': sub.sector,
        'Departemen': sub.department,
        'Divisi': sub.division,
        'Program Studi': sub.program_studi,
        'Instagram': sub.instagram,
        'Tempat Lahir': sub.birth_place,
        'Tanggal Lahir': sub.birth_date,
        'Quotes': sub.quotes,
        'Tanggal Input': new Date(sub.created_at).toLocaleString('id-ID'),
      }));

      const worksheet = XLSX.utils.json_to_sheet(worksheetData);
      
      // Set column widths
      worksheet['!cols'] = [
        { wch: 5 },  // No
        { wch: 20 }, // Nama
        { wch: 30 }, // Nama Lengkap
        { wch: 10 }, // Sektor
        { wch: 20 }, // Departemen
        { wch: 35 }, // Divisi
        { wch: 35 }, // Program Studi
        { wch: 20 }, // Instagram
        { wch: 20 }, // Tempat Lahir
        { wch: 15 }, // Tanggal Lahir
        { wch: 50 }, // Quotes
        { wch: 20 }, // Tanggal Input
      ];

      // Sanitize sheet name (Excel doesn't allow certain characters)
      const sheetName = department.replace(/[\\\/\?\*\[\]]/g, '_').substring(0, 31);
      XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
    });

    // Create summary sheet
    const summaryData = [
      { Info: 'Total Submissions', Value: totalSubmissions },
      { Info: '', Value: '' },
      { Info: 'Department', Value: 'Count' },
      ...stats.map(stat => ({ Info: stat.department, Value: stat.count })),
    ];
    const summarySheet = XLSX.utils.json_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(workbook, summarySheet, 'Summary');

    // Generate Excel file
    const fileName = `Form_Panitia_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(workbook, fileName);
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
    <div className="min-h-screen bg-linear-to-br from-blue-50 to-indigo-100 py-12 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-800">Admin Dashboard</h1>
              <p className="text-gray-600 mt-2">Form Data Panitia</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleDownloadExcel}
                className="bg-green-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-green-700 focus:ring-4 focus:ring-green-300 transition-all flex items-center gap-2"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
                Download Excel
              </button>
              <button
                onClick={() => setIsAuthenticated(false)}
                className="bg-red-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-red-700 focus:ring-4 focus:ring-red-300 transition-all flex items-center gap-2"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M3 3a1 1 0 00-1 1v12a1 1 0 102 0V4a1 1 0 00-1-1zm10.293 9.293a1 1 0 001.414 1.414l3-3a1 1 0 000-1.414l-3-3a1 1 0 10-1.414 1.414L14.586 9H7a1 1 0 100 2h7.586l-1.293 1.293z" clipRule="evenodd" />
                </svg>
                Logout
              </button>
            </div>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Total Submissions</p>
                <p className="text-4xl font-bold text-indigo-600 mt-2">{totalSubmissions}</p>
              </div>
              <div className="bg-indigo-100 p-4 rounded-full">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-indigo-600" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Total Departments</p>
                <p className="text-4xl font-bold text-green-600 mt-2">{stats.length}</p>
              </div>
              <div className="bg-green-100 p-4 rounded-full">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-green-600" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Last Updated</p>
                <p className="text-lg font-semibold text-gray-800 mt-2">
                  {submissions.length > 0 
                    ? new Date(submissions[0].created_at).toLocaleString('id-ID', { 
                        dateStyle: 'medium', 
                        timeStyle: 'short' 
                      })
                    : '-'}
                </p>
              </div>
              <div className="bg-blue-100 p-4 rounded-full">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-blue-600" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Department Statistics */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">Statistik per Departemen</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {stats.map((stat) => (
              <div key={stat.department} className="border-2 border-indigo-100 rounded-xl p-4 hover:border-indigo-300 transition">
                <div className="flex justify-between items-center">
                  <p className="font-semibold text-gray-800">{stat.department}</p>
                  <span className="bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full text-sm font-bold">
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
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">Data Terbaru</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-indigo-50 border-b-2 border-indigo-200">
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">No</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Nama</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Departemen</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Divisi</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Instagram</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Tanggal Input</th>
                </tr>
              </thead>
              <tbody>
                {submissions.slice(0, 20).map((submission, index) => (
                  <tr key={submission.id} className="border-b border-gray-200 hover:bg-gray-50 transition">
                    <td className="px-4 py-3 text-sm text-gray-600">{index + 1}</td>
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">{submission.employee_name}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{submission.department}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{submission.division}</td>
                    <td className="px-4 py-3 text-sm text-indigo-600">@{submission.instagram}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">
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
          {submissions.length > 20 && (
            <p className="text-center text-gray-500 text-sm mt-4">
              Menampilkan 20 dari {totalSubmissions} data. Download Excel untuk melihat semua data.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
