export interface Employee {
  id: string;
  name: string;
  full_name: string;
  sector: string;
  department: string;
  division: string;
}

export interface FormData {
  employee_id: string;
  employee_name: string;
  full_name: string;
  sector: string;
  department: string;
  division: string;
  instagram: string;
  birth_place: string;
  birth_date: string;
  quotes: string;
  program_studi: string;
  photo_url?: string;
}
