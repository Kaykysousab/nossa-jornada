export interface Couple {
  id: string;
  user1_id: string;
  user2_id: string | null;
  user1_name: string;
  user2_name: string | null;
  relationship_start_date: string | null;
  profile_photo_url: string | null;
  created_at: string;
}

export interface Goal {
  id: string;
  couple_id: string;
  name: string;
  target_amount: number;
  current_amount: number;
  target_date: string | null;
  inspiration_photo_url: string | null;
  created_at: string;
  is_completed: boolean;
}

export interface Contribution {
  id: string;
  goal_id: string;
  amount: number;
  contributed_by: string;
  contributed_at: string;
  notes: string | null;
}

export interface Expense {
  id: string;
  couple_id: string;
  description: string;
  amount: number;
  category: 'Alimentação' | 'Casa' | 'Lazer' | 'Saúde' | 'Transporte' | 'Outros';
  paid_by: string;
  expense_date: string;
  created_at: string;
}
