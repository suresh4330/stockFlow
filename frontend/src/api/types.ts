export interface Product {
  id: number;
  name: string;
  sku: string;
  category_id: number;
  supplier_id: number;
  purchase_price: number;
  selling_price: number;
  current_stock: number;
  minimum_stock: number;
  description: string;
  created_at: string;
  updated_at: string;
}

export interface Category {
  id: number;
  name: string;
  description: string;
  created_at: string;
}

export interface Supplier {
  id: number;
  name: string;
  email: string;
  phone: string;
  company_name: string;
  address: string;
  created_at: string;
}

export type StockTransactionType = "stock_in" | "stock_out";

export interface StockTransaction {
  id: number;
  product_id: number;
  type: StockTransactionType;
  quantity: number;
  reason: string;
  created_by: number;
  created_at: string;
}

export interface Alert {
  id: number;
  product_id: number;
  alert_type: string;
  message: string;
  is_resolved: boolean;
  created_at: string;
}

export interface DashboardSummary {
  total_products: number;
  total_categories: number;
  total_suppliers: number;
  low_stock_items: number;
  out_of_stock_items: number;
  total_inventory_value: number;
  recent_transactions: number;
}

export interface DashboardCharts {
  category_distribution: { name: string; value: number }[];
  stock_movement: { date: string; stock_in: number; stock_out: number }[];
  top_products: { name: string; sku: string; stock: number }[];
  low_stock: {
    name: string;
    sku: string;
    current_stock: number;
    minimum_stock: number;
  }[];
}

export interface LowStockItem {
  id: number;
  name: string;
  sku: string;
  current_stock: number;
  minimum_stock: number;
  status: "out" | "low";
}

export interface DevOpsService {
  name: string;
  status: string;
  uptime: string;
  response_time_ms: number;
  last_checked: string;
}

export interface DevOpsStatus {
  backend_status: string;
  database_status: string;
  api_health: string;
  docker_environment: string;
  application_version: string;
  services: DevOpsService[];
  deployments?: Array<{
    sha: string;
    branch: string;
    status: string;
    deployed_at: string;
    duration_seconds: number;
  }>;
  build_info?: Record<string, string>;
}
