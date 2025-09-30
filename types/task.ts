export interface TaskStep {
  id: string;
  name: string;
  startDate: Date;
  endDate: Date;
  duration: number; // in days
  pic: string;
  quantity: number;
  unit: string;
  target?: string; // Target realisasi kerja (target output/hasil)
  progress: number; // 0-100
  dependsOn: string[]; // array of task IDs
  isMilestone: boolean;
  notes?: string;
}

export interface OrderTask {
  title: string;
  client: string;
  category: string;
  priority: 'low' | 'normal' | 'high';
  tasks: TaskStep[];
  totalDuration: number;
  estimatedEndDate: Date;
}