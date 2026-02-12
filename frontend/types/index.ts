export interface Scholarship {
  id: number;
  title: string;
  provider: string;
  amount?: string;
  deadline: string;
  education_level: string;
  institution_type?: string;
  url?: string;
  tags?: string[];
}
