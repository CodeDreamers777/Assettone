"use client";

import type React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import ExpensesPageContent from "./expenses-page-content";

// Create a client
const queryClient = new QueryClient();

const ExpensesPage: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <ExpensesPageContent />
    </QueryClientProvider>
  );
};

export default ExpensesPage;
