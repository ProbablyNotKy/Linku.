export interface Scholarship {
  id: number;
  name: string;
  provider: string;
  amount: string;
  deadline: string;
  education_level: string;
  description?: string;
  requirements?: string[];
  link?: string;
}
