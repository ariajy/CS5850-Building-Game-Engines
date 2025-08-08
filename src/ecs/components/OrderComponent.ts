export interface OrderComponent {
  recipeId: string;     
  perfumeName: string;   
  quantity: number;      
  status: 'pending' | 'completed' | 'cancelled';
}
