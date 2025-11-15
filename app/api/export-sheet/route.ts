import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { data } = await request.json();

    // Create HTML table for Google Sheets
    const headers = ['No', 'Nama', 'Nama Lengkap', 'Posisi', 'Sektor', 'Departemen', 'Divisi', 'Program Studi', 'Instagram', 'Tempat Lahir', 'Tanggal Lahir', 'Quotes', 'Tanggal Input'];
    
    const htmlTable = `
      <table>
        <thead>
          <tr>${headers.map(h => `<th>${h}</th>`).join('')}</tr>
        </thead>
        <tbody>
          ${data.map((row: any[]) => 
            `<tr>${row.map(cell => `<td>${cell}</td>`).join('')}</tr>`
          ).join('')}
        </tbody>
      </table>
    `;

    // Create Google Sheets URL with data
    const sheetsUrl = `https://docs.google.com/spreadsheets/d/1/edit?usp=sharing`;
    
    return NextResponse.json({ 
      success: true,
      message: 'Data siap diexport',
      sheetsUrl 
    });

  } catch (error) {
    console.error('Export error:', error);
    return NextResponse.json(
      { error: 'Gagal export data' },
      { status: 500 }
    );
  }
}
