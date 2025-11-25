'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Employee, FormData } from '@/types';
import employeesData from '@/data/employees.json';
import confetti from 'canvas-confetti';

export default function Home() {
  const [searchQuery, setSearchQuery] = useState('');
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [isCustomProdi, setIsCustomProdi] = useState(false);
  const [customProdi, setCustomProdi] = useState('');
  const [selectedEmployeeIds, setSelectedEmployeeIds] = useState<string[]>([]);
  const [quotesLength, setQuotesLength] = useState(0);
  const [formProgress, setFormProgress] = useState(0);
  
  const [formData, setFormData] = useState({
    instagram: '',
    birth_place: '',
    birth_date: '',
    quotes: '',
    program_studi: '',
  });

  const programStudiList = [
    'Program Studi Ilmu Politik',
    'Program Studi Hubungan Internasional',
    'Program Studi Administrasi Publik',
    'Program Studi Sosiologi',
    'Program Studi Ilmu Komunikasi',
    'Program Studi Hukum',
    'Program Studi Sastra Inggris',
    'Program Studi Sastra Indonesia',
    'Program Studi Sastra Jepang',
    'Program Studi Bahasa Korea',
    'Program Studi Manajemen',
    'Program Studi Akuntansi',
    'Program Studi Pariwisata',
    'Program Studi Bisnis Digital',
    'Program Studi Fisika',
    'Program Studi Teknik Elektro',
    'Program Studi Teknik Mesin',
    'Program Studi Teknik Fisika',
    'Program Studi Biologi',
    'Program Studi Agroteknologi',
    'Program Studi Sistem Informasi',
    'Program Studi Informatika',
    'Program Studi Keperawatan',
    'Program Studi Kebidanan',
    'Program Studi Pendidikan Profesi Ners',
    'Program Studi Pendidikan Profesi Bidan',
  ];

  // Calculate form progress
  useEffect(() => {
    let completed = 0;
    const totalFields = 6;
    
    if (selectedEmployee) completed++;
    if (formData.program_studi || customProdi) completed++;
    if (formData.instagram) completed++;
    if (formData.birth_place) completed++;
    if (formData.birth_date) completed++;
    if (formData.quotes) completed++;
    
    setFormProgress((completed / totalFields) * 100);
  }, [selectedEmployee, formData, customProdi]);

  // Search employees from JSON
  useEffect(() => {
    if (searchQuery.length < 2) {
      setEmployees([]);
      setShowDropdown(false);
      return;
    }

    const filtered = employeesData.filter((employee) =>
      (employee.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      employee.full_name.toLowerCase().includes(searchQuery.toLowerCase())) &&
      !selectedEmployeeIds.includes(employee.id)
    );

    setEmployees(filtered);
    setShowDropdown(filtered.length > 0);
  }, [searchQuery, selectedEmployeeIds]);

  const handleEmployeeSelect = (employee: Employee) => {
    setSelectedEmployee(employee);
    setSearchQuery(employee.name);
    setShowDropdown(false);
    setSelectedEmployeeIds([...selectedEmployeeIds, employee.id]);
  };

  const handleProdiChange = (value: string) => {
    if (value === 'LAINNYA') {
      setIsCustomProdi(true);
      setFormData({ ...formData, program_studi: '' });
      setCustomProdi('');
    } else {
      setIsCustomProdi(false);
      setCustomProdi('');
      setFormData({ ...formData, program_studi: value });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedEmployee) {
      alert('Silakan pilih karyawan terlebih dahulu');
      return;
    }

    if (isCustomProdi && !customProdi.trim()) {
      alert('Silakan isi Program Studi');
      return;
    }

    setIsSubmitting(true);

    try {
      // Insert form data
      const { error: insertError } = await supabase
        .from('form_submissions')
        .insert({
          employee_id: selectedEmployee.id,
          employee_name: selectedEmployee.name,
          full_name: selectedEmployee.full_name,
          sector: selectedEmployee.sector || null,
          department: selectedEmployee.department || null,
          division: selectedEmployee.division || null,
          position: selectedEmployee.position || null,
          instagram: formData.instagram,
          birth_place: formData.birth_place,
          birth_date: formData.birth_date,
          quotes: formData.quotes,
          program_studi: isCustomProdi ? customProdi : formData.program_studi,
        });

      if (insertError) throw insertError;

      // Show success modal
      setShowSuccessModal(true);
      
      // Fire confetti
      const duration = 3000;
      const animationEnd = Date.now() + duration;
      const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 9999 };

      const randomInRange = (min: number, max: number) => {
        return Math.random() * (max - min) + min;
      };

      const interval: any = setInterval(() => {
        const timeLeft = animationEnd - Date.now();

        if (timeLeft <= 0) {
          return clearInterval(interval);
        }

        const particleCount = 50 * (timeLeft / duration);

        confetti({
          ...defaults,
          particleCount,
          origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 }
        });
        confetti({
          ...defaults,
          particleCount,
          origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 }
        });
      }, 250);

      // Reset form after delay
      setTimeout(() => {
        setSelectedEmployee(null);
        setSearchQuery('');
        setFormData({
          instagram: '',
          birth_place: '',
          birth_date: '',
          quotes: '',
          program_studi: '',
        });
        setIsCustomProdi(false);
        setCustomProdi('');
        // Do not reset selectedEmployeeIds - keep them hidden from future searches
      }, 1000);
      
    } catch (error) {
      console.error('Error:', error);
      alert('Terjadi kesalahan saat mengirim form');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-linear-to-br from-blue-50 to-indigo-100 py-12 px-4">
      {/* Success Modal */}
      {showSuccessModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-md w-full transform animate-bounce-in">
            <div className="text-center">
              {/* Success Icon */}
              <div className="mx-auto flex items-center justify-center h-24 w-24 rounded-full bg-green-100 mb-6">
                <svg className="h-16 w-16 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                </svg>
              </div>
              
              {/* Success Message */}
              <h3 className="text-3xl font-bold text-gray-900 mb-3">
                🎉 Berhasil! 🎉
              </h3>
              <p className="text-lg text-gray-600 mb-6">
                Form Anda telah berhasil dikirim!
              </p>
              
              {/* Close Button */}
              <button
                onClick={() => setShowSuccessModal(false)}
                className="bg-linear-to-r from-indigo-600 to-purple-600 text-white px-8 py-3 rounded-xl font-semibold text-lg hover:from-indigo-700 hover:to-purple-700 focus:ring-4 focus:ring-indigo-300 transition-all shadow-lg hover:shadow-xl transform hover:scale-105"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          {/* Progress Bar */}
          <div className="h-2 bg-gray-100">
            <div 
              className="h-full bg-linear-to-r from-indigo-500 to-purple-500 transition-all duration-500 ease-out"
              style={{ width: `${formProgress}%` }}
            />
          </div>
          
          <div className="p-8">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-gray-800 mb-2">
                Form Data Panitia
              </h1>
              <p className="text-sm text-gray-500">
                Progress: <span className="font-semibold text-indigo-600">{Math.round(formProgress)}%</span> selesai
              </p>
            </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Search Employee */}
            <div className="relative">
              <label className="flex items-center gap-2 text-sm font-medium text-indigo-700 mb-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
                </svg>
                Cari Nama <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                  </svg>
                </div>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => employees.length > 0 && setShowDropdown(true)}
                  className="w-full pl-12 pr-4 py-3 border-2 border-indigo-200 rounded-xl bg-white focus:bg-white focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 transition-all placeholder:text-gray-400 text-gray-700"
                  placeholder="Ketik minimal 2 karakter untuk mencari..."
                  required
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery('');
                      setSelectedEmployee(null);
                      setShowDropdown(false);
                    }}
                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  </button>
                )}
              </div>
              
              {showDropdown && (
                <div className="absolute z-10 w-full mt-2 bg-white border-2 border-indigo-200 rounded-xl shadow-2xl max-h-64 overflow-y-auto animate-slide-down">
                  {employees.length > 0 ? (
                    employees.map((employee, index) => (
                      <div
                        key={employee.id}
                        onClick={() => handleEmployeeSelect(employee)}
                        className="px-4 py-3 hover:bg-linear-to-r hover:from-indigo-50 hover:to-purple-50 cursor-pointer transition-all border-b border-gray-100 last:border-0 group"
                        style={{ animationDelay: `${index * 50}ms` }}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <p className="font-semibold text-gray-900 group-hover:text-indigo-600 transition-colors">{employee.name}</p>
                            <p className="text-sm text-gray-600 hidden">{employee.full_name}</p>
                            {employee.position ? (
                              <p className="text-xs text-indigo-600 font-semibold mt-1">{employee.position}</p>
                            ) : (
                              <p className="text-xs text-gray-500 mt-1">{employee.department} - {employee.division}</p>
                            )}
                          </div>
                          <svg className="h-5 w-5 text-indigo-400 opacity-0 group-hover:opacity-100 transition-opacity" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                          </svg>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="px-4 py-8 text-center">
                      <svg className="mx-auto h-12 w-12 text-gray-400 mb-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                      <p className="text-gray-500 font-medium">Tidak ada hasil</p>
                      <p className="text-xs text-gray-400 mt-1">Coba kata kunci lain</p>
                    </div>
                  )}
                </div>
              )}
              {searchQuery.length > 0 && searchQuery.length < 2 && (
                <p className="text-xs text-amber-600 mt-2 flex items-center gap-1">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  Ketik minimal 2 karakter
                </p>
              )}
            </div>


            {/* Auto-filled Fields (Read-only) */}
            {selectedEmployee && (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Nama Lengkap */}
                  <div>
                    <label className="flex items-center gap-2 text-sm font-medium text-indigo-700 mb-2">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                      </svg>
                      Nama Lengkap
                    </label>
                    <input
                      type="text"
                      value={selectedEmployee.full_name}
                      readOnly
                      className="w-full px-4 py-3 border-2 border-indigo-100 rounded-xl bg-indigo-50 text-indigo-900 cursor-not-allowed font-medium"
                    />
                  </div>

                  {/* Position (for PM/DPM) or Sektor (for regular) */}
                  {selectedEmployee.position ? (
                    <div className="md:col-span-1">
                      <label className="block text-sm font-medium text-indigo-700 mb-2">
                        Posisi
                      </label>
                      <input
                        type="text"
                        value={selectedEmployee.position}
                        readOnly
                        className="w-full px-4 py-3 border-2 border-indigo-100 rounded-xl bg-indigo-50 text-indigo-900 cursor-not-allowed"
                      />
                    </div>
                  ) : (
                    <>
                      {/* Sektor */}
                      <div>
                        <label className="block text-sm font-medium text-indigo-700 mb-2">
                          Sektor
                        </label>
                        <input
                          type="text"
                          value={selectedEmployee.sector}
                          readOnly
                          className="w-full px-4 py-3 border-2 border-indigo-100 rounded-xl bg-indigo-50 text-indigo-900 cursor-not-allowed"
                        />
                      </div>
                    </>
                  )}
                </div>

                {/* Department and Division only for non-PM/DPM */}
                {!selectedEmployee.position && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Departemen */}
                    <div>
                      <label className="block text-sm font-medium text-indigo-700 mb-2">
                        Departemen
                      </label>
                      <input
                        type="text"
                        value={selectedEmployee.department}
                        readOnly
                        className="w-full px-4 py-3 border-2 border-indigo-100 rounded-xl bg-indigo-50 text-indigo-900 cursor-not-allowed"
                      />
                    </div>

                    {/* Divisi */}
                    <div>
                      <label className="block text-sm font-medium text-indigo-700 mb-2">
                        Divisi
                      </label>
                      <input
                        type="text"
                        value={selectedEmployee.division}
                        readOnly
                        className="w-full px-4 py-3 border-2 border-indigo-100 rounded-xl bg-indigo-50 text-indigo-900 cursor-not-allowed"
                      />
                    </div>
                  </div>
                )}

                <hr className="border-gray-200" />
              </>
            )}

            {/* Program Studi */}
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-indigo-700 mb-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M10.394 2.08a1 1 0 00-.788 0l-7 3a1 1 0 000 1.84L5.25 8.051a.999.999 0 01.356-.257l4-1.714a1 1 0 11.788 1.838L7.667 9.088l1.94.831a1 1 0 00.787 0l7-3a1 1 0 000-1.838l-7-3zM3.31 9.397L5 10.12v4.102a8.969 8.969 0 00-1.05-.174 1 1 0 01-.89-.89 11.115 11.115 0 01.25-3.762zM9.3 16.573A9.026 9.026 0 007 14.935v-3.957l1.818.78a3 3 0 002.364 0l5.508-2.361a11.026 11.026 0 01.25 3.762 1 1 0 01-.89.89 8.968 8.968 0 00-5.35 2.524 1 1 0 01-1.4 0zM6 18a1 1 0 001-1v-2.065a8.935 8.935 0 00-2-.712V17a1 1 0 001 1z" />
                </svg>
                Program Studi <span className="text-rose-500">*</span>
              </label>
              <select
                value={isCustomProdi ? 'LAINNYA' : formData.program_studi}
                onChange={(e) => handleProdiChange(e.target.value)}
                className="w-full px-4 py-3 border-2 border-indigo-200 rounded-xl bg-white focus:bg-white focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 transition-all text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-gray-50"
                required={!isCustomProdi}
                disabled={!selectedEmployee}
              >
                <option value="">Pilih Program Studi</option>
                {programStudiList.map((prodi, index) => (
                  <option key={index} value={prodi}>
                    {prodi}
                  </option>
                ))}
                <option value="LAINNYA">✏️ Lainnya (Ketik Manual)</option>
              </select>
              {!isCustomProdi && !formData.program_studi && selectedEmployee && (
                <p className="text-xs text-gray-500 mt-2 flex items-center gap-1">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                  Tidak menemukan program studi Anda? Pilih "✏️ Lainnya" untuk input manual
                </p>
              )}
            </div>

            {/* Custom Program Studi Input */}
            {isCustomProdi && (
              <div className="bg-indigo-50 border-2 border-indigo-200 rounded-xl p-4 animate-fade-in">
                <label className="flex items-center gap-2 text-sm font-medium text-indigo-700 mb-2">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                  </svg>
                  Nama Program Studi <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={customProdi}
                  onChange={(e) => setCustomProdi(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-indigo-300 rounded-xl bg-white focus:bg-white focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 transition-all placeholder:text-gray-400 text-gray-700"
                  placeholder="Contoh: Program Studi Teknik Informatika"
                  required
                  autoFocus
                />
                <p className="text-xs text-indigo-600 mt-2 flex items-center gap-1">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                  Ketik nama lengkap program studi Anda dengan benar
                </p>
              </div>
            )}

            {/* Instagram */}
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-indigo-700 mb-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                </svg>
                Instagram <span className="text-rose-500">*</span>
              </label>
              <div className="flex">
                <span className="inline-flex items-center px-4 rounded-l-xl border-2 border-r-0 border-indigo-200 bg-indigo-100 text-indigo-700 font-medium">
                  @
                </span>
                <input
                  type="text"
                  value={formData.instagram}
                  onChange={(e) => setFormData({ ...formData, instagram: e.target.value })}
                  className="flex-1 px-4 py-3 border-2 border-indigo-200 rounded-r-xl bg-white focus:bg-white focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 transition-all placeholder:text-gray-400 text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-gray-50"
                  placeholder="username"
                  required
                  disabled={!selectedEmployee}
                />
              </div>
            </div>

            {/* Tempat Tanggal Lahir */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-indigo-700 mb-2">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                  </svg>
                  Tempat Lahir <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.birth_place}
                  onChange={(e) => setFormData({ ...formData, birth_place: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-indigo-200 rounded-xl bg-white focus:bg-white focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 transition-all placeholder:text-gray-400 text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-gray-50"
                  placeholder="Kota tempat lahir"
                  required
                  disabled={!selectedEmployee}
                />
              </div>

              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-indigo-700 mb-2">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                  </svg>
                  Tanggal Lahir <span className="text-rose-500">*</span>
                </label>
                <input
                  type="date"
                  value={formData.birth_date}
                  onChange={(e) => setFormData({ ...formData, birth_date: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-indigo-200 rounded-xl bg-white focus:bg-white focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 transition-all text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-gray-50"
                  required
                  disabled={!selectedEmployee}
                />
              </div>
            </div>

            {/* Quotes */}
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-indigo-700 mb-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 13V5a2 2 0 00-2-2H4a2 2 0 00-2 2v8a2 2 0 002 2h3l3 3 3-3h3a2 2 0 002-2zM5 7a1 1 0 011-1h8a1 1 0 110 2H6a1 1 0 01-1-1zm1 3a1 1 0 100 2h3a1 1 0 100-2H6z" clipRule="evenodd" />
                </svg>
                Quotes <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <textarea
                  value={formData.quotes}
                  onChange={(e) => {
                    setFormData({ ...formData, quotes: e.target.value });
                    setQuotesLength(e.target.value.length);
                  }}
                  className="w-full px-4 py-3 border-2 border-indigo-200 rounded-xl bg-white focus:bg-white focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 transition-all resize-none placeholder:text-gray-400 text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-gray-50"
                  placeholder="Quotes atau motto hidup Anda..."
                  rows={4}
                  maxLength={500}
                  required
                  disabled={!selectedEmployee}
                />
                <div className="absolute bottom-3 right-3 text-xs text-gray-400 bg-white px-2 py-1 rounded-lg">
                  {quotesLength}/500
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting || !selectedEmployee}
              className="w-full bg-linear-to-r from-indigo-600 to-purple-600 text-white py-4 px-6 rounded-xl font-bold text-lg hover:from-indigo-700 hover:to-purple-700 hover:shadow-2xl hover:scale-105 focus:ring-4 focus:ring-indigo-300 transition-all duration-300 disabled:from-gray-300 disabled:to-gray-400 disabled:cursor-not-allowed disabled:shadow-none disabled:scale-100 flex items-center justify-center gap-3 group"
            >
              {isSubmitting ? (
                <>
                  <svg className="animate-spin h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Mengirim Form...
                </>
              ) : (
                <>
                  <svg className="h-6 w-6 group-hover:scale-110 transition-transform" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                  Kirim Form
                  <svg className="h-5 w-5 group-hover:translate-x-1 transition-transform" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </>
              )}
            </button>
            
            {!selectedEmployee && (
              <p className="text-center text-[11px] sm:text-sm text-amber-600 -mt-2 flex items-center justify-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
                Pilih nama terlebih dahulu untuk mengaktifkan form
              </p>
            )}
          </form>
          </div>
        </div>
      </div>
    </main>
  );
}