'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Employee, FormData } from '@/types';
import employeesData from '@/data/employees.json';

export default function Home() {
  const [searchQuery, setSearchQuery] = useState('');
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
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

  // Search employees from JSON
  useEffect(() => {
    if (searchQuery.length < 2) {
      setEmployees([]);
      setShowDropdown(false);
      return;
    }

    const filtered = employeesData.filter((employee) =>
      employee.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      employee.full_name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    setEmployees(filtered);
    setShowDropdown(filtered.length > 0);
  }, [searchQuery]);

  const handleEmployeeSelect = (employee: Employee) => {
    setSelectedEmployee(employee);
    setSearchQuery(employee.name);
    setShowDropdown(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedEmployee) {
      alert('Silakan pilih karyawan terlebih dahulu');
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
          program_studi: formData.program_studi,
        });

      if (insertError) throw insertError;

      alert('Form berhasil dikirim!');
      
      // Reset form
      setSelectedEmployee(null);
      setSearchQuery('');
      setFormData({
        instagram: '',
        birth_place: '',
        birth_date: '',
        quotes: '',
        program_studi: '',
      });
      
    } catch (error) {
      console.error('Error:', error);
      alert('Terjadi kesalahan saat mengirim form');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-linear-to-br from-blue-50 to-indigo-100 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-8 text-center">
            Form Data Panitia
          </h1>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Search Employee */}
            <div className="relative">
              <label className="block text-sm font-medium text-indigo-700 mb-2">
                Cari Nama <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => employees.length > 0 && setShowDropdown(true)}
                className="w-full px-4 py-3 border-2 border-indigo-200 rounded-xl bg-white focus:bg-white focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 transition-all placeholder:text-gray-400 text-gray-700"
                placeholder="Ketik nama untuk mencari..."
                required
              />
              
              {showDropdown && employees.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                  {employees.map((employee) => (
                    <div
                      key={employee.id}
                      onClick={() => handleEmployeeSelect(employee)}
                      className="px-4 py-3 hover:bg-indigo-50 cursor-pointer transition border-b border-gray-100 last:border-0"
                    >
                      <p className="font-medium text-gray-900">{employee.name}</p>
                      <p className="text-sm text-gray-600">{employee.full_name}</p>
                      {employee.position ? (
                        <p className="text-xs text-indigo-600 font-semibold">{employee.position}</p>
                      ) : (
                        <p className="text-xs text-gray-500">{employee.department} - {employee.division}</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Auto-filled Fields (Read-only) */}
            {selectedEmployee && (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Nama Lengkap */}
                  <div>
                    <label className="block text-sm font-medium text-indigo-700 mb-2">
                      Nama Lengkap
                    </label>
                    <input
                      type="text"
                      value={selectedEmployee.full_name}
                      readOnly
                      className="w-full px-4 py-3 border-2 border-indigo-100 rounded-xl bg-indigo-50 text-indigo-900 cursor-not-allowed"
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
              <label className="block text-sm font-medium text-indigo-700 mb-2">
                Program Studi <span className="text-rose-500">*</span>
              </label>
              <select
                value={formData.program_studi}
                onChange={(e) => setFormData({ ...formData, program_studi: e.target.value })}
                className="w-full px-4 py-3 border-2 border-indigo-200 rounded-xl bg-white focus:bg-white focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 transition-all text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-gray-50"
                required
                disabled={!selectedEmployee}
              >
                <option value="">Pilih Program Studi</option>
                {programStudiList.map((prodi, index) => (
                  <option key={index} value={prodi}>
                    {prodi}
                  </option>
                ))}
              </select>
            </div>

            {/* Instagram */}
            <div>
              <label className="block text-sm font-medium text-indigo-700 mb-2">
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
                <label className="block text-sm font-medium text-indigo-700 mb-2">
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
                <label className="block text-sm font-medium text-indigo-700 mb-2">
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
              <label className="block text-sm font-medium text-indigo-700 mb-2">
                Quotes <span className="text-rose-500">*</span>
              </label>
              <textarea
                value={formData.quotes}
                onChange={(e) => setFormData({ ...formData, quotes: e.target.value })}
                className="w-full px-4 py-3 border-2 border-indigo-200 rounded-xl bg-white focus:bg-white focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 transition-all resize-none placeholder:text-gray-400 text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-gray-50"
                placeholder="Quotes atau motto hidup Anda..."
                rows={4}
                required
                disabled={!selectedEmployee}
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting || !selectedEmployee}
              className="w-full bg-indigo-600 text-white py-4 px-6 rounded-xl font-semibold text-lg hover:bg-indigo-700 hover:shadow-lg focus:ring-4 focus:ring-indigo-300 transition-all disabled:bg-indigo-300 disabled:cursor-not-allowed disabled:shadow-none"
            >
              {isSubmitting ? 'Mengirim...' : 'Kirim Form'}
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}